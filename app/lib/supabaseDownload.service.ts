"use client"

import { db } from "./db"
import { auth } from "./firebase"
import { authHeaders, isMissingTableError, readApiError } from "./apiClient"
import { normalizeQuantityUnit } from "./quantityUnit"
import { getUserIdentityFromAuthUser } from "./userIdentity"
import type { PurchaseRecord, StockTransactionProduct, StockTransactionType } from "./db"

type ProductSyncRow = {
  id: string
  name: string
  price: number | string
  quantity: number | string
  quantity_unit?: string | null
  category?: string
  supplier?: string
  note?: string
  expiry?: string
  sku?: string
  hsn_code?: string | null
  low_stock_threshold?: number | string | null
  critical_stock_threshold?: number | string | null
  user_id: string
  created_at: string
}

type ProductLogSyncRow = {
  id: string
  product_id: string
  product_name?: string | null
  product_category?: string | null
  product_sku?: string | null
  product_hsn_code?: string | null
  quantity_added: number | string
  quantity?: number | string | null
  quantity_unit?: string | null
  old_stock?: number | string | null
  new_stock?: number | string | null
  type: "in" | "out"
  reason?: string
  price: number | string
  amount?: number | string | null
  taxable_amount?: number | string | null
  gst_rate?: number | string | null
  cgst_amount?: number | string | null
  sgst_amount?: number | string | null
  igst_amount?: number | string | null
  gst_amount?: number | string | null
  expiry?: string
  date: string
  note?: string
  notes?: string | null
  transaction_id?: string | null
  transaction_type?: StockTransactionType | null
  invoice_receipt_no?: string | null
  payment_mode?: string | null
  payment_status?: string | null
  products?: StockTransactionProduct[] | null
  corrected_at?: string | null
  correction_label?: string | null
}

type PurchaseSyncResponse = {
  purchases: PurchaseRecord[]
}

export async function syncSupabaseToDexie() {
  const user = auth?.currentUser
  if (!user) throw new Error("User not logged in")

  const token = await user.getIdToken()
  const userId = getUserIdentityFromAuthUser(user)
  if (!userId) throw new Error("Authenticated user is missing an email address")

  const response = await fetch("/api/products/sync", {
    method: "GET",
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const error = await readApiError(response, "Products fetch request")
    console.error("Fetch products error:", error)
    throw error
  }

  const { products, logs } = (await response.json()) as {
    products: ProductSyncRow[]
    logs: ProductLogSyncRow[]
  }

  await db.transaction("rw", db.products, db.productLogs, async () => {
    if (products.length) {
      await db.products.bulkPut(
        products.map((product) => ({
          id: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: Number(product.quantity),
          quantityUnit: normalizeQuantityUnit(product.quantity_unit),
          category: product.category,
          supplier: product.supplier,
          note: product.note,
          expiry: product.expiry,
          sku: product.sku,
          hsnCode: product.hsn_code || undefined,
          lowStockThreshold: normalizeOptionalNumber(product.low_stock_threshold),
          criticalStockThreshold: normalizeOptionalNumber(product.critical_stock_threshold),
          userId: String(product.user_id),
          createdAt: product.created_at,
        }))
      )
    }

    if (logs.length) {
      await db.productLogs.bulkPut(
        logs.map((log) => {
          const quantityAdded = Number(log.quantity_added)
          const quantity = Math.abs(normalizeOptionalNumber(log.quantity) ?? quantityAdded)
          return {
            id: log.id,
            productId: log.product_id,
            productName: log.product_name || undefined,
            productCategory: log.product_category || undefined,
            productSku: log.product_sku || undefined,
            productHsnCode: log.product_hsn_code || undefined,
            quantityAdded,
            quantity,
            quantityUnit: normalizeQuantityUnit(log.quantity_unit),
            oldStock: normalizeOptionalNumber(log.old_stock),
            newStock: normalizeOptionalNumber(log.new_stock),
            type: log.type,
            reason: log.reason,
            price: Number(log.price),
            amount: normalizeOptionalNumber(log.amount),
            taxableAmount: normalizeOptionalNumber(log.taxable_amount),
            gstRate: normalizeOptionalNumber(log.gst_rate),
            cgstAmount: normalizeOptionalNumber(log.cgst_amount),
            sgstAmount: normalizeOptionalNumber(log.sgst_amount),
            igstAmount: normalizeOptionalNumber(log.igst_amount),
            gstAmount: normalizeOptionalNumber(log.gst_amount),
            expiry: log.expiry,
            date: log.date,
            transactionId: log.transaction_id || undefined,
            transactionType: log.transaction_type || undefined,
            invoiceReceiptNo: log.invoice_receipt_no || undefined,
            paymentMode: log.payment_mode || undefined,
            paymentStatus: log.payment_status || undefined,
            products: Array.isArray(log.products) ? log.products : undefined,
            correctedAt: log.corrected_at || undefined,
            correctionLabel: log.correction_label || undefined,
            note: log.note,
            notes: log.notes || undefined,
          }
        })
      )
    }
  })

  await syncPurchasesFromSupabase(token, userId)

  console.log("Supabase to Dexie sync complete")
}

async function syncPurchasesFromSupabase(token: string, userId: string) {
  const response = await fetch("/api/purchases/sync", {
    method: "GET",
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const error = await readApiError(response, "Purchases fetch request")
    if (isMissingTableError(error, "purchases")) {
      console.warn("Purchase download skipped because Supabase purchases table is not created yet.")
      return
    }
    console.error("Fetch purchases error:", error)
    throw error
  }

  const { purchases } = (await response.json()) as PurchaseSyncResponse

  await db.transaction("rw", db.purchases, async () => {
    if (purchases.length) {
      await db.purchases.bulkPut(
        purchases.map((purchase) => ({
          ...purchase,
          userId,
          amountPaid: Number(purchase.amountPaid || 0),
          totalAmount: Number(purchase.totalAmount || 0),
          dueAmount: Number(purchase.dueAmount || 0),
          items: purchase.items.map((item) => ({
            ...item,
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 0),
            quantityUnit: normalizeQuantityUnit(item.quantityUnit),
            lineTotal: Number(item.lineTotal || 0),
          })),
        }))
      )
    }
  })
}

function normalizeOptionalNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
