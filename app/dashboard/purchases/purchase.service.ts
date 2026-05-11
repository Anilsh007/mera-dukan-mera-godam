"use client"

import { v4 as uuidv4 } from "uuid"
import { addProduct } from "@/app/dashboard/add-product/product.service"
import { db, type PurchaseItem, type PurchasePaymentStatus, type PurchaseRecord } from "@/app/lib/db"
import { autoSyncToSupabase } from "@/app/lib/autoSupabaseSync.service"
import { normalizeQuantityUnit } from "@/app/lib/quantityUnit"

export type PurchaseLineInput = {
  name: string
  price: number
  quantity: number
  quantityUnit: string
  category?: string
  expiry?: string
  sku?: string
  hsnCode?: string
  note?: string
}

export type SavePurchaseInput = {
  userId: string
  billNo: string
  supplierName: string
  purchaseDate: string
  purchaseDateTime?: string
  paymentStatus: PurchasePaymentStatus
  paymentMode?: string
  amountPaid: number
  note?: string
  items: PurchaseLineInput[]
}

export type SaveQuickPurchaseInput = {
  userId: string
  ref?: string
  purchaseDate?: string
  purchaseDateTime?: string
  paymentStatus: PurchasePaymentStatus
  paymentMode?: string
  amountPaid: number
  dueAmount: number
  items: Array<PurchaseLineInput & { supplier: string }>
}

export type ApplySupplierPaymentInput = {
  userId: string
  supplierName: string
  amount: number
  paymentMode?: string
  note?: string
}

export async function savePurchase(input: SavePurchaseInput) {
  const billNo = input.billNo.trim()
  const supplierName = input.supplierName.trim()
  const purchaseDate = input.purchaseDate || new Date().toISOString().slice(0, 10)
  const purchaseDateTime = input.purchaseDateTime || buildDateTimeFromDate(purchaseDate)

  if (!billNo) throw new Error("Purchase bill number required hai")
  if (!supplierName) throw new Error("Supplier name required hai")
  if (!input.items.length) throw new Error("Kam se kam ek purchase item add karo")

  const existing = await db.purchases.where("[userId+billNo]").equals([input.userId, billNo]).first()
  if (existing) throw new Error("Is bill number ki purchase already saved hai")

  const cleanLines = input.items.map((item) => {
    const name = item.name.trim()
    const price = Number(item.price)
    const quantity = Number(item.quantity)
    const quantityUnit = normalizeQuantityUnit(item.quantityUnit)

    if (!name) throw new Error("Product name required hai")
    if (!Number.isFinite(price) || price < 0) throw new Error(`${name}: price valid nahi hai`)
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(`${name}: quantity zero se zyada honi chahiye`)

    return {
      ...item,
      name,
      price,
      quantity,
      quantityUnit,
      category: item.category?.trim() || undefined,
      expiry: item.expiry || undefined,
      sku: item.sku?.trim() || undefined,
      hsnCode: item.hsnCode?.trim() || undefined,
      note: item.note?.trim() || undefined,
    }
  })

  const totalAmount = cleanLines.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const normalizedPaid =
    input.paymentStatus === "unpaid" ? 0 : Math.min(Math.max(Number(input.amountPaid || 0), 0), totalAmount)
  const amountPaid = input.paymentStatus === "paid" ? totalAmount : normalizedPaid
  const dueAmount = Math.max(totalAmount - amountPaid, 0)
  const now = new Date().toISOString()
  const purchaseId = uuidv4()
  const savedItems: PurchaseItem[] = []

  await db.transaction("rw", db.products, db.productLogs, db.purchases, async () => {
    for (const line of cleanLines) {
      const before = await db.products
        .where("[userId+name+category+quantityUnit]")
        .equals([
          input.userId,
          line.name.toLowerCase(),
          (line.category || "").toLowerCase(),
          line.quantityUnit,
        ])
        .first()

      await addProduct(
        {
          name: line.name,
          price: line.price,
          quantity: line.quantity,
          quantityUnit: line.quantityUnit,
          category: line.category,
          supplier: supplierName,
          expiry: line.expiry,
          sku: line.sku,
          hsnCode: line.hsnCode,
          note: buildPurchaseLogNote(billNo, purchaseId, line.note),
          userId: input.userId,
        },
        { skipImmediateSync: true }
      )

      const product =
        before ||
        (await db.products
          .where("[userId+name+category+quantityUnit]")
          .equals([
            input.userId,
            line.name.toLowerCase(),
            (line.category || "").toLowerCase(),
            line.quantityUnit,
          ])
          .first())

      if (!product) throw new Error(`${line.name}: product save failed`)

      savedItems.push({
        id: uuidv4(),
        productId: product.id,
        name: line.name.toLowerCase(),
        price: line.price,
        quantity: line.quantity,
        quantityUnit: line.quantityUnit,
        category: line.category?.toLowerCase() || undefined,
        expiry: line.expiry,
        sku: line.sku,
        hsnCode: line.hsnCode,
        note: line.note,
        lineTotal: line.price * line.quantity,
      })
    }

    const record: PurchaseRecord = {
      id: purchaseId,
      userId: input.userId,
      billNo,
      supplierName,
      purchaseDate,
      purchaseDateTime,
      paymentStatus: input.paymentStatus,
      paymentMode: input.paymentMode?.trim() || undefined,
      amountPaid,
      totalAmount,
      dueAmount,
      note: input.note?.trim() || undefined,
      items: savedItems,
      createdAt: now,
      updatedAt: now,
    }

    await db.purchases.add(record)
  })

  await autoSyncToSupabase()
  return purchaseId
}

export async function saveQuickPurchase(input: SaveQuickPurchaseInput) {
  if (!input.items.length) throw new Error("Kam se kam ek quick purchase item add karo")

  const totalAmount = input.items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  )
  const supplierGroups = groupBySupplier(input.items)
  const baseRef = input.ref?.trim() || `QP-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Date.now()}`
  const savedIds: string[] = []

  for (const [index, [supplierName, items]] of supplierGroups.entries()) {
    const supplierTotal = items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    )
    const supplierPaid =
      totalAmount > 0 ? Math.round((Number(input.amountPaid || 0) * supplierTotal) / totalAmount) : 0
    const billNo = supplierGroups.length === 1 ? baseRef : `${baseRef}-${index + 1}`

    const id = await savePurchase({
      userId: input.userId,
      billNo,
      supplierName,
      purchaseDate: input.purchaseDate || new Date().toISOString().slice(0, 10),
      purchaseDateTime: input.purchaseDateTime,
      paymentStatus: input.paymentStatus,
      paymentMode: input.paymentMode,
      amountPaid: supplierPaid,
      note: "Created from Quick Purchase",
      items: items.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        quantityUnit: item.quantityUnit,
        category: item.category,
        expiry: item.expiry,
        sku: item.sku,
        hsnCode: item.hsnCode,
        note: item.note,
      })),
    })

    savedIds.push(id)
  }

  return savedIds
}

export async function loadPurchases(userId: string) {
  const purchases = await db.purchases.where("userId").equals(userId).toArray()
  return purchases.sort((left, right) => right.purchaseDate.localeCompare(left.purchaseDate))
}

export async function applySupplierPayment(input: ApplySupplierPaymentInput) {
  const supplierName = input.supplierName.trim()
  const amount = Number(input.amount)

  if (!supplierName) throw new Error("Supplier name required hai")
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Payment amount zero se zyada hona chahiye")

  const duePurchases = (await db.purchases
    .where("userId")
    .equals(input.userId)
    .toArray())
    .filter(
      (purchase) =>
        purchase.supplierName.trim().toLowerCase() === supplierName.toLowerCase() &&
        purchase.dueAmount > 0
    )
    .sort((left, right) => {
      const leftDate = left.purchaseDateTime || left.purchaseDate
      const rightDate = right.purchaseDateTime || right.purchaseDate
      return leftDate.localeCompare(rightDate)
    })

  const totalDue = duePurchases.reduce((sum, purchase) => sum + purchase.dueAmount, 0)
  if (!duePurchases.length || totalDue <= 0) throw new Error("Is supplier ka due pending nahi hai")

  let remaining = Math.min(amount, totalDue)
  const now = new Date().toISOString()
  const paymentNote = buildPaymentNote({
    amount: Math.min(amount, totalDue),
    paymentMode: input.paymentMode,
    note: input.note,
    paidAt: now,
  })

  await db.transaction("rw", db.purchases, async () => {
    for (const purchase of duePurchases) {
      if (remaining <= 0) break

      const applied = Math.min(remaining, purchase.dueAmount)
      const nextPaid = purchase.amountPaid + applied
      const nextDue = Math.max(purchase.totalAmount - nextPaid, 0)
      const nextStatus: PurchasePaymentStatus =
        nextDue === 0 ? "paid" : nextPaid > 0 ? "partial" : "unpaid"

      await db.purchases.update(purchase.id, {
        amountPaid: nextPaid,
        dueAmount: nextDue,
        paymentStatus: nextStatus,
        paymentMode: input.paymentMode?.trim() || purchase.paymentMode,
        note: [purchase.note, paymentNote].filter(Boolean).join(" | "),
        updatedAt: now,
      })

      remaining -= applied
    }
  })

  await autoSyncToSupabase()
  return {
    paidAmount: Math.min(amount, totalDue),
    remainingSupplierDue: Math.max(totalDue - amount, 0),
  }
}

function buildPurchaseLogNote(billNo: string, purchaseId: string, note?: string) {
  return [`Purchase Bill: ${billNo}`, `Purchase ID: ${purchaseId}`, note].filter(Boolean).join(" | ")
}

function buildPaymentNote({
  amount,
  paymentMode,
  note,
  paidAt,
}: {
  amount: number
  paymentMode?: string
  note?: string
  paidAt: string
}) {
  return [
    `Payment: Rs ${amount}`,
    paymentMode?.trim() ? `Mode: ${paymentMode.trim()}` : "",
    `Paid At: ${paidAt}`,
    note?.trim(),
  ].filter(Boolean).join(" / ")
}

function buildDateTimeFromDate(date: string) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString()
  return parsed.toISOString()
}

function groupBySupplier(items: Array<PurchaseLineInput & { supplier: string }>) {
  const groups = new Map<string, Array<PurchaseLineInput & { supplier: string }>>()

  for (const item of items) {
    const supplier = item.supplier.trim()
    if (!supplier) throw new Error(`${item.name || "Item"}: supplier required hai`)
    groups.set(supplier, [...(groups.get(supplier) || []), item])
  }

  return Array.from(groups.entries())
}
