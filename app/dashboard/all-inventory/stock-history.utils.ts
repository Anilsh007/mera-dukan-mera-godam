import { formatQuantity } from "@/app/lib/quantityUnit"
import type { HistoryRow } from "./stock-history.types"
import { en } from "@/app/messages/en"
import { printTransactionDocument, type BusinessDocumentProfile } from "@/app/lib/transactionDocument"

export const HISTORY_PAGE_SIZES = [5, 10, 20, 50]

export function formatDateTime(iso: string) {
  if (!iso) return "-"
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export function formatDateInput(value: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

export function formatReason(reason: string) {
  const value = reason.toLowerCase()
  if (value === "sold") return en.stockHistory.reasonLabels.sale
  if (value === "expired") return en.stockHistory.reasonLabels.expired
  if (value === "damaged") return en.stockHistory.reasonLabels.damaged
  if (value === "personal use") return en.stockHistory.reasonLabels.personalUse
  if (value === "stock in" || value === "maal aaya") return en.stockHistory.reasonLabels.stockIn
  if (value === "stock out" || value === "maal nikla") return en.stockHistory.reasonLabels.stockOut
  return reason || "-"
}

export function printRows(rows: HistoryRow[], seller?: BusinessDocumentProfile) {
  const total = rows.reduce((sum, row) => sum + (row.amount || row.price * row.quantity), 0)
  const uniqueBuyers = Array.from(new Set(rows.map((row) => row.buyerName).filter(Boolean)))
  const buyerLabel = uniqueBuyers.length === 1 ? uniqueBuyers[0] : uniqueBuyers.length ? en.stockHistory.labels.multipleBuyers : en.stockHistory.labels.na

  return printTransactionDocument({
    type: "stock-adjustment",
    title: en.stockHistory.labels.selectedStockHistory,
    reference: `HIS-${Date.now()}`,
    date: new Date().toLocaleString("en-IN"),
    seller,
    partyLabel: en.stockHistory.labels.buyer,
    party: { name: buyerLabel },
    items: rows.map((row) => ({
      name: toTitleCase(row.productName),
      description: [
        row.category,
        row.buyerName || row.reason,
        row.expiry ? `${en.inventory.expiry}: ${row.expiry}` : "",
        row.invoiceReceiptNo ? `${en.receipt.ref}: ${row.invoiceReceiptNo}` : "",
        row.oldStock !== undefined && row.newStock !== undefined ? `${en.stockHistory.labels.stock}: ${row.oldStock} → ${row.newStock}` : "",
      ].filter(Boolean).join(" | "),
      quantity: formatQuantity(row.quantity, row.quantityUnit),
      rate: row.price,
      total: row.amount || row.price * row.quantity,
      note: [row.note, row.gstAmount ? `${en.transaction.totalGst}: ${en.common.rupeeSymbol} ${row.gstAmount.toLocaleString("en-IN")}` : ""].filter(Boolean).join(" | "),
    })),
    totals: { grandTotal: total },
    footerNote: `${en.stockHistory.labels.printedOn}: ${new Date().toLocaleString("en-IN")}`,
  })
}

export function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1))
}
