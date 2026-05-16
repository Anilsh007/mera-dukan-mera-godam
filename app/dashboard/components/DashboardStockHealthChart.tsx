"use client"

import { en } from "@/app/messages/en"
import type { StockHealth } from "@/app/dashboard/reports/types"

type DashboardStockHealthChartProps = {
  health: StockHealth
  loading?: boolean
}

export default function DashboardStockHealthChart({ health, loading }: DashboardStockHealthChartProps) {
  const segments = [
    { key: "healthy", label: en.inventory.healthy, strokeClass: "stroke-emerald-500", bgClass: "bg-emerald-500" },
    { key: "low", label: en.inventory.low, strokeClass: "stroke-amber-500", bgClass: "bg-amber-500" },
    { key: "critical", label: en.inventory.critical, strokeClass: "stroke-orange-500", bgClass: "bg-orange-500" },
    { key: "out", label: en.inventory.out, strokeClass: "stroke-red-500", bgClass: "bg-red-500" },
  ] as const
  const total = health.healthy + health.low + health.critical + health.out
  const safeTotal = Math.max(total, 1)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  let offset = 0
  const healthyPercent = total > 0 ? Math.round((health.healthy / safeTotal) * 100) : 0

  return (
    <div className="dashboard-chart-shell rounded-[28px] p-5">
      <div className="pointer-events-none absolute -right-12 top-4 h-32 w-32 rounded-full bg-violet-400/22 blur-3xl" aria-hidden="true" />
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{en.dashboard.stockMix}</p>
          <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">{en.reports.stockHealth}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{en.dashboard.stockHealthSubtitle}</p>
        </div>
        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--text-primary)]">{total} {en.dashboard.products}</span>
      </div>

      {loading ? (
        <div className="skeleton h-48 rounded-3xl" aria-label={en.common.loadingAriaLabel} />
      ) : (
        <div className="grid grid-cols-1 gap-5 min-[460px]:grid-cols-[0.75fr_1fr] min-[460px]:items-center">
          <div className="relative mx-auto h-44 w-44">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" role="img" aria-label={en.dashboard.stockHealthChartAriaLabel}>
              <circle cx="60" cy="60" r={radius} className="fill-none stroke-[var(--chart-grid)]" strokeWidth="16" />
              {segments.map((segment) => {
                const value = health[segment.key]
                const length = (value / safeTotal) * circumference
                const dash = `${length} ${circumference - length}`
                const dashOffset = -offset
                offset += length
                if (value <= 0) return null
                return (
                  <circle
                    key={segment.key}
                    cx="60"
                    cy="60"
                    r={radius}
                    className={`fill-none ${segment.strokeClass}`}
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

          <div className="space-y-2">
            {segments.map((segment) => {
              const value = health[segment.key]
              const percent = total > 0 ? Math.round((value / safeTotal) * 100) : 0
              return (
                <div key={segment.key} className="rounded-2xl border border-[var(--surface-outline)] bg-[var(--surface-subtle)] p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${segment.bgClass}`} />
                      <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{segment.label}</span>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">{value}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--chart-grid)]">
                    <div className={`h-full rounded-full ${segment.bgClass}`} style={{ width: `${Math.max(percent, value > 0 ? 3 : 0)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
