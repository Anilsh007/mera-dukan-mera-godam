"use client"

import { db } from "./db"
import { auth } from "./firebase"

export async function syncSupabaseToDexie() {
  const user = auth.currentUser
  if (!user) throw new Error("User not logged in")

  const token = await user.getIdToken()
  const userId = normalizeUserIdentity(user.email)
  if (!userId) throw new Error("Authenticated user is missing an email address")

  const response = await fetch("/api/products/sync", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await readApiError(response)
    console.error("Fetch products error:", error)
    throw error
  }

  const { products, logs } = (await response.json()) as {
    products: any[]
    logs: any[]
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
          category: product.category,
          supplier: product.supplier,
          note: product.note,
          expiry: product.expiry,
          sku: product.sku,
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

  console.log("Supabase to Dexie sync complete")
}

function normalizeUserIdentity(email: string | null | undefined) {
  return email?.trim().toLowerCase() || null
}

async function readApiError(response: Response) {
  try {
    return await response.json()
  } catch {
    return {
      message: `Products fetch request failed with status ${response.status}`,
    }
  }
}
