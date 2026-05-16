import type { ReportSummary } from "../types"
import { en } from "@/app/messages/en"

export function exportReportCsv(report: ReportSummary) {
  downloadTextFile(buildDelimitedReport(report, ","), `reports-summary-${todayStamp()}.csv`, "text/csv;charset=utf-8")
}

export function exportReportExcel(report: ReportSummary) {
  const rows = buildReportRows(report)
  const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`)
    .join("")}</table></body></html>`
  downloadTextFile(html, `reports-summary-${todayStamp()}.xls`, "application/vnd.ms-excel;charset=utf-8")
}

export function printReportSummary(report: ReportSummary) {
  const rows = buildReportRows(report)
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(en.share.reportTitle)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    p { color: #4b5563; margin-top: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
    th { background: #f3f4f6; }
  </style>
</head>
<body>
  <h1>${escapeHtml(en.share.reportTitle)}</h1>
  <p>${escapeHtml(new Date().toLocaleString("en-IN"))}</p>
  <table>
    <thead><tr><th>${escapeHtml(en.reports.title)}</th><th>${escapeHtml(en.gstInvoice.total)}</th></tr></thead>
    <tbody>${rows.slice(1).map((row) => `<tr><td>${escapeHtml(String(row[0]))}</td><td>${escapeHtml(String(row[1]))}</td></tr>`).join("")}</tbody>
  </table>
</body>
</html>`
  const printWindow = window.open("", "_blank")
  if (!printWindow) return false
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  return true
}

function buildDelimitedReport(report: ReportSummary, delimiter: string) {
  return buildReportRows(report)
    .map((row) => row.map((cell) => quoteCell(cell, delimiter)).join(delimiter))
    .join("\n")
}

function buildReportRows(report: ReportSummary) {
  return [
    [en.reports.title, en.gstInvoice.total],
    [en.reports.inventoryValue, report.inventoryValue],
    [en.dashboard.totalProducts, report.productCount],
    [en.reports.salesInPeriod, report.periodSales],
    [en.dashboard.unitsSoldSuffix, report.periodUnitsSold],
    [en.reports.todaySale, report.todaySales],
    [en.reports.todayPurchase, report.todayPurchase],
    [en.reports.monthlySale, report.monthlySales],
    [en.reports.monthlyPurchase, report.monthlyPurchase],
    [en.reports.gstBilled, report.invoiceTotal],
    [en.reports.gstCollected, report.gstCollected],
    [en.reports.gstPaid, report.gstPaid],
    [en.reports.purchaseValue, report.purchaseTotal],
    [en.reports.supplierDue, report.supplierDue],
    [en.reports.lowCriticalStock, report.lowStockCount],
    [en.reports.criticalStock, report.criticalStockCount],
    [en.reports.outOfStock, report.outOfStockCount],
    [en.reports.expiryRisk, report.expiryRiskCount],
    [en.reports.estimatedMargin, report.estimatedMargin],
  ]
}

function quoteCell(value: string | number, delimiter: string) {
  const text = String(value).replaceAll('"', '""')
  return text.includes(delimiter) || text.includes("\n") ? `"${text}"` : `"${text}"`
}

function downloadTextFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10)
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}
