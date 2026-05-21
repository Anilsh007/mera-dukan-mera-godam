"use client"

import { v4 as uuidv4 } from "uuid"
import { db, type EstimateRecord, type EstimateStatus, type SaleCustomer } from "@/app/lib/db"
import { ensurePartyRecord } from "@/app/lib/parties/party.service"
import { assertFeatureAccess, ensureCustomerCapacity, incrementUsage } from "@/app/lib/subscription/subscription.service"
import { roundCurrency } from "@/app/lib/gst.utils"
import { saveSale } from "@/app/lib/sales/sale.service"
import { calculateEstimateLine, calculateEstimateTotals, buildEstimateNumber, type EstimateLineInput } from "@/app/lib/estimates/estimate.utils"
import type { SalePaymentMode, SalePaymentStatus } from "@/app/lib/db"
import { en } from "@/app/messages/en"

export type SaveEstimateInput = {
  userId: string
  estimateNo?: string
  customer?: SaleCustomer
  items: EstimateLineInput[]
  sellerGstin?: string
  sellerState?: string
  estimateDate?: string
  estimateDateTime?: string
  expiryDate?: string
  status?: EstimateStatus
  note?: string
  terms?: string
  reference?: string
  gstEnabled?: boolean
}

export type ConvertEstimateToSaleInput = {
  estimateId: string
  userId: string
  paymentMode: SalePaymentMode
  paymentStatus: SalePaymentStatus
  amountPaid: number
  note?: string
  sellerGstin?: string
  sellerState?: string
}

function normalizeCustomer(customer?: SaleCustomer) {
  if (!customer) return undefined
  const normalized: SaleCustomer = {
    name: customer.name?.trim() || undefined,
    gstin: customer.gstin?.trim().toUpperCase() || undefined,
    phone: customer.phone?.trim() || undefined,
    email: customer.email?.trim() || undefined,
    address: customer.address?.trim() || undefined,
    city: customer.city?.trim() || undefined,
    state: customer.state?.trim() || undefined,
    pincode: customer.pincode?.trim() || undefined,
  }

  return Object.values(normalized).some(Boolean) ? normalized : undefined
}

function validateEstimateItems(items: EstimateLineInput[]) {
  if (!items.length) throw new Error(en.estimates.addAtLeastOneItem)
  items.forEach((item) => {
    const quantity = Number(item.quantity || 0)
    const price = Number(item.salePrice || 0)
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(en.estimates.quantityRequired)
    if (!Number.isFinite(price) || price < 0) throw new Error(en.estimates.priceRequired)
  })
}

export async function loadEstimates(userId: string) {
  const estimates = await db.estimates.where("userId").equals(userId).toArray()
  return estimates.sort((left, right) => right.estimateDateTime.localeCompare(left.estimateDateTime))
}

export async function getEstimateById(estimateId: string) {
  return db.estimates.get(estimateId)
}

