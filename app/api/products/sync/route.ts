import { NextRequest, NextResponse } from "next/server"
import { normalizeQuantityUnit } from "@/app/lib/quantityUnit"
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
    productName?: string
    productCategory?: string
    productSku?: string
    productHsnCode?: string
    quantityAdded: number
    quantity?: number
    quantityUnit?: string
    oldStock?: number
    newStock?: number
    type: "in" | "out"
    reason?: string
    price: number
    amount?: number
    taxableAmount?: number
    gstRate?: number
    cgstAmount?: number
    sgstAmount?: number
    igstAmount?: number
    gstAmount?: number
    expiry?: string
    date: string
    transactionId?: string
    transactionType?:
      | "purchase"
      | "quick-purchase"
      | "stock-in"
      | "sale"
      | "multi-item-sale"
      | "stock-adjustment"
      | "stock-correction"
    invoiceReceiptNo?: string
    paymentMode?: string
    paymentStatus?: string
    products?: Array<{
      productId?: string
      name: string
      category?: string
      sku?: string
      hsnCode?: string
      quantity: number
      quantityUnit: string
      oldStock?: number
      newStock?: number
      rate: number
      amount: number
      gstRate?: number
      gstAmount?: number
    }>
    note?: string
    notes?: string
    correctedAt?: string
    correctionLabel?: string
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

    const productIds = (products || []).map((product: { id: unknown }) => String(product.id))

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
    const { products, logs } = validateSyncPayload(await readJsonBody<SyncPayload>(request))
    const supabase = createSupabaseAdminClient()
    const incomingProductIds = products.map((product) => product.id)

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

    const scopedProductIds = incomingProductIds
    const hasForeignLogReference = logs.some((log) => !scopedProductIds.includes(log.productId))
    if (hasForeignLogReference) {
      return NextResponse.json({ message: "Logs contain invalid product references" }, { status: 400 })
    }

    let { error: logError } = await supabase.from("product_logs").upsert(logs.map(mapLogToSupabaseRow))

    if (logError && isUnknownColumnError(logError)) {
      const retry = await supabase.from("product_logs").upsert(logs.map(mapLegacyLogToSupabaseRow))
      logError = retry.error
    }

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

  const logs = payload.logs.map((log) => {
    const quantityAdded = assertFiniteNumber(log.quantityAdded, "Log quantity", { min: -1_000_000, max: 1_000_000 })
    const quantity = assertOptionalFiniteNumber(log.quantity, "Log absolute quantity", { min: 0, max: 1_000_000 }) ?? Math.abs(quantityAdded)

    return {
      id: sanitizeRequiredText(log.id, 120, "Log id"),
      productId: sanitizeRequiredText(log.productId, 120, "Log productId"),
      productName: sanitizeOptionalText(log.productName, 160),
      productCategory: sanitizeOptionalText(log.productCategory, 100),
      productSku: sanitizeOptionalText(log.productSku, 80),
      productHsnCode: sanitizeOptionalText(log.productHsnCode, 40),
      quantityAdded,
      quantity,
      quantityUnit: normalizeQuantityUnit(sanitizeOptionalText(log.quantityUnit, 40)),
      oldStock: assertOptionalFiniteNumber(log.oldStock, "Log old stock", { min: -1_000_000, max: 1_000_000 }),
      newStock: assertOptionalFiniteNumber(log.newStock, "Log new stock", { min: -1_000_000, max: 1_000_000 }),
      type: log.type === "in" || log.type === "out" ? log.type : (() => {
        throw new SecurityError("Invalid log type", 400)
      })(),
      reason: sanitizeOptionalText(log.reason, 120),
      price: assertFiniteNumber(log.price, "Log price", { min: 0, max: 10_000_000 }),
      amount: assertOptionalFiniteNumber(log.amount, "Log amount", { min: 0, max: 100_000_000 }),
      taxableAmount: assertOptionalFiniteNumber(log.taxableAmount, "Log taxable amount", { min: 0, max: 100_000_000 }),
      gstRate: assertOptionalFiniteNumber(log.gstRate, "Log GST rate", { min: 0, max: 100 }),
      cgstAmount: assertOptionalFiniteNumber(log.cgstAmount, "Log CGST", { min: 0, max: 100_000_000 }),
      sgstAmount: assertOptionalFiniteNumber(log.sgstAmount, "Log SGST", { min: 0, max: 100_000_000 }),
      igstAmount: assertOptionalFiniteNumber(log.igstAmount, "Log IGST", { min: 0, max: 100_000_000 }),
      gstAmount: assertOptionalFiniteNumber(log.gstAmount, "Log GST amount", { min: 0, max: 100_000_000 }),
      expiry: log.expiry ? assertIsoDate(log.expiry, "Log expiry") : undefined,
      date: assertIsoDate(log.date, "Log date"),
      transactionId: sanitizeOptionalText(log.transactionId, 120),
      transactionType: sanitizeTransactionType(log.transactionType),
      invoiceReceiptNo: sanitizeOptionalText(log.invoiceReceiptNo, 120),
      paymentMode: sanitizeOptionalText(log.paymentMode, 80),
      paymentStatus: sanitizeOptionalText(log.paymentStatus, 80),
      products: sanitizeTransactionProducts(log.products),
      note: sanitizeOptionalText(log.note, 1000),
      notes: sanitizeOptionalText(log.notes, 1000),
      correctedAt: log.correctedAt ? assertIsoDate(log.correctedAt, "Log corrected date") : undefined,
      correctionLabel: sanitizeOptionalText(log.correctionLabel, 80),
    }
  })

  return { products, logs }
}


