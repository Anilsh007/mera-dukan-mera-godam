import type { StockHealth } from "../types"
import EmptyState from "./EmptyState"
import { en } from "@/app/messages/en"

export default function StockHealthSummary({ health }: { health: StockHealth }) {
  const total = health.healthy + health.low + health.critical + health.out
  const safeTotal = Math.max(total, 1)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  let offset = 0
  const items = [
    { key: "healthy", label: en.inventory.healthy, value: health.healthy, strokeCls: "stroke-emerald-500", bgCls: "bg-emerald-500" },
    { key: "low", label: en.inventory.low, value: health.low, strokeCls: "stroke-amber-500", bgCls: "bg-amber-500" },
    { key: "critical", label: en.inventory.critical, value: health.critical, strokeCls: "stroke-orange-500", bgCls: "bg-orange-500" },
    { key: "out", label: en.inventory.out, value: health.out, strokeCls: "stroke-red-500", bgCls: "bg-red-500" },
  ]
  const healthyPercent = total > 0 ? Math.round((health.healthy / safeTotal) * 100) : 0

  if (items.every((item) => item.value === 0)) return <EmptyState text={en.reports.noProductsAvailable} />

  return (
    <div className="grid grid-cols-1 gap-5 min-[520px]:grid-cols-[0.75fr_1fr] min-[520px]:items-center">
      <div className="relative mx-auto h-48 w-48">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" role="img" aria-label={en.dashboard.stockHealthChartAriaLabel}>
          <circle cx="60" cy="60" r={radius} className="fill-none stroke-black/10 dark:stroke-white/10" strokeWidth="16" />
          {items.map((item) => {
            const length = (item.value / safeTotal) * circumference
            const dash = `${length} ${circumference - length}`
            const dashOffset = -offset
            offset += length
            if (item.value <= 0) return null
            return (
              <circle
                key={item.key}
                cx="60"
                cy="60"
                r={radius}
                className={`fill-none ${item.strokeCls}`}
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={dash}
                strokeDashoffset={dashOffset}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-black text-[var(--text-primary)]">{healthyPercent}%</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{en.dashboard.healthyStock}</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const percent = total > 0 ? Math.round((item.value / safeTotal) * 100) : 0
          return (
            <div key={item.label} className="rounded-2xl bg-black/5 px-4 py-3 dark:bg-white/5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.bgCls}`} />
                  <span className="truncate text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-[var(--text-primary)]">{item.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div className={`h-full rounded-full ${item.bgCls}`} style={{ width: `${Math.max(percent, item.value > 0 ? 3 : 0)}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
