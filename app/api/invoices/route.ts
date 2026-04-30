import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { createVerify } from "node:crypto"
import { normalizeUserIdentity } from "@/app/lib/userIdentity"
import type { GSTInvoiceRecord } from "@/app/dashboard/gst-invoice/gst.types"
import {
  assertContentLength,
  assertFiniteNumber,
  enforceRateLimit,
  sanitizeOptionalText,
  sanitizeRequiredText,
  SecurityError,
} from "@/app/api/_lib/security"

export const runtime = "nodejs"

const FIREBASE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

type FirebaseTokenPayload = {
  aud: string
  email?: string
  exp: number
  iat: number
  iss: string
  sub: string
}

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
    return toErrorResponse(error)
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
    return toErrorResponse(error)
  }
}

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server credentials are not configured")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function getUserIdentityFromRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) {
    throw new ApiError("Missing Firebase token", 401)
  }

  const token = authorization.slice("Bearer ".length)
  const payload = await verifyFirebaseToken(token)

  if (!payload.email) {
    throw new ApiError("Firebase token is missing email", 401)
  }

  return normalizeUserIdentity(payload.email)
}

async function verifyFirebaseToken(token: string): Promise<FirebaseTokenPayload> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".")

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new ApiError("Invalid Firebase token format", 401)
  }

  const header = JSON.parse(base64UrlDecode(encodedHeader)) as { alg?: string; kid?: string }
  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as FirebaseTokenPayload
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  if (!projectId) {
    throw new Error("Firebase project id is not configured")
  }

  if (header.alg !== "RS256" || !header.kid) {
    throw new ApiError("Unsupported Firebase token header", 401)
  }

  if (payload.aud !== projectId) {
    throw new ApiError("Firebase token audience mismatch", 401)
  }

  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new ApiError("Firebase token issuer mismatch", 401)
  }

  if (!payload.sub) {
    throw new ApiError("Firebase token subject is missing", 401)
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp <= now || payload.iat > now) {
    throw new ApiError("Firebase token is expired or invalid", 401)
  }

  const certificates = await fetchFirebaseCertificates()
  const certificate = certificates[header.kid]

  if (!certificate) {
    throw new ApiError("Firebase signing certificate not found", 401)
  }

  const verifier = createVerify("RSA-SHA256")
  verifier.update(`${encodedHeader}.${encodedPayload}`)
  verifier.end()

  const isValid = verifier.verify(certificate, base64UrlToBuffer(encodedSignature))
  if (!isValid) {
    throw new ApiError("Firebase token signature verification failed", 401)
  }

  return payload
}

async function fetchFirebaseCertificates(): Promise<Record<string, string>> {
  const response = await fetch(FIREBASE_CERTS_URL, {
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error("Unable to fetch Firebase signing certificates")
  }

  return (await response.json()) as Record<string, string>
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

function toErrorResponse(error: unknown) {
  if (error instanceof SecurityError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  if (error instanceof ApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  const message = error instanceof Error ? error.message : "Unexpected invoices API error"
  return NextResponse.json({ message }, { status: 500 })
}

function base64UrlDecode(value: string) {
  return Buffer.from(normalizeBase64Url(value), "base64").toString("utf8")
}

function base64UrlToBuffer(value: string) {
  return Buffer.from(normalizeBase64Url(value), "base64")
}

function normalizeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padding = (4 - (normalized.length % 4)) % 4
  return `${normalized}${"=".repeat(padding)}`
}

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

function validateInvoicePayload(invoice: GSTInvoiceRecord): GSTInvoiceRecord {
  if (!invoice || typeof invoice !== "object") {
    throw new SecurityError("Invalid invoice payload", 400)
  }

  const items = Array.isArray(invoice.items) ? invoice.items : []
  if (!items.length || items.length > 200) {
    throw new SecurityError("Invoice must contain between 1 and 200 items", 400)
  }

  const validatedItems = items.map((item) => ({
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
