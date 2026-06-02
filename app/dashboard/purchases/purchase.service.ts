"use client"

import { v4 as uuidv4 } from "uuid"
import { addProduct } from "@/app/dashboard/quick-purchase/product.service"
import { db, type PurchaseDetailsStatus, type PurchaseEntryMode, type PurchaseItem, type PurchasePaymentStatus, type PurchaseRecord, type StockTransactionProduct } from "@/app/lib/db"
import { ensurePartyRecord, syncPartyBalances } from "@/app/lib/parties/party.service"
import { normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import { requestSupabaseSync } from "@/app/lib/persistence/supabaseSyncTrigger"
import { en } from "@/app/messages/en"
import { makePurchaseBillNo } from "./purchase.form"
import {
  assertFeatureAccess,
  ensureSupplierCapacity,
  incrementUsage,
} from "@/app/lib/subscription/subscription.service"

export type PurchaseLineInput = {
  name: string
  price: number
  quantity: number
  quantityUnit: string
  category?: string
  expiry?: string
  sku?: string
  hsnCode?: string
  batchNo?: string
  locationId?: string
  locationName?: string
  note?: string
}

export type SavePurchaseInput = {
  userId: string
  billNo: string
  supplierName: string
  supplierPartyId?: string
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
  await assertFeatureAccess(input.userId, "purchases", { operation: "create", incrementBy: 1 })

  const billNo = input.billNo.trim() || makePurchaseBillNo()
  const supplierName = input.supplierName.trim()
  const purchaseDate = input.purchaseDate || new Date().toISOString().slice(0, 10)
  const purchaseDateTime = input.purchaseDateTime || buildDateTimeFromDate(purchaseDate)

  if (!billNo) throw new Error(en.purchases.billNumberRequired)
  if (!supplierName) throw new Error(en.purchases.validation.supplierRequired)
  if (!input.items.length) throw new Error(en.purchases.validation.addAtLeastOneProduct)

  const shouldCreateSupplierParty = supplierName.toLowerCase() !== "details pending"
  let supplierPartyId: string | undefined
  if (shouldCreateSupplierParty) {
    await ensureSupplierCapacity(input.userId, supplierName)
    const supplierParty = await ensurePartyRecord({
      userId: input.userId,
      name: supplierName,
      type: "supplier",
    })
    supplierPartyId = supplierParty.id
  }

  const existing = await db.purchases.where("[userId+billNo]").equals([input.userId, billNo]).first()
  if (existing) throw new Error(en.purchases.duplicateBillNo)

  const cleanLines = input.items.map((item) => {
    const name = item.name.trim()
    const price = Number(item.price)
    const quantity = Number(item.quantity)
    const quantityUnit = normalizeQuantityUnit(item.quantityUnit)

    if (!name) throw new Error(en.purchases.validation.productNameRequired)
    if (!Number.isFinite(price) || price < 0) throw new Error(`${name}: ${en.purchases.validation.priceInvalid}`)
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(`${name}: ${en.purchases.validation.quantityInvalid}`)

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
    batchNo: line.batchNo,
    locationId: line.locationId,
    locationName: line.locationName,
    quantity: line.quantity,
    quantityUnit: line.quantityUnit,
    rate: line.price,
    amount: line.price * line.quantity,
    gstAmount: 0,
  }))
  const savedItems: PurchaseItem[] = []

  await db.transaction("rw", [db.products, db.productLogs, db.purchases, db.inventoryLocations, db.productLocationStocks, db.inventoryBatches, db.subscriptions], async () => {
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
          batchNo: line.batchNo,
          locationId: line.locationId,
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
            locationId: line.locationId,
            locationName: line.locationName,
            batchNo: line.batchNo,
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

      if (!product) throw new Error(en.purchases.productSaveFailed.replace("{name}", line.name))

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
        batchNo: line.batchNo,
        locationId: line.locationId,
        locationName: line.locationName,
        note: line.note,
        lineTotal: line.price * line.quantity,
      })
    }

    const record: PurchaseRecord = {
      id: purchaseId,
      userId: input.userId,
      billNo,
      supplierName,
      partyId: supplierPartyId,
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

  if (supplierPartyId) await syncPartyBalances(input.userId, supplierPartyId)
  await requestSupabaseSync("purchase")
  await incrementUsage(input.userId, "purchases")
  return purchaseId
}

