"use client"

import { db } from "./db"
import { auth } from "./firebase"
import { authHeaders, isMissingTableError, readApiError } from "./apiClient"
import { normalizeQuantityUnit } from "./quantityUnit"
import { getUserIdentityFromAuthUser } from "./userIdentity"
import { en } from "@/app/messages/en"
import type { PurchaseRecord, StockTransactionProduct, StockTransactionType } from "./db"
import { syncDexieToSupabase } from "./supabaseSync.service"

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
  if (!user) throw new Error(en.profile.signInRequired)

  const token = await user.getIdToken()
  const userId = getUserIdentityFromAuthUser(user)
  if (!userId) throw new Error(en.profile.signInRequired)
  await syncDexieToSupabase()

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
  const localProducts = await db.products.where("userId").equals(userId).toArray()
  const localProductIds = localProducts.map((product) => product.id)
  const localLogs = localProductIds.length
    ? await db.productLogs.where("productId").anyOf(localProductIds).toArray()
    : []
  const remoteProductIds = new Set(products.map((product) => product.id))
  const staleProductIds = localProducts
    .filter((product) => !remoteProductIds.has(product.id))
    .map((product) => product.id)
  const staleProductIdSet = new Set(staleProductIds)
  const remoteLogIds = new Set(logs.map((log) => log.id))
  const staleLogIds = localLogs
    .filter((log) => staleProductIdSet.has(log.productId) || !remoteLogIds.has(log.id))
    .map((log) => log.id)

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

    if (staleLogIds.length) {
      await db.productLogs.bulkDelete(staleLogIds)
    }
    if (staleProductIds.length) {
      await db.products.bulkDelete(staleProductIds)
    }
  })

  await syncPurchasesFromSupabase(token, userId)
  await syncExtendedDataFromSupabase(token)

  console.log("Supabase to Dexie sync complete")
}

async function syncPurchasesFromSupabase(token: string, userId: string) {
  const localPurchases = await db.purchases.where("userId").equals(userId).toArray()
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
  const remotePurchaseIds = new Set(purchases.map((purchase) => purchase.id))
  const stalePurchaseIds = localPurchases
    .filter((purchase) => !remotePurchaseIds.has(purchase.id))
    .map((purchase) => purchase.id)

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
    if (stalePurchaseIds.length) {
      await db.purchases.bulkDelete(stalePurchaseIds)
    }
  })
}

type GenericSyncResponse = {
  profiles?: Array<Record<string, unknown>>
  invoices?: Array<Record<string, unknown>>
  sales?: Array<Record<string, unknown>>
  estimates?: Array<Record<string, unknown>>
  returnDocuments?: Array<Record<string, unknown>>
  expenses?: Array<Record<string, unknown>>
  cashbookEntries?: Array<Record<string, unknown>>
  inventoryLocations?: Array<Record<string, unknown>>
  productLocationStocks?: Array<Record<string, unknown>>
  inventoryBatches?: Array<Record<string, unknown>>
  stockTransfers?: Array<Record<string, unknown>>
  parties?: Array<Record<string, unknown>>
  partyLedger?: Array<Record<string, unknown>>
  subscriptions?: Array<Record<string, unknown>>
  usageTracking?: Array<Record<string, unknown>>
}

