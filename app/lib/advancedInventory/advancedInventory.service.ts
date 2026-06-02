"use client"

import { v4 as uuidv4 } from "uuid"
import {
  db,
  type InventoryLocationRecord,
  type Product,
  type ProductLocationStockRecord,
  type ProductLog,
  type StockTransferRecord,
} from "@/app/lib/db"
import { roundCurrency } from "@/app/lib/gst.utils"
import { normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import { assertFeatureAccess } from "@/app/lib/subscription/subscription.service"
import { requestSupabaseSync } from "@/app/lib/persistence/supabaseSyncTrigger"
import { requirePositiveNumber, trimOrUndefined, trimToLowerOrUndefined } from "@/app/lib/normalization.utils"
import { en } from "@/app/messages/en"

export const DEFAULT_LOCATION_CODE = "MAIN"

export type LocationStockDeltaInput = {
  userId: string
  product: Product
  locationId?: string
  locationName?: string
  quantityDelta: number
  quantityUnit?: string
  oldProductStock: number
  batchNo?: string
  expiry?: string
  skipImmediateSync?: boolean
}

export type SaveInventoryLocationInput = {
  userId: string
  name: string
  code?: string
  notes?: string
}

export type StockTransferInput = {
  userId: string
  productId: string
  fromLocationId: string
  toLocationId: string
  quantity: number
  note?: string
}

export type InventoryLocationOption = {
  id: string
  name: string
  isDefault: boolean
}

export async function ensureDefaultInventoryLocation(
  userId: string,
  options?: { skipImmediateSync?: boolean },
): Promise<InventoryLocationRecord> {
  const existing = await db.inventoryLocations
    .where("userId")
    .equals(userId)
    .filter((location) => location.isDefault)
    .first()
  if (existing) return existing

  const now = new Date().toISOString()
  const location: InventoryLocationRecord = {
    id: uuidv4(),
    userId,
    name: en.advancedInventory.defaultGodownName,
    code: DEFAULT_LOCATION_CODE,
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  }
  await db.inventoryLocations.add(location)
  if (!options?.skipImmediateSync) await requestSupabaseSync("inventory location")
  return location
}

export async function saveInventoryLocation(input: SaveInventoryLocationInput) {
  const name = trimOrUndefined(input.name)
  if (!name) throw new Error(en.advancedInventory.locationNameRequired)

  await assertFeatureAccess(input.userId, "godowns", { operation: "create", scope: "premium" })
  const existing = await db.inventoryLocations
    .where("[userId+name]")
    .equals([input.userId, name.toLowerCase()])
    .first()
  if (existing) throw new Error(en.advancedInventory.locationAlreadyExists)

  const now = new Date().toISOString()
  const location: InventoryLocationRecord = {
    id: uuidv4(),
    userId: input.userId,
    name: trimToLowerOrUndefined(name) || name,
    code: trimOrUndefined(input.code),
    isDefault: false,
    notes: trimOrUndefined(input.notes),
    createdAt: now,
    updatedAt: now,
  }
  await db.inventoryLocations.add(location)
  await requestSupabaseSync("inventory location")
  return location
}

export async function loadInventoryLocations(userId: string) {
  await ensureDefaultInventoryLocation(userId)
  const locations = await db.inventoryLocations.where("userId").equals(userId).toArray()
  return locations.sort((left, right) => Number(right.isDefault) - Number(left.isDefault) || left.name.localeCompare(right.name))
}

export async function loadProductLocationStocks(userId: string) {
  return db.productLocationStocks.where("userId").equals(userId).toArray()
}

export async function loadInventoryBatches(userId: string) {
  return db.inventoryBatches.where("userId").equals(userId).toArray()
}

export async function loadStockTransfers(userId: string) {
  const transfers = await db.stockTransfers.where("userId").equals(userId).toArray()
  return transfers.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export async function adjustAdvancedInventoryStock(input: LocationStockDeltaInput) {
  const location = input.locationId
    ? await db.inventoryLocations.get(input.locationId)
    : await ensureDefaultInventoryLocation(input.userId, { skipImmediateSync: input.skipImmediateSync })
  if (!location || location.userId !== input.userId) throw new Error(en.advancedInventory.locationNotFound)

  const delta = roundCurrency(Number(input.quantityDelta || 0))
  if (!Number.isFinite(delta) || delta === 0) return

  const quantityUnit = normalizeQuantityUnit(input.quantityUnit || input.product.quantityUnit)
  await adjustLocationStock({
    userId: input.userId,
    product: input.product,
    location,
    delta,
    quantityUnit,
    oldProductStock: input.oldProductStock,
  })

  if (input.batchNo || input.expiry) {
    await adjustBatchStock({
      userId: input.userId,
      product: input.product,
      location,
      delta,
      quantityUnit,
      batchNo: input.batchNo,
      expiry: input.expiry,
    })
  }

  if (!input.skipImmediateSync) await requestSupabaseSync("advanced inventory stock")
}

export async function ensureProductDefaultLocationStock(userId: string, product: Product) {
  const existing = await db.productLocationStocks.where("productId").equals(product.id).first()
  if (existing) return
  const location = await ensureDefaultInventoryLocation(userId)
  await db.productLocationStocks.put(buildLocationStock({
    userId,
    productId: product.id,
    location,
    quantity: Number(product.quantity || 0),
    quantityUnit: normalizeQuantityUnit(product.quantityUnit),
  }))
}

export async function transferStock(input: StockTransferInput) {
  const quantity = requirePositiveNumber(input.quantity, en.advancedInventory.validTransferQuantity)
  if (input.fromLocationId === input.toLocationId) throw new Error(en.advancedInventory.transferDifferentLocation)

  await assertFeatureAccess(input.userId, "godowns", { operation: "update", scope: "premium" })

  const [product, fromLocation, toLocation] = await Promise.all([
    db.products.get(input.productId),
    db.inventoryLocations.get(input.fromLocationId),
    db.inventoryLocations.get(input.toLocationId),
  ])
  if (!product || product.userId !== input.userId) throw new Error(en.advancedInventory.productNotFound)
  if (!fromLocation || fromLocation.userId !== input.userId || !toLocation || toLocation.userId !== input.userId) {
    throw new Error(en.advancedInventory.locationNotFound)
  }

  await ensureProductDefaultLocationStock(input.userId, product)
  const fromStock = await getLocationStock(product.id, fromLocation.id)
  if (quantity > Number(fromStock?.quantity || 0)) {
    throw new Error(en.advancedInventory.transferStockInsufficient)
  }

  const now = new Date().toISOString()
  const toStock = await getLocationStock(product.id, toLocation.id)
  const unit = normalizeQuantityUnit(product.quantityUnit)
  const transfer: StockTransferRecord = {
    id: uuidv4(),
    userId: input.userId,
    transferNo: buildTransferNumber(),
    productId: product.id,
    productName: product.name,
    fromLocationId: fromLocation.id,
    fromLocationName: fromLocation.name,
    toLocationId: toLocation.id,
    toLocationName: toLocation.name,
    quantity,
    quantityUnit: unit,
    note: trimOrUndefined(input.note),
    createdAt: now,
  }

  await db.transaction("rw", db.productLocationStocks, db.stockTransfers, db.productLogs, async () => {
    await db.productLocationStocks.put({
      ...(fromStock || buildLocationStock({ userId: input.userId, productId: product.id, location: fromLocation, quantity: 0, quantityUnit: unit })),
      quantity: roundCurrency(Number(fromStock?.quantity || 0) - quantity),
      updatedAt: now,
    })
    await db.productLocationStocks.put({
      ...(toStock || buildLocationStock({ userId: input.userId, productId: product.id, location: toLocation, quantity: 0, quantityUnit: unit })),
      quantity: roundCurrency(Number(toStock?.quantity || 0) + quantity),
      updatedAt: now,
    })
    await db.stockTransfers.add(transfer)
    await db.productLogs.add(buildTransferLog(product, transfer, now))
  })

  await requestSupabaseSync("stock transfer")

  return transfer
}

export async function getLocationOptions(userId: string): Promise<InventoryLocationOption[]> {
  const locations = await loadInventoryLocations(userId)
  return locations.map((location) => ({ id: location.id, name: location.name, isDefault: location.isDefault }))
}

async function adjustLocationStock({
  userId,
  product,
  location,
  delta,
  quantityUnit,
  oldProductStock,
}: {
  userId: string
  product: Product
  location: InventoryLocationRecord
  delta: number
  quantityUnit: string
  oldProductStock: number
}) {
  const rows = await db.productLocationStocks.where("productId").equals(product.id).toArray()
  const current = rows.find((row) => row.locationId === location.id)
  const now = new Date().toISOString()

  if (!rows.length) {
    if (delta < 0 && !location.isDefault) throw new Error(en.advancedInventory.locationStockInsufficient)
    await db.productLocationStocks.put(buildLocationStock({
      userId,
      productId: product.id,
      location,
      quantity: roundCurrency(oldProductStock + delta),
      quantityUnit,
      updatedAt: now,
    }))
    return
  }

  if (!current && delta < 0) throw new Error(en.advancedInventory.locationStockInsufficient)

  if (!current) {
    await db.productLocationStocks.add(buildLocationStock({
      userId,
      productId: product.id,
      location,
      quantity: delta,
      quantityUnit,
      updatedAt: now,
    }))
    return
  }

  const nextQuantity = roundCurrency(Number(current.quantity || 0) + delta)
  if (nextQuantity < 0) throw new Error(en.advancedInventory.locationStockInsufficient)
  await db.productLocationStocks.update(current.id, {
    quantity: nextQuantity,
    quantityUnit,
    locationName: location.name,
    updatedAt: now,
  })
}

async function adjustBatchStock({
  userId,
  product,
  location,
  delta,
  quantityUnit,
  batchNo,
  expiry,
}: {
  userId: string
  product: Product
  location: InventoryLocationRecord
  delta: number
  quantityUnit: string
  batchNo?: string
  expiry?: string
}) {
  const cleanBatch = batchNo?.trim() || undefined
  const cleanExpiry = expiry || undefined
  const rows = await db.inventoryBatches.where("[productId+locationId]").equals([product.id, location.id]).toArray()
  const current = rows.find((row) => (row.batchNo || "") === (cleanBatch || "") && (row.expiry || "") === (cleanExpiry || ""))
  const now = new Date().toISOString()
  if (!current && delta < 0) return

  if (!current) {
    await db.inventoryBatches.add({
      id: uuidv4(),
      userId,
      productId: product.id,
      productName: product.name,
      batchNo: cleanBatch,
      expiry: cleanExpiry,
      locationId: location.id,
      locationName: location.name,
      quantity: Math.max(0, delta),
      quantityUnit,
      updatedAt: now,
    })
    return
  }

  const nextQuantity = Math.max(0, roundCurrency(Number(current.quantity || 0) + delta))
  await db.inventoryBatches.update(current.id, {
    productName: product.name,
    locationName: location.name,
    quantity: nextQuantity,
    quantityUnit,
    updatedAt: now,
  })
}

function buildLocationStock({
  userId,
  productId,
  location,
  quantity,
  quantityUnit,
  updatedAt = new Date().toISOString(),
}: {
  userId: string
  productId: string
  location: InventoryLocationRecord
  quantity: number
  quantityUnit: string
  updatedAt?: string
}): ProductLocationStockRecord {
  return {
    id: `${productId}:${location.id}`,
    userId,
    productId,
    locationId: location.id,
    locationName: location.name,
    quantity: roundCurrency(Math.max(0, quantity)),
    quantityUnit,
    updatedAt,
  }
}

async function getLocationStock(productId: string, locationId: string) {
  return db.productLocationStocks.where("[productId+locationId]").equals([productId, locationId]).first()
}

function buildTransferLog(product: Product, transfer: StockTransferRecord, now: string): ProductLog {
  return {
    id: uuidv4(),
    productId: product.id,
    productName: product.name,
    productCategory: product.category,
    productSku: product.sku,
    productHsnCode: product.hsnCode,
    locationId: transfer.toLocationId,
    locationName: `${transfer.fromLocationName} → ${transfer.toLocationName}`,
    quantityAdded: 0,
    quantity: transfer.quantity,
    quantityUnit: transfer.quantityUnit,
    oldStock: product.quantity,
    newStock: product.quantity,
    type: "in",
    reason: en.advancedInventory.stockTransfer,
    price: product.price,
    amount: 0,
    date: now,
    transactionId: transfer.id,
    transactionType: "stock-transfer",
    invoiceReceiptNo: transfer.transferNo,
    note: transfer.note,
    notes: transfer.note,
  }
}

function buildTransferNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "")
  return `TRF-${date}-${Date.now().toString().slice(-5)}`
}
