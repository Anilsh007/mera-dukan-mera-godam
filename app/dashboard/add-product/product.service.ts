import { db } from "@/app/components/client/useClient"
import { Product } from "@/app/lib/db"
import { scheduleSync } from "@/app/lib/syncManager"

export async function addProduct(data: {
  name: string
  price: number
  quantity: number
  category?: string
  supplier?: string
  expiry?: string
  note?: string
  sku?: string
  userId: string
}) {

  await db.products.add({
    ...data,
    createdAt: new Date().toISOString()
  })
  scheduleSync();
}

export async function getProducts(userId: string): Promise<Product[]> {
  return await db.products
    .where("userId")
    .equals(userId)
    .toArray()
}