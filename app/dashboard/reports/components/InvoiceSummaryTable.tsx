import type { GSTInvoiceRecord } from "@/app/dashboard/gst-invoice/types/gst.types"
import { formatDate, formatMoney, safeNumber } from "../lib/format"
import EmptyState from "./EmptyState"
import { en } from "@/app/messages/en"

export default function InvoiceSummaryTable({ invoices }: { invoices: GSTInvoiceRecord[] }) {
  if (!invoices.length) return <EmptyState text={en.reports.noGstInvoicesForPeriod} />

  const rows = invoices.map((invoice) => ({
    invoice,
    gstTotal: safeNumber(invoice.totals?.cgstTotal) + safeNumber(invoice.totals?.sgstTotal) + safeNumber(invoice.totals?.igstTotal),
  }))

  return (
    <>
      <div className="space-y-3 sm:hidden">
        {rows.map(({ invoice, gstTotal }) => (
          <article key={invoice.id} className="premium-surface rounded-2xl p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-semibold text-[var(--text-primary)]">{invoice.invoiceNo}</p>
                <p className="mt-1 text-sm capitalize text-[var(--text-secondary)]">{invoice.buyerName || invoice.buyer?.name || "-"}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{formatDate(invoice.invoiceDate)}</p>
              </div>
              <p className="shrink-0 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(invoice.totals?.grandTotal || 0)}</p>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm min-[420px]:grid-cols-2">
              <MiniStat label={en.reports.taxable} value={formatMoney(invoice.totals?.taxableValue || 0)} />
              <MiniStat label={en.reports.gst} value={formatMoney(gstTotal)} />
            </div>
          </article>
        ))}
      </div>

      <div className="mobile-safe-table hidden sm:block">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <tr className="border-b border-[var(--border-card)]">
              <th className="py-3 pr-4">{en.reports.invoiceNo}</th>
              <th className="py-3 pr-4">{en.reports.buyer}</th>
              <th className="py-3 pr-4">{en.reports.date}</th>
              <th className="py-3 pr-4 text-right">{en.reports.taxable}</th>
              <th className="py-3 pr-4 text-right">{en.reports.gst}</th>
              <th className="py-3 text-right">{en.reports.total}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-card)]">
            {rows.map(({ invoice, gstTotal }) => (
              <tr key={invoice.id}>
                <td className="py-3 pr-4 font-semibold text-[var(--text-primary)]">{invoice.invoiceNo}</td>
                <td className="py-3 pr-4 capitalize text-[var(--text-secondary)]">{invoice.buyerName || invoice.buyer?.name || "-"}</td>
                <td className="py-3 pr-4 text-[var(--text-secondary)]">{formatDate(invoice.invoiceDate)}</td>
                <td className="py-3 pr-4 text-right text-[var(--text-secondary)]">{formatMoney(invoice.totals?.taxableValue || 0)}</td>
                <td className="py-3 pr-4 text-right text-[var(--text-secondary)]">{formatMoney(gstTotal)}</td>
                <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(invoice.totals?.grandTotal || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 break-words font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  )
}
