import InfoTile from "@/app/components/ui/InfoTile"
import ResponsiveDataTable from "@/app/components/ui/ResponsiveDataTable"
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
              <InfoTile variant="subtle" labelClassName="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]" valueClassName="mt-1 break-words font-semibold text-[var(--text-primary)]" label={en.reports.taxable} value={formatMoney(invoice.totals?.taxableValue || 0)} />
              <InfoTile variant="subtle" labelClassName="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]" valueClassName="mt-1 break-words font-semibold text-[var(--text-primary)]" label={en.reports.gst} value={formatMoney(gstTotal)} />
            </div>
          </article>
        ))}
      </div>

      <ResponsiveDataTable
        rows={rows}
        getRowKey={({ invoice }) => invoice.id}
        minWidth={720}
        className="hidden sm:block"
        columns={[
          { key: "invoiceNo", header: en.reports.invoiceNo, render: ({ invoice }) => invoice.invoiceNo, className: "font-semibold text-[var(--text-primary)]" },
          { key: "buyer", header: en.reports.buyer, render: ({ invoice }) => invoice.buyerName || invoice.buyer?.name || "-", className: "capitalize text-[var(--text-secondary)]" },
          { key: "date", header: en.reports.date, render: ({ invoice }) => formatDate(invoice.invoiceDate), className: "text-[var(--text-secondary)]" },
          { key: "taxable", header: en.reports.taxable, align: "right", render: ({ invoice }) => formatMoney(invoice.totals?.taxableValue || 0), className: "text-[var(--text-secondary)]" },
          { key: "gst", header: en.reports.gst, align: "right", render: ({ gstTotal }) => formatMoney(gstTotal), className: "text-[var(--text-secondary)]" },
          { key: "total", header: en.reports.total, align: "right", render: ({ invoice }) => formatMoney(invoice.totals?.grandTotal || 0), className: "font-bold text-emerald-600 dark:text-emerald-400" },
        ]}
      />
    </>
  )
}