function mapLegacyLogToSupabaseRow(log: ReturnType<typeof validateSyncPayload>["logs"][number]) {
  return {
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
  }
}

function mapLogToSupabaseRow(log: ReturnType<typeof validateSyncPayload>["logs"][number]) {
  return {
    ...mapLegacyLogToSupabaseRow(log),
    product_name: log.productName,
    product_category: log.productCategory,
    product_sku: log.productSku,
    product_hsn_code: log.productHsnCode,
    quantity: log.quantity,
    old_stock: log.oldStock,
    new_stock: log.newStock,
    amount: log.amount,
    taxable_amount: log.taxableAmount,
    gst_rate: log.gstRate,
    cgst_amount: log.cgstAmount,
    sgst_amount: log.sgstAmount,
    igst_amount: log.igstAmount,
    gst_amount: log.gstAmount,
    transaction_id: log.transactionId,
    transaction_type: log.transactionType,
    invoice_receipt_no: log.invoiceReceiptNo,
    payment_mode: log.paymentMode,
    payment_status: log.paymentStatus,
    products: log.products,
    notes: log.notes,
    corrected_at: log.correctedAt,
    correction_label: log.correctionLabel,
  }
}

function isUnknownColumnError(error: { code?: string; message?: string }) {
  const message = error.message || ""
  return error.code === "PGRST204" || message.includes("schema cache") || message.includes("column")
}

function sanitizeTransactionType(value: SyncPayload["logs"][number]["transactionType"]) {
  if (!value) return undefined
  const validTypes = new Set([
    "purchase",
    "quick-purchase",
    "stock-in",
    "sale",
    "multi-item-sale",
    "stock-adjustment",
    "stock-correction",
  ])
  if (!validTypes.has(value)) throw new SecurityError("Invalid transaction type", 400)
  return value
}

function sanitizeTransactionProducts(value: SyncPayload["logs"][number]["products"]) {
  if (!Array.isArray(value)) return undefined
  return value.slice(0, 100).map((product) => ({
    productId: sanitizeOptionalText(product.productId, 120),
    name: sanitizeRequiredText(product.name, 160, "Transaction product name"),
    category: sanitizeOptionalText(product.category, 100),
    sku: sanitizeOptionalText(product.sku, 80),
    hsnCode: sanitizeOptionalText(product.hsnCode, 40),
    quantity: assertFiniteNumber(product.quantity, "Transaction product quantity", { min: 0, max: 1_000_000 }),
    quantityUnit: normalizeQuantityUnit(sanitizeOptionalText(product.quantityUnit, 40)),
    oldStock: assertOptionalFiniteNumber(product.oldStock, "Transaction product old stock", { min: -1_000_000, max: 1_000_000 }),
    newStock: assertOptionalFiniteNumber(product.newStock, "Transaction product new stock", { min: -1_000_000, max: 1_000_000 }),
    rate: assertFiniteNumber(product.rate, "Transaction product rate", { min: 0, max: 10_000_000 }),
    amount: assertFiniteNumber(product.amount, "Transaction product amount", { min: 0, max: 100_000_000 }),
    gstRate: assertOptionalFiniteNumber(product.gstRate, "Transaction product GST rate", { min: 0, max: 100 }),
    gstAmount: assertOptionalFiniteNumber(product.gstAmount, "Transaction product GST amount", { min: 0, max: 100_000_000 }),
  }))
}

function assertOptionalFiniteNumber(
  value: unknown,
  fieldName: string,
  options?: { min?: number; max?: number }
) {
  if (value === null || value === undefined || value === "") return undefined
  return assertFiniteNumber(value, fieldName, options)
}
