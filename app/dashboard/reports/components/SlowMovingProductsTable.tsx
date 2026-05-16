import EmptyState from "./EmptyState"
import { formatDate, formatMoney, formatNumber } from "../lib/format"
import { en } from "@/app/messages/en"

type SlowMovingProduct = {
  name: string
  quantity: number
  stockValue: number
  lastSoldAt: number | null
  soldQuantity: number
}

export default function SlowMovingProductsTable({ items }: { items: SlowMovingProduct[] }) {
  if (!items.length) return <EmptyState text={en.reports.noSlowMovingProducts} />

  return (
    <div className="mobile-safe-table">
      <table className="min-w-[560px] w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
          <tr className="border-b border-[var(--border-card)]">
            <th className="py-3 pr-4">{en.reports.product}</th>
            <th className="py-3 pr-4 text-right">{en.reports.units}</th>
            <th className="py-3 pr-4 text-right">{en.reports.stockValue}</th>
            <th className="py-3 text-right">{en.reports.lastSold}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-card)]">
          {items.map((item) => (
            <tr key={item.name}>
              <td className="py-3 pr-4 font-medium capitalize text-[var(--text-primary)]">{item.name}</td>
              <td className="py-3 pr-4 text-right text-[var(--text-secondary)]">{formatNumber(item.quantity)}</td>
              <td className="py-3 pr-4 text-right font-semibold text-[var(--text-primary)]">{formatMoney(item.stockValue)}</td>
              <td className="py-3 text-right text-[var(--text-secondary)]">
                {item.lastSoldAt ? formatDate(new Date(item.lastSoldAt).toISOString()) : en.reports.neverSold}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
