import type { GSTInvoiceParty, GSTInvoiceRecord } from "./types/gst.types"

export type BuyerSuggestion = {
  key: string
  buyer: GSTInvoiceParty
  lastInvoiceNo?: string
  lastInvoiceDate?: string
}

export function buildBuyerSuggestions(invoices: GSTInvoiceRecord[]): BuyerSuggestion[] {
  const buyers = new Map<string, BuyerSuggestion>()

  for (const invoice of invoices) {
    const buyer = invoice.buyer
    const key = buildBuyerKey(buyer)
    if (!key) continue

    const existing = buyers.get(key)
    if (!existing || (invoice.invoiceDate || "") > (existing.lastInvoiceDate || "")) {
      buyers.set(key, {
        key,
        buyer: {
          name: buyer.name || "",
          gstin: buyer.gstin || "",
          address: buyer.address || "",
          city: buyer.city || "",
          state: buyer.state || "",
          pincode: buyer.pincode || "",
          phone: buyer.phone || "",
          email: buyer.email || "",
        },
        lastInvoiceNo: invoice.invoiceNo,
        lastInvoiceDate: invoice.invoiceDate,
      })
    }
  }

  return Array.from(buyers.values()).sort((left, right) =>
    (right.lastInvoiceDate || "").localeCompare(left.lastInvoiceDate || "")
  )
}

export function matchBuyerSuggestion(
  suggestions: BuyerSuggestion[],
  field: "name" | "gstin" | "phone" | "email",
  rawValue: string
) {
  const value = rawValue.trim().toLowerCase()
  if (!value) return null

  return (
    suggestions.find((suggestion) => (suggestion.buyer[field] || "").trim().toLowerCase() === value) || null
  )
}

function buildBuyerKey(buyer: GSTInvoiceParty) {
  if (buyer.gstin?.trim()) return `gstin:${buyer.gstin.trim().toLowerCase()}`
  if (buyer.phone?.trim()) return `phone:${buyer.phone.trim().toLowerCase()}`
  if (buyer.email?.trim()) return `email:${buyer.email.trim().toLowerCase()}`
  if (buyer.name?.trim()) return `name:${buyer.name.trim().toLowerCase()}`
  return null
}
