"use client"

import { escapePrintHtml } from "@/app/lib/print"
import { formatIndianDateTime } from "@/app/lib/formatters"
import { buildBusinessDocumentProfile, printTransactionDocument, type TransactionDocumentData } from "@/app/lib/transactionDocument"
import { en } from "@/app/messages/en"

export type ExportCell = string | number
export type ExportRow = ExportCell[]

export function todayStamp() {
  return new Date().toISOString().slice(0, 10)
}

export function quoteDelimitedCell(value: ExportCell, delimiter: string) {
  const text = String(value).replaceAll('"', '""')
  return text.includes(delimiter) || text.includes("\n") ? `"${text}"` : text
}

export function buildDelimitedRows(rows: ExportRow[], delimiter = ",") {
  return rows.map((row) => row.map((cell) => quoteDelimitedCell(cell, delimiter)).join(delimiter)).join("\n")
}

export function downloadTextFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function buildExcelTableHtml(rows: ExportRow[]) {
  return `<!doctype html><html><head><meta charset="utf-8" /></head><body><table>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapePrintHtml(cell)}</td>`).join("")}</tr>`)
    .join("")}</table></body></html>`
}

export function buildPrintableRowsHtml(rows: ExportRow[], title: string, labels?: { title?: string; value?: string }) {
  const [header = [], ...body] = rows
  const headerHtml = labels
    ? `<tr><th>${escapePrintHtml(labels.title)}</th><th>${escapePrintHtml(labels.value)}</th></tr>`
    : `<tr>${header.map((cell) => `<th>${escapePrintHtml(cell)}</th>`).join("")}</tr>`
  const bodyHtml = labels
    ? body.map((row) => `<tr><td>${escapePrintHtml(row[0])}</td><td>${escapePrintHtml(row[1])}</td></tr>`).join("")
    : body.map((row) => `<tr>${row.map((cell) => `<td>${escapePrintHtml(cell)}</td>`).join("")}</tr>`).join("")

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapePrintHtml(title)}</title>
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
  <h1>${escapePrintHtml(title)}</h1>
  <p>${escapePrintHtml(formatIndianDateTime(new Date()))}</p>
  <table>
    <thead>${headerHtml}</thead>
    <tbody>${bodyHtml}</tbody>
  </table>
</body>
</html>`
}

export function printRows(rows: ExportRow[], title: string, labels?: { title?: string; value?: string }) {
  const document = buildRowsTransactionDocument(rows, title, labels)
  return printTransactionDocument(document)
}

export function buildRowsTransactionDocument(rows: ExportRow[], title: string, labels?: { title?: string; value?: string }): TransactionDocumentData {
  const [header = [], ...body] = rows
  const items = body.map((row, index) => {
    const itemName = labels ? String(row[0] ?? `${en.gstInvoice.details} ${index + 1}`) : String(row[0] ?? header[0] ?? `${en.gstInvoice.details} ${index + 1}`)
    const description = labels
      ? `${labels.value || en.gstInvoice.total}: ${row[1] ?? ""}`
      : row.map((cell, cellIndex) => `${header[cellIndex] || `${en.gstInvoice.details} ${cellIndex + 1}`}: ${cell}`).join(" | ")
    return {
      name: itemName,
      description,
      quantity: 1,
      total: 0,
    }
  })

  return {
    type: "report",
    title,
    reference: todayStamp(),
    date: formatIndianDateTime(new Date()),
    seller: buildBusinessDocumentProfile(),
    partyLabel: en.share.reportTitle,
    party: { name: title },
    items: items.length ? items : [{ name: en.common.notAvailable, quantity: 1, total: 0 }],
    totals: {},
    footerNote: en.share.footerNote,
  }
}
