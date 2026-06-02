import { InvoiceHistoryProps } from "../types/ui.types"
import { en } from "@/app/messages/en"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import { buildGstInvoiceDocument } from "../Preview/InvoicePreview"

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0)

const formatDate = (date?: string) => {
  if (!date) return "-"
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function InvoiceHistory({ invoices, onSelect }: InvoiceHistoryProps) {
  return (
    <section className="premium-surface min-w-0 rounded-2xl p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{en.gstInvoice.savedGstBills}</h3>
          <p className="text-sm text-[var(--text-muted)]">{en.gstInvoice.clickRowToOpenEdit}</p>
        </div>
        <span className="w-fit rounded-full border border-[var(--border-card)] px-3 py-1 text-sm text-[var(--text-muted)]">
          {invoices.length} {en.gstInvoice.invoices}
        </span>
      </div>

      <div className="mt-4 mobile-safe-table rounded-2xl border border-[var(--border-card)]">
        {invoices.length ? (
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-[var(--bg-soft)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">{en.gstInvoice.invoiceNo}</th>
                <th className="px-4 py-3 font-semibold">{en.gstInvoice.buyer}</th>
                <th className="px-4 py-3 font-semibold">{en.gstInvoice.invoiceDate}</th>
                <th className="px-4 py-3 font-semibold">{en.gstInvoice.items}</th>
                <th className="px-4 py-3 text-right font-semibold">{en.gstInvoice.grandTotal}</th>
                <th className="px-4 py-3 font-semibold">{en.gstInvoice.sync}</th>
                <th className="px-4 py-3 text-right font-semibold">{en.gstInvoice.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-card)]">
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="text-[var(--text-primary)] transition hover:bg-[var(--bg-soft)]"
                >
                  <td className="px-4 py-3 font-semibold">{inv.invoiceNo}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{inv.buyerName || inv.buyer?.name || "-"}</div>
                    {inv.buyer?.gstin ? (
                      <div className="text-xs text-[var(--text-muted)]">{en.profile.gstShort}: {inv.buyer.gstin}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{formatDate(inv.invoiceDate)}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{inv.items?.length || 0}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(inv.totals?.grandTotal || 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      inv.syncStatus === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : inv.syncStatus === "failed"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {inv.syncStatus === "pending" ? en.gstInvoice.pending : inv.syncStatus === "failed" ? en.gstInvoice.failed : en.gstInvoice.synced}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                    <TransactionActionPanel document={buildGstInvoiceDocument(inv)} compact showPrint={false} className="justify-end" />
                    <button
                      type="button"
                      onClick={() => onSelect(inv)}
                      className="rounded-xl border border-[var(--border-card)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)]"
                    >
                      {en.gstInvoice.open}
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-sm text-[var(--text-muted)]">{en.gstInvoice.noInvoices}</div>
        )}
      </div>
    </section>
  )
}
