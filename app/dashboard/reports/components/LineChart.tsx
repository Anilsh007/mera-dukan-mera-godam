import type { ChartPoint } from "../types"
import { formatMoney } from "../lib/format"
import EmptyState from "./EmptyState"
import MetricLineAreaChart, { type MetricLinePoint } from "@/app/components/charts/MetricLineAreaChart"
import { en } from "@/app/messages/en"

export default function LineChart({ points }: { points: ChartPoint[] }) {
  const total = points.reduce((sum, point) => sum + point.value, 0)
  const peak = points.reduce((best, point) => (point.value > best.value ? point : best), points[0] || { label: "", value: 0 })
  const chartPoints: MetricLinePoint[] = points.map((point) => ({
    label: point.label,
    value: point.value,
    tooltipRows: [{ label: en.reports.sales, value: formatMoney(point.value) }],
  }))

  if (points.every((point) => point.value === 0)) {
    return <EmptyState text={en.reports.noSalesData} />
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[var(--surface-subtle)] p-4">
      <MetricLineAreaChart points={chartPoints} ariaLabel={en.reports.salesTrendChartAriaLabel} valueLabel={en.reports.sales} formatValue={formatMoney} heightClassName="h-72" />
      <div className="relative mt-2 grid grid-cols-1 gap-3 text-xs text-[var(--text-secondary)] min-[520px]:grid-cols-3">
        <span className="rounded-2xl bg-[var(--bg-card-strong)] px-3 py-2"><strong className="text-[var(--text-primary)]">{en.reports.peak}:</strong> {formatMoney(peak.value)}</span>
        <span className="rounded-2xl bg-[var(--bg-card-strong)] px-3 py-2"><strong className="text-[var(--text-primary)]">{en.reports.total}:</strong> {formatMoney(total)}</span>
        <span className="rounded-2xl bg-[var(--bg-card-strong)] px-3 py-2"><strong className="text-[var(--text-primary)]">{en.dashboard.peakDay}:</strong> {peak.label || en.common.notAvailable}</span>
      </div>
    </div>
  )
}
