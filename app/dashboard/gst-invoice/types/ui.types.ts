import type { GSTInvoice, GSTInvoiceItem, GSTInvoiceRecord } from "./gst.types"
import type { BuyerSuggestion } from "../buyerSuggestions"
import { CommonInvoiceProps } from "../lib/commonProps"

export type InvoiceHeaderProps = {
  invoice: GSTInvoice
  onChange: (field: string, value: string) => void
  onSave: () => void
  onReset: () => void
  saving: boolean
}

export type BuyerSectionProps = {
  buyer: GSTInvoice["buyer"];                 // the buyer object
  onChange: (field: keyof GSTInvoice["buyer"], value: string) => void;
  suggestions: BuyerSuggestion[];
};

export type SellerSectionProps = {
  seller: GSTInvoice["seller"]
}

export type ItemsSectionProps = {
  items: GSTInvoiceItem[]
  onChange: (index: number, field: keyof GSTInvoiceItem, value: string) => void
  addItem: () => void
  removeItem: (index: number) => void
  productSuggestions: any[]
}

export type ItemCardProps = {
  item: GSTInvoiceItem
  index: number
  onChange: (index: number, field: keyof GSTInvoiceItem, value: string) => void
  onRemove: (index: number) => void
}

export type BankNotesProps = {
  invoice: GSTInvoice
  onChange: (field: string, value: string) => void
}

export type InvoiceHistoryProps = {
  invoices: GSTInvoiceRecord[]
  onSelect: (inv: GSTInvoiceRecord) => void
}