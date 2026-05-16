"use client"

import { Activity } from "lucide-react"
import SvgChartTooltip from "@/app/components/ui/SvgChartTooltip"
import { formatCurrency } from "@/app/lib/formatters"
import { en } from "@/app/messages/en"

type OverviewMiniTrendChartProps = {
  values: number[]
  loading?: boolean
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

export default function OverviewMiniTrendChart({ values, loading }: OverviewMiniTrendChartProps) {
  const safeValues = values.length ? values : [0, 0, 0, 0, 0, 0, 0]
  const width = 260
  const height = 112
  const padding = 14
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  const max = Math.max(...safeValues, 1)
  const latest = safeValues[safeValues.length - 1] || 0
  const total = safeValues.reduce((sum, value) => sum + value, 0)
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
    <div className="relative overflow-hidden rounded-[24px] border border-[var(--border-card)] bg-black/5 p-3 shadow-sm dark:bg-white/5">
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
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(latest)}</p>
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-28 rounded-2xl" aria-label={en.common.loadingAriaLabel} />
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="relative h-28 w-full overflow-visible" role="img" aria-label={en.dashboard.salesTrend}>
          <defs>
            <linearGradient id="overviewMiniLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="55%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
            <linearGradient id="overviewMiniArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((line) => (
            <line
              key={line}
              x1={padding}
              x2={width - padding}
              y1={padding + chartHeight * line}
              y2={padding + chartHeight * line}
              className="stroke-[var(--border-card)]"
              strokeDasharray="4 7"
            />
          ))}
          {total > 0 ? <path d={areaPath} fill="url(#overviewMiniArea)" /> : null}
          {total > 0 ? <path d={linePath} fill="none" stroke="url(#overviewMiniLine)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
          {coordinates.map((point) => (
            <g
              key={`${point.label}-${point.x}`}
              tabIndex={0}
              className="group cursor-pointer outline-none"
              aria-label={`${en.reports.date}: ${point.label}. ${en.reports.sales}: ${formatCurrency(point.value)}`}
            >
              <title>{`${en.reports.date}: ${point.label} • ${en.reports.sales}: ${formatCurrency(point.value)}`}</title>
              <rect x={point.x - 12} y={padding} width="24" height={chartHeight} fill="transparent" />
              <line
                x1={point.x}
                x2={point.x}
                y1={padding}
                y2={height - padding}
                className="stroke-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-35 group-focus:opacity-35"
                strokeWidth="1.5"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={point.value > 0 ? "4" : "3.2"}
                className="fill-[var(--bg-card-strong)] transition-opacity group-hover:opacity-100 group-focus:opacity-100"
                stroke="url(#overviewMiniLine)"
                strokeWidth="2.5"
              />
              <SvgChartTooltip
                x={point.x}
                y={point.y}
                svgWidth={width}
                title={point.label}
                rows={[{ label: en.reports.sales, value: formatCurrency(point.value) }]}
                width={136}
              />
            </g>
          ))}
        </svg>
      )}
    </div>
  )
}
