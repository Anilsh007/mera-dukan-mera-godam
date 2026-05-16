"use client"

import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"

type SalesSparklineProps = {
  values: number[]
  label?: string
}

function formatShortDay(offsetFromToday: number) {
  const date = new Date()
  date.setDate(date.getDate() + offsetFromToday)
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

function buildSmoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return ""
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previous = points[index - 1]
    const controlX = previous.x + (point.x - previous.x) / 2
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`
  }, "")
}

export default function SalesSparkline({ values, label = en.dashboard.salesTrend }: SalesSparklineProps) {
  const safeValues = values.length ? values : [0, 0, 0, 0, 0, 0, 0]
  const max = Math.max(...safeValues, 1)
  const total = safeValues.reduce((sum, value) => sum + value, 0)
  const average = total / Math.max(safeValues.length, 1)
  const peakValue = Math.max(...safeValues)
  const peakIndex = safeValues.findIndex((value) => value === peakValue)
  const firstNonZero = safeValues.find((value) => value > 0) || 0
  const latest = safeValues[safeValues.length - 1] || 0
  const trendPercent = firstNonZero > 0 ? ((latest - firstNonZero) / firstNonZero) * 100 : 0
  const trendLabel = trendPercent >= 0 ? en.dashboard.trendRising : en.dashboard.trendFalling
  const width = 360
  const height = 154
  const padding = 18
  const chartHeight = height - padding * 2
  const chartWidth = width - padding * 2
  const coordinates = safeValues.map((value, index) => {
    const x = padding + (safeValues.length === 1 ? chartWidth : (index / (safeValues.length - 1)) * chartWidth)
    const y = padding + chartHeight - (value / max) * chartHeight
    return { x, y, value, label: formatShortDay(index - (safeValues.length - 1)) }
  })
  const linePath = buildSmoothPath(coordinates)
  const areaPath = coordinates.length
    ? `${linePath} L ${coordinates[coordinates.length - 1].x} ${height - padding} L ${coordinates[0].x} ${height - padding} Z`
    : ""

  return (
    <div className="dashboard-chart-shell rounded-[28px] p-5">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-fuchsia-400/18 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-sky-400/18 blur-3xl" aria-hidden="true" />

      <div className="relative mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{en.dashboard.tracking}</p>
          <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">{label}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.dashboard.trendChartSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--text-primary)]">{en.dashboard.days7Label}</span>
          {total > 0 ? (
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {trendLabel} {Math.abs(trendPercent).toFixed(0)}%
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-[var(--surface-outline)] bg-[var(--surface-subtle)] p-3">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="h-48 w-full overflow-visible">
          <defs>
            <linearGradient id="dashboardSalesLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#7c6bff" />
              <stop offset="52%" stopColor="#4ea7ff" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
            <linearGradient id="dashboardSalesArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#7c6bff" stopOpacity="0.3" />
              <stop offset="65%" stopColor="#4ea7ff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#4ea7ff" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((line) => (
            <line
              key={line}
              x1={padding}
              x2={width - padding}
              y1={padding + chartHeight * line}
              y2={padding + chartHeight * line}
              className="text-[var(--chart-grid)]"
              stroke="currentColor"
              strokeDasharray="5 8"
            />
          ))}
          {total > 0 ? <path d={areaPath} fill="url(#dashboardSalesArea)" /> : null}
          {total > 0 ? <path d={linePath} fill="none" stroke="url(#dashboardSalesLine)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /> : null}
          {coordinates.map((point, index) => {
            const isPeak = index === peakIndex && peakValue > 0
            return (
              <g key={`${point.label}-${point.x}`}>
                <rect
                  x={point.x - 10}
                  y={point.y}
                  width="20"
                  height={height - padding - point.y}
                  rx="10"
                  className="fill-[var(--accent)] opacity-10"
                />
                {point.value > 0 ? (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isPeak ? "6" : "4"}
                    className="fill-[var(--bg-card-strong)]"
                    stroke="url(#dashboardSalesLine)"
                    strokeWidth="3"
                  />
                ) : null}
                <text x={point.x} y={height - 2} textAnchor="middle" className="fill-[var(--text-muted)] text-[10px]">
                  {index === 0 || index === coordinates.length - 1 || index === peakIndex ? point.label : ""}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

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
    </div>
  )
}
