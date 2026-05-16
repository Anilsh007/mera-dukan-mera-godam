import type { GSTInvoice, GSTInvoiceItem } from "../types/gst.types"
import {
  isDifferentStateSupply,
  isValidGstin,
  normalizeGstin,
  normalizeStateName,
  getGstinStateCode,
} from "@/app/lib/gst.utils"
import { en } from "@/app/messages/en"

export { isValidGstin, normalizeGstin, normalizeStateName, getGstinStateCode }

export type InvoiceValidationResult = {
  valid: boolean
  errors: string[]
}

const PINCODE_REGEX = /^[1-9][0-9]{5}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[6-9][0-9]{9}$/

export function isInterStateSupply(invoice: GSTInvoice) {
  return isDifferentStateSupply({
    sellerGstin: invoice.seller.gstin,
    buyerGstin: invoice.buyer.gstin,
    sellerState: invoice.seller.state,
    buyerState: invoice.buyer.state,
  })
}

export function validateInvoice(invoice: GSTInvoice): InvoiceValidationResult {
  const errors: string[] = []
  const messages = en.gstInvoice.validation

  if (!invoice.invoiceNo?.trim()) errors.push(messages.invoiceNumberRequired)
  if (!invoice.invoiceDate?.trim()) errors.push(messages.invoiceDateRequired)

  if (!invoice.seller.name?.trim()) errors.push(messages.sellerNameRequired)
  if (!invoice.seller.gstin?.trim()) errors.push(messages.sellerGstinRequired)
  else if (!isValidGstin(invoice.seller.gstin)) errors.push(messages.sellerGstinInvalid)
  if (!invoice.seller.address?.trim()) errors.push(messages.sellerAddressRequired)
  if (!invoice.seller.city?.trim()) errors.push(messages.sellerCityRequired)
  if (!invoice.seller.state?.trim()) errors.push(messages.sellerStateRequired)
  if (!invoice.seller.pincode?.trim()) errors.push(messages.sellerPincodeRequired)
  else if (!PINCODE_REGEX.test(invoice.seller.pincode.trim())) {
    errors.push(messages.sellerPincodeInvalid)
  }
  if (invoice.seller.email?.trim() && !EMAIL_REGEX.test(invoice.seller.email.trim())) {
    errors.push(messages.sellerEmailInvalid)
  }
  if (!invoice.seller.phone?.trim()) errors.push(messages.sellerPhoneRequired)
  else if (!PHONE_REGEX.test(invoice.seller.phone.trim())) {
    errors.push(messages.sellerPhoneInvalid)
  }

  if (!invoice.buyer.name?.trim()) errors.push(messages.buyerNameRequired)
  if (invoice.buyer.gstin?.trim() && !isValidGstin(invoice.buyer.gstin)) {
    errors.push(messages.buyerGstinInvalid)
  }
  if (!invoice.buyer.state?.trim()) errors.push(messages.buyerStateRequired)
  if (invoice.buyer.pincode?.trim() && !PINCODE_REGEX.test(invoice.buyer.pincode.trim())) {
    errors.push(messages.buyerPincodeInvalid)
  }
  if (invoice.buyer.email?.trim() && !EMAIL_REGEX.test(invoice.buyer.email.trim())) {
    errors.push(messages.buyerEmailInvalid)
  }
  if (invoice.buyer.phone?.trim() && !PHONE_REGEX.test(invoice.buyer.phone.trim())) {
    errors.push(messages.buyerPhoneInvalid)
  }

  const validItems = invoice.items.filter((item) => item.name?.trim())
  if (!validItems.length) errors.push(messages.atLeastOneItemRequired)

  invoice.items.forEach((item, index) => {
    const label = `${messages.itemPrefix} ${index + 1}`
    if (!item.name?.trim()) errors.push(`${label}: ${messages.itemProductNameRequired}`)
    if (!isPositiveNumber(item.quantity)) errors.push(`${label}: ${messages.itemQuantityInvalid}`)
    if (!isNonNegativeNumber(item.rate)) errors.push(`${label}: ${messages.itemRateInvalid}`)
    if (!isNonNegativeNumber(item.discount)) errors.push(`${label}: ${messages.itemDiscountInvalid}`)

    const gross = Number(item.quantity || 0) * Number(item.rate || 0)
    if (Number(item.discount || 0) > gross) {
      errors.push(`${label}: ${messages.itemDiscountTooHigh}`)
    }
  })

  return { valid: errors.length === 0, errors }
}

export function sanitizeInvoiceForSave(invoice: GSTInvoice): GSTInvoice {
  const items = invoice.items.map(sanitizeItem)
  return {
    ...invoice,
    invoiceNo: invoice.invoiceNo.trim(),
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate || invoice.invoiceDate,
    seller: {
      ...invoice.seller,
      name: invoice.seller.name.trim(),
      gstin: normalizeGstin(invoice.seller.gstin),
      state: invoice.seller.state.trim(),
      email: invoice.seller.email?.trim() || "",
      phone: invoice.seller.phone?.trim() || "",
      pincode: invoice.seller.pincode?.trim() || "",
    },
    buyer: {
      ...invoice.buyer,
      name: invoice.buyer.name.trim(),
      gstin: normalizeGstin(invoice.buyer.gstin),
      state: invoice.buyer.state.trim(),
      email: invoice.buyer.email?.trim() || "",
      phone: invoice.buyer.phone?.trim() || "",
      pincode: invoice.buyer.pincode?.trim() || "",
    },
    items,
  }
}

function sanitizeItem(item: GSTInvoiceItem): GSTInvoiceItem {
  const quantity = clampNumber(item.quantity, 0, 1_000_000)
  const rate = clampNumber(item.rate, 0, 10_000_000)
  const gross = quantity * rate
  const discount = Math.min(clampNumber(item.discount, 0, 10_000_000), gross)

  return {
    ...item,
    name: item.name.trim(),
    description: (item.description || item.name).trim(),
    hsnCode: item.hsnCode?.trim() || "",
    unit: item.unit?.trim() || "pcs",
    quantity,
    rate,
    discount,
  }
}

function isPositiveNumber(value: unknown) {
  return Number.isFinite(Number(value)) && Number(value) > 0
}

function isNonNegativeNumber(value: unknown) {
  return Number.isFinite(Number(value)) && Number(value) >= 0
}

function clampNumber(value: unknown, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return min
  return Math.min(Math.max(parsed, min), max)
}
