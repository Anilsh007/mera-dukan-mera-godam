import { NextRequest, NextResponse } from "next/server"
import type { GSTInvoiceItem, GSTInvoiceRecord } from "@/app/dashboard/gst-invoice/types/gst.types"
import {
  createSupabaseAdminClient,
  getUserIdentityFromRequest,
  toApiErrorResponse,
} from "@/app/api/_lib/auth"
import {
  assertContentLength,
  assertFiniteNumber,
  enforceRateLimit,
  sanitizeOptionalText,
  sanitizeRequiredText,
  SecurityError,
} from "@/app/api/_lib/security"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: "invoices:get", limit: 80, windowMs: 60_000 })
    const userId = await getUserIdentityFromRequest(request)
    const supabase = createSupabaseAdminClient()

    const { data, error } = await supabase
      .from("gst_invoices")
      .select("*")
      .eq("user_id", userId)
      .order("invoice_date", { ascending: false })

    if (error) {
      return NextResponse.json(
        { code: error.code, message: error.message, details: error.details, hint: error.hint },
        { status: 500 }
      )
    }

    return NextResponse.json((data || []).map(mapDbToInvoiceRecord))
  } catch (error) {
    return toApiErrorResponse(error, "Unexpected invoices API error")
  }
}

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: "invoices:post", limit: 30, windowMs: 60_000 })
    assertContentLength(request, 512 * 1024)
    const userId = await getUserIdentityFromRequest(request)
    const invoice = validateInvoicePayload((await request.json()) as GSTInvoiceRecord)
    const supabase = createSupabaseAdminClient()
    const payload = mapInvoiceRecordToDb(invoice, userId)

    const { error } = await supabase.from("gst_invoices").upsert(payload, {
      onConflict: "id",
    })

    if (error) {
      return NextResponse.json(
        { code: error.code, message: error.message, details: error.details, hint: error.hint },
        { status: 500 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    return toApiErrorResponse(error, "Unexpected invoices API error")
  }
}

function mapInvoiceRecordToDb(invoice: GSTInvoiceRecord, userId: string) {
  return {
    id: invoice.id,
    user_id: userId,
    invoice_no: invoice.invoiceNo,
    invoice_date: invoice.invoiceDate,
    buyer_name: invoice.buyerName,
    buyer_gstin: invoice.buyer.gstin || null,
    grand_total: invoice.totals.grandTotal,
    created_at: invoice.createdAt,
    updated_at: invoice.updatedAt,
    payload: invoice,
  }
}

function mapDbToInvoiceRecord(row: Record<string, unknown>) {
  return row.payload as GSTInvoiceRecord
}

function validateInvoicePayload(invoice: GSTInvoiceRecord): GSTInvoiceRecord {
  if (!invoice || typeof invoice !== "object") {
    throw new SecurityError("Invalid invoice payload", 400)
  }

  const items = Array.isArray(invoice.items) ? invoice.items : []
  if (!items.length || items.length > 200) {
    throw new SecurityError("Invoice must contain between 1 and 200 items", 400)
  }

  const validatedItems = items.map((item: GSTInvoiceItem) => ({
    ...item,
    description: sanitizeRequiredText(item.description, 300, "Item description"),
    hsnCode: sanitizeOptionalText(item.hsnCode, 50) || "",
    unit: sanitizeOptionalText(item.unit, 20) || "pcs",
    quantity: assertFiniteNumber(item.quantity, "Item quantity", { min: 0.01, max: 1_000_000 }),
    rate: assertFiniteNumber(item.rate, "Item rate", { min: 0, max: 10_000_000 }),
    gstRate: assertFiniteNumber(item.gstRate, "Item GST rate", { min: 0, max: 100 }),
  }))

  return {
    ...invoice,
    invoiceNo: sanitizeRequiredText(invoice.invoiceNo, 60, "Invoice number"),
    buyerName: sanitizeOptionalText(invoice.buyerName, 160) || invoice.buyer?.name || "",
    buyer: {
      ...invoice.buyer,
      name: sanitizeRequiredText(invoice.buyer?.name, 160, "Buyer name"),
      gstin: sanitizeOptionalText(invoice.buyer?.gstin, 30) || "",
      phone: sanitizeOptionalText(invoice.buyer?.phone, 30) || "",
      email: sanitizeOptionalText(invoice.buyer?.email, 160) || "",
      address: sanitizeOptionalText(invoice.buyer?.address, 300) || "",
      city: sanitizeOptionalText(invoice.buyer?.city, 120) || "",
      state: sanitizeOptionalText(invoice.buyer?.state, 120) || "",
      pincode: sanitizeOptionalText(invoice.buyer?.pincode, 20) || "",
    },
    seller: {
      ...invoice.seller,
      name: sanitizeRequiredText(invoice.seller?.name, 160, "Seller name"),
      gstin: sanitizeOptionalText(invoice.seller?.gstin, 30) || "",
      address: sanitizeRequiredText(invoice.seller?.address, 300, "Seller address"),
      city: sanitizeRequiredText(invoice.seller?.city, 120, "Seller city"),
      state: sanitizeRequiredText(invoice.seller?.state, 120, "Seller state"),
      pincode: sanitizeRequiredText(invoice.seller?.pincode, 20, "Seller pincode"),
      phone: sanitizeRequiredText(invoice.seller?.phone, 30, "Seller phone"),
      email: sanitizeOptionalText(invoice.seller?.email, 160) || "",
    },
    items: validatedItems,
    notes: sanitizeOptionalText(invoice.notes, 3000) || "",
    terms: sanitizeOptionalText(invoice.terms, 3000) || "",
  }
}
