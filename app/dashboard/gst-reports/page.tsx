"use client"

import { useMemo, useState } from "react"
import { Download, FileSpreadsheet, FileText, Printer, ReceiptText, ShieldAlert } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import SelectField from "@/app/components/ui/SelectField"
import PageHeader from "@/app/components/ui/PageHeader"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import SummaryCard from "@/app/components/ui/SummaryCard"
import useFeatureGate from "@/app/hooks/useFeatureGate"
import useGstReportsData from "@/app/hooks/useGstReportsData"
import { buildRowsShareMessage, type AccountingExportRow } from "@/app/lib/accounting/accounting.export"
import { runAccountingExport, type AccountingExportKind } from "@/app/lib/accounting/accounting.exportActions"
import {
  buildCaExportRows,
  buildGstRegisterExportRows,
  buildGstReportsSummary,
  buildGstSummaryExportRows,
  buildHsnExportRows,
  buildPartySummaryExportRows,
  formatDate,
  formatGstMoney,
  getSourceLabel,
  type GstRegisterLine,
  type GstSummaryLine,
  type HsnSummaryRow,
  type PartyGstSummaryRow,
} from "@/app/lib/gstReports/gstReports.utils"
import { notify as toast } from "@/app/lib/notifications"
import { en } from "@/app/messages/en"

type PeriodMode = "month" | "quarter" | "custom"
type ReportKind = "sales" | "purchase" | "hsn" | "b2b" | "b2c" | "gstr1" | "gstr3b" | "collectedPaid" | "ca"
type ExportKind = AccountingExportKind

