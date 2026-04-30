import { InvoiceHistoryProps } from "../types/ui.types";

export default function InvoiceHistory({ invoices, onSelect }:InvoiceHistoryProps) {
  return (
    <section className="card">
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold">Invoices</h3>
        <span className="text-sm text-gray-400">{invoices.length}</span>
      </div>

      <div className="mt-4 space-y-2">
        {invoices.length ? (
          invoices.map((inv) => (
            <button
              key={inv.id}
              onClick={() => onSelect(inv)}
              className="w-full text-left border rounded-xl p-3 hover:bg-gray-50"
            >
              <p className="font-semibold">{inv.invoiceNo}</p>
              <p className="text-sm text-gray-500">{inv.buyerName}</p>
              <p className="text-sm">₹ {inv.totals.grandTotal}</p>
            </button>
          ))
        ) : (
          <p className="text-sm text-gray-400">No invoices</p>
        )}
      </div>
    </section>
  )
}