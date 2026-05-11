import { NextRequest, NextResponse } from "next/server"
import { normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import {
  createSupabaseAdminClient,
  getUserIdentityFromRequest,
  toApiErrorResponse,
} from "@/app/api/_lib/auth"
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

type SyncPayload = {
  products: Array<{
    id: string
    name: string
    price: number
    quantity: number
    quantityUnit?: string
    category?: string
    supplier?: string
    note?: string
    expiry?: string
    sku?: string
    hsnCode?: string
    lowStockThreshold?: number
    criticalStockThreshold?: number
    userId: string
    createdAt: string
  }>
  logs: Array<{
    id: string
    productId: string
    quantityAdded: number
    quantityUnit?: string
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
    return toApiErrorResponse(error, "Unexpected products API error")
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
        quantity_unit: product.quantityUnit,
        category: product.category,
        supplier: product.supplier,
        note: product.note,
        expiry: product.expiry,
        sku: product.sku,
        hsn_code: product.hsnCode,
        low_stock_threshold: product.lowStockThreshold,
        critical_stock_threshold: product.criticalStockThreshold,
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
        quantity_unit: log.quantityUnit,
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
    return toApiErrorResponse(error, "Unexpected products API error")
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
    quantityUnit: normalizeQuantityUnit(sanitizeOptionalText(product.quantityUnit, 40)),
    category: sanitizeOptionalText(product.category, 100),
    supplier: sanitizeOptionalText(product.supplier, 160),
    note: sanitizeOptionalText(product.note, 1000),
    expiry: product.expiry ? assertIsoDate(product.expiry, "Product expiry") : undefined,
    sku: sanitizeOptionalText(product.sku, 80),
    hsnCode: sanitizeOptionalText(product.hsnCode, 40),
    lowStockThreshold: assertOptionalFiniteNumber(product.lowStockThreshold, "Product low stock threshold", {
      min: 0,
      max: 1_000_000,
    }),
    criticalStockThreshold: assertOptionalFiniteNumber(product.criticalStockThreshold, "Product critical stock threshold", {
      min: 0,
      max: 1_000_000,
    }),
    userId: sanitizeRequiredText(product.userId, 160, "Product userId"),
    createdAt: assertIsoDate(product.createdAt, "Product createdAt"),
  }))

  const logs = payload.logs.map((log) => ({
    id: sanitizeRequiredText(log.id, 120, "Log id"),
    productId: sanitizeRequiredText(log.productId, 120, "Log productId"),
    quantityAdded: assertFiniteNumber(log.quantityAdded, "Log quantity", { min: -1_000_000, max: 1_000_000 }),
    quantityUnit: normalizeQuantityUnit(sanitizeOptionalText(log.quantityUnit, 40)),
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

function assertOptionalFiniteNumber(
  value: unknown,
  fieldName: string,
  options?: { min?: number; max?: number }
) {
  if (value === null || value === undefined || value === "") return undefined
  return assertFiniteNumber(value, fieldName, options)
}
