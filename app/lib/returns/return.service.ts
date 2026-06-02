"use client"

import { v4 as uuidv4 } from "uuid"
import {
  db,
  type Product,
  type ProductLog,
  type ReturnDocumentKind,
  type ReturnDocumentRecord,
  type ReturnDocumentStatus,
  type ReturnStockImpact,
  type SaleCustomer,
  type StockTransactionProduct,
} from "@/app/lib/db"
import { adjustAdvancedInventoryStock } from "@/app/lib/advancedInventory/advancedInventory.service"
import { ensureCustomerCapacity, ensureSupplierCapacity, assertFeatureAccess, incrementUsage } from "@/app/lib/subscription/subscription.service"
import { ensurePartyRecord } from "@/app/lib/parties/party.service"
import { normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import { roundCurrency } from "@/app/lib/gst.utils"
import { requestSupabaseSync } from "@/app/lib/persistence/supabaseSyncTrigger"
import { normalizeContactLike } from "@/app/lib/normalization.utils"
import { en } from "@/app/messages/en"
import { assertLinkedSaleAllowsReturn } from "@/app/lib/returns/linkedSaleReturnGuard"
import {
  buildReturnAuditNote,
  buildReturnDocumentNumber,
  calculateReturnLine,
  calculateReturnTotals,
  getDefaultStockImpact,
  getReturnKindLabel,
  type ReturnDraftLineInput,
} from "./return.utils"

export type SaveReturnDocumentInput = {
  userId: string
  kind: ReturnDocumentKind
  documentNo?: string
  documentDate?: string
  documentDateTime?: string
  status?: ReturnDocumentStatus
  party?: SaleCustomer
  items: ReturnDraftLineInput[]
  sellerGstin?: string
  sellerState?: string
  gstEnabled?: boolean
  note?: string
  linkedSaleId?: string
  linkedPurchaseId?: string
  linkedInvoiceId?: string
  stockImpact?: ReturnStockImpact
}

export async function loadReturnDocuments(userId: string) {
  const records = await db.returnDocuments.where("userId").equals(userId).toArray()
  return records.sort((left, right) => right.documentDateTime.localeCompare(left.documentDateTime))
}

export async function saveReturnDocument(input: SaveReturnDocumentInput) {
  await assertFeatureAccess(input.userId, "returns", { operation: "create", incrementBy: 1 })
  validateItems(input.items)

  const kind = input.kind
  const stockImpact = input.stockImpact || getDefaultStockImpact(kind)
  if (stockImpact !== "none" && input.items.some((item) => !item.productId)) {
    throw new Error(en.returns.stockItemNeedsProduct)
  }
  const party = normalizeParty(input.party)
  const partyId = await ensureCorrectionParty({ userId: input.userId, kind, party })
  const products = await loadProductsForItems(input.items)
  const productMap = new Map(products.map((product) => [product.id, product]))
  const documentItems = input.items.map((item, index) => {
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
        party,
        sellerGstin: input.sellerGstin,
        sellerState: input.sellerState,
        gstEnabled: input.gstEnabled,
      },
    )
    return { ...line, id: `${line.productId || "manual"}-${index + 1}` }
  })
  const totals = calculateReturnTotals(documentItems)
  const now = new Date().toISOString()
  const documentDateTime = input.documentDateTime || now
  const documentDate = input.documentDate || documentDateTime.slice(0, 10)
  const documentNo = input.documentNo?.trim() || buildReturnDocumentNumber(kind)
  const linkedSale = input.linkedSaleId
    ? await assertLinkedSaleAllowsReturn(
        input.linkedSaleId,
        documentItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: Number(item.quantity || 0),
        })),
      )
    : undefined
  const linkedPurchase = input.linkedPurchaseId ? await db.purchases.get(input.linkedPurchaseId) : undefined
  const linkedInvoice = input.linkedInvoiceId ? await db.invoices.get(input.linkedInvoiceId) : undefined
  const linkedReference = linkedSale?.receiptNo || linkedPurchase?.billNo || linkedInvoice?.invoiceNo

  const duplicate = await db.returnDocuments.where("[userId+documentNo]").equals([input.userId, documentNo]).first()
  if (duplicate) throw new Error(en.returns.duplicateDocumentNumber)

  const auditNote = buildReturnAuditNote({
    kind,
    documentNo,
    linkedReference,
    stockImpact,
    note: input.note,
  })

  const record: ReturnDocumentRecord = {
    id: uuidv4(),
    userId: input.userId,
    documentNo,
    kind,
    status: input.status || "completed",
    documentDate,
    documentDateTime,
    partyId,
    party,
    linkedSaleId: linkedSale?.id,
    linkedSaleReceiptNo: linkedSale?.receiptNo,
    linkedPurchaseId: linkedPurchase?.id,
    linkedPurchaseBillNo: linkedPurchase?.billNo,
    linkedInvoiceId: linkedInvoice?.id,
    linkedInvoiceNo: linkedInvoice?.invoiceNo,
    stockImpact,
    items: documentItems,
    totalAmount: totals.totalAmount,
    taxableAmount: totals.taxableAmount,
    gstAmount: totals.gstAmount,
    paymentAdjustment: totals.totalAmount,
    dueAdjustment: totals.totalAmount,
    note: input.note?.trim() || undefined,
    auditNote,
    createdAt: now,
    updatedAt: now,
  }

  await db.transaction("rw", [db.products, db.productLogs, db.returnDocuments, db.inventoryLocations, db.productLocationStocks, db.inventoryBatches], async () => {
    if (stockImpact !== "none") {
      await applyStockImpact(record, productMap)
    }
    await db.returnDocuments.add(record)
  })

  await requestSupabaseSync("return document")
  await incrementUsage(input.userId, "returns")
  return record
}