export async function saveQuickPurchase(input: SaveQuickPurchaseInput) {
  if (!input.items.length) throw new Error(en.purchases.validation.addAtLeastOneProduct)

  const purchaseDate = input.purchaseDate || new Date().toISOString().slice(0, 10)
  const baseRef = `QP-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Date.now()}`
  const groupedItems = input.items.reduce((groups, item) => {
    const supplierName = item.supplierName?.trim() || en.purchases.detailsPending
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
      note: en.purchases.quickPurchasePendingNote,
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
        batchNo: item.batchNo,
        locationId: item.locationId,
        locationName: item.locationName,
        note: item.note,
      })),
    })
    savedIds.push(id)
  }

  return savedIds
}

export async function completeQuickPurchaseDetails(input: CompletePurchaseDetailsInput) {
  await assertFeatureAccess(input.userId, "purchases", { operation: "update" })
  const purchase = await db.purchases.get(input.purchaseId)
  if (!purchase || purchase.userId !== input.userId) throw new Error(en.purchases.purchaseRecordNotFound)
  if (purchase.entryMode !== "quick") throw new Error(en.purchases.onlyQuickPurchasesCanComplete)

  const billNo = input.billNo.trim()
  const supplierName = input.supplierName.trim()
  const purchaseDate = input.purchaseDate || purchase.purchaseDate

  if (!supplierName) throw new Error(en.purchases.validation.supplierRequired)
  const supplierParty = await ensurePartyRecord({
    userId: input.userId,
    name: supplierName,
    type: "supplier",
  })

  const duplicate = await db.purchases.where("[userId+billNo]").equals([input.userId, billNo]).first()
  if (duplicate && duplicate.id !== purchase.id) throw new Error(en.purchases.duplicateBillNo)

  const normalizedPaid =
    input.paymentStatus === "unpaid" ? 0 : Math.min(Math.max(Number(input.amountPaid || 0), 0), purchase.totalAmount)
  const amountPaid = input.paymentStatus === "paid" ? purchase.totalAmount : normalizedPaid
  const dueAmount = Math.max(purchase.totalAmount - amountPaid, 0)
  const now = new Date().toISOString()

  await db.transaction("rw", db.purchases, db.productLogs, async () => {
    await db.purchases.update(purchase.id, {
      billNo,
      supplierName,
      partyId: supplierParty.id,
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

  await syncPartyBalances(input.userId, supplierParty.id)
  await requestSupabaseSync("purchase details")
  return purchase.id
}
export async function loadPurchases(userId: string) {
  const purchases = await db.purchases.where("userId").equals(userId).toArray()
  return purchases.sort((left, right) => right.purchaseDate.localeCompare(left.purchaseDate))
}

export async function applySupplierPayment(input: ApplySupplierPaymentInput) {
  const supplierName = input.supplierName.trim()
  const amount = Number(input.amount)

  if (!supplierName) throw new Error(en.purchases.validation.supplierRequired)
  if (!Number.isFinite(amount) || amount <= 0) throw new Error(en.purchases.paymentAmountInvalid)

  const supplierParty = await ensurePartyRecord({
    userId: input.userId,
    name: supplierName,
    type: "supplier",
  })

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
  if (!duePurchases.length || totalDue <= 0) throw new Error(en.purchases.noSupplierDue)

  let remaining = Math.min(amount, totalDue)
  const now = new Date().toISOString()
  const paymentNote = buildPaymentNote({
    amount: Math.min(amount, totalDue),
    paymentMode: input.paymentMode,
    note: input.note,
    paidAt: now,
  })

  await db.transaction("rw", db.purchases, db.partyLedger, async () => {
    for (const purchase of duePurchases) {
      if (remaining <= 0) break

      const applied = Math.min(remaining, purchase.dueAmount)
      const nextPaid = purchase.amountPaid + applied
      const nextDue = Math.max(purchase.totalAmount - nextPaid, 0)
      const nextStatus: PurchasePaymentStatus =
        nextDue === 0 ? "paid" : nextPaid > 0 ? "partial" : "unpaid"

      await db.purchases.update(purchase.id, {
        partyId: supplierParty.id,
        amountPaid: nextPaid,
        dueAmount: nextDue,
        paymentStatus: nextStatus,
        paymentMode: input.paymentMode?.trim() || purchase.paymentMode,
        note: [purchase.note, paymentNote].filter(Boolean).join(" | "),
        updatedAt: now,
      })

      remaining -= applied
    }

    await db.partyLedger.add({
      id: uuidv4(),
      userId: input.userId,
      partyId: supplierParty.id,
      type: "payment-paid",
      amount: Math.min(amount, totalDue),
      paymentMode: input.paymentMode?.trim() || undefined,
      note: input.note?.trim() || undefined,
      reference: `PAY-${Date.now()}`,
      entryDate: now,
      createdAt: now,
      updatedAt: now,
    })
  })

  await syncPartyBalances(input.userId, supplierParty.id)
  await requestSupabaseSync("supplier payment")
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
