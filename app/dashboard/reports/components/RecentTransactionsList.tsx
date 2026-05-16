import EmptyState from "./EmptyState"
import { formatDate, formatMoney } from "../lib/format"
import { en } from "@/app/messages/en"

type RecentTransaction = {
  id: string
  kind: string
  label: string
  date: string
  amount: number
  status?: string
}

export default function RecentTransactionsList({ items }: { items: RecentTransaction[] }) {
  if (!items.length) return <EmptyState text={en.reports.noRecentTransactions} />

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={`${item.kind}-${item.id}`} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{item.kind}</p>
              <p className="mt-1 truncate font-semibold text-[var(--text-primary)]">{item.label}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{formatDate(item.date)}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-bold text-[var(--text-primary)]">{formatMoney(item.amount)}</p>
              {item.status && <p className="mt-1 text-xs capitalize text-[var(--text-muted)]">{item.status}</p>}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
