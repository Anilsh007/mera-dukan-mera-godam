import { calculateGstBreakup, roundCurrency } from "@/app/lib/gst.utils"
import type { SaleCustomer, SaleItem, SalePaymentStatus } from "@/app/lib/db"

export type SaleDraftLineInput = {
  productId: string
  name: string
  category?: string
  sku?: string
  hsnCode?: string
  batchNo?: string
  locationId?: string
  locationName?: string
  quantity: number
  quantityUnit: string
  salePrice: number
  discount?: number
  gstRate?: number
  note?: string
}

export type SaleCalculationContext = {
  customer?: SaleCustomer
  sellerGstin?: string
  sellerState?: string
  gstEnabled?: boolean
}

export type CalculatedSaleLine = SaleItem

export function calculateSaleLine(
  line: SaleDraftLineInput,
  context: SaleCalculationContext = {},
): CalculatedSaleLine {
  const quantity = Number(line.quantity || 0)
  const salePrice = roundCurrency(Number(line.salePrice || 0))
  const discount = roundCurrency(Number(line.discount || 0))
  const gstRate = context.gstEnabled ? Number(line.gstRate || 0) : 0
  const gst = calculateGstBreakup({
    quantity,
    rate: salePrice,
    discount,
    gstRate,
    sellerGstin: context.sellerGstin,
    buyerGstin: context.customer?.gstin,
    sellerState: context.sellerState,
    buyerState: context.customer?.state,
  })

  return {
    id: `${line.productId}:${line.quantityUnit}`,
    productId: line.productId,
    name: line.name,
    category: line.category,
    sku: line.sku,
    hsnCode: line.hsnCode,
    batchNo: line.batchNo,
    locationId: line.locationId,
    locationName: line.locationName,
    quantity,
    quantityUnit: line.quantityUnit,
    salePrice,
    discount,
    taxableAmount: gst.taxableAmount,
    gstRate,
    cgstAmount: gst.cgstAmount,
    sgstAmount: gst.sgstAmount,
    igstAmount: gst.igstAmount,
    gstAmount: gst.totalGst,
    lineTotal: gst.grandTotal,
    note: line.note?.trim() || undefined,
  }
}

export function calculateSaleTotals(items: CalculatedSaleLine[]) {
  return items.reduce(
    (acc, item) => {
      acc.taxableAmount += Number(item.taxableAmount || 0)
      acc.gstAmount += Number(item.gstAmount || 0)
      acc.totalAmount += Number(item.lineTotal || 0)
      return acc
    },
    {
      taxableAmount: 0,
      gstAmount: 0,
      totalAmount: 0,
    },
  )
}

export function normalizePaidAmount(
  totalAmount: number,
  paymentStatus: SalePaymentStatus,
  amountPaid: number,
) {
  if (paymentStatus === "paid") return roundCurrency(totalAmount)
  if (paymentStatus === "unpaid") return 0
  return roundCurrency(Math.min(Math.max(Number(amountPaid || 0), 0), totalAmount))
}

export function buildReceiptNumber(prefix = "SALE") {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "")
  return `${prefix}-${date}-${Date.now()}`
}
