"use client"

import { v4 as uuidv4 } from "uuid"
import {
  db,
  type ProductLog,
  type SaleCustomer,
  type SaleEntryMode,
  type SalePaymentMode,
  type SalePaymentStatus,
  type SaleRecord,
  type StockTransactionProduct,
} from "@/app/lib/db"
import { ensurePartyRecord, syncPartyBalances } from "@/app/lib/parties/party.service"
import { buildSaleLogNote } from "@/app/lib/saleMetadata"
import { roundCurrency } from "@/app/lib/gst.utils"
import { assertFeatureAccess, ensureCustomerCapacity, incrementUsage } from "@/app/lib/subscription/subscription.service"
import { calculateSaleLine, calculateSaleTotals, normalizePaidAmount, buildReceiptNumber, type SaleDraftLineInput } from "./sale.utils"
import { stockOut } from "@/app/dashboard/quick-purchase/product.service"
import { adjustAdvancedInventoryStock } from "@/app/lib/advancedInventory/advancedInventory.service"
import { requestSupabaseSync } from "@/app/lib/persistence/supabaseSyncTrigger"
import { normalizeContactLike } from "@/app/lib/normalization.utils"
import { runWithCrudBusy } from "@/app/lib/crudBusy"
import { en } from "@/app/messages/en"

export type SaveSaleInput = {
  userId: string
  items: SaleDraftLineInput[]
  customer?: SaleCustomer
  sellerGstin?: string
  sellerState?: string
  paymentMode: SalePaymentMode
  paymentStatus: SalePaymentStatus
  amountPaid: number
  note?: string
  reference?: string
  gstEnabled?: boolean
  allowNegativeStock?: boolean
  entryMode?: SaleEntryMode
  saleDate?: string
  saleDateTime?: string
}

export async function saveSale(input: SaveSaleInput): Promise<SaleRecord> {
  return runWithCrudBusy("Saving sale", async () => {
    await assertFeatureAccess(input.userId, "quickSales", {
    operation: "create",
    incrementBy: 1,
  })

  if (!input.items.length) throw new Error(en.sales.addAtLeastOneItem)

  const customerName = input.customer?.name?.trim()
  let partyId: string | undefined
  if (customerName) {
    await ensureCustomerCapacity(input.userId, customerName)
    const customerParty = await ensurePartyRecord({
      userId: input.userId,
      name: customerName,
      mobile: input.customer?.phone,
      email: input.customer?.email,
      gstin: input.customer?.gstin,
      address: input.customer?.address,
      city: input.customer?.city,
      state: input.customer?.state,
      pincode: input.customer?.pincode,
      type: "customer",
    })
    partyId = customerParty.id
  }

  const products = await db.products
    .where("id")
    .anyOf(input.items.map((item) => item.productId))
    .toArray()
  const productMap = new Map(products.map((product) => [product.id, product]))

  const preparedItems = input.items.map((item) => {
    const product = productMap.get(item.productId)
    if (!product) throw new Error(en.sales.productNotFound)

    const quantity = Number(item.quantity || 0)
    const salePrice = Number(item.salePrice || 0)
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(en.sales.quantityGreaterThanZero)
    if (!Number.isFinite(salePrice) || salePrice < 0) throw new Error(en.sales.priceCannotBeNegative)
    if (!input.allowNegativeStock && quantity > Number(product.quantity || 0)) {
      throw new Error(
        en.sales.availableForProduct
          .replace("{quantity}", String(product.quantity))
          .replace("{unit}", String(product.quantityUnit))
          .replace("{name}", product.name),
      )
    }

    return {
      product,
      line: calculateSaleLine(
        {
          ...item,
          quantity,
          salePrice,
          quantityUnit: item.quantityUnit || product.quantityUnit,
        },
        {
          customer: input.customer,
          sellerGstin: input.sellerGstin,
          sellerState: input.sellerState,
          gstEnabled: input.gstEnabled,
        },
      ),
    }
  })

  const saleItems = preparedItems.map((entry, index) => ({
    ...entry.line,
    id: `${entry.product.id}-${index + 1}`,
  }))
  const totals = calculateSaleTotals(saleItems)
  const totalAmount = roundCurrency(totals.totalAmount)
  const amountPaid = normalizePaidAmount(totalAmount, input.paymentStatus, input.amountPaid)
  const dueAmount = roundCurrency(Math.max(totalAmount - amountPaid, 0))
  if (dueAmount > 0 && !customerName) throw new Error(en.pos.customerRequiredForDue)
  const createdAt = new Date().toISOString()
  const saleDateTime = input.saleDateTime || createdAt
  const saleDate = input.saleDate || saleDateTime.slice(0, 10)
  const saleId = uuidv4()
  const receiptNo = input.reference?.trim() || buildReceiptNumber("SALE")
  const transactionType = saleItems.length > 1 ? "multi-item-sale" : "sale"
  const transactionProducts: StockTransactionProduct[] = saleItems.map((item) => ({
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

  let createdSale: SaleRecord | null = null
  await db.transaction("rw", [db.products, db.productLogs, db.sales, db.inventoryLocations, db.productLocationStocks, db.inventoryBatches], async () => {
    for (const item of saleItems) {
      await stockOut(
        {
          productId: item.productId,
          quantity: item.quantity,
          quantityUnit: item.quantityUnit,
          salePrice: item.salePrice,
          reason: en.inventory.reasons.sold,
          buyerName: input.customer?.name?.trim(),
          buyerPhone: input.customer?.phone?.trim(),
          buyerGstin: input.customer?.gstin?.trim(),
          note: item.note || input.note,
          gstRate: item.gstRate,
          taxableAmount: item.taxableAmount,
          cgstAmount: item.cgstAmount,
          sgstAmount: item.sgstAmount,
          igstAmount: item.igstAmount,
          gstAmount: item.gstAmount,
          paymentMode: input.paymentMode,
          paymentStatus: input.paymentStatus,
          invoiceReceiptNo: receiptNo,
          batchNo: item.batchNo,
          locationId: item.locationId,
          transactionId: saleId,
          transactionType,
          transactionProducts,
          allowNegativeStock: input.allowNegativeStock,
        },
        {
          skipImmediateSync: true,
          transaction: {
            transactionId: saleId,
            transactionType,
            products: transactionProducts,
            date: saleDateTime,
            amount: item.taxableAmount,
            taxableAmount: item.taxableAmount,
            gstRate: item.gstRate,
            cgstAmount: item.cgstAmount,
            sgstAmount: item.sgstAmount,
            igstAmount: item.igstAmount,
            gstAmount: item.gstAmount,
            paymentMode: input.paymentMode,
            paymentStatus: input.paymentStatus,
            invoiceReceiptNo: receiptNo,
            locationId: item.locationId,
            locationName: item.locationName,
            batchNo: item.batchNo,
            notes: item.note || input.note,
            allowNegativeStock: input.allowNegativeStock,
          },
        },
      )
    }

    const saleRecord: SaleRecord = {
      id: saleId,
      userId: input.userId,
      receiptNo,
      saleDate,
      saleDateTime,
      partyId,
      customer: normalizeCustomer(input.customer),
      items: saleItems,
      totalAmount,
      taxableAmount: roundCurrency(totals.taxableAmount),
      gstAmount: roundCurrency(totals.gstAmount),
      amountPaid,
      dueAmount,
      paymentStatus: input.paymentStatus,
      paymentMode: input.paymentMode,
      note: input.note?.trim() || undefined,
      reference: input.reference?.trim() || undefined,
      gstEnabled: Boolean(input.gstEnabled),
      entryMode: input.entryMode || "quick-sale",
      status: "completed",
      createdAt,
      updatedAt: createdAt,
    }

    await db.sales.add(saleRecord)
    createdSale = saleRecord
  })

  if (partyId) await syncPartyBalances(input.userId, partyId)
  await requestSupabaseSync("sale")
  await incrementUsage(input.userId, "quickSales")
  if (!createdSale) {
    throw new Error(en.sales.saveFailed)
  }
    return createdSale as SaleRecord
  })
}

export async function loadSales(userId: string) {
  const sales = await db.sales.where("userId").equals(userId).toArray()
  return sales.sort((left, right) => right.saleDateTime.localeCompare(left.saleDateTime))
}

export async function getSaleById(saleId: string) {
  return db.sales.get(saleId)
}

export async function cancelSale({
  saleId,
  userId,
  note,
}: {
  saleId: string
  userId: string
  note?: string
}) {
  return runWithCrudBusy("Cancelling sale", async () => {
    await assertFeatureAccess(userId, "sales", { operation: "update", scope: "premium" })

  const sale = await db.sales.get(saleId)
  if (!sale || sale.userId !== userId) throw new Error(en.sales.saleRecordNotFound)
  if (sale.status === "cancelled") throw new Error(en.sales.saleAlreadyCancelled)

  const products = await db.products.where("id").anyOf(sale.items.map((item) => item.productId)).toArray()
  const productMap = new Map(products.map((product) => [product.id, product]))
  const cancelledAt = new Date().toISOString()

  await db.transaction("rw", [db.products, db.productLogs, db.sales, db.inventoryLocations, db.productLocationStocks, db.inventoryBatches], async () => {
    for (const item of sale.items) {
      const product = productMap.get(item.productId)
      if (!product) continue

      const oldStock = Number(product.quantity || 0)
      const newStock = roundCurrency(oldStock + Number(item.quantity || 0))

      await db.products.update(product.id, { quantity: newStock })

      const reversalLog: ProductLog = {
        id: uuidv4(),
        productId: product.id,
        productName: product.name,
        productCategory: product.category,
        productSku: product.sku,
        productHsnCode: product.hsnCode,
        quantityAdded: item.quantity,
        quantity: item.quantity,
        quantityUnit: item.quantityUnit,
        oldStock,
        newStock,
        type: "in",
        reason: en.sales.cancellationReason,
        price: item.salePrice,
        amount: item.taxableAmount,
        taxableAmount: item.taxableAmount,
        gstRate: item.gstRate,
        cgstAmount: item.cgstAmount,
        sgstAmount: item.sgstAmount,
        igstAmount: item.igstAmount,
        gstAmount: item.gstAmount,
        date: cancelledAt,
        transactionId: sale.id,
        transactionType: "sale-cancellation",
        invoiceReceiptNo: sale.receiptNo,
        paymentMode: sale.paymentMode,
        paymentStatus: "cancelled",
        products: sale.items.map((saleItem) => ({
          productId: saleItem.productId,
          name: saleItem.name,
          category: saleItem.category,
          sku: saleItem.sku,
          hsnCode: saleItem.hsnCode,
          quantity: saleItem.quantity,
          quantityUnit: saleItem.quantityUnit,
          rate: saleItem.salePrice,
          amount: saleItem.taxableAmount,
          gstRate: saleItem.gstRate,
          gstAmount: saleItem.gstAmount,
        })),
        note: buildSaleLogNote({
          buyerName: sale.customer?.name,
          buyerPhone: sale.customer?.phone,
          buyerGstin: sale.customer?.gstin,
          note: note?.trim() || sale.note,
        }),
        notes: note?.trim() || sale.note,
        correctedAt: cancelledAt,
        correctionLabel: "cancelled",
      }

      await db.productLogs.add(reversalLog)

      await adjustAdvancedInventoryStock({
        userId,
        product,
        locationId: item.locationId,
        locationName: item.locationName,
        quantityDelta: Number(item.quantity || 0),
        quantityUnit: item.quantityUnit,
        oldProductStock: oldStock,
        batchNo: item.batchNo,
        skipImmediateSync: true,
      })
    }

    await db.productLogs
      .where("transactionId")
      .equals(sale.id)
      .modify((log) => {
        log.paymentStatus = "cancelled"
        log.correctedAt = cancelledAt
        log.correctionLabel = "cancelled"
      })

    await db.sales.update(sale.id, {
      status: "cancelled",
      cancelledAt,
      cancellationNote: note?.trim() || undefined,
      updatedAt: cancelledAt,
    })
  })

  if (sale.partyId) await syncPartyBalances(userId, sale.partyId)
    await requestSupabaseSync("sale cancellation")
    return sale.id
  })
}

function normalizeCustomer(customer?: SaleCustomer) {
  return normalizeContactLike(customer) as SaleCustomer | undefined
}
