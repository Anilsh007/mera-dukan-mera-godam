import { NextRequest, NextResponse } from "next/server"
import type { PurchaseItem, PurchasePaymentStatus, PurchaseRecord } from "@/app/lib/db"
import {
  createSupabaseAdminClient,
  getUserIdentityFromRequest,
  toApiErrorResponse,
} from "@/app/api/_lib/auth"
import {
  assertContentLength,
  readJsonBody,
  assertFiniteNumber,
  assertIsoDate,
  enforceRateLimit,
  sanitizeOptionalText,
  sanitizeRequiredText,
  SecurityError,
} from "@/app/api/_lib/security"
import { normalizeQuantityUnit } from "@/app/lib/quantityUnit"

export const runtime = "nodejs"

type PurchaseEntryMode = "quick" | "detailed"
type PurchaseDetailsStatus = "pending" | "completed"

type PurchaseSyncPayload = {
  purchases: PurchaseRecord[]
}

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: "purchases-sync:get", limit: 120, windowMs: 60_000 })
    const userId = await getUserIdentityFromRequest(request)
    const supabase = createSupabaseAdminClient()

    const { data, error } = await supabase
      .from("purchases")
      .select("*")
      .eq("user_id", userId)
      .order("purchase_date", { ascending: false })

    if (error) {
      return NextResponse.json(
        { code: error.code, message: error.message, details: error.details, hint: error.hint },
        { status: 500 }
      )
    }

    return NextResponse.json({
      purchases: (data || []).map(mapDbToPurchase),
    })
  } catch (error) {
    return toApiErrorResponse(error, "Unexpected purchases API error")
  }
}

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: "purchases-sync:post", limit: 40, windowMs: 60_000 })
    assertContentLength(request, 1024 * 1024)
    const userId = await getUserIdentityFromRequest(request)
    const { purchases } = validatePurchasePayload(await readJsonBody<PurchaseSyncPayload>(request), userId)
    const supabase = createSupabaseAdminClient()

    const { error } = await supabase.from("purchases").upsert(
      purchases.map((purchase) => mapPurchaseToDb(purchase, userId)),
      { onConflict: "id" }
    )

    if (error) {
      return NextResponse.json(
        { code: error.code, message: error.message, details: error.details, hint: error.hint },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return toApiErrorResponse(error, "Unexpected purchases API error")
  }
}

function validatePurchasePayload(payload: PurchaseSyncPayload, userId: string) {
  if (!payload || !Array.isArray(payload.purchases)) {
    throw new SecurityError("Invalid purchase sync payload", 400)
  }

  if (payload.purchases.length > 10000) {
    throw new SecurityError("Purchase sync payload exceeds allowed size", 400)
  }

  const purchases = payload.purchases.map((purchase) => {
    const items = Array.isArray(purchase.items) ? purchase.items : []
    if (!items.length || items.length > 500) {
      throw new SecurityError("Purchase must contain between 1 and 500 items", 400)
    }

    const totalAmount = assertFiniteNumber(purchase.totalAmount, "Purchase total", {
      min: 0,
      max: 100_000_000,
    })
    const amountPaid = assertFiniteNumber(purchase.amountPaid, "Purchase paid amount", {
      min: 0,
      max: 100_000_000,
    })
    const dueAmount = assertFiniteNumber(purchase.dueAmount, "Purchase due amount", {
      min: 0,
      max: 100_000_000,
    })

    return {
      ...purchase,
      id: sanitizeRequiredText(purchase.id, 120, "Purchase id"),
      userId,
      billNo: sanitizeRequiredText(purchase.billNo, 120, "Purchase bill number"),
      supplierName: sanitizeRequiredText(purchase.supplierName, 160, "Supplier name"),
      purchaseDate: assertIsoDate(purchase.purchaseDate, "Purchase date"),
      purchaseDateTime: purchase.purchaseDateTime
        ? assertIsoDate(purchase.purchaseDateTime, "Purchase date time")
        : undefined,
      paymentStatus: validatePaymentStatus(purchase.paymentStatus),
      paymentMode: sanitizeOptionalText(purchase.paymentMode, 80),
      amountPaid,
      totalAmount,
      dueAmount,
      note: sanitizeOptionalText(purchase.note, 1000),
      entryMode: validateEntryMode(purchase.entryMode),
      detailsStatus: validateDetailsStatus(purchase.detailsStatus),
      detailsCompletedAt: purchase.detailsCompletedAt
        ? assertIsoDate(purchase.detailsCompletedAt, "Purchase details completedAt")
        : undefined,
      items: items.map(validatePurchaseItem),
      createdAt: assertIsoDate(purchase.createdAt, "Purchase createdAt"),
      updatedAt: assertIsoDate(purchase.updatedAt, "Purchase updatedAt"),
    }
  })

  return { purchases }
}

function validatePurchaseItem(item: PurchaseItem): PurchaseItem {
  const quantity = assertFiniteNumber(item.quantity, "Purchase item quantity", {
    min: 0.01,
    max: 1_000_000,
  })
  const price = assertFiniteNumber(item.price, "Purchase item price", {
    min: 0,
    max: 10_000_000,
  })

  return {
    id: sanitizeRequiredText(item.id, 120, "Purchase item id"),
    productId: sanitizeRequiredText(item.productId, 120, "Purchase item product id"),
    name: sanitizeRequiredText(item.name, 160, "Purchase item name"),
    price,
    quantity,
    quantityUnit: normalizeQuantityUnit(sanitizeOptionalText(item.quantityUnit, 40)),
    category: sanitizeOptionalText(item.category, 100),
    expiry: item.expiry ? assertIsoDate(item.expiry, "Purchase item expiry") : undefined,
    sku: sanitizeOptionalText(item.sku, 80),
    hsnCode: sanitizeOptionalText(item.hsnCode, 40),
    note: sanitizeOptionalText(item.note, 1000),
    lineTotal: assertFiniteNumber(item.lineTotal, "Purchase item line total", {
      min: 0,
      max: 100_000_000,
    }),
  }
}

function validatePaymentStatus(status: PurchasePaymentStatus) {
  if (status === "paid" || status === "partial" || status === "unpaid") return status
  throw new SecurityError("Invalid purchase payment status", 400)
}

function validateEntryMode(mode?: PurchaseEntryMode) {
  if (!mode) return "detailed"
  if (mode === "quick" || mode === "detailed") return mode
  throw new SecurityError("Invalid purchase entry mode", 400)
}

function validateDetailsStatus(status?: PurchaseDetailsStatus) {
  if (!status) return "completed"
  if (status === "pending" || status === "completed") return status
  throw new SecurityError("Invalid purchase details status", 400)
}

function mapPurchaseToDb(purchase: PurchaseRecord, userId: string) {
  return {
    id: purchase.id,
    user_id: userId,
    bill_no: purchase.billNo,
    supplier_name: purchase.supplierName,
    purchase_date: purchase.purchaseDate,
    payment_status: purchase.paymentStatus,
    payment_mode: purchase.paymentMode || null,
    total_amount: purchase.totalAmount,
    amount_paid: purchase.amountPaid,
    due_amount: purchase.dueAmount,
    created_at: purchase.createdAt,
    updated_at: purchase.updatedAt,
    payload: purchase,
  }
}

function mapDbToPurchase(row: Record<string, unknown>) {
  return row.payload as PurchaseRecord
}
