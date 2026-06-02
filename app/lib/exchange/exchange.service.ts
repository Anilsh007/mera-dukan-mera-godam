"use client"

import { v4 as uuidv4 } from "uuid"
import {
  db,
  type Product,
  type ProductLog,
  type ReturnDocumentItem,
  type ReturnDocumentRecord,
  type SaleCustomer,
  type SalePaymentMode,
  type SalePaymentStatus,
  type SaleRecord,
  type StockTransactionProduct,
} from "@/app/lib/db"
import { stockOut } from "@/app/dashboard/quick-purchase/product.service"
import { adjustAdvancedInventoryStock } from "@/app/lib/advancedInventory/advancedInventory.service"
import { roundCurrency } from "@/app/lib/gst.utils"
import { normalizeContactLike } from "@/app/lib/normalization.utils"
import { ensurePartyRecord, syncPartyBalances } from "@/app/lib/parties/party.service"
import { requestSupabaseSync } from "@/app/lib/persistence/supabaseSyncTrigger"
import { normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import { buildSaleLogNote } from "@/app/lib/saleMetadata"
import { assertLinkedSaleAllowsReturn } from "@/app/lib/returns/linkedSaleReturnGuard"
import { calculateReturnLine, calculateReturnTotals, buildReturnDocumentNumber, buildReturnAuditNote, type ReturnDraftLineInput } from "@/app/lib/returns/return.utils"
import { buildReceiptNumber, calculateSaleLine, calculateSaleTotals, type SaleDraftLineInput } from "@/app/lib/sales/sale.utils"
import { assertFeatureAccess, ensureCustomerCapacity, incrementUsage } from "@/app/lib/subscription/subscription.service"
import { en } from "@/app/messages/en"

export type SaveExchangeInput = {
  userId: string
  linkedSaleId: string
  customer?: SaleCustomer
  returnedItems: ReturnDraftLineInput[]
  replacementItems: SaleDraftLineInput[]
  sellerGstin?: string
  sellerState?: string
  gstEnabled?: boolean
  externalAmountPaid?: number
  paymentMode?: SalePaymentMode
  note?: string
  exchangeDate?: string
  exchangeDateTime?: string
}

export type SavedExchangeResult = {
  exchangeReference: string
  returnDocument: ReturnDocumentRecord
  replacementSale: SaleRecord
}

export async function saveExchange(input: SaveExchangeInput): Promise<SavedExchangeResult> {
  await assertFeatureAccess(input.userId, "returns", { operation: "create", incrementBy: 1 })
  await assertFeatureAccess(input.userId, "quickSales", { operation: "create", incrementBy: 1 })

  validateReturnItems(input.returnedItems)
  validateReplacementItems(input.replacementItems)

  const linkedSale = await assertLinkedSaleAllowsReturn(input.linkedSaleId, input.returnedItems)
  if (linkedSale.userId !== input.userId) throw new Error(en.sales.saleRecordNotFound)

  const normalizedCustomer = normalizeCustomer(input.customer || linkedSale.customer)
  const exchangeReference = buildReceiptNumber("EXCH")
  const returnDocumentNo = buildReturnDocumentNumber("sales-return")
  const replacementReceiptNo = buildReceiptNumber("EXCHSALE")
  const now = new Date().toISOString()
  const exchangeDateTime = input.exchangeDateTime || now
  const exchangeDate = input.exchangeDate || exchangeDateTime.slice(0, 10)

  const products = await loadProductsForExchangeItems(input.returnedItems, input.replacementItems)
  const productMap = new Map(products.map((product) => [product.id, product]))

  const returnItems = input.returnedItems.map((item, index) => {
    const product = item.productId ? productMap.get(item.productId) : undefined
    const line = calculateReturnLine(
      {
        ...item,
        productId: item.productId || `manual-${index + 1}`,
        name: item.name || product?.name || "",
        category: item.category || product?.category,
        sku: item.sku || product?.sku,
        hsnCode: item.hsnCode || product?.hsnCode,
        quantityUnit: normalizeQuantityUnit(item.quantityUnit || product?.quantityUnit),
      },
      {
        party: normalizedCustomer,
        sellerGstin: input.sellerGstin,
        sellerState: input.sellerState,
        gstEnabled: input.gstEnabled,
      },
    )
    return { ...line, id: `${line.productId || "manual"}-${index + 1}` }
  })

  const replacementSaleItems = input.replacementItems.map((item, index) => {
    const product = productMap.get(item.productId)
    if (!product) throw new Error(en.sales.productNotFound)
    const line = calculateSaleLine(
      {
        ...item,
        name: item.name || product.name,
        category: item.category || product.category,
        sku: item.sku || product.sku,
        hsnCode: item.hsnCode || product.hsnCode,
        quantityUnit: normalizeQuantityUnit(item.quantityUnit || product.quantityUnit),
      },
      {
        customer: normalizedCustomer,
        sellerGstin: input.sellerGstin,
        sellerState: input.sellerState,
        gstEnabled: input.gstEnabled,
      },
    )
    return { ...line, id: `${line.productId}-${index + 1}` }
  })

  const returnTotals = calculateReturnTotals(returnItems)
  const replacementTotals = calculateSaleTotals(replacementSaleItems)
  const replacementTotal = roundCurrency(replacementTotals.totalAmount)
  const returnTotal = roundCurrency(returnTotals.totalAmount)
  const externalAmountPaid = roundCurrency(Math.max(Number(input.externalAmountPaid || 0), 0))
  const exchangeCreditApplied = roundCurrency(Math.min(returnTotal, replacementTotal))
  const effectivePaid = roundCurrency(Math.min(exchangeCreditApplied + externalAmountPaid, replacementTotal))
  const dueAmount = roundCurrency(Math.max(replacementTotal - effectivePaid, 0))
  const refundAmount = roundCurrency(Math.max(returnTotal - replacementTotal, 0))
  const paymentStatus: SalePaymentStatus = dueAmount <= 0 ? "paid" : effectivePaid > 0 ? "partial" : "unpaid"
  const paymentMode: SalePaymentMode = input.paymentMode || "Other"

  if (dueAmount > 0 && !normalizedCustomer?.name?.trim()) {
    throw new Error(en.pos.customerRequiredForDue)
  }

  const exchangeNote = buildExchangeNote({
    reference: exchangeReference,
    note: input.note,
    returnDocumentNo,
    linkedSaleReceiptNo: linkedSale.receiptNo,
    replacementReceiptNo,
    returnTotal,
    replacementTotal,
    externalAmountPaid,
    dueAmount,
    refundAmount,
  })

  const partyId = await ensureExchangeParty(input.userId, normalizedCustomer)
  const transactionType = replacementSaleItems.length > 1 ? "multi-item-sale" : "sale"
  const transactionProducts: StockTransactionProduct[] = replacementSaleItems.map((item) => ({
    productId: item.productId,
    name: item.name,
    category: item.category,
    sku: item.sku,
    hsnCode: item.hsnCode,
    batchNo: item.batchNo,
    locationId: item.locationId,
    locationName: item.locationName,
    quantity: item.quantity,
    quantityUnit: item.quantityUnit,
    rate: item.salePrice,
    amount: item.taxableAmount,
    gstRate: item.gstRate,
    gstAmount: item.gstAmount,
  }))

  const returnRecord: ReturnDocumentRecord = {
    id: uuidv4(),
    userId: input.userId,
    documentNo: returnDocumentNo,
    kind: "sales-return",
    status: "completed",
    documentDate: exchangeDate,
    documentDateTime: exchangeDateTime,
    partyId,
    party: normalizedCustomer,
    linkedSaleId: linkedSale.id,
    linkedSaleReceiptNo: linkedSale.receiptNo,
    stockImpact: "stock-in",
    items: returnItems,
    totalAmount: returnTotal,
    taxableAmount: roundCurrency(returnTotals.taxableAmount),
    gstAmount: roundCurrency(returnTotals.gstAmount),
    paymentAdjustment: returnTotal,
    dueAdjustment: returnTotal,
    note: exchangeNote,
    auditNote: buildReturnAuditNote({
      kind: "sales-return",
      documentNo: returnDocumentNo,
      linkedReference: linkedSale.receiptNo,
      stockImpact: "stock-in",
      note: exchangeNote,
    }),
    createdAt: exchangeDateTime,
    updatedAt: exchangeDateTime,
  }

  const replacementSale: SaleRecord = {
    id: uuidv4(),
    userId: input.userId,
    receiptNo: replacementReceiptNo,
    saleDate: exchangeDate,
    saleDateTime: exchangeDateTime,
    partyId,
    customer: normalizedCustomer,
    items: replacementSaleItems,
    totalAmount: replacementTotal,
    taxableAmount: roundCurrency(replacementTotals.taxableAmount),
    gstAmount: roundCurrency(replacementTotals.gstAmount),
    amountPaid: effectivePaid,
    dueAmount,
    paymentStatus,
    paymentMode,
    note: exchangeNote,
    reference: exchangeReference,
    gstEnabled: Boolean(input.gstEnabled),
    entryMode: "quick-sale",
    status: "completed",
    createdAt: exchangeDateTime,
    updatedAt: exchangeDateTime,
  }

  const duplicateReturn = await db.returnDocuments.where("[userId+documentNo]").equals([input.userId, returnDocumentNo]).first()
  if (duplicateReturn) throw new Error(en.returns.duplicateDocumentNumber)
  const duplicateSale = await db.sales.where("[userId+receiptNo]").equals([input.userId, replacementReceiptNo]).first()
  if (duplicateSale) throw new Error(en.exchange.duplicateExchangeReference)

  await db.transaction(
    "rw",
    [db.products, db.productLogs, db.returnDocuments, db.sales, db.inventoryLocations, db.productLocationStocks, db.inventoryBatches],
    async () => {
      await applyReturnStockIn(returnRecord, productMap)
      await db.returnDocuments.add(returnRecord)

      for (const item of replacementSaleItems) {
        await stockOut(
          {
            productId: item.productId,
            quantity: item.quantity,
            quantityUnit: item.quantityUnit,
            salePrice: item.salePrice,
            reason: en.inventory.reasons.sold,
            buyerName: normalizedCustomer?.name?.trim(),
            buyerPhone: normalizedCustomer?.phone?.trim(),
            buyerGstin: normalizedCustomer?.gstin?.trim(),
            note: exchangeNote,
            gstRate: item.gstRate,
            taxableAmount: item.taxableAmount,
            cgstAmount: item.cgstAmount,
            sgstAmount: item.sgstAmount,
            igstAmount: item.igstAmount,
            gstAmount: item.gstAmount,
            paymentMode,
            paymentStatus,
            invoiceReceiptNo: replacementReceiptNo,
            batchNo: item.batchNo,
            locationId: item.locationId,
            transactionId: replacementSale.id,
            transactionType,
            transactionProducts,
          },
          {
            skipImmediateSync: true,
            transaction: {
              transactionId: replacementSale.id,
              transactionType,
              products: transactionProducts,
              date: exchangeDateTime,
              amount: item.taxableAmount,
              taxableAmount: item.taxableAmount,
              gstRate: item.gstRate,
              cgstAmount: item.cgstAmount,
              sgstAmount: item.sgstAmount,
              igstAmount: item.igstAmount,
              gstAmount: item.gstAmount,
              paymentMode,
              paymentStatus,
              invoiceReceiptNo: replacementReceiptNo,
              locationId: item.locationId,
              locationName: item.locationName,
              batchNo: item.batchNo,
              notes: exchangeNote,
            },
          },
        )
      }

      await db.sales.add(replacementSale)
    },
  )

  if (partyId) await syncPartyBalances(input.userId, partyId)
  await requestSupabaseSync("exchange")
  await Promise.all([
    incrementUsage(input.userId, "returns"),
    incrementUsage(input.userId, "quickSales"),
  ])

  return {
    exchangeReference,
    returnDocument: returnRecord,
    replacementSale,
  }
}

async function loadProductsForExchangeItems(returnedItems: ReturnDraftLineInput[], replacementItems: SaleDraftLineInput[]) {
  const ids = Array.from(
    new Set(
      [...returnedItems.map((item) => item.productId), ...replacementItems.map((item) => item.productId)].filter(Boolean),
    ),
  ) as string[]
  if (!ids.length) return []
  return db.products.where("id").anyOf(ids).toArray()
}

function validateReturnItems(items: ReturnDraftLineInput[]) {
  if (!items.length) throw new Error(en.exchange.returnedItemRequired)
  items.forEach((item) => {
    const quantity = Number(item.quantity || 0)
    const rate = Number(item.rate || 0)
    if (!item.productId) throw new Error(en.returns.stockItemNeedsProduct)
    if (!item.name?.trim()) throw new Error(en.returns.itemNameRequired)
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(en.returns.quantityRequired)
    if (!Number.isFinite(rate) || rate < 0) throw new Error(en.returns.rateRequired)
  })
}

function validateReplacementItems(items: SaleDraftLineInput[]) {
  if (!items.length) throw new Error(en.exchange.replacementItemRequired)
  items.forEach((item) => {
    const quantity = Number(item.quantity || 0)
    const salePrice = Number(item.salePrice || 0)
    if (!item.productId) throw new Error(en.sales.productNotFound)
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(en.sales.quantityGreaterThanZero)
    if (!Number.isFinite(salePrice) || salePrice < 0) throw new Error(en.sales.priceCannotBeNegative)
  })
}

function normalizeCustomer(customer?: SaleCustomer) {
  return normalizeContactLike(customer) as SaleCustomer | undefined
}

async function ensureExchangeParty(userId: string, customer?: SaleCustomer) {
  const name = customer?.name?.trim()
  if (!name) return undefined

  await ensureCustomerCapacity(userId, name)
  const saved = await ensurePartyRecord({
    userId,
    name,
    mobile: customer?.phone,
    email: customer?.email,
    gstin: customer?.gstin,
    address: customer?.address,
    city: customer?.city,
    state: customer?.state,
    pincode: customer?.pincode,
    type: "customer",
  })
  return saved.id
}

async function applyReturnStockIn(record: ReturnDocumentRecord, productMap: Map<string, Product>) {
  const transactionProducts: StockTransactionProduct[] = record.items.map((item) => ({
    productId: item.productId,
    name: item.name,
    category: item.category,
    sku: item.sku,
    hsnCode: item.hsnCode,
    quantity: item.quantity,
    quantityUnit: item.quantityUnit,
    rate: item.rate,
    amount: item.taxableAmount,
    gstRate: item.gstRate,
    gstAmount: item.gstAmount,
  }))

  for (const item of record.items) {
    if (!item.productId) continue
    const product = productMap.get(item.productId)
    if (!product) throw new Error(en.sales.productNotFound)

    const oldStock = Number(product.quantity || 0)
    const quantity = Number(item.quantity || 0)
    const newStock = roundCurrency(oldStock + quantity)

    await db.products.update(product.id, { quantity: newStock })
    await db.productLogs.add(buildReturnStockLog({ record, product, item, oldStock, newStock, transactionProducts }))
    await adjustAdvancedInventoryStock({
      userId: record.userId,
      product,
      locationId: item.locationId,
      locationName: item.locationName,
      quantityDelta: quantity,
      quantityUnit: item.quantityUnit || product.quantityUnit,
      oldProductStock: oldStock,
      batchNo: item.batchNo,
      expiry: product.expiry,
      skipImmediateSync: true,
    })

    productMap.set(product.id, { ...product, quantity: newStock })
  }
}

function buildReturnStockLog({
  record,
  product,
  item,
  oldStock,
  newStock,
  transactionProducts,
}: {
  record: ReturnDocumentRecord
  product: Product
  item: ReturnDocumentItem
  oldStock: number
  newStock: number
  transactionProducts: StockTransactionProduct[]
}): ProductLog {
  return {
    id: uuidv4(),
    productId: product.id,
    productName: product.name,
    productCategory: product.category,
    productSku: product.sku,
    productHsnCode: product.hsnCode,
    quantityAdded: item.quantity,
    quantity: item.quantity,
    quantityUnit: item.quantityUnit || product.quantityUnit,
    oldStock,
    newStock,
    type: "in",
    reason: en.exchange.returnStockReason,
    price: item.rate,
    amount: item.taxableAmount,
    taxableAmount: item.taxableAmount,
    gstRate: item.gstRate,
    cgstAmount: item.cgstAmount,
    sgstAmount: item.sgstAmount,
    igstAmount: item.igstAmount,
    gstAmount: item.gstAmount,
    date: record.documentDateTime,
    transactionId: record.id,
    transactionType: "sales-return",
    invoiceReceiptNo: record.documentNo,
    paymentStatus: en.exchange.exchangeRecorded,
    products: transactionProducts,
    note: buildSaleLogNote({
      buyerName: record.party?.name,
      buyerPhone: record.party?.phone,
      buyerGstin: record.party?.gstin,
      note: record.note,
    }),
    notes: record.note,
    correctedAt: record.createdAt,
    correctionLabel: "exchange-return",
  }
}

function buildExchangeNote({
  reference,
  note,
  returnDocumentNo,
  linkedSaleReceiptNo,
  replacementReceiptNo,
  returnTotal,
  replacementTotal,
  externalAmountPaid,
  dueAmount,
  refundAmount,
}: {
  reference: string
  note?: string
  returnDocumentNo: string
  linkedSaleReceiptNo: string
  replacementReceiptNo: string
  returnTotal: number
  replacementTotal: number
  externalAmountPaid: number
  dueAmount: number
  refundAmount: number
}) {
  return [
    `${en.exchange.referenceLabel}: ${reference}`,
    `${en.exchange.linkedSaleLabel}: ${linkedSaleReceiptNo}`,
    `${en.exchange.returnDocumentLabel}: ${returnDocumentNo}`,
    `${en.exchange.replacementSaleLabel}: ${replacementReceiptNo}`,
    `${en.exchange.returnTotalLabel}: Rs ${returnTotal}`,
    `${en.exchange.replacementTotalLabel}: Rs ${replacementTotal}`,
    `${en.exchange.additionalPaymentLabel}: Rs ${externalAmountPaid}`,
    dueAmount > 0 ? `${en.exchange.balanceDueLabel}: Rs ${dueAmount}` : "",
    refundAmount > 0 ? `${en.exchange.refundDueLabel}: Rs ${refundAmount}` : "",
    note?.trim() || "",
  ]
    .filter(Boolean)
    .join(" | ")
}
