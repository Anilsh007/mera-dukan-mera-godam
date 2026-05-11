import { formatQuantity } from "@/app/lib/quantityUnit"
import type { HistoryRow } from "./stock-history.types"
import { en } from "@/app/messages/en"

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
  return new Date(value).toISOString().slice(0, 10)
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

export function printRows(rows: HistoryRow[]) {
  const printWindow = window.open("", "_blank", "width=900,height=700")
  if (!printWindow) return

  const total = rows.reduce((sum, row) => sum + row.price * row.quantity, 0)
  const uniqueBuyers = Array.from(new Set(rows.map((row) => row.buyerName).filter(Boolean)))

  printWindow.document.write(`
    <html>
      <head>
        <title>${en.stockHistory.labels.selectedStockHistory}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
          th { background: #f3f4f6; }
          .meta { margin-top: 6px; color: #4b5563; font-size: 14px; }
          .total { margin-top: 18px; text-align: right; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <h2>${en.stockHistory.labels.selectedStockHistory}</h2>
        <div class="meta">${en.stockHistory.labels.printedOn}: ${new Date().toLocaleString("en-IN")}</div>
        <div class="meta">${en.stockHistory.labels.buyer}: ${uniqueBuyers.length === 1 ? uniqueBuyers[0] : uniqueBuyers.length ? en.stockHistory.labels.multipleBuyers : en.stockHistory.labels.na}</div>
        <table>
          <tr>
            <th>Date</th>
            <th>${en.stockHistory.item}</th>
            <th>${en.stockHistory.labels.category}</th>
            <th>${en.stockHistory.labels.buyerReason}</th>
            <th>${en.stockHistory.labels.qty}</th>
            <th>${en.inventory.rate}</th>
            <th>${en.purchases.total}</th>
          </tr>
          ${rows
            .map(
              (row) => `
            <tr>
              <td>${formatDateTime(row.date)}</td>
              <td>${toTitleCase(row.productName)}</td>
              <td>${row.category}</td>
              <td>${row.buyerName || row.reason}</td>
              <td>${formatQuantity(row.quantity, row.quantityUnit)}</td>
              <td>Rs ${row.price.toFixed(2)}</td>
              <td>Rs ${(row.price * row.quantity).toFixed(2)}</td>
            </tr>`
            )
            .join("")}
        </table>
        <div class="total">${en.stockHistory.labels.grandTotal}: Rs ${total.toFixed(2)}</div>
        <script>window.print();</script>
      </body>
    </html>
  `)

  printWindow.document.close()
}

export function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1))
}
