"use client"

import { Activity } from "lucide-react"
import ChartEmptyState from "@/app/components/charts/ChartEmptyState"
import MetricLineAreaChart, { type MetricLinePoint } from "@/app/components/charts/MetricLineAreaChart"
import { formatCurrency } from "@/app/lib/formatters"
import { formatShortDay } from "@/app/lib/chart.utils"
import { en } from "@/app/messages/en"

type OverviewMiniTrendChartProps = {
  values: number[]
  loading?: boolean
}

export default function OverviewMiniTrendChart({ values, loading }: OverviewMiniTrendChartProps) {
  const points: MetricLinePoint[] = values.map((value, index) => ({
    label: formatShortDay(index - (values.length - 1)),
    value,
    tooltipRows: [{ label: en.dashboard.saleAmount, value: formatCurrency(value) }],
  }))
  const latest = values[values.length - 1] || 0
  const total = values.reduce((sum, value) => sum + value, 0)

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[var(--border-card)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-card)]">
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-emerald-400/20 blur-2xl" aria-hidden="true" />
      <div className="relative mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--text-primary)]">
            <Activity size={17} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--text-primary)]">{en.dashboard.salesTrend}</p>
            <p className="truncate text-xs text-[var(--text-secondary)]">{en.dashboard.trendChartSubtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{en.reports.sales}</p>
          <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(latest)}</p>
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-28 rounded-2xl" aria-label={en.common.loadingAriaLabel} />
      ) : total > 0 ? (
        <MetricLineAreaChart points={points} ariaLabel={en.dashboard.salesTrend} valueLabel={en.dashboard.saleAmount} formatValue={formatCurrency} heightClassName="h-28" />
      ) : (
        <ChartEmptyState title={en.dashboard.noSalesYet} description={en.dashboard.noSalesYetDescription} icon={Activity} />
      )}
    </div>
  )
}