async function syncExtendedDataFromSupabase(token: string) {
  const response = await fetch("/api/sync/all", {
    method: "GET",
    headers: authHeaders(token),
  })

  if (!response.ok) {
    const error = await readApiError(response, "Extended sync fetch request")
    console.error("Fetch extended sync error:", error)
    throw error
  }

  const payload = (await response.json()) as GenericSyncResponse
  const user = auth?.currentUser
  if (!user) throw new Error(en.profile.signInRequired)
  const userId = getUserIdentityFromAuthUser(user)
  if (!userId) throw new Error(en.profile.signInRequired)
  const [
    localProfiles,
    localInvoices,
    localSales,
    localEstimates,
    localReturnDocuments,
    localExpenses,
    localCashbookEntries,
    localInventoryLocations,
    localProductLocationStocks,
    localInventoryBatches,
    localStockTransfers,
    localParties,
    localPartyLedger,
    localSubscriptions,
    localUsageTracking,
  ] = await Promise.all([
    db.profiles.where("userId").equals(userId).toArray(),
    db.invoices.where("userId").equals(userId).toArray(),
    db.sales.where("userId").equals(userId).toArray(),
    db.estimates.where("userId").equals(userId).toArray(),
    db.returnDocuments.where("userId").equals(userId).toArray(),
    db.expenses.where("userId").equals(userId).toArray(),
    db.cashbookEntries.where("userId").equals(userId).toArray(),
    db.inventoryLocations.where("userId").equals(userId).toArray(),
    db.productLocationStocks.where("userId").equals(userId).toArray(),
    db.inventoryBatches.where("userId").equals(userId).toArray(),
    db.stockTransfers.where("userId").equals(userId).toArray(),
    db.parties.where("userId").equals(userId).toArray(),
    db.partyLedger.where("userId").equals(userId).toArray(),
    db.subscriptions.where("userId").equals(userId).toArray(),
    db.usageTracking.where("userId").equals(userId).toArray(),
  ])

  await db.transaction(
    "rw",
    [
      db.profiles,
      db.invoices,
      db.sales,
      db.estimates,
      db.returnDocuments,
      db.expenses,
      db.cashbookEntries,
      db.inventoryLocations,
      db.productLocationStocks,
      db.inventoryBatches,
      db.stockTransfers,
      db.parties,
      db.partyLedger,
      db.subscriptions,
      db.usageTracking,
    ],
    async () => {
      await reconcileUserScopedTable({
        table: db.profiles,
        localRecords: localProfiles,
        remoteRecords: payload.profiles || [],
        idSelector: (record) => String(record.userId),
      })
      await reconcileUserScopedTable({
        table: db.invoices,
        localRecords: localInvoices,
        remoteRecords: payload.invoices || [],
        idSelector: (record) => String(record.id),
      })
      await reconcileUserScopedTable({
        table: db.sales,
        localRecords: localSales,
        remoteRecords: payload.sales || [],
        idSelector: (record) => String(record.id),
      })
      await reconcileUserScopedTable({
        table: db.estimates,
        localRecords: localEstimates,
        remoteRecords: payload.estimates || [],
        idSelector: (record) => String(record.id),
      })
      await reconcileUserScopedTable({
        table: db.returnDocuments,
        localRecords: localReturnDocuments,
        remoteRecords: payload.returnDocuments || [],
        idSelector: (record) => String(record.id),
      })
      await reconcileUserScopedTable({
        table: db.expenses,
        localRecords: localExpenses,
        remoteRecords: payload.expenses || [],
        idSelector: (record) => String(record.id),
      })
      await reconcileUserScopedTable({
        table: db.cashbookEntries,
        localRecords: localCashbookEntries,
        remoteRecords: payload.cashbookEntries || [],
        idSelector: (record) => String(record.id),
      })
      await reconcileUserScopedTable({
        table: db.inventoryLocations,
        localRecords: localInventoryLocations,
        remoteRecords: payload.inventoryLocations || [],
        idSelector: (record) => String(record.id),
      })
      await reconcileUserScopedTable({
        table: db.productLocationStocks,
        localRecords: localProductLocationStocks,
        remoteRecords: payload.productLocationStocks || [],
        idSelector: (record) => String(record.id),
      })
      await reconcileUserScopedTable({
        table: db.inventoryBatches,
        localRecords: localInventoryBatches,
        remoteRecords: payload.inventoryBatches || [],
        idSelector: (record) => String(record.id),
      })
      await reconcileUserScopedTable({
        table: db.stockTransfers,
        localRecords: localStockTransfers,
        remoteRecords: payload.stockTransfers || [],
        idSelector: (record) => String(record.id),
      })
      await reconcileUserScopedTable({
        table: db.parties,
        localRecords: localParties,
        remoteRecords: payload.parties || [],
        idSelector: (record) => String(record.id),
      })
      await reconcileUserScopedTable({
        table: db.partyLedger,
        localRecords: localPartyLedger,
        remoteRecords: payload.partyLedger || [],
        idSelector: (record) => String(record.id),
      })
      await reconcileUserScopedTable({
        table: db.subscriptions,
        localRecords: localSubscriptions,
        remoteRecords: payload.subscriptions || [],
        idSelector: (record) => String(record.id),
      })
      await reconcileUserScopedTable({
        table: db.usageTracking,
        localRecords: localUsageTracking,
        remoteRecords: payload.usageTracking || [],
        idSelector: (record) => String(record.id),
      })
    },
  )
}

async function reconcileUserScopedTable<T extends { userId?: string }>(params: {
  table: { bulkPut: (records: T[]) => Promise<unknown>; bulkDelete: (keys: string[]) => Promise<unknown> }
  localRecords: T[]
  remoteRecords: Array<Record<string, unknown>>
  idSelector: (record: T) => string
}) {
  const { table, localRecords, remoteRecords, idSelector } = params
  const normalizedRemote = remoteRecords as T[]
  const remoteIds = new Set(normalizedRemote.map((record) => idSelector(record)))
  const staleIds = localRecords
    .map((record) => idSelector(record))
    .filter((id) => !remoteIds.has(id))

  if (normalizedRemote.length) {
    await table.bulkPut(normalizedRemote)
  }
  if (staleIds.length) {
    await table.bulkDelete(staleIds)
  }
}

function normalizeOptionalNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
