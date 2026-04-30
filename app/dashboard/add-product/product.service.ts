import { db } from "@/app/components/client/useClient"
import { Product } from "@/app/lib/db"
import { autoSyncToSupabase } from "@/app/lib/autoSupabaseSync.service"
import { buildSaleLogNote } from "@/app/lib/saleMetadata"
import { v4 as uuidv4 } from "uuid"

async function ensureCloudSync(context: string) {
  try {
    await autoSyncToSupabase()
  } catch {
    throw new Error(`${context} local database me save ho gaya, lekin cloud sync fail ho gaya`)
  }
}

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
  const normalizedName = data.name.trim().toLowerCase()
  const normalizedCategory = (data.category || "").trim().toLowerCase()

  const existing = await db.products
    .where("[userId+name+category]")
    .equals([data.userId, normalizedName, normalizedCategory])
    .first()

  if (existing) {
    await db.products.update(existing.id, {
      quantity: existing.quantity + data.quantity,
      price: data.price,
      expiry: data.expiry,
      supplier: data.supplier || existing.supplier,
      sku: data.sku || existing.sku,
      note: data.note || existing.note,
    })

    await db.productLogs.add({
      id: uuidv4(),
      productId: existing.id,
      quantityAdded: Number(data.quantity),
      type: "in",
      price: Number(data.price),
      expiry: data.expiry || undefined,
      date: new Date().toISOString(),
      note: data.note || undefined,
    })

    await ensureCloudSync("Stock update")
    return "updated"
  }

  const newId = uuidv4()

  await db.products.add({
    id: newId,
    name: normalizedName,
    price: Number(data.price),
    quantity: Number(data.quantity),
    category: normalizedCategory || undefined,
    supplier: data.supplier || undefined,
    expiry: data.expiry || undefined,
    sku: data.sku || undefined,
    note: data.note || undefined,
    userId: data.userId,
    createdAt: new Date().toISOString(),
  })

  await db.productLogs.add({
    id: uuidv4(),
    productId: newId,
    quantityAdded: Number(data.quantity),
    type: "in",
    price: Number(data.price),
    expiry: data.expiry || undefined,
    date: new Date().toISOString(),
    note: data.note || undefined,
  })

  await ensureCloudSync("Product creation")
  return "created"
}

type StockOutInput = {
  productId: string
  quantity: number
  salePrice: number
  expiry?: string
  reason?: string
  buyerName?: string
  buyerPhone?: string
  buyerGstin?: string
  note?: string
}

export async function stockOut(data: StockOutInput, options?: { skipImmediateSync?: boolean }) {
  const product = await db.products.get(data.productId)
  if (!product) throw new Error("Product not found")

  const normalizedReason = data.reason || "Sold"
  const normalizedSalePrice = Number(data.salePrice || 0)

  if (data.quantity > product.quantity) {
    throw new Error(`Only ${product.quantity} available, cannot stock out ${data.quantity}`)
  }

  await db.products.update(data.productId, {
    quantity: product.quantity - data.quantity,
  })

  await db.productLogs.add({
    id: uuidv4(),
    productId: data.productId,
    quantityAdded: -Number(data.quantity),
    type: "out",
    reason: normalizedReason,
    price: normalizedSalePrice,
    expiry: data.expiry,
    date: new Date().toISOString(),
    note: buildSaleLogNote({
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      buyerGstin: data.buyerGstin,
      note: data.note,
    }),
  })

  if (!options?.skipImmediateSync) {
    await ensureCloudSync("Stock out")
  }

  return "stocked-out"
}

export async function stockOutMany(entries: StockOutInput[]) {
  await db.transaction("rw", db.products, db.productLogs, async () => {
    for (const entry of entries) {
      await stockOut(entry, { skipImmediateSync: true })
    }
  })

  await ensureCloudSync("Bulk stock out")
  return "stocked-out-many"
}

type UpdateProductInput = {
  productId: string
  name: string
  price: number
  category?: string
  supplier?: string
  expiry?: string
  note?: string
  sku?: string
}

type UpdateProductLogInput = {
  logId: string
  quantity: number
  price: number
  type?: "in" | "out"
  reason?: string
  expiry?: string
  date?: string
  note?: string
  buyerName?: string
  buyerPhone?: string
  buyerGstin?: string
}

