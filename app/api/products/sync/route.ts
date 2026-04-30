import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { createVerify } from "node:crypto"
import { normalizeUserIdentity } from "@/app/lib/userIdentity"
import {
  assertContentLength,
  assertFiniteNumber,
  assertIsoDate,
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

type SyncPayload = {
  products: Array<{
    id: string
    name: string
    price: number
    quantity: number
    category?: string
    supplier?: string
    note?: string
    expiry?: string
    sku?: string
    userId: string
    createdAt: string
  }>
  logs: Array<{
    id: string
    productId: string
    quantityAdded: number
    type: "in" | "out"
    reason?: string
    price: number
    expiry?: string
    date: string
    note?: string
  }>
}

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: "products-sync:get", limit: 120, windowMs: 60_000 })
    const userId = await getUserIdentityFromRequest(request)
    const supabase = createSupabaseAdminClient()

    const { data: products, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", userId)

    if (productError) {
      return NextResponse.json(
        { code: productError.code, message: productError.message, details: productError.details, hint: productError.hint },
        { status: 500 }
      )
    }

    const productIds = (products || []).map((product) => String(product.id))

    const { data: logs, error: logError } = productIds.length
      ? await supabase.from("product_logs").select("*").in("product_id", productIds)
      : { data: [], error: null }

    if (logError) {
      return NextResponse.json(
        { code: logError.code, message: logError.message, details: logError.details, hint: logError.hint },
        { status: 500 }
      )
    }

    return NextResponse.json({
      products: products || [],
      logs: logs || [],
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: "products-sync:post", limit: 40, windowMs: 60_000 })
    assertContentLength(request, 1024 * 1024)
    const userId = await getUserIdentityFromRequest(request)
    const { products, logs } = validateSyncPayload((await request.json()) as SyncPayload)
    const supabase = createSupabaseAdminClient()
    const incomingProductIds = products.map((product) => product.id)
    const incomingLogIds = logs.map((log) => log.id)

    const { data: existingProducts, error: existingProductsError } = await supabase
      .from("products")
      .select("id")
      .eq("user_id", userId)

    if (existingProductsError) {
      return NextResponse.json(
        { code: existingProductsError.code, message: existingProductsError.message, details: existingProductsError.details, hint: existingProductsError.hint },
        { status: 500 }
      )
    }

    const existingProductIds = (existingProducts || []).map((product) => String(product.id))
    const productIdsToDelete = existingProductIds.filter((id) => !incomingProductIds.includes(id))

    if (productIdsToDelete.length) {
      const { error: deleteLogsByProductError } = await supabase
        .from("product_logs")
        .delete()
        .in("product_id", productIdsToDelete)

      if (deleteLogsByProductError) {
        return NextResponse.json(
          { code: deleteLogsByProductError.code, message: deleteLogsByProductError.message, details: deleteLogsByProductError.details, hint: deleteLogsByProductError.hint },
          { status: 500 }
        )
      }

      const { error: deleteProductsError } = await supabase
        .from("products")
        .delete()
        .in("id", productIdsToDelete)
        .eq("user_id", userId)

      if (deleteProductsError) {
        return NextResponse.json(
          { code: deleteProductsError.code, message: deleteProductsError.message, details: deleteProductsError.details, hint: deleteProductsError.hint },
          { status: 500 }
        )
      }
    }

    const { error: productError } = await supabase.from("products").upsert(
      products.map((product) => ({
        id: product.id,
        user_id: userId,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        category: product.category,
        supplier: product.supplier,
        note: product.note,
        expiry: product.expiry,
        sku: product.sku,
        created_at: product.createdAt,
      }))
    )

    if (productError) {
      return NextResponse.json(
        { code: productError.code, message: productError.message, details: productError.details, hint: productError.hint },
        { status: 500 }
      )
    }

    const scopedProductIds = incomingProductIds.length ? incomingProductIds : existingProductIds
    const hasForeignLogReference = logs.some((log) => !scopedProductIds.includes(log.productId))
    if (hasForeignLogReference) {
      return NextResponse.json({ message: "Logs contain invalid product references" }, { status: 400 })
    }

    const { data: existingLogs, error: existingLogsError } = scopedProductIds.length
      ? await supabase
          .from("product_logs")
          .select("id")
          .in("product_id", scopedProductIds)
      : { data: [], error: null }

    if (existingLogsError) {
      return NextResponse.json(
        { code: existingLogsError.code, message: existingLogsError.message, details: existingLogsError.details, hint: existingLogsError.hint },
        { status: 500 }
      )
    }

    const existingLogIds = (existingLogs || []).map((log) => String(log.id))
    const logIdsToDelete = existingLogIds.filter((id) => !incomingLogIds.includes(id))

    if (logIdsToDelete.length) {
      const { error: deleteLogsError } = await supabase
        .from("product_logs")
        .delete()
        .in("id", logIdsToDelete)

      if (deleteLogsError) {
        return NextResponse.json(
          { code: deleteLogsError.code, message: deleteLogsError.message, details: deleteLogsError.details, hint: deleteLogsError.hint },
          { status: 500 }
        )
      }
    }

    const { error: logError } = await supabase.from("product_logs").upsert(
      logs.map((log) => ({
        id: log.id,
        product_id: log.productId,
        quantity_added: log.quantityAdded,
        type: log.type,
        reason: log.reason,
        price: log.price,
        expiry: log.expiry,
        date: log.date,
        note: log.note,
      }))
    )

    if (logError) {
      return NextResponse.json(
        { code: logError.code, message: logError.message, details: logError.details, hint: logError.hint },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
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

function toErrorResponse(error: unknown) {
  if (error instanceof SecurityError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  if (error instanceof ApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  const message = error instanceof Error ? error.message : "Unexpected products API error"
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

function validateSyncPayload(payload: SyncPayload) {
  if (!payload || !Array.isArray(payload.products) || !Array.isArray(payload.logs)) {
    throw new SecurityError("Invalid sync payload", 400)
  }

  if (payload.products.length > 5000 || payload.logs.length > 50000) {
    throw new SecurityError("Sync payload exceeds allowed size", 400)
  }

  const products = payload.products.map((product) => ({
    id: sanitizeRequiredText(product.id, 120, "Product id"),
    name: sanitizeRequiredText(product.name, 160, "Product name"),
    price: assertFiniteNumber(product.price, "Product price", { min: 0, max: 10_000_000 }),
    quantity: assertFiniteNumber(product.quantity, "Product quantity", { min: 0, max: 1_000_000 }),
    category: sanitizeOptionalText(product.category, 100),
    supplier: sanitizeOptionalText(product.supplier, 160),
    note: sanitizeOptionalText(product.note, 1000),
    expiry: product.expiry ? assertIsoDate(product.expiry, "Product expiry") : undefined,
    sku: sanitizeOptionalText(product.sku, 80),
    userId: sanitizeRequiredText(product.userId, 160, "Product userId"),
    createdAt: assertIsoDate(product.createdAt, "Product createdAt"),
  }))

  const logs = payload.logs.map((log) => ({
    id: sanitizeRequiredText(log.id, 120, "Log id"),
    productId: sanitizeRequiredText(log.productId, 120, "Log productId"),
    quantityAdded: assertFiniteNumber(log.quantityAdded, "Log quantity", { min: -1_000_000, max: 1_000_000 }),
    type: log.type === "in" || log.type === "out" ? log.type : (() => {
      throw new SecurityError("Invalid log type", 400)
    })(),
    reason: sanitizeOptionalText(log.reason, 120),
    price: assertFiniteNumber(log.price, "Log price", { min: 0, max: 10_000_000 }),
    expiry: log.expiry ? assertIsoDate(log.expiry, "Log expiry") : undefined,
    date: assertIsoDate(log.date, "Log date"),
    note: sanitizeOptionalText(log.note, 1000),
  }))

  return { products, logs }
}
