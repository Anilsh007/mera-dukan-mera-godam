"use client"

import { db } from "./db"
import { auth } from "./firebase"
import { authHeaders, isMissingTableError, readApiError } from "./apiClient"
import { getUserIdentityFromAuthUser } from "./userIdentity"
import { en } from "@/app/messages/en"
import { clearDeletionTombstones, loadDeletionTombstones } from "@/app/lib/persistence/syncTombstone.service"

export async function syncDexieToSupabase() {
  const user = auth?.currentUser
  if (!user) throw new Error(en.profile.signInRequired)

  const token = await user.getIdToken()
  if (!token) throw new Error(en.profile.signInRequired)
  const userId = getUserIdentityFromAuthUser(user)
  if (!userId) throw new Error(en.profile.signInRequired)

  const products = await db.products.where("userId").equals(userId).toArray()
  const productIds = products.map((product) => product.id)
  const logs = productIds.length
    ? await db.productLogs.where("productId").anyOf(productIds).toArray()
    : []
  const purchases = await db.purchases.where("userId").equals(userId).toArray()
  const tombstones = await loadDeletionTombstones(userId)
  const [
    profiles,
    invoices,
    sales,
    estimates,
    returnDocuments,
    expenses,
    cashbookEntries,
    inventoryLocations,
    productLocationStocks,
    inventoryBatches,
    stockTransfers,
    parties,
    partyLedger,
    subscriptions,
    usageTracking,
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

  if (
    !products.length &&
    !logs.length &&
    !purchases.length &&
    !profiles.length &&
    !invoices.length &&
    !sales.length &&
    !estimates.length &&
    !returnDocuments.length &&
    !expenses.length &&
    !cashbookEntries.length &&
    !inventoryLocations.length &&
    !productLocationStocks.length &&
    !inventoryBatches.length &&
    !stockTransfers.length &&
    !parties.length &&
    !partyLedger.length &&
    !subscriptions.length &&
    !usageTracking.length &&
    !tombstones.length
  ) {
    console.log("No local data to sync")
    return
  }

  const deletedProducts = tombstones.filter((entry) => entry.entity === "products")
  const deletedLogs = tombstones.filter((entry) => entry.entity === "productLogs")
  if (products.length || logs.length || deletedProducts.length || deletedLogs.length) {
    const response = await fetch("/api/products/sync", {
      method: "POST",
      headers: authHeaders(token, true),
      body: JSON.stringify({
        products,
        logs,
        deletedProductIds: deletedProducts.map((entry) => entry.recordId),
        deletedLogIds: deletedLogs.map((entry) => entry.recordId),
      }),
    })

    if (!response.ok) {
      const error = await readApiError(response, "Products sync request")
      console.error("Product sync error:", error.message || error)
      throw new Error(error.message || "Product sync failed")
    }

    console.log(`Synced ${products.length} products & ${logs.length} logs to Supabase`)
    await clearDeletionTombstones([...deletedProducts, ...deletedLogs].map((entry) => entry.id))
  }

  if (purchases.length) {
    const response = await fetch("/api/purchases/sync", {
      method: "POST",
      headers: authHeaders(token, true),
      body: JSON.stringify({ purchases }),
    })

    if (!response.ok) {
      const error = await readApiError(response, "Purchases sync request")
      if (isMissingTableError(error, "purchases")) {
        console.warn("Purchase sync skipped because Supabase purchases table is not created yet.")
      } else {
        console.error("Purchase sync error:", error.message || error)
        throw new Error(error.message || "Purchase sync failed")
      }
    } else {
      console.log(`Synced ${purchases.length} purchases to Supabase`)
    }
  }

  const genericPayload = {
    profiles,
    invoices,
    sales,
    estimates,
    returnDocuments,
    expenses,
    cashbookEntries,
    inventoryLocations,
    productLocationStocks,
    inventoryBatches,
    stockTransfers,
    parties,
    partyLedger,
    subscriptions,
    usageTracking,
  }
  const genericDeletes = {
    profiles: tombstones.filter((entry) => entry.entity === "profiles").map((entry) => entry.recordId),
    invoices: tombstones.filter((entry) => entry.entity === "invoices").map((entry) => entry.recordId),
    sales: tombstones.filter((entry) => entry.entity === "sales").map((entry) => entry.recordId),
    estimates: tombstones.filter((entry) => entry.entity === "estimates").map((entry) => entry.recordId),
    returnDocuments: tombstones.filter((entry) => entry.entity === "returnDocuments").map((entry) => entry.recordId),
    expenses: tombstones.filter((entry) => entry.entity === "expenses").map((entry) => entry.recordId),
    cashbookEntries: tombstones.filter((entry) => entry.entity === "cashbookEntries").map((entry) => entry.recordId),
    inventoryLocations: tombstones.filter((entry) => entry.entity === "inventoryLocations").map((entry) => entry.recordId),
    productLocationStocks: tombstones.filter((entry) => entry.entity === "productLocationStocks").map((entry) => entry.recordId),
    inventoryBatches: tombstones.filter((entry) => entry.entity === "inventoryBatches").map((entry) => entry.recordId),
    stockTransfers: tombstones.filter((entry) => entry.entity === "stockTransfers").map((entry) => entry.recordId),
    parties: tombstones.filter((entry) => entry.entity === "parties").map((entry) => entry.recordId),
    partyLedger: tombstones.filter((entry) => entry.entity === "partyLedger").map((entry) => entry.recordId),
    subscriptions: tombstones.filter((entry) => entry.entity === "subscriptions").map((entry) => entry.recordId),
    usageTracking: tombstones.filter((entry) => entry.entity === "usageTracking").map((entry) => entry.recordId),
  }

  const hasGenericData = Object.values(genericPayload).some((records) => records.length > 0)
  const hasGenericDeletes = Object.values(genericDeletes).some((ids) => ids.length > 0)
  if (!hasGenericData && !hasGenericDeletes) return

  const response = await fetch("/api/sync/all", {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify({
      ...genericPayload,
      deleted: genericDeletes,
    }),
  })

  if (!response.ok) {
    const error = await readApiError(response, "Generic sync request")
    console.error("Generic sync error:", error.message || error)
    throw new Error(error.message || "Generic sync failed")
  }

  console.log("Synced extended business data to Supabase")
  await db.invoices
    .where("userId")
    .equals(userId)
    .modify((invoice) => {
      invoice.syncStatus = "synced"
    })
  await clearDeletionTombstones(
    tombstones
      .filter((entry) => entry.entity !== "products" && entry.entity !== "productLogs")
      .map((entry) => entry.id),
  )
}
