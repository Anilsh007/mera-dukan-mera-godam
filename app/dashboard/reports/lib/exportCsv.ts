import type { ReportSummary } from "../types"
import { en } from "@/app/messages/en"
import { buildDelimitedRows, buildExcelTableHtml, downloadTextFile, printRows, todayStamp } from "@/app/lib/export.utils"

export function exportReportCsv(report: ReportSummary) {
  downloadTextFile(buildDelimitedRows(buildReportRows(report), ","), `reports-summary-${todayStamp()}.csv`, "text/csv;charset=utf-8")
}

export function exportReportExcel(report: ReportSummary) {
  downloadTextFile(buildExcelTableHtml(buildReportRows(report)), `reports-summary-${todayStamp()}.xls`, "application/vnd.ms-excel;charset=utf-8")
}

export function printReportSummary(report: ReportSummary) {
  return printRows(buildReportRows(report), en.share.reportTitle, {
    title: en.reports.title,
    value: en.gstInvoice.total,
  })
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
