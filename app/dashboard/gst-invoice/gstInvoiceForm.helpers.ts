import {
  calculateGST,
  createEmptyInvoiceItem,
  buildInvoiceTotals,
  type GSTInvoice,
} from "./types/gst.types"

import { getStateFromGSTIN } from "./lib/getStateFromGSTIN"
import { findHsnSacTaxInfo } from "./lib/hsnSacLookup"
import { isInterStateSupply } from "./lib/invoiceValidation"
import type { SaleInvoiceDraft } from "./invoiceDraft.service"

export function buildInvoiceFromSaleDraft(baseInvoice: GSTInvoice, draft: SaleInvoiceDraft): GSTInvoice {
  const buyer = {
    ...baseInvoice.buyer,
    name: cleanDraftText(draft.buyer?.name) || baseInvoice.buyer.name,
    gstin: cleanDraftText(draft.buyer?.gstin) || baseInvoice.buyer.gstin,
    phone: cleanDraftText(draft.buyer?.phone) || baseInvoice.buyer.phone,
    email: cleanDraftText(draft.buyer?.email) || baseInvoice.buyer.email,
    address: cleanDraftText(draft.buyer?.address) || baseInvoice.buyer.address,
    city: cleanDraftText(draft.buyer?.city) || baseInvoice.buyer.city,
    state: cleanDraftText(draft.buyer?.state) || baseInvoice.buyer.state,
    pincode: cleanDraftText(draft.buyer?.pincode) || baseInvoice.buyer.pincode,
  }

  if (!buyer.state && buyer.gstin) {
    buyer.state = getStateFromGSTIN(buyer.gstin) || ""
  }

  const draftInvoice: GSTInvoice = {
    ...baseInvoice,
    buyer,
    notes: cleanDraftText(draft.notes) || baseInvoice.notes,
    shippingSameAsBilling: true,
    shippingAddress: {
      address: buyer.address || "",
      city: buyer.city || "",
      state: buyer.state || "",
      pincode: buyer.pincode || "",
    },
  }

  const interState = isInterStateSupply(draftInvoice)
  const items = (draft.items.length ? draft.items : baseInvoice.items).map((item) =>
    calculateInvoiceItem(item, interState)
  )

  return {
    ...draftInvoice,
    items,
    totals: buildInvoiceTotals(items),
  }
}

export function calculateInvoiceItem(
  rawItem: GSTInvoice["items"][number],
  interState: boolean
): GSTInvoice["items"][number] {
  const rawName = typeof rawItem.name === "string" ? rawItem.name : ""
  const rawDescription = typeof rawItem.description === "string" ? rawItem.description : ""
  const normalizedName = rawName.trim() || rawDescription.trim()
  const rawRate = rawItem.rate === "" ? "" : rawItem.rate
  const rawQuantity = rawItem.quantity === "" ? "" : rawItem.quantity
  const rawDiscount = rawItem.discount === "" ? "" : rawItem.discount
  const numericRate = toSafeNumber(rawItem.rate)
  const numericQuantity = toSafeNumber(rawItem.quantity)
  const numericDiscount = toSafeNumber(rawItem.discount)

  const item = {
    ...createEmptyInvoiceItem(),
    ...rawItem,
    name: rawName,
    description: rawDescription || normalizedName,
    hsnCode: cleanDraftText(rawItem.hsnCode),
    unit: cleanDraftText(rawItem.unit) || "pcs",
    rate: rawRate,
    quantity: rawQuantity,
    discount: rawDiscount,
  }

  const taxInfo = findHsnSacTaxInfo(item.hsnCode)
  const fallbackGstRate = toPositiveNumber(item.gstRate, 18)

  const cgstRate = taxInfo?.cgstRate ?? fallbackGstRate / 2
  const sgstRate = taxInfo?.sgstRate ?? fallbackGstRate / 2
  const igstRate = taxInfo?.igstRate ?? fallbackGstRate
  const gstRate = interState ? igstRate : cgstRate + sgstRate

  const gst = calculateGST(gstRate, numericQuantity, numericRate, numericDiscount, interState, {
    cgstRate,
    sgstRate,
    igstRate,
  })

  return {
    ...item,
    hsnSacType: taxInfo?.type,
    hsnSacDescription: taxInfo?.description || item.hsnSacDescription || "",
    gstCondition: taxInfo?.condition || item.gstCondition || "",
    gstRate,
    cgstRate,
    sgstRate,
    igstRate,
    taxableValue: gst.taxableValue,
    cgstAmount: gst.cgst,
    sgstAmount: gst.sgst,
    igstAmount: gst.igst,
    total: gst.total,
  }
}

function cleanDraftText(value: string | undefined) {
  return value?.trim() || ""
}

function toPositiveNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function toSafeNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
