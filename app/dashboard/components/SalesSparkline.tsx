"use client"

import ChartCard from "@/app/components/charts/ChartCard"
import MetricLineAreaChart, { type MetricLinePoint } from "@/app/components/charts/MetricLineAreaChart"
import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"
import { formatShortDay } from "@/app/lib/chart.utils"
import { DASHBOARD_ROUTES } from "@/app/lib/navigation/dashboardRoutes"

type SalesSparklineProps = {
  values: number[]
  label?: string
}

export default function SalesSparkline({ values, label = en.dashboard.salesTrend }: SalesSparklineProps) {
  const total = values.reduce((sum, value) => sum + value, 0)
  const average = total / Math.max(values.length, 1)
  const peakValue = values.length ? Math.max(...values) : 0
  const firstNonZero = values.find((value) => value > 0) || 0
  const latest = values[values.length - 1] || 0
  const trendPercent = firstNonZero > 0 ? ((latest - firstNonZero) / firstNonZero) * 100 : 0
  const trendLabel = trendPercent >= 0 ? en.dashboard.trendRising : en.dashboard.trendFalling
  const points: MetricLinePoint[] = values.map((value, index) => ({
    label: formatShortDay(index - (values.length - 1)),
    value,
    tooltipRows: [{ label: en.dashboard.saleAmount, value: formatCurrency(value) }],
  }))

  return (
    <ChartCard
      eyebrow={en.dashboard.tracking}
      title={label}
      description={en.dashboard.trendChartSubtitle}
      action={{ href: DASHBOARD_ROUTES.sales, label: en.dashboard.viewSales }}
      secondaryAction={{ href: DASHBOARD_ROUTES.quickSale, label: en.navigation.quickSale }}
      empty={total <= 0}
      emptyTitle={en.dashboard.noSalesYet}
      emptyDescription={en.dashboard.noSalesYetDescription}
      emptyAction={{ href: DASHBOARD_ROUTES.quickSale, label: en.navigation.quickSale }}
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--text-primary)]">{en.dashboard.days7Label}</span>
        {total > 0 ? (
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            {trendLabel} {Math.abs(trendPercent).toFixed(0)}%
          </span>
        ) : null}
      </div>

      <MetricLineAreaChart points={points} ariaLabel={label} valueLabel={en.dashboard.saleAmount} formatValue={formatCurrency} heightClassName="h-48" showEveryLabel />

      <div className="relative mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
        <div className="rounded-2xl border border-[var(--surface-outline)] bg-[var(--surface-subtle)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{en.dashboard.sevenDayTotal}</p>
          <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">{formatCurrency(total)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--surface-outline)] bg-[var(--surface-subtle)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{en.dashboard.peakDay}</p>
          <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">{peakValue > 0 ? formatCurrency(peakValue) : en.common.notAvailable}</p>
        </div>
        <div className="rounded-2xl border border-[var(--surface-outline)] bg-[var(--surface-subtle)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{en.dashboard.averageSale}</p>
          <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">{formatCurrency(average)}</p>
        </div>
      </div>
    </ChartCard>
  )
}