export async function saveEstimate(input: SaveEstimateInput) {
  await assertFeatureAccess(input.userId, "estimates", { operation: "create", incrementBy: 1 })
  validateEstimateItems(input.items)

  const customer = normalizeCustomer(input.customer)
  const customerName = customer?.name?.trim()
  let partyId: string | undefined
  if (customerName) {
    await ensureCustomerCapacity(input.userId, customerName)
    const party = await ensurePartyRecord({
      userId: input.userId,
      name: customerName,
      mobile: customer?.phone,
      email: customer?.email,
      gstin: customer?.gstin,
      address: customer?.address,
      city: customer?.city,
      state: customer?.state,
      pincode: customer?.pincode,
      type: "customer",
    })
    partyId = party.id
  }

  const products = await db.products
    .where("id")
    .anyOf(input.items.map((item) => item.productId))
    .toArray()
  const productMap = new Map(products.map((product) => [product.id, product]))

  const estimateItems = input.items.map((item, index) => {
    const product = productMap.get(item.productId)
    if (!product) throw new Error(en.sales.productNotFound)
    const line = calculateEstimateLine(
      {
        ...item,
        name: item.name || product.name,
        category: item.category || product.category,
        sku: item.sku || product.sku,
        hsnCode: item.hsnCode || product.hsnCode,
        quantityUnit: item.quantityUnit || product.quantityUnit,
        quantity: Number(item.quantity || 0),
        salePrice: Number(item.salePrice || 0),
        discount: Number(item.discount || 0),
        gstRate: Number(item.gstRate || 0),
      },
      {
        customer,
        sellerGstin: input.sellerGstin,
        sellerState: input.sellerState,
        gstEnabled: input.gstEnabled,
      },
    )
    return { ...line, id: `${product.id}-${index + 1}` }
  })

  const totals = calculateEstimateTotals(estimateItems)
  const now = new Date().toISOString()
  const estimateDateTime = input.estimateDateTime || now
  const estimateDate = input.estimateDate || estimateDateTime.slice(0, 10)
  const estimateNo = input.estimateNo?.trim() || buildEstimateNumber()

  const existing = await db.estimates
    .where("[userId+estimateNo]")
    .equals([input.userId, estimateNo])
    .first()
  if (existing) throw new Error(en.estimates.duplicateEstimateNumber)

  const estimate: EstimateRecord = {
    id: uuidv4(),
    userId: input.userId,
    estimateNo,
    estimateDate,
    estimateDateTime,
    expiryDate: input.expiryDate || undefined,
    partyId,
    customer,
    items: estimateItems,
    totalAmount: roundCurrency(totals.totalAmount),
    taxableAmount: roundCurrency(totals.taxableAmount),
    gstAmount: roundCurrency(totals.gstAmount),
    status: input.status || "draft",
    note: input.note?.trim() || undefined,
    terms: input.terms?.trim() || undefined,
    reference: input.reference?.trim() || undefined,
    gstEnabled: Boolean(input.gstEnabled),
    createdAt: now,
    updatedAt: now,
  }

  await db.estimates.add(estimate)
  await incrementUsage(input.userId, "estimates")
  return estimate
}

export async function updateEstimateStatus({
  estimateId,
  userId,
  status,
}: {
  estimateId: string
  userId: string
  status: EstimateStatus
}) {
  await assertFeatureAccess(userId, "estimates", { operation: "update", scope: "premium" })
  const estimate = await db.estimates.get(estimateId)
  if (!estimate || estimate.userId !== userId) throw new Error(en.estimates.notFound)
  if (estimate.status === "converted" && status !== "converted") throw new Error(en.estimates.convertedCannotChange)
  await db.estimates.update(estimateId, { status, updatedAt: new Date().toISOString() })
}

export async function markEstimateInvoiceDraftCreated({
  estimateId,
  userId,
}: {
  estimateId: string
  userId: string
}) {
  await assertFeatureAccess(userId, "gstInvoices", { operation: "create", incrementBy: 0 })
  const estimate = await db.estimates.get(estimateId)
  if (!estimate || estimate.userId !== userId) throw new Error(en.estimates.notFound)
  await db.estimates.update(estimateId, {
    convertedInvoiceDraftAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

export async function convertEstimateToSale(input: ConvertEstimateToSaleInput) {
  await assertFeatureAccess(input.userId, "estimates", { operation: "update", scope: "premium" })
  const estimate = await db.estimates.get(input.estimateId)
  if (!estimate || estimate.userId !== input.userId) throw new Error(en.estimates.notFound)
  if (estimate.status === "converted") throw new Error(en.estimates.alreadyConverted)
  if (estimate.status === "rejected") throw new Error(en.estimates.rejectedCannotConvert)

  const sale = await saveSale({
    userId: input.userId,
    items: estimate.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      category: item.category,
      sku: item.sku,
      hsnCode: item.hsnCode,
      quantity: item.quantity,
      quantityUnit: item.quantityUnit,
      salePrice: item.salePrice,
      discount: item.discount,
      gstRate: item.gstRate,
      note: item.note,
    })),
    customer: estimate.customer,
    sellerGstin: input.sellerGstin,
    sellerState: input.sellerState,
    paymentMode: input.paymentMode,
    paymentStatus: input.paymentStatus,
    amountPaid: input.amountPaid,
    note: [estimate.note, input.note].filter(Boolean).join(" | ") || undefined,
    reference: `${estimate.estimateNo}`,
    gstEnabled: estimate.gstEnabled,
    entryMode: "quick-sale",
  })

  const now = new Date().toISOString()
  await db.estimates.update(input.estimateId, {
    status: "converted",
    convertedSaleId: sale.id,
    convertedAt: now,
    updatedAt: now,
  })

  return sale
}