export default function GstReportsPage() {
  const { data, loading } = useGstReportsData()
  const reportGate = useFeatureGate("reports")
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month")
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [quarter, setQuarter] = useState(() => getCurrentQuarterValue())
  const [fromDate, setFromDate] = useState(() => startOfMonth(new Date()).toISOString().slice(0, 10))
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [activeReport, setActiveReport] = useState<ReportKind>("sales")

  const range = useMemo(
    () => resolveRange({ periodMode, month, quarter, fromDate, toDate }),
    [fromDate, month, periodMode, quarter, toDate],
  )

  const summary = useMemo(
    () => buildGstReportsSummary({ ...data, range }),
    [data, range],
  )

  const activeRows = useMemo(() => buildRowsForReport(activeReport, summary), [activeReport, summary])
  const shareMessage = buildRowsShareMessage(activeRows.slice(0, 40), getReportTitle(activeReport))
  const noData = !summary.salesRegister.length && !summary.purchaseRegister.length && !summary.hsnSummary.length

  const runExport = async (kind: ExportKind, reportKind = activeReport) => {
    const rows = buildRowsForReport(reportKind, summary)
    if (!rows.length || rows.length === 1) {
      toast.warning(en.gstReports.noReportData)
      return
    }

    await runAccountingExport({
      kind,
      rows,
      filenamePrefix: getReportFilename(reportKind),
      title: getReportTitle(reportKind),
      errorLabel: en.gstReports.exportFailed,
    })
  }

  if (!reportGate.loading && !reportGate.allowed) {
    return (
      <main className="space-y-5 p-3 sm:p-4 lg:p-6">
        <PageHeader title={en.gstReports.title} description={en.gstReports.description} />
        <section className="premium-surface rounded-3xl p-6 text-center">
          <ShieldAlert className="mx-auto mb-3 text-amber-500" size={36} />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{en.subscription.subscriptionRequired}</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{en.subscription.premiumActionRequiresUpgrade}</p>
        </section>
      </main>
    )
  }

  return (
    <main className="space-y-5 p-3 sm:p-4 lg:p-6">
      <PageHeader
        title={en.gstReports.title}
        description={en.gstReports.description}
        actions={<TransactionActionPanel message={shareMessage} subject={getReportTitle(activeReport)} filename="gst-report-summary.pdf" showPrint={false} />}
      />

      <section className="rounded-3xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-bold">{en.gstReports.disclaimerTitle}</p>
            <p className="mt-1">{en.gstReports.officialIntegrationDisclaimer}</p>
            <p className="mt-1">{en.gstReports.placeholderDisclaimer}</p>
          </div>
        </div>
      </section>

      <section className="premium-surface rounded-3xl p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[180px_1fr_auto] lg:items-end">
          <SelectField
            label={en.gstReports.periodType}
            value={periodMode}
            onChange={(event) => setPeriodMode(event.target.value as PeriodMode)}
            options={[
              { value: "month", label: en.gstReports.monthly },
              { value: "quarter", label: en.gstReports.quarterly },
              { value: "custom", label: en.gstReports.customRange },
            ]}
          />

          {periodMode === "month" ? (
            <Input label={en.gstReports.month} type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          ) : periodMode === "quarter" ? (
            <SelectField
              label={en.gstReports.quarter}
              value={quarter}
              onChange={(event) => setQuarter(event.target.value)}
              options={buildQuarterOptions()}
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <Input label={en.download.fromDate} type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
              <Input label={en.download.toDate} type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="black" icon={<Download size={16} />} title={en.reports.exportCsv} onClick={() => void runExport("csv")} disabled={loading || noData} />
            <Button type="button" variant="outline" icon={<FileSpreadsheet size={16} />} title={en.reports.exportExcel} onClick={() => void runExport("excel")} disabled={loading || noData} />
            <Button type="button" variant="outline" icon={<Printer size={16} />} title={en.gstReports.printPdf} onClick={() => void runExport("print")} disabled={loading || noData} />
            <Button type="button" variant="secondary" icon={<FileText size={16} />} title={en.gstReports.caExport} onClick={() => void runExport("excel", "ca")} disabled={loading || noData} />
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          {en.gstReports.rangeShowing.replace("{from}", formatDate(range.from)).replace("{to}", formatDate(range.to))}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label={en.gstReports.gstCollected} value={formatGstMoney(summary.totals.gstCollected)} icon={<ReceiptText size={18} />} />
        <SummaryCard label={en.gstReports.gstPaid} value={formatGstMoney(summary.totals.gstPaid)} icon={<ReceiptText size={18} />} />
        <SummaryCard label={en.gstReports.netGstPayable} value={formatGstMoney(summary.totals.netGstPayable)} icon={<ReceiptText size={18} />} />
        <SummaryCard label={en.gstReports.hsnSummary} value={String(summary.hsnSummary.length)} icon={<FileSpreadsheet size={18} />} />
      </section>

      <section className="premium-surface rounded-3xl p-3 sm:p-4">
        <div className="mobile-safe-table">
          <div className="flex min-w-max gap-2 pb-2">
            {REPORT_TABS.map((tab) => (
              <Button
                key={tab.kind}
                type="button"
                variant={activeReport === tab.kind ? "primary" : "outline"}
                title={tab.label}
                onClick={() => setActiveReport(tab.kind)}
                className="whitespace-nowrap"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="premium-surface space-y-4 rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{getReportTitle(activeReport)}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{getReportDescription(activeReport)}</p>
          </div>
          <p className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
            {activeRows.length > 1 ? `${activeRows.length - 1} ${en.gstReports.rows}` : en.gstReports.noRows}
          </p>
        </div>

        {activeReport === "sales" && <RegisterTable rows={summary.salesRegister} emptyText={en.gstReports.noSalesRegister} />}
        {activeReport === "purchase" && <RegisterTable rows={summary.purchaseRegister} emptyText={en.gstReports.noPurchaseRegister} />}
        {activeReport === "hsn" && <HsnTable rows={summary.hsnSummary} />}
        {activeReport === "b2b" && <PartySummaryTable rows={summary.b2bSummary} emptyText={en.gstReports.noB2bData} />}
        {activeReport === "b2c" && <PartySummaryTable rows={summary.b2cSummary} emptyText={en.gstReports.noB2cData} />}
        {activeReport === "gstr1" && <SummaryLineTable rows={summary.gstr1Summary} />}
        {activeReport === "gstr3b" && <SummaryLineTable rows={summary.gstr3bSummary} />}
        {activeReport === "collectedPaid" && <SummaryLineTable rows={summary.collectedPaidSummary} />}
        {activeReport === "ca" && <CaExportPreview rows={buildCaExportRows(summary)} />}
      </section>
    </main>
  )
}

const REPORT_TABS: Array<{ kind: ReportKind; label: string }> = [
  { kind: "sales", label: en.gstReports.salesRegister },
  { kind: "purchase", label: en.gstReports.purchaseRegister },
  { kind: "hsn", label: en.gstReports.hsnSummary },
  { kind: "b2b", label: en.gstReports.b2bSummary },
  { kind: "b2c", label: en.gstReports.b2cSummary },
  { kind: "gstr1", label: en.gstReports.gstr1Summary },
  { kind: "gstr3b", label: en.gstReports.gstr3bSummary },
  { kind: "collectedPaid", label: en.gstReports.gstCollectedPaidSummary },
  { kind: "ca", label: en.gstReports.caExport },
]

function RegisterTable({ rows, emptyText }: { rows: GstRegisterLine[]; emptyText: string }) {
  if (!rows.length) return <EmptyReport text={emptyText} />
  return (
    <div className="mobile-safe-table">
      <table className="w-full min-w-[980px] border-collapse text-sm">
        <thead className="bg-[var(--surface-subtle)] text-left text-xs uppercase text-[var(--text-muted)]">
          <tr>
            <th className="px-3 py-3">{en.gstReports.documentNo}</th>
            <th className="px-3 py-3">{en.gstReports.date}</th>
            <th className="px-3 py-3">{en.gstReports.source}</th>
            <th className="px-3 py-3">{en.gstReports.party}</th>
            <th className="px-3 py-3">{en.gstInvoice.hsnSac}</th>
            <th className="px-3 py-3 text-right">{en.gstInvoice.taxableValue}</th>
            <th className="px-3 py-3 text-right">{en.transaction.totalGst}</th>
            <th className="px-3 py-3 text-right">{en.reports.total}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-card)]">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-[var(--surface-subtle)]">
              <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{row.documentNo}</td>
              <td className="px-3 py-3 text-[var(--text-secondary)]">{formatDate(row.date)}</td>
              <td className="px-3 py-3 text-[var(--text-secondary)]">{getSourceLabel(row.source)}</td>
              <td className="px-3 py-3 text-[var(--text-secondary)]">
                <span className="block font-medium text-[var(--text-primary)]">{row.partyName}</span>
                <span className="text-xs text-[var(--text-muted)]">{row.gstin || en.gstReports.noGstin}</span>
              </td>
              <td className="px-3 py-3 text-[var(--text-secondary)]">
                <span className="block">{row.hsnCode || en.gstReports.unclassifiedHsn}</span>
                <span className="text-xs text-[var(--text-muted)]">{row.itemName}</span>
              </td>
              <td className="px-3 py-3 text-right font-medium">{formatGstMoney(row.taxableAmount)}</td>
              <td className="px-3 py-3 text-right font-medium">{formatGstMoney(row.gstAmount)}</td>
              <td className="px-3 py-3 text-right font-bold text-[var(--text-primary)]">{formatGstMoney(row.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HsnTable({ rows }: { rows: HsnSummaryRow[] }) {
  if (!rows.length) return <EmptyReport text={en.gstReports.noHsnData} />
  return (
    <div className="mobile-safe-table">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead className="bg-[var(--surface-subtle)] text-left text-xs uppercase text-[var(--text-muted)]">
          <tr>
            <th className="px-3 py-3">{en.gstInvoice.hsnSac}</th>
            <th className="px-3 py-3 text-right">{en.gstReports.qty}</th>
            <th className="px-3 py-3 text-right">{en.gstReports.outwardTaxable}</th>
            <th className="px-3 py-3 text-right">{en.gstReports.outwardGst}</th>
            <th className="px-3 py-3 text-right">{en.gstReports.inwardTaxable}</th>
            <th className="px-3 py-3 text-right">{en.gstReports.inwardGst}</th>
            <th className="px-3 py-3 text-right">{en.gstReports.netGst}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-card)]">
          {rows.map((row) => (
            <tr key={row.hsnCode} className="hover:bg-[var(--surface-subtle)]">
              <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{row.hsnCode}</td>
              <td className="px-3 py-3 text-right">{row.quantity}</td>
              <td className="px-3 py-3 text-right">{formatGstMoney(row.outwardTaxable)}</td>
              <td className="px-3 py-3 text-right">{formatGstMoney(row.outwardGst)}</td>
              <td className="px-3 py-3 text-right">{formatGstMoney(row.inwardTaxable)}</td>
              <td className="px-3 py-3 text-right">{formatGstMoney(row.inwardGst)}</td>
              <td className="px-3 py-3 text-right font-bold">{formatGstMoney(row.netGst)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PartySummaryTable({ rows, emptyText }: { rows: PartyGstSummaryRow[]; emptyText: string }) {
  if (!rows.length) return <EmptyReport text={emptyText} />
  return (
    <div className="mobile-safe-table">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead className="bg-[var(--surface-subtle)] text-left text-xs uppercase text-[var(--text-muted)]">
          <tr>
            <th className="px-3 py-3">{en.gstReports.party}</th>
            <th className="px-3 py-3">{en.gstInvoice.gstin}</th>
            <th className="px-3 py-3 text-right">{en.gstReports.documentCount}</th>
            <th className="px-3 py-3 text-right">{en.gstInvoice.taxableValue}</th>
            <th className="px-3 py-3 text-right">{en.transaction.totalGst}</th>
            <th className="px-3 py-3 text-right">{en.reports.total}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-card)]">
          {rows.map((row) => (
            <tr key={`${row.gstin || row.partyName}:${row.totalAmount}`} className="hover:bg-[var(--surface-subtle)]">
              <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{row.partyName}</td>
              <td className="px-3 py-3 text-[var(--text-secondary)]">{row.gstin || en.gstReports.noGstin}</td>
              <td className="px-3 py-3 text-right">{row.documentCount}</td>
              <td className="px-3 py-3 text-right">{formatGstMoney(row.taxableAmount)}</td>
              <td className="px-3 py-3 text-right">{formatGstMoney(row.gstAmount)}</td>
              <td className="px-3 py-3 text-right font-bold">{formatGstMoney(row.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SummaryLineTable({ rows }: { rows: GstSummaryLine[] }) {
  if (!rows.length) return <EmptyReport text={en.gstReports.noReportData} />
  return (
    <div className="mobile-safe-table">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead className="bg-[var(--surface-subtle)] text-left text-xs uppercase text-[var(--text-muted)]">
          <tr>
            <th className="px-3 py-3">{en.gstReports.particulars}</th>
            <th className="px-3 py-3 text-right">{en.gstInvoice.taxableValue}</th>
            <th className="px-3 py-3 text-right">{en.gstInvoice.cgst}</th>
            <th className="px-3 py-3 text-right">{en.gstInvoice.sgstUtgst}</th>
            <th className="px-3 py-3 text-right">{en.gstInvoice.igst}</th>
            <th className="px-3 py-3 text-right">{en.transaction.totalGst}</th>
            <th className="px-3 py-3 text-right">{en.reports.total}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-card)]">
          {rows.map((row) => (
            <tr key={row.label} className="hover:bg-[var(--surface-subtle)]">
              <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{row.label}</td>
              <td className="px-3 py-3 text-right">{formatGstMoney(row.taxableAmount)}</td>
              <td className="px-3 py-3 text-right">{formatGstMoney(row.cgstAmount)}</td>
              <td className="px-3 py-3 text-right">{formatGstMoney(row.sgstAmount)}</td>
              <td className="px-3 py-3 text-right">{formatGstMoney(row.igstAmount)}</td>
              <td className="px-3 py-3 text-right">{formatGstMoney(row.gstAmount)}</td>
              <td className="px-3 py-3 text-right font-bold">{formatGstMoney(row.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CaExportPreview({ rows }: { rows: AccountingExportRow[] }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-input)] bg-[var(--surface-subtle)] p-5 text-sm text-[var(--text-secondary)]">
      <p className="font-semibold text-[var(--text-primary)]">{en.gstReports.caExportTitle}</p>
      <p className="mt-2">{en.gstReports.caExportHelp}</p>
      <p className="mt-2">{en.gstReports.caExportRows.replace("{count}", String(rows.length))}</p>
    </div>
  )
}

function EmptyReport({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-[var(--border-input)] p-8 text-center text-sm text-[var(--text-secondary)]">{text}</p>
}

function buildRowsForReport(reportKind: ReportKind, summary: ReturnType<typeof buildGstReportsSummary>) {
  if (reportKind === "sales") return buildGstRegisterExportRows(summary.salesRegister, en.gstReports.salesRegister)
  if (reportKind === "purchase") return buildGstRegisterExportRows(summary.purchaseRegister, en.gstReports.purchaseRegister)
  if (reportKind === "hsn") return buildHsnExportRows(summary.hsnSummary)
  if (reportKind === "b2b") return buildPartySummaryExportRows(summary.b2bSummary, en.gstReports.b2bSummary)
  if (reportKind === "b2c") return buildPartySummaryExportRows(summary.b2cSummary, en.gstReports.b2cSummary)
  if (reportKind === "gstr1") return buildGstSummaryExportRows(summary.gstr1Summary, en.gstReports.gstr1Summary)
  if (reportKind === "gstr3b") return buildGstSummaryExportRows(summary.gstr3bSummary, en.gstReports.gstr3bSummary)
  if (reportKind === "collectedPaid") return buildGstSummaryExportRows(summary.collectedPaidSummary, en.gstReports.gstCollectedPaidSummary)
  return buildCaExportRows(summary)
}

function getReportTitle(reportKind: ReportKind) {
  const tab = REPORT_TABS.find((item) => item.kind === reportKind)
  return tab?.label || en.gstReports.title
}

function getReportDescription(reportKind: ReportKind) {
  const descriptions: Record<ReportKind, string> = {
    sales: en.gstReports.salesRegisterDescription,
    purchase: en.gstReports.purchaseRegisterDescription,
    hsn: en.gstReports.hsnSummaryDescription,
    b2b: en.gstReports.b2bSummaryDescription,
    b2c: en.gstReports.b2cSummaryDescription,
    gstr1: en.gstReports.gstr1Description,
    gstr3b: en.gstReports.gstr3bDescription,
    collectedPaid: en.gstReports.collectedPaidDescription,
    ca: en.gstReports.caExportHelp,
  }
  return descriptions[reportKind]
}

function getReportFilename(reportKind: ReportKind) {
  const filenames: Record<ReportKind, string> = {
    sales: "gst-sales-register",
    purchase: "gst-purchase-register",
    hsn: "gst-hsn-summary",
    b2b: "gst-b2b-summary",
    b2c: "gst-b2c-summary",
    gstr1: "gstr-1-style-summary",
    gstr3b: "gstr-3b-style-summary",
    collectedPaid: "gst-collected-paid-summary",
    ca: "ca-gst-export",
  }
  return filenames[reportKind]
}

function resolveRange({ periodMode, month, quarter, fromDate, toDate }: { periodMode: PeriodMode; month: string; quarter: string; fromDate: string; toDate: string }) {
  if (periodMode === "month") {
    const [year, monthIndex] = month.split("-").map(Number)
    const first = new Date(year, monthIndex - 1, 1)
    const last = new Date(year, monthIndex, 0)
    return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) }
  }

  if (periodMode === "quarter") {
    const [yearText, quarterText] = quarter.split("-Q")
    const fiscalYear = Number(yearText)
    const quarterNumber = Number(quarterText)
    const startMonthByQuarter: Record<number, number> = { 1: 3, 2: 6, 3: 9, 4: 0 }
    const startMonth = startMonthByQuarter[quarterNumber] ?? 3
    const calendarYear = quarterNumber === 4 ? fiscalYear + 1 : fiscalYear
    const first = new Date(calendarYear, startMonth, 1)
    const last = new Date(calendarYear, startMonth + 3, 0)
    return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) }
  }

  return fromDate <= toDate ? { from: fromDate, to: toDate } : { from: toDate, to: fromDate }
}

function buildQuarterOptions() {
  const currentFiscalYear = getCurrentFiscalYear(new Date())
  const years = [currentFiscalYear, currentFiscalYear - 1]
  return years.flatMap((year) => [1, 2, 3, 4].map((quarterNumber) => ({
    value: `${year}-Q${quarterNumber}`,
    label: `${year} ${getQuarterLabel(quarterNumber)}`,
  })))
}

function getQuarterLabel(quarterNumber: number) {
  if (quarterNumber === 1) return en.gstReports.quarterQ1
  if (quarterNumber === 2) return en.gstReports.quarterQ2
  if (quarterNumber === 3) return en.gstReports.quarterQ3
  return en.gstReports.quarterQ4
}

function getCurrentQuarterValue() {
  const today = new Date()
  const fiscalYear = getCurrentFiscalYear(today)
  const month = today.getMonth()
  const quarterNumber = month >= 3 && month <= 5 ? 1 : month >= 6 && month <= 8 ? 2 : month >= 9 && month <= 11 ? 3 : 4
  return `${fiscalYear}-Q${quarterNumber}`
}

function getCurrentFiscalYear(date: Date) {
  return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
