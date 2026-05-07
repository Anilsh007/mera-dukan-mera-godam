import type { GSTInvoice, GSTInvoiceItem, GSTInvoiceRecord } from "./gst.types"
import type { BuyerSuggestion } from "../buyerSuggestions"

export type InvoiceHeaderProps = {
  invoice: GSTInvoice
  onChange: (field: string, value: string) => void
  onSave: () => void
  onReset: () => void
  saving: boolean
}

export type BuyerSectionProps = {
  buyer: GSTInvoice["buyer"]
  shippingAddress: GSTInvoice["shippingAddress"]
  shippingSameAsBilling: boolean
  onBuyerChange: (field: keyof GSTInvoice["buyer"], value: string) => void
  onShippingAddressChange: (field: keyof GSTInvoice["shippingAddress"], value: string) => void
  onShippingSameChange: (checked: boolean) => void
  suggestions: BuyerSuggestion[]
}

export type SellerSectionProps = {
  seller: GSTInvoice["seller"]
}

export type ItemsSectionProps = {
  items: GSTInvoiceItem[]
  onChange: (index: number, field: keyof GSTInvoiceItem, value: string) => void
  addItem: () => void
  removeItem: (index: number) => void
  isInterState: boolean
}

export type ItemCardProps = {
  item: GSTInvoiceItem
  index: number
  onChange: (index: number, field: keyof GSTInvoiceItem, value: string) => void
  onRemove: (index: number) => void
  isInterState: boolean
}

export type BankNotesProps = {
  invoice: GSTInvoice
  onChange: (field: string, value: string) => void
}

export type InvoiceHistoryProps = {
  invoices: GSTInvoiceRecord[]
  onSelect: (inv: GSTInvoiceRecord) => void
}
