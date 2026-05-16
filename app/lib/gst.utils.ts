import type { GSTInvoiceItem, GSTInvoiceTotals } from "@/app/dashboard/gst-invoice/types/gst.types"

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

export type GstSupplyType = "same-state" | "different-state"

export type GstCalculationInput = {
  quantity: number
  rate: number
  discount?: number
  gstRate: number
  sellerGstin?: string
  buyerGstin?: string
  sellerState?: string
  buyerState?: string
  isInterState?: boolean
  cgstRate?: number
  sgstRate?: number
  igstRate?: number
}

export type GstBreakup = {
  taxableAmount: number
  cgstRate: number
  cgstAmount: number
  sgstRate: number
  sgstAmount: number
  igstRate: number
  igstAmount: number
  totalGst: number
  grandTotal: number
  isInterState: boolean
  supplyType: GstSupplyType
}

export function normalizeGstin(value?: string) {
  return (value || "").trim().toUpperCase()
}

export function isValidGstin(value?: string) {
  return GSTIN_REGEX.test(normalizeGstin(value))
}

export function getGstinStateCode(value?: string) {
  const gstin = normalizeGstin(value)
  return isValidGstin(gstin) ? gstin.slice(0, 2) : null
}

export function normalizeStateName(value?: string) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function isDifferentStateSupply(input: {
  sellerGstin?: string
  buyerGstin?: string
  sellerState?: string
  buyerState?: string
}) {
  const sellerCode = getGstinStateCode(input.sellerGstin)
  const buyerCode = getGstinStateCode(input.buyerGstin)

  if (sellerCode && buyerCode) return sellerCode !== buyerCode

  const sellerState = normalizeStateName(input.sellerState)
  const buyerState = normalizeStateName(input.buyerState)
  return Boolean(sellerState && buyerState && sellerState !== buyerState)
}

export function getSupplyType(input: {
  sellerGstin?: string
  buyerGstin?: string
  sellerState?: string
  buyerState?: string
  isInterState?: boolean
}): GstSupplyType {
  const isInterState = typeof input.isInterState === "boolean" ? input.isInterState : isDifferentStateSupply(input)
  return isInterState ? "different-state" : "same-state"
}

export function roundCurrency(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

export function calculateTaxableAmount(quantity: number, rate: number, discount = 0) {
  const gross = roundCurrency(Number(quantity || 0) * Number(rate || 0))
  return Math.max(0, roundCurrency(gross - Number(discount || 0)))
}

export function calculateGstBreakup(input: GstCalculationInput): GstBreakup {
  const supplyType = getSupplyType(input)
  const isInterState = supplyType === "different-state"
  const taxableAmount = calculateTaxableAmount(input.quantity, input.rate, input.discount || 0)
  const cgstRate = input.cgstRate ?? input.gstRate / 2
  const sgstRate = input.sgstRate ?? input.gstRate / 2
  const igstRate = input.igstRate ?? input.gstRate

  const cgstAmount = isInterState ? 0 : roundCurrency((taxableAmount * cgstRate) / 100)
  const sgstAmount = isInterState ? 0 : roundCurrency((taxableAmount * sgstRate) / 100)
  const igstAmount = isInterState ? roundCurrency((taxableAmount * igstRate) / 100) : 0
  const totalGst = roundCurrency(cgstAmount + sgstAmount + igstAmount)

  return {
    taxableAmount,
    cgstRate: isInterState ? 0 : cgstRate,
    cgstAmount,
    sgstRate: isInterState ? 0 : sgstRate,
    sgstAmount,
    igstRate: isInterState ? igstRate : 0,
    igstAmount,
    totalGst,
    grandTotal: roundCurrency(taxableAmount + totalGst),
    isInterState,
    supplyType,
  }
}

export function calculateLineGst(input: GstCalculationInput) {
  return calculateGstBreakup(input)
}

export function calculateGstTotals(items: GSTInvoiceItem[]): GSTInvoiceTotals {
  const totals = items.reduce(
    (acc, item) => {
      acc.taxableValue += Number(item.taxableValue || 0)
      acc.cgstTotal += Number(item.cgstAmount || 0)
      acc.sgstTotal += Number(item.sgstAmount || 0)
      acc.igstTotal += Number(item.igstAmount || 0)
      acc.grandTotal += Number(item.total || 0)
      return acc
    },
    {
      taxableValue: 0,
      cgstTotal: 0,
      sgstTotal: 0,
      igstTotal: 0,
      grandTotal: 0,
      amountInWords: "Zero Only",
    }
  )

  return {
    taxableValue: roundCurrency(totals.taxableValue),
    cgstTotal: roundCurrency(totals.cgstTotal),
    sgstTotal: roundCurrency(totals.sgstTotal),
    igstTotal: roundCurrency(totals.igstTotal),
    grandTotal: roundCurrency(totals.grandTotal),
    amountInWords: totals.amountInWords,
  }
}
