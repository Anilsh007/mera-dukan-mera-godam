"use client"

import { db } from "./db"
import { auth } from "./firebase"

export async function syncDexieToSupabase() {
  const user = auth.currentUser
  if (!user) throw new Error("User not logged in")

  const token = await user.getIdToken()
  const userId = normalizeUserIdentity(user.email)
  if (!userId) throw new Error("Authenticated user is missing an email address")

  const products = await db.products.where("userId").equals(userId).toArray()
  const productIds = products.map((product) => product.id)
  const logs = productIds.length
    ? await db.productLogs.where("productId").anyOf(productIds).toArray()
    : []

  if (!products.length && !logs.length) {
    console.log("No local data to sync")
    return
  }

  const response = await fetch("/api/products/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ products, logs }),
  })

  if (!response.ok) {
    const error = await readApiError(response)
    console.error("Product sync error:", error)
    throw error
  }

  console.log(`Synced ${products.length} products & ${logs.length} logs to Supabase`)
}

function normalizeUserIdentity(email: string | null | undefined) {
  return email?.trim().toLowerCase() || null
}

async function readApiError(response: Response) {
  try {
    return await response.json()
  } catch {
    return {
      message: `Products sync request failed with status ${response.status}`,
    }
  }
}
