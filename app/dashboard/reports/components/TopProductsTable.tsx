import { formatMoney, formatNumber } from "../lib/format"
import EmptyState from "./EmptyState"
import { en } from "@/app/messages/en"

export default function TopProductsTable({ items }: { items: Array<{ name: string; quantity: number; value: number }> }) {
  if (!items.length) return <EmptyState text={en.reports.noSalesData} />

  return (
    <>
      <div className="space-y-3 sm:hidden">
        {items.map((item) => (
          <article key={item.name} className="premium-surface rounded-2xl p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-semibold capitalize text-[var(--text-primary)]">{item.name}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{formatNumber(item.quantity)} {en.reports.units}</p>
              </div>
              <p className="shrink-0 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(item.value)}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mobile-safe-table hidden sm:block">
        <table className="min-w-[520px] w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <tr className="border-b border-[var(--border-card)]">
              <th className="py-3 pr-4">{en.reports.product}</th>
              <th className="py-3 pr-4 text-right">{en.reports.units}</th>
              <th className="py-3 text-right">{en.reports.sales}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-card)]">
            {items.map((item) => (
              <tr key={item.name}>
                <td className="py-3 pr-4 font-medium capitalize text-[var(--text-primary)]">{item.name}</td>
                <td className="py-3 pr-4 text-right text-[var(--text-secondary)]">{formatNumber(item.quantity)}</td>
                <td className="py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatMoney(item.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
