import type { TransactionDocumentItem } from "@/app/lib/transactionDocument"
import { en } from "@/app/messages/en"

type DocumentLineSource = {
  name: string
  category?: string
  sku?: string
  hsnCode?: string
  quantity?: number | string
  quantityUnit?: string
  rate?: number
  salePrice?: number
  discount?: number
  gstRate?: number
  taxableAmount?: number
  cgstAmount?: number
  sgstAmount?: number
  igstAmount?: number
  lineTotal?: number
  total?: number
  note?: string
}

export function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1))
}

export function buildTransactionItemDescription(item: Pick<DocumentLineSource, "category" | "sku">) {
  return [item.category, item.sku ? `${en.inventory.sku}: ${item.sku}` : ""].filter(Boolean).join(" | ")
}

export function buildTransactionDocumentItem(
  item: DocumentLineSource,
  options: { titleCaseName?: boolean } = {},
): TransactionDocumentItem {
  return {
    name: options.titleCaseName ? toTitleCase(item.name) : item.name,
    description: buildTransactionItemDescription(item),
    hsnCode: item.hsnCode,
    quantity: item.quantity,
    unit: item.quantityUnit,
    rate: item.rate ?? item.salePrice,
    discount: item.discount,
    gstRate: item.gstRate,
    taxableAmount: item.taxableAmount,
    cgstAmount: item.cgstAmount,
    sgstAmount: item.sgstAmount,
    igstAmount: item.igstAmount,
    total: Number(item.lineTotal ?? item.total ?? 0),
    note: item.note,
  }
}

export function calculateDocumentTaxTotals(items: Array<Pick<DocumentLineSource, "cgstAmount" | "sgstAmount" | "igstAmount">>) {
  return {
    cgstTotal: items.reduce((sum, item) => sum + Number(item.cgstAmount || 0), 0),
    sgstTotal: items.reduce((sum, item) => sum + Number(item.sgstAmount || 0), 0),
    igstTotal: items.reduce((sum, item) => sum + Number(item.igstAmount || 0), 0),
  }
}
