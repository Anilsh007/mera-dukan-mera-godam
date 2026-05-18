"use client"

import { v4 as uuidv4 } from "uuid"
import { addProduct } from "@/app/dashboard/quick-purchase/product.service"
import { db, type PurchaseDetailsStatus, type PurchaseEntryMode, type PurchaseItem, type PurchasePaymentStatus, type PurchaseRecord, type StockTransactionProduct } from "@/app/lib/db"
import { autoSyncToSupabase } from "@/app/lib/autoSupabaseSync.service"
import { normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import { en } from "@/app/messages/en"
import { makePurchaseBillNo } from "./purchase.form"

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
  entryMode?: PurchaseEntryMode
  detailsStatus?: PurchaseDetailsStatus
  detailsCompletedAt?: string
  items: PurchaseLineInput[]
}

export type QuickPurchaseLineInput = PurchaseLineInput & {
  supplierName?: string
}

export type SaveQuickPurchaseInput = {
  userId: string
  purchaseDate?: string
  purchaseDateTime?: string
  items: QuickPurchaseLineInput[]
}

export type CompletePurchaseDetailsInput = {
  userId: string
  purchaseId: string
  billNo: string
  supplierName: string
  purchaseDate: string
  paymentStatus: PurchasePaymentStatus
  paymentMode?: string
  amountPaid: number
  note?: string
}

export type ApplySupplierPaymentInput = {
  userId: string
  supplierName: string
  amount: number
  paymentMode?: string
  note?: string
}