async function loadProductsForItems(items: ReturnDraftLineInput[]) {
  const productIds = Array.from(new Set(items.map((item) => item.productId).filter(Boolean))) as string[]
  if (!productIds.length) return []
  return db.products.where("id").anyOf(productIds).toArray()
}

function validateItems(items: ReturnDraftLineInput[]) {
  if (!items.length) throw new Error(en.returns.addAtLeastOneItem)
  items.forEach((item) => {
    const quantity = Number(item.quantity || 0)
    const rate = Number(item.rate || 0)
    if (!item.name?.trim()) throw new Error(en.returns.itemNameRequired)
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(en.returns.quantityRequired)
    if (!Number.isFinite(rate) || rate < 0) throw new Error(en.returns.rateRequired)
  })
}

function normalizeParty(party?: SaleCustomer) {
  return normalizeContactLike(party) as SaleCustomer | undefined
}

async function ensureCorrectionParty({
  userId,
  kind,
  party,
}: {
  userId: string
  kind: ReturnDocumentKind
  party?: SaleCustomer
}) {
  const name = party?.name?.trim()
  if (!name) return undefined

  const role = kind === "purchase-return" || kind === "debit-note" ? "supplier" : "customer"
  if (role === "supplier") await ensureSupplierCapacity(userId, name)
  else await ensureCustomerCapacity(userId, name)

  const saved = await ensurePartyRecord({
    userId,
    name,
    mobile: party?.phone,
    email: party?.email,
    gstin: party?.gstin,
    address: party?.address,
    city: party?.city,
    state: party?.state,
    pincode: party?.pincode,
    type: role,
  })
  return saved.id
}

async function applyStockImpact(record: ReturnDocumentRecord, productMap: Map<string, Product>) {
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
    const newStock = record.stockImpact === "stock-in" ? roundCurrency(oldStock + quantity) : roundCurrency(oldStock - quantity)
    if (record.stockImpact === "stock-out" && newStock < 0) {
      throw new Error(
        en.returns.negativeStockBlocked
          .replace("{name}", product.name)
          .replace("{quantity}", String(product.quantity))
          .replace("{unit}", product.quantityUnit),
      )
    }

    await db.products.update(product.id, { quantity: newStock })
    await db.productLogs.add(buildStockLog({ record, product, item, oldStock, newStock, transactionProducts }))
    await adjustAdvancedInventoryStock({
      userId: record.userId,
      product,
      locationId: item.locationId,
      locationName: item.locationName,
      quantityDelta: record.stockImpact === "stock-in" ? quantity : -quantity,
      quantityUnit: item.quantityUnit || product.quantityUnit,
      oldProductStock: oldStock,
      batchNo: item.batchNo,
      expiry: product.expiry,
    })
    productMap.set(product.id, { ...product, quantity: newStock })
  }
}

function buildStockLog({
  record,
  product,
  item,
  oldStock,
  newStock,
  transactionProducts,
}: {
  record: ReturnDocumentRecord
  product: Product
  item: ReturnDocumentRecord["items"][number]
  oldStock: number
  newStock: number
  transactionProducts: StockTransactionProduct[]
}): ProductLog {
  const type = record.stockImpact === "stock-in" ? "in" : "out"
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
    type,
    reason: getReturnKindLabel(record.kind),
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
    transactionType: record.kind,
    invoiceReceiptNo: record.documentNo,
    paymentStatus: en.returns.paymentCorrectionRecorded,
    products: transactionProducts,
    note: record.auditNote,
    notes: record.note,
    correctedAt: record.createdAt,
    correctionLabel: record.kind,
  }
}
