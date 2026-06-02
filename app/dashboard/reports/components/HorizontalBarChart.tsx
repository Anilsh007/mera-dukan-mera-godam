import type { ChartPoint } from "../types"
import { formatMoney } from "../lib/format"
import EmptyState from "./EmptyState"
import { en } from "@/app/messages/en"

export default function HorizontalBarChart({ items }: { items: ChartPoint[] }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)
  if (!items.length) return <EmptyState text={en.reports.noCategoryData} />

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const percent = Math.max((item.value / maxValue) * 100, 4)
        return (
          <div key={item.label} className="group relative overflow-hidden rounded-2xl bg-[var(--surface-subtle)] p-4 transition hover:-translate-y-0.5">
            <div className="pointer-events-none absolute -right-10 -top-10 h-20 w-20 rounded-full bg-[var(--accent-soft)] blur-2xl transition group-hover:scale-125" aria-hidden="true" />
            <div className="relative mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-xs font-black text-[var(--text-primary)]">{index + 1}</span>
                <span className="truncate text-sm font-semibold capitalize text-[var(--text-primary)]">{item.label}</span>
              </div>
              <span className="shrink-0 text-sm font-bold text-emerald-600 dark:text-emerald-600">{formatMoney(item.value)}</span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-[var(--chart-grid)]">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-500 shadow-sm" style={{ width: `${percent}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
