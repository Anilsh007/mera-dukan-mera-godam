import type { ChartPoint } from "../types"
import { formatMoney } from "../lib/format"
import EmptyState from "./EmptyState"
import { en } from "@/app/messages/en"

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

export default function LineChart({ points }: { points: ChartPoint[] }) {
  const maxValue = Math.max(...points.map((point) => point.value), 1)
  const total = points.reduce((sum, point) => sum + point.value, 0)
  const peak = points.reduce((best, point) => (point.value > best.value ? point : best), points[0] || { label: "", value: 0 })
  const width = 720
  const height = 260
  const padding = 26
  const usableWidth = width - padding * 2
  const usableHeight = height - padding * 2
  const coordinates = points.map((point, index) => {
    const x = padding + (points.length === 1 ? usableWidth : (index / (points.length - 1)) * usableWidth)
    const y = padding + usableHeight - (point.value / maxValue) * usableHeight
    return { ...point, x, y }
  })
  const path = buildSmoothPath(coordinates)
  const areaPath = coordinates.length ? `${path} L ${coordinates[coordinates.length - 1].x} ${height - padding} L ${coordinates[0].x} ${height - padding} Z` : ""

  if (points.every((point) => point.value === 0)) {
    return <EmptyState text={en.reports.noSalesData} />
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[var(--surface-subtle)] p-4">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />
      <svg viewBox={`0 0 ${width} ${height}`} className="relative h-72 w-full" role="img" aria-label={en.reports.salesTrendChartAriaLabel}>
        <defs>
          <linearGradient id="salesAreaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="salesLineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padding + (line / 3) * usableHeight
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} className="stroke-[var(--border-card)]" strokeWidth="1" strokeDasharray="5 8" />
        })}
        <path d={areaPath} fill="url(#salesAreaGradient)" />
        <path d={path} fill="none" stroke="url(#salesLineGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map((point) => (
          <circle key={`${point.label}-${point.x}`} cx={point.x} cy={point.y} r={point.value === peak.value ? "6" : "4.5"} className="fill-[var(--bg-card-strong)]" stroke="url(#salesLineGradient)" strokeWidth="3" />
        ))}
        {coordinates.map((point, index) => {
          if (points.length > 14 && index % Math.ceil(points.length / 7) !== 0 && index !== points.length - 1) return null
          return (
            <text key={point.label} x={point.x} y={height - 5} textAnchor="middle" className="fill-[var(--text-muted)] text-[11px]">
              {point.label}
            </text>
          )
        })}
      </svg>
      <div className="relative mt-2 grid grid-cols-1 gap-3 text-xs text-[var(--text-secondary)] min-[520px]:grid-cols-3">
        <span className="rounded-2xl bg-[var(--bg-card-strong)] px-3 py-2"><strong className="text-[var(--text-primary)]">{en.reports.peak}:</strong> {formatMoney(maxValue)}</span>
        <span className="rounded-2xl bg-[var(--bg-card-strong)] px-3 py-2"><strong className="text-[var(--text-primary)]">{en.reports.total}:</strong> {formatMoney(total)}</span>
        <span className="rounded-2xl bg-[var(--bg-card-strong)] px-3 py-2"><strong className="text-[var(--text-primary)]">{en.dashboard.peakDay}:</strong> {peak.label || en.common.notAvailable}</span>
      </div>
    </div>
  )
}
