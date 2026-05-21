"use client"

import { useMemo, useState } from "react"
import { Download, FileSpreadsheet, Printer, TrendingDown, TrendingUp } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import PageHeader from "@/app/components/ui/PageHeader"
import ShareActions from "@/app/components/ui/ShareActions"
import SummaryCard from "@/app/components/ui/SummaryCard"
import useExpenses from "@/app/hooks/useExpenses"
import usePurchases from "@/app/hooks/usePurchases"
import useSales from "@/app/hooks/useSales"
import {
  buildProfitLossReportRows,
  calculateProfitLoss,
  formatAccountingMoney,
  type MonthlyProfitLossPoint,
} from "@/app/lib/accounting/accounting.utils"
import { buildRowsShareMessage } from "@/app/lib/accounting/accounting.export"
import { runAccountingExport, type AccountingExportKind } from "@/app/lib/accounting/accounting.exportActions"
import { notify as toast } from "@/app/lib/notifications"
import { en } from "@/app/messages/en"

export default function ProfitLossPage() {
  const { sales } = useSales()
  const { purchases } = usePurchases()
  const { expenses } = useExpenses()
  const [fromDate, setFromDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10))

  const summary = useMemo(
    () => calculateProfitLoss({ sales, purchases, expenses, range: { from: fromDate, to: toDate } }),
    [expenses, fromDate, purchases, sales, toDate],
  )
  const rows = buildProfitLossReportRows(summary)
  const shareMessage = buildRowsShareMessage(rows, en.accounting.profitLossTitle)
  const hasData = summary.salesTotal > 0 || summary.purchaseCost > 0 || summary.expensesTotal > 0

  const runExport = async (kind: AccountingExportKind) => {
    if (!hasData) {
      toast.warning(en.accounting.noProfitLossData)
      return
    }

    await runAccountingExport({
      kind,
      rows,
      filenamePrefix: "profit-loss",
      title: en.accounting.profitLossTitle,
      errorLabel: en.accounting.profitLossExportFailed,
    })
  }

  return (
    <main className="space-y-5 p-3 sm:p-4 lg:p-6">
      <PageHeader
        title={en.accounting.profitLossTitle}
        description={en.accounting.profitLossDescription}
        actions={<ShareActions message={shareMessage} subject={en.accounting.profitLossTitle} filename="profit-loss-summary.pdf" showPrint={false} />}
      />

      <section className="premium-surface rounded-3xl p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <Input label={en.download.fromDate} type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <Input label={en.download.toDate} type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="black" icon={<Download size={16} />} title={en.reports.exportCsv} onClick={() => void runExport("csv")} />
            <Button type="button" variant="outline" icon={<FileSpreadsheet size={16} />} title={en.reports.exportExcel} onClick={() => void runExport("excel")} />
            <Button type="button" variant="outline" icon={<Printer size={16} />} title={en.reports.printOrPdf} onClick={() => void runExport("print")} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label={en.accounting.salesTotal} value={formatAccountingMoney(summary.salesTotal)} icon={<TrendingUp size={18} />} />
        <SummaryCard label={en.accounting.purchaseCost} value={formatAccountingMoney(summary.purchaseCost)} icon={<TrendingDown size={18} />} />
        <SummaryCard label={en.accounting.grossProfit} value={formatAccountingMoney(summary.grossProfit)} icon={<TrendingUp size={18} />} />
        <SummaryCard label={en.accounting.netProfit} value={formatAccountingMoney(summary.netProfit)} icon={<TrendingUp size={18} />} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
        <div className="premium-surface rounded-3xl p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.accounting.monthlyComparison}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{en.accounting.monthlyComparisonHelp}</p>
          </div>
          {summary.monthlyComparison.length ? (
            <div className="space-y-3">
              {summary.monthlyComparison.map((point) => <MonthlyRow key={point.key} point={point} />)}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-[var(--border-input)] p-6 text-center text-sm text-[var(--text-secondary)]">{en.accounting.noProfitLossData}</p>
          )}
        </div>

        <aside className="premium-surface h-fit rounded-3xl p-4 sm:p-5">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.accounting.duesSnapshot}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.accounting.duesSnapshotHelp}</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
              <p className="text-xs uppercase text-[var(--text-muted)]">{en.accounting.customerDue}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{formatAccountingMoney(summary.customerDue)}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
              <p className="text-xs uppercase text-[var(--text-muted)]">{en.accounting.supplierDue}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{formatAccountingMoney(summary.supplierDue)}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-secondary)]">
              {en.accounting.profitLossSafeNote}
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}

function MonthlyRow({ point }: { point: MonthlyProfitLossPoint }) {
  const maxValue = Math.max(point.sales, point.purchases, point.expenses, 1)
  const salesWidth = Math.min(100, (point.sales / maxValue) * 100)
  const purchaseWidth = Math.min(100, (point.purchases / maxValue) * 100)
  const expenseWidth = Math.min(100, (point.expenses / maxValue) * 100)

  return (
    <article className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-[var(--text-primary)]">{point.label}</p>
        <p className={`font-bold ${point.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{formatAccountingMoney(point.netProfit)}</p>
      </div>
      <div className="space-y-2 text-xs text-[var(--text-secondary)]">
        <BarLine label={en.accounting.salesTotal} value={point.sales} width={salesWidth} />
        <BarLine label={en.accounting.purchaseCost} value={point.purchases} width={purchaseWidth} />
        <BarLine label={en.accounting.expensesTotal} value={point.expenses} width={expenseWidth} />
      </div>
    </article>
  )
}

function BarLine({ label, value, width }: { label: string; value: number; width: number }) {
  return (
    <div>
      <div className="flex justify-between gap-3">
        <span>{label}</span>
        <span>{formatAccountingMoney(value)}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-[var(--surface-subtle)]">
        <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}
