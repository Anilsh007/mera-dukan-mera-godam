import { createEmptyInvoiceItem } from "@/app/dashboard/gst-invoice/types/gst.types"
import { buildInvoiceTotals } from "@/app/dashboard/gst-invoice/types/gst.types"
import { calculateSaleLine, calculateSaleTotals, type SaleDraftLineInput } from "@/app/lib/sales/sale.utils"
import type { EstimateItem, EstimateRecord, SaleCustomer } from "@/app/lib/db"

export type EstimateLineInput = SaleDraftLineInput

export type EstimateCalculationContext = {
  customer?: SaleCustomer
  sellerGstin?: string
  sellerState?: string
  gstEnabled?: boolean
}

export function calculateEstimateLine(
  line: EstimateLineInput,
  context: EstimateCalculationContext = {},
): EstimateItem {
  return calculateSaleLine(line, context)
}

export function calculateEstimateTotals(items: EstimateItem[]) {
  return calculateSaleTotals(items)
}

export function buildEstimateNumber(prefix = "EST") {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "")
  return `${prefix}-${date}-${Date.now()}`
}

export function isEstimateExpired(estimate: Pick<EstimateRecord, "status" | "expiryDate">, now = new Date()) {
  if (estimate.status === "converted" || estimate.status === "rejected" || estimate.status === "expired") {
    return estimate.status === "expired"
  }
  if (!estimate.expiryDate) return false
  const expiry = new Date(`${estimate.expiryDate}T23:59:59`)
  return expiry.getTime() < now.getTime()
}

export function getEffectiveEstimateStatus(estimate: EstimateRecord) {
  return isEstimateExpired(estimate) ? "expired" : estimate.status
}

export function buildInvoiceDraftItemsFromEstimate(estimate: Pick<EstimateRecord, "items">) {
  return estimate.items.map((line) => {
    const item = createEmptyInvoiceItem()
    item.name = line.name
    item.description = line.name
    item.category = line.category || ""
    item.hsnCode = line.hsnCode || ""
    item.quantity = line.quantity
    item.unit = line.quantityUnit
    item.rate = line.salePrice
    item.discount = line.discount
    item.gstRate = line.gstRate
    item.taxableValue = line.taxableAmount
    item.cgstRate = line.cgstAmount > 0 ? line.gstRate / 2 : 0
    item.cgstAmount = line.cgstAmount
    item.sgstRate = line.sgstAmount > 0 ? line.gstRate / 2 : 0
    item.sgstAmount = line.sgstAmount
    item.igstRate = line.igstAmount > 0 ? line.gstRate : 0
    item.igstAmount = line.igstAmount
    item.total = line.lineTotal
    return item
  })
}

export function buildInvoiceDraftTotalsFromEstimate(estimate: Pick<EstimateRecord, "items">) {
  return buildInvoiceTotals(buildInvoiceDraftItemsFromEstimate(estimate))
}