export async function updateProductDetails(data: UpdateProductInput) {
  const product = await db.products.get(data.productId)
  if (!product) throw new Error("Product not found")

  const normalizedName = data.name.trim().toLowerCase()
  const normalizedCategory = (data.category || "").trim().toLowerCase()

  if (!normalizedName) {
    throw new Error("Product name is required")
  }

  const duplicate = await db.products
    .where("[userId+name+category]")
    .equals([product.userId, normalizedName, normalizedCategory])
    .first()

  if (duplicate && duplicate.id !== product.id) {
    throw new Error("Another product already exists with same name and category")
  }

  await db.products.update(product.id, {
    name: normalizedName,
    price: Number(data.price),
    category: normalizedCategory || undefined,
    supplier: data.supplier?.trim() || undefined,
    expiry: data.expiry || undefined,
    sku: data.sku?.trim() || undefined,
    note: data.note?.trim() || undefined,
  })

  await ensureCloudSync("Product update")
  return "product-updated"
}

export async function deleteProductWithLogs(productId: string) {
  const product = await db.products.get(productId)
  if (!product) throw new Error("Product not found")

  await db.transaction("rw", db.products, db.productLogs, async () => {
    await db.productLogs.where("productId").equals(productId).delete()
    await db.products.delete(productId)
  })

  await ensureCloudSync("Product deletion")
  return "product-deleted"
}

export async function updateProductLog(data: UpdateProductLogInput) {
  const log = await db.productLogs.get(data.logId)
  if (!log) throw new Error("History entry not found")

  const product = await db.products.get(log.productId)
  if (!product) throw new Error("Related product not found")

  const nextType = data.type || log.type || (log.quantityAdded < 0 ? "out" : "in")
  const nextQuantity = Number(data.quantity)
  const nextPrice = Number(data.price || 0)

  if (!nextQuantity || nextQuantity <= 0) {
    throw new Error("Quantity should be greater than 0")
  }

  if (nextPrice < 0) {
    throw new Error("Price cannot be negative")
  }

  const nextSignedQuantity = nextType === "out" ? -nextQuantity : nextQuantity
  const nextProductQuantity = product.quantity - log.quantityAdded + nextSignedQuantity

  if (nextProductQuantity < 0) {
    throw new Error("Correction would make stock negative")
  }

  await db.transaction("rw", db.products, db.productLogs, async () => {
    await db.products.update(product.id, {
      quantity: nextProductQuantity,
    })

    await db.productLogs.update(log.id, {
      quantityAdded: nextSignedQuantity,
      type: nextType,
      reason: nextType === "out" ? data.reason || log.reason || "Sold" : undefined,
      price: nextPrice,
      expiry: data.expiry || undefined,
      date: data.date || log.date,
      correctedAt: new Date().toISOString(),
      correctionLabel: "corrected",
      note:
        nextType === "out"
          ? buildSaleLogNote({
              buyerName: data.buyerName,
              buyerPhone: data.buyerPhone,
              buyerGstin: data.buyerGstin,
              note: data.note,
            })
          : data.note?.trim() || undefined,
    })
  })

  await ensureCloudSync("History correction")
  return "log-updated"
}

export async function deleteProductLog(logId: string) {
  const log = await db.productLogs.get(logId)
  if (!log) throw new Error("History entry not found")

  const product = await db.products.get(log.productId)
  if (!product) throw new Error("Related product not found")

  const nextProductQuantity = product.quantity - log.quantityAdded
  if (nextProductQuantity < 0) {
    throw new Error("Cannot delete this entry because stock would become negative")
  }

  await db.transaction("rw", db.products, db.productLogs, async () => {
    await db.products.update(product.id, {
      quantity: nextProductQuantity,
    })
    await db.productLogs.delete(log.id)
  })

  await ensureCloudSync("History deletion")
  return "log-deleted"
}

export async function getProducts(userId: string): Promise<Product[]> {
  return await db.products.where("userId").equals(userId).toArray()
}

export async function getProductLogs(productId: string) {
  return await db.productLogs.where("productId").equals(productId).reverse().toArray()
}

export async function getProductExpiryBatches(productId: string) {
  const logs = await db.productLogs.where("productId").equals(productId).toArray()
  const batchMap = new Map<string, number>()

  for (const log of logs) {
    if (!log.expiry) continue
    const current = batchMap.get(log.expiry) || 0
    batchMap.set(log.expiry, current + Number(log.quantityAdded))
  }

  return Array.from(batchMap.entries())
    .map(([expiry, quantity]) => ({
      expiry,
      quantity: Math.max(0, quantity),
    }))
    .filter((batch) => batch.quantity > 0)
    .sort((left, right) => new Date(left.expiry).getTime() - new Date(right.expiry).getTime())
}
