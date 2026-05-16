import { Download, FileSpreadsheet, Printer } from "lucide-react"
import Button from "@/app/components/ui/Button"
import PageHeader from "@/app/components/ui/PageHeader"
import { en } from "@/app/messages/en"
import type { DateRangeKey, ReportSummary } from "../types"
import { RANGE_OPTIONS } from "../lib/dateRange"
import { exportReportCsv, exportReportExcel, printReportSummary } from "../lib/exportCsv"
import ShareActions from "@/app/components/ui/ShareActions"
import { notify as toast } from "@/app/lib/notifications"
import { buildReportShareMessage } from "@/app/lib/share"
import { formatMoney, formatNumber } from "../lib/format"

type ReportsHeaderProps = {
  rangeKey: DateRangeKey
  onRangeChange: (rangeKey: DateRangeKey) => void
  report: ReportSummary
}

export default function ReportsHeader({ rangeKey, onRangeChange, report }: ReportsHeaderProps) {
  const hasReportData =
    report.productCount > 0 ||
    report.purchaseCount > 0 ||
    report.invoiceCount > 0 ||
    report.periodSales > 0 ||
    report.inventoryValue > 0 ||
    report.recentTransactions.length > 0

  const reportShareMessage = buildReportShareMessage([
    [en.reports.inventoryValue, formatMoney(report.inventoryValue)],
    [en.reports.salesInPeriod, formatMoney(report.periodSales)],
    [en.dashboard.unitsSoldSuffix, formatNumber(report.periodUnitsSold)],
    [en.reports.todaySale, formatMoney(report.todaySales)],
    [en.reports.todayPurchase, formatMoney(report.todayPurchase)],
    [en.reports.monthlySale, formatMoney(report.monthlySales)],
    [en.reports.monthlyPurchase, formatMoney(report.monthlyPurchase)],
    [en.reports.gstCollected, formatMoney(report.gstCollected)],
    [en.reports.gstPaid, formatMoney(report.gstPaid)],
    [en.reports.supplierDue, formatMoney(report.supplierDue)],
    [en.reports.lowCriticalStock, report.lowStockCount],
    [en.reports.expiryRisk, report.expiryRiskCount],
  ])

  const handleExportCsv = () => {
    if (!hasReportData) {
      toast.warning(en.reports.noData)
      return
    }
    try {
      exportReportCsv(report)
      toast.success(en.notifications.exportCompleted)
    } catch (error) {
      console.error("Report CSV export failed", error)
      toast.error(en.share.downloadFailed)
    }
  }

  const handleExportExcel = () => {
    if (!hasReportData) {
      toast.warning(en.reports.noData)
      return
    }
    try {
      exportReportExcel(report)
      toast.success(en.notifications.exportCompleted)
    } catch (error) {
      console.error("Report Excel export failed", error)
      toast.error(en.share.downloadFailed)
    }
  }

  const handlePrint = () => {
    if (!hasReportData) {
      toast.warning(en.reports.noData)
      return
    }
    try {
      const printed = printReportSummary(report)
      if (printed) toast.success(en.print.printStarted)
      else toast.error(en.print.popupBlocked)
    } catch (error) {
      console.error("Report print failed", error)
      toast.error(en.print.printFailed)
    }
  }

  return (
    <PageHeader
      eyebrow={en.reports.businessIntelligence}
      title={en.pages.reportsTitle}
      description={`${en.pages.reportsDescription} ${en.reports.headerExtraDescription}`}
      actions={
        <>
          <div className="w-full overflow-x-auto rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-1 shadow-[var(--shadow-card)] sm:w-auto" aria-label={en.reports.rangeLabel}>
            <div className="flex min-w-max gap-1">
              {RANGE_OPTIONS.map((range) => (
                <button
                  key={range.key}
                  type="button"
                  onClick={() => onRangeChange(range.key)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                    rangeKey === range.key
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/10"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          <ShareActions
            message={hasReportData ? reportShareMessage : ""}
            subject={en.share.reportTitle}
            filename={`reports-summary-${rangeKey}.txt`}
            showPrint={false}
            className="w-full sm:w-auto"
          />
          <div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-3 sm:w-auto sm:flex sm:flex-wrap">
            <Button type="button" onClick={handleExportCsv} variant="black" title={en.reports.exportCsv} icon={<Download size={16} />} className="w-full sm:w-auto" />
            <Button type="button" onClick={handleExportExcel} variant="outline" title={en.reports.exportExcel} icon={<FileSpreadsheet size={16} />} className="w-full sm:w-auto" />
            <Button type="button" onClick={handlePrint} variant="outline" title={en.reports.printOrPdf} icon={<Printer size={16} />} className="w-full sm:w-auto" />
          </div>
        </>
      }
    />
  )
}
