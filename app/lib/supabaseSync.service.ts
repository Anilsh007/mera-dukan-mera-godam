"use client"

import { db } from "./db"
import { auth } from "./firebase"
import { authHeaders, isMissingTableError, readApiError } from "./apiClient"
import { getUserIdentityFromAuthUser } from "./userIdentity"

export async function syncDexieToSupabase() {
  const user = auth.currentUser
  if (!user) throw new Error("User not logged in")

  const token = await user.getIdToken()
  const userId = getUserIdentityFromAuthUser(user)
  if (!userId) throw new Error("Authenticated user is missing an email address")

  const products = await db.products.where("userId").equals(userId).toArray()
  const productIds = products.map((product) => product.id)
  const logs = productIds.length
    ? await db.productLogs.where("productId").anyOf(productIds).toArray()
    : []
  const purchases = await db.purchases.where("userId").equals(userId).toArray()

  if (!products.length && !logs.length && !purchases.length) {
    console.log("No local data to sync")
    return
  }

  if (products.length || logs.length) {
    const response = await fetch("/api/products/sync", {
      method: "POST",
      headers: authHeaders(token, true),
      body: JSON.stringify({ products, logs }),
    })

    if (!response.ok) {
      const error = await readApiError(response, "Products sync request")
      console.error("Product sync error:", error)
      throw error
    }

    console.log(`Synced ${products.length} products & ${logs.length} logs to Supabase`)
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
        return
      }
      console.error("Purchase sync error:", error)
      throw error
    }

    console.log(`Synced ${purchases.length} purchases to Supabase`)
  }
}
