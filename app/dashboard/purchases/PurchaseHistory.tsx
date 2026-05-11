import type { PurchaseRecord } from "@/app/lib/db"
import { formatCurrency, formatPurchaseDate, getPaymentStatusClass } from "./purchase.utils"

export default function PurchaseHistory({ purchases }: { purchases: PurchaseRecord[] }) {
  const recentDue = purchases.reduce((sum, purchase) => sum + purchase.dueAmount, 0)
  const recentValue = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0)
  const recentPurchases = purchases.slice(0, 12)

  return (
    <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] shadow-[var(--shadow-card)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 border-b border-[var(--border-card)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Purane purchase bill</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Total {formatCurrency(recentValue)} purchase, {formatCurrency(recentDue)} supplier due.
          </p>
        </div>
      </div>
      <PurchaseCards purchases={recentPurchases} />
      <PurchaseTable purchases={recentPurchases} />
    </section>
  )
}

function PurchaseCards({ purchases }: { purchases: PurchaseRecord[] }) {
  return (
    <div className="space-y-3 p-4 md:hidden">
      {purchases.length === 0 ? (
        <EmptyHistory />
      ) : (
        purchases.map((purchase) => (
          <div key={purchase.id} className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">{purchase.supplierName}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {purchase.billNo} - {formatPurchaseDate(purchase)}
                </p>
              </div>
              <span className={getPaymentStatusClass(purchase.paymentStatus)}>{purchase.paymentStatus}</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <HistoryAmount label="Total" value={formatCurrency(purchase.totalAmount)} />
              <HistoryAmount label="Paid" value={formatCurrency(purchase.amountPaid)} className="text-emerald-600" />
              <HistoryAmount label="Baaki" value={formatCurrency(purchase.dueAmount)} className="text-amber-600" />
            </div>
            <p className="mt-3 text-xs text-[var(--text-secondary)]">{formatItemsSummary(purchase)}</p>
          </div>
        ))
      )}
    </div>
  )
}

function PurchaseTable({ purchases }: { purchases: PurchaseRecord[] }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[850px] text-left text-sm">
        <thead className="bg-black/5 dark:bg-white/5">
          <tr>
            {["Bill", "Supplier", "Date", "Product", "Total", "Paid", "Baaki", "Status"].map((heading) => (
              <th key={heading} className="px-4 py-3 text-xs uppercase text-[var(--text-muted)]">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-card)]">
          {purchases.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-[var(--text-muted)]">
                Abhi purchase bill saved nahi hai.
              </td>
            </tr>
          ) : (
            purchases.map((purchase) => (
              <tr key={purchase.id}>
                <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{purchase.billNo}</td>
                <td className="px-4 py-3 text-[var(--text-primary)]">{purchase.supplierName}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{formatPurchaseDate(purchase)}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{formatItemsSummary(purchase)}</td>
                <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                  {formatCurrency(purchase.totalAmount)}
                </td>
                <td className="px-4 py-3 text-emerald-600">{formatCurrency(purchase.amountPaid)}</td>
                <td className="px-4 py-3 text-amber-600">{formatCurrency(purchase.dueAmount)}</td>
                <td className="px-4 py-3">
                  <span className={getPaymentStatusClass(purchase.paymentStatus)}>{purchase.paymentStatus}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function EmptyHistory() {
  return (
    <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] p-4 text-center text-sm text-[var(--text-muted)]">
      Abhi purchase bill saved nahi hai.
    </div>
  )
}

function HistoryAmount({ label, value, className = "text-[var(--text-primary)]" }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className={`font-bold ${className}`}>{value}</p>
    </div>
  )
}

function formatItemsSummary(purchase: PurchaseRecord) {
  const firstItem = purchase.items[0]
  if (!firstItem) return "0 item"

  const details = [
    firstItem.category,
    firstItem.sku ? `SKU: ${firstItem.sku}` : "",
    firstItem.hsnCode ? `HSN: ${firstItem.hsnCode}` : "",
  ].filter(Boolean).join(" - ")
  const suffix = purchase.items.length > 1 ? ` +${purchase.items.length - 1} more` : ""

  return `${firstItem.name}${details ? ` (${details})` : ""}${suffix}`
}
