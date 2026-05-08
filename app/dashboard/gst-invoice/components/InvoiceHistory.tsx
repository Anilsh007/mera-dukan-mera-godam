import { InvoiceHistoryProps } from "../types/ui.types";

export default function InvoiceHistory({ invoices, onSelect }:InvoiceHistoryProps) {
  return (
    <section className="card min-w-0">
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold">Invoices</h3>
        <span className="text-sm text-[var(--text-muted)]">{invoices.length}</span>
      </div>

      <div className="mt-4 space-y-2">
        {invoices.length ? (
          invoices.map((inv) => (
            <button
              key={inv.id}
              onClick={() => onSelect(inv)}
              className="w-full rounded-xl border border-[var(--border-card)] p-3 text-left text-[var(--text-primary)] hover:bg-[var(--bg-soft)]"
            >
              <p className="font-semibold">{inv.invoiceNo}</p>
              <p className="text-sm text-[var(--text-secondary)]">{inv.buyerName}</p>
              <p className="text-sm">₹ {inv.totals.grandTotal}</p>
            </button>
          ))
        ) : (
          <p className="text-sm text-[var(--text-muted)]">No invoices</p>
        )}
      </div>
    </section>
  )
}
