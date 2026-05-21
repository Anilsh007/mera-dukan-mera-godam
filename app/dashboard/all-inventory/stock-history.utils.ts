import { formatQuantity } from "@/app/lib/quantityUnit"
import { formatCurrency, formatIndianDateTime } from "@/app/lib/formatters"
import type { HistoryRow } from "./stock-history.types"
import { en } from "@/app/messages/en"
import {
  printTransactionDocument,
  type BusinessDocumentProfile,
  type TransactionDocumentData,
} from "@/app/lib/transactionDocument"

export const HISTORY_PAGE_SIZES = [5, 10, 20, 50]

export function formatDateTime(iso: string) {
  return formatIndianDateTime(iso)
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

export function getBuyerKey(row: Pick<HistoryRow, "buyerName" | "buyerPhone" | "buyerGstin">) {
  const name = row.buyerName?.trim().toLowerCase() || ""
  const phone = row.buyerPhone?.trim().toLowerCase() || ""
  const gstin = row.buyerGstin?.trim().toLowerCase() || ""
  return [name, phone, gstin].join("|")
}

export function groupTransactionsByBuyer(rows: HistoryRow[]) {
  const groups = new Map<string, HistoryRow[]>()

  rows.forEach((row) => {
    const key = getBuyerKey(row) || "__missing__"
    const current = groups.get(key) || []
    current.push(row)
    groups.set(key, current)
  })

  return groups
}

export function hasSingleBuyer(rows: HistoryRow[]) {
  const buyerKeys = Array.from(
    new Set(
      rows
        .filter((row) => row.buyerName?.trim())
        .map((row) => getBuyerKey(row))
        .filter(Boolean)
    )
  )

  return buyerKeys.length === 1
}

export function getBuyerSelectionState(rows: HistoryRow[]) {
  const saleRows = rows.filter((row) => row.logType === "out" && row.reason.toLowerCase() === "sold")
  const missingBuyer = saleRows.some((row) => !row.buyerName?.trim())
  const buyerKeys = Array.from(new Set(saleRows.map((row) => getBuyerKey(row)).filter(Boolean)))

  if (!saleRows.length) {
    return {
      code: "unknown" as const,
      label: en.stockHistory.buyerStatusUnknown,
      warning: "",
    }
  }

  if (missingBuyer) {
    return {
      code: "missing" as const,
      label: en.stockHistory.buyerStatusMissing,
      warning: en.stockHistory.actionMessages.buyerMissingForSelection,
    }
  }

  if (buyerKeys.length > 1) {
    return {
      code: "multiple" as const,
      label: en.stockHistory.buyerStatusMultiple,
      warning: en.stockHistory.actionMessages.gstBuyerMismatchHindi,
    }
  }

  return {
    code: "single" as const,
    label: en.stockHistory.buyerStatusSame,
    warning: "",
  }
}

export function canGenerateCombinedGstInvoice(rows: HistoryRow[]) {
  const saleRows = rows.filter((row) => row.logType === "out" && row.reason.toLowerCase() === "sold")
  return (
    rows.length > 0 &&
    saleRows.length === rows.length &&
    hasSingleBuyer(saleRows) &&
    Boolean(saleRows[0]?.buyerName?.trim())
  )
}

export function getBuyerMismatchWarning(rows: HistoryRow[]) {
  return getBuyerSelectionState(rows).warning
}

export function buildGroupedPrintDocument(
  rows: HistoryRow[],
  seller?: BusinessDocumentProfile
): TransactionDocumentData {
  const total = rows.reduce((sum, row) => sum + (row.amount || row.price * row.quantity), 0)
  const buyerState = getBuyerSelectionState(rows)
  const grouped = groupTransactionsByBuyer(rows)

  const buyerSummary = Array.from(grouped.values())
    .map((group) => {
      const first = group[0]
      const name = first?.buyerName?.trim() || en.stockHistory.labels.buyerUnavailable
      const groupTotal = group.reduce((sum, row) => sum + Number(row.amount || row.price * row.quantity), 0)
      return `${name}: ${formatCurrency(groupTotal)}`
    })
    .join(" | ")

  return {
    type: "stock-adjustment" as TransactionDocumentData["type"],
    title: en.stockHistory.labels.selectedStockHistory,
    reference: `HIS-${Date.now()}`,
    date: formatIndianDateTime(new Date()),
    seller: seller ?? ({} as BusinessDocumentProfile),
    partyLabel: en.stockHistory.labels.buyerSummary,
    party: {
      name:
        buyerState.code === "single"
          ? rows.find((row) => row.buyerName?.trim())?.buyerName || en.stockHistory.labels.na
          : en.stockHistory.labels.multipleBuyers,
    },
    items: rows.map((row) => ({
      name: toTitleCase(row.productName),
      description: [
        row.category,
        `${en.stockHistory.labels.buyer}: ${row.buyerName || en.stockHistory.labels.buyerUnavailable}`,
        row.invoiceReceiptNo ? `${en.receipt.ref}: ${row.invoiceReceiptNo}` : "",
        row.oldStock !== undefined && row.newStock !== undefined ? `${en.stockHistory.labels.stock}: ${row.oldStock} -> ${row.newStock}` : "",
        row.expiry ? `${en.inventory.expiry}: ${row.expiry}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
      quantity: formatQuantity(row.quantity, row.quantityUnit),
      rate: row.price,
      total: row.amount || row.price * row.quantity,
      note: [row.note, row.gstAmount ? `${en.transaction.totalGst}: ${formatCurrency(row.gstAmount)}` : ""]
        .filter(Boolean)
        .join(" | "),
    })),
    totals: {
      grandTotal: total,
      totalGst: rows.reduce((sum, row) => sum + Number(row.gstAmount || 0), 0),
    },
    notes: buyerSummary || undefined,
    footerNote: `${en.stockHistory.labels.printedOn}: ${formatIndianDateTime(new Date())}`,
  }
}

export function printRows(rows: HistoryRow[], seller?: BusinessDocumentProfile) {
  return printTransactionDocument(buildGroupedPrintDocument(rows, seller))
}

export function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1))
}
