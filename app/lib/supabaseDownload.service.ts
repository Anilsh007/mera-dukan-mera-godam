"use client"

import { db } from "./db"
import { auth } from "./firebase"
import { authHeaders, isMissingTableError, readApiError } from "./apiClient"
import { normalizeQuantityUnit } from "./quantityUnit"
import { getUserIdentityFromAuthUser } from "./userIdentity"
import type { PurchaseRecord } from "./db"

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
  quantity_added: number | string
  quantity_unit?: string | null
  type: "in" | "out"
  reason?: string
  price: number | string
  expiry?: string
  date: string
  note?: string
}

type PurchaseSyncResponse = {
  purchases: PurchaseRecord[]
}

export async function syncSupabaseToDexie() {
  const user = auth.currentUser
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

  const existingProductIds = await db.products.where("userId").equals(userId).primaryKeys()

  await db.transaction("rw", db.products, db.productLogs, async () => {
    const normalizedExistingProductIds = existingProductIds.map(String)

    if (normalizedExistingProductIds.length) {
      await db.productLogs.where("productId").anyOf(normalizedExistingProductIds).delete()
      await db.products.bulkDelete(normalizedExistingProductIds)
    }

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
        logs.map((log) => ({
          id: log.id,
          productId: log.product_id,
          quantityAdded: Number(log.quantity_added),
          quantityUnit: normalizeQuantityUnit(log.quantity_unit),
          type: log.type,
          reason: log.reason,
          price: Number(log.price),
          expiry: log.expiry,
          date: log.date,
          note: log.note,
        }))
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
  const existingPurchaseIds = await db.purchases.where("userId").equals(userId).primaryKeys()

  await db.transaction("rw", db.purchases, async () => {
    const normalizedPurchaseIds = existingPurchaseIds.map(String)
    if (normalizedPurchaseIds.length) {
      await db.purchases.bulkDelete(normalizedPurchaseIds)
    }

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
