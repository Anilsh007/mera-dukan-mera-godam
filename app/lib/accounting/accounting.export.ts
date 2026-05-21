"use client"

import { en } from "@/app/messages/en"
import { formatIndianDateTime } from "@/app/lib/formatters"
import { buildDelimitedRows, buildExcelTableHtml, downloadTextFile, printRows, todayStamp, type ExportRow } from "@/app/lib/export.utils"

export type AccountingExportRow = ExportRow

export function exportAccountingCsv(rows: AccountingExportRow[], filenamePrefix: string) {
  downloadTextFile(buildDelimitedRows(rows, ","), `${filenamePrefix}-${todayStamp()}.csv`, "text/csv;charset=utf-8")
}

export function exportAccountingExcel(rows: AccountingExportRow[], filenamePrefix: string) {
  downloadTextFile(buildExcelTableHtml(rows), `${filenamePrefix}-${todayStamp()}.xls`, "application/vnd.ms-excel;charset=utf-8")
}

export function printAccountingRows(rows: AccountingExportRow[], title: string) {
  return printRows(rows, title)
}

export function buildRowsShareMessage(rows: AccountingExportRow[], title: string) {
  const [header = [], ...body] = rows
  return [
    en.common.appName,
    title,
    formatIndianDateTime(new Date()),
    "",
    ...body.slice(0, 30).map((row) => row.map((cell, index) => `${header[index] || ""}: ${cell}`).join(" | ")),
    body.length > 30 ? en.accounting.shareLimitedRows : "",
    "",
    en.share.footerNote,
  ].filter(Boolean).join("\n")
}