export async function savePurchase(input: SavePurchaseInput) {
  const billNo = input.billNo.trim() || makePurchaseBillNo()
  const supplierName = input.supplierName.trim()
  const purchaseDate = input.purchaseDate || new Date().toISOString().slice(0, 10)
  const purchaseDateTime = input.purchaseDateTime || buildDateTimeFromDate(purchaseDate)

  if (!billNo) throw new Error("Purchase bill number is required.")
  if (!supplierName) throw new Error("Supplier name is required.")
  if (!input.items.length) throw new Error("Add at least one purchase item.")

  const existing = await db.purchases.where("[userId+billNo]").equals([input.userId, billNo]).first()
  if (existing) throw new Error("A purchase with this bill number is already saved.")

  const cleanLines = input.items.map((item) => {
    const name = item.name.trim()
    const price = Number(item.price)
    const quantity = Number(item.quantity)
    const quantityUnit = normalizeQuantityUnit(item.quantityUnit)

    if (!name) throw new Error("Product name is required.")
    if (!Number.isFinite(price) || price < 0) throw new Error(`${name}: enter a valid price.`)
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(`${name}: quantity must be greater than 0.`)

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
  const transactionType = input.entryMode === "quick" ? "quick-purchase" : "purchase"
  const transactionProducts: StockTransactionProduct[] = cleanLines.map((line) => ({
    name: line.name.toLowerCase(),
    category: line.category?.toLowerCase() || undefined,
    sku: line.sku,
    hsnCode: line.hsnCode,
    quantity: line.quantity,
    quantityUnit: line.quantityUnit,
    rate: line.price,
    amount: line.price * line.quantity,
    gstAmount: 0,
  }))
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
          note: line.note,
          userId: input.userId,
        },
        {
          skipImmediateSync: true,
          transaction: {
            transactionId: purchaseId,
            transactionType,
            products: transactionProducts,
            date: purchaseDateTime,
            amount: line.price * line.quantity,
            taxableAmount: line.price * line.quantity,
            gstAmount: 0,
            paymentMode: input.paymentMode?.trim() || undefined,
            paymentStatus: input.paymentStatus,
            invoiceReceiptNo: billNo,
            notes: buildPurchaseLogNote(billNo, purchaseId, line.note),
          },
        }
      )

      const normalizedLineName = line.name.toLowerCase()
      const normalizedLineCategory = (line.category || "").toLowerCase()

      const product =
        before ||
        (await db.products
          .where("[userId+name+category+quantityUnit]")
          .equals([input.userId, normalizedLineName, normalizedLineCategory, line.quantityUnit])
          .first()) ||
        (await db.products
          .where("userId")
          .equals(input.userId)
          .filter((candidate) =>
            candidate.name === normalizedLineName &&
            (candidate.category || "") === normalizedLineCategory &&
            normalizeQuantityUnit(candidate.quantityUnit) === line.quantityUnit
          )
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
      entryMode: input.entryMode || "detailed",
      detailsStatus: input.detailsStatus || "completed",
      detailsCompletedAt: input.detailsCompletedAt,
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
  if (!input.items.length) throw new Error("Add at least one quick purchase item.")

  const purchaseDate = input.purchaseDate || new Date().toISOString().slice(0, 10)
  const baseRef = `QP-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Date.now()}`
  const groupedItems = input.items.reduce((groups, item) => {
    const supplierName = item.supplierName?.trim() || "Details Pending"
    const current = groups.get(supplierName) || []
    current.push(item)
    groups.set(supplierName, current)
    return groups
  }, new Map<string, QuickPurchaseLineInput[]>())

  const savedIds: string[] = []
  let groupIndex = 0

  for (const [supplierName, items] of groupedItems.entries()) {
    groupIndex += 1
    const id = await savePurchase({
      userId: input.userId,
      billNo: groupedItems.size === 1 ? baseRef : `${baseRef}-${groupIndex}`,
      supplierName,
      purchaseDate,
      purchaseDateTime: input.purchaseDateTime,
      paymentStatus: "unpaid",
      paymentMode: undefined,
      amountPaid: 0,
      note: "Created from Quick Purchase. Bill and payment details pending.",
      entryMode: "quick",
      detailsStatus: "pending",
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

export async function completeQuickPurchaseDetails(input: CompletePurchaseDetailsInput) {
  const purchase = await db.purchases.get(input.purchaseId)
  if (!purchase || purchase.userId !== input.userId) throw new Error("Purchase record not found.")
  if (purchase.entryMode !== "quick") throw new Error("Only quick purchases can be completed here.")

  const billNo = input.billNo.trim()
  const supplierName = input.supplierName.trim()
  const purchaseDate = input.purchaseDate || purchase.purchaseDate

  if (!supplierName) throw new Error("Supplier name is required.")

  const duplicate = await db.purchases.where("[userId+billNo]").equals([input.userId, billNo]).first()
  if (duplicate && duplicate.id !== purchase.id) throw new Error("A purchase with this bill number is already saved.")

  const normalizedPaid =
    input.paymentStatus === "unpaid" ? 0 : Math.min(Math.max(Number(input.amountPaid || 0), 0), purchase.totalAmount)
  const amountPaid = input.paymentStatus === "paid" ? purchase.totalAmount : normalizedPaid
  const dueAmount = Math.max(purchase.totalAmount - amountPaid, 0)
  const now = new Date().toISOString()

  await db.transaction("rw", db.purchases, db.productLogs, async () => {
    await db.purchases.update(purchase.id, {
      billNo,
      supplierName,
      purchaseDate,
      paymentStatus: input.paymentStatus,
      paymentMode: input.paymentMode?.trim() || undefined,
      amountPaid,
      dueAmount,
      note: input.note?.trim() || purchase.note,
      detailsStatus: "completed",
      detailsCompletedAt: now,
      updatedAt: now,
    })

    await db.productLogs.where("transactionId").equals(purchase.id).modify((log) => {
      log.invoiceReceiptNo = billNo
      log.paymentStatus = input.paymentStatus
      log.paymentMode = input.paymentMode?.trim() || undefined
      log.notes = buildPurchaseLogNote(billNo, purchase.id, input.note)
    })
  })

  await autoSyncToSupabase()
  return purchase.id
}
export async function loadPurchases(userId: string) {
  const purchases = await db.purchases.where("userId").equals(userId).toArray()
  return purchases.sort((left, right) => right.purchaseDate.localeCompare(left.purchaseDate))
}

export async function applySupplierPayment(input: ApplySupplierPaymentInput) {
  const supplierName = input.supplierName.trim()
  const amount = Number(input.amount)

  if (!supplierName) throw new Error("Supplier name is required.")
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Payment amount must be greater than 0.")

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
  if (!duePurchases.length || totalDue <= 0) throw new Error("No due amount is pending for this supplier.")

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
  return [
    `${en.purchases.purchaseBill}: ${billNo}`,
    `${en.purchases.purchaseId}: ${formatDisplayId(purchaseId)}`,
    note,
  ]
    .filter(Boolean)
    .join(" | ")
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
    `${en.purchases.payment}: ${en.common.rupeeSymbol} ${amount}`,
    paymentMode?.trim() ? `${en.purchases.paymentMode}: ${paymentMode.trim()}` : "",
    `${en.stockHistory.labels.date}: ${paidAt}`,
    note?.trim(),
  ].filter(Boolean).join(" / ")
}

function buildDateTimeFromDate(date: string) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString()
  return parsed.toISOString()
}

function formatDisplayId(value: string) {
  return value.replace(/-/g, "").slice(0, 8).toUpperCase()
}
