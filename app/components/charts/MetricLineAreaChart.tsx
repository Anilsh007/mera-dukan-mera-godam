"use client"

import { useId } from "react"
import SvgChartTooltip from "@/app/components/ui/SvgChartTooltip"
import { buildAreaPath, buildSmoothPath } from "@/app/lib/chart.utils"
import { en } from "@/app/messages/en"

export type MetricTooltipRow = {
  label: string
  value: string
}

export type MetricLinePoint = {
  label: string
  value: number
  tooltipRows?: MetricTooltipRow[]
}

type MetricLineAreaChartProps = {
  points: MetricLinePoint[]
  ariaLabel: string
  valueLabel: string
  formatValue: (value: number) => string
  heightClassName?: string
  showEveryLabel?: boolean
}

export default function MetricLineAreaChart({
  points,
  ariaLabel,
  valueLabel,
  formatValue,
  heightClassName = "h-64",
  showEveryLabel = false,
}: MetricLineAreaChartProps) {
  const gradientId = useId().replace(/:/g, "")
  const safePoints = points.length ? points : [{ label: en.common.notAvailable, value: 0 }]
  const width = 720
  const height = 260
  const padding = 28
  const usableWidth = width - padding * 2
  const usableHeight = height - padding * 2
  const minValue = Math.min(...safePoints.map((point) => point.value), 0)
  const maxValue = Math.max(...safePoints.map((point) => point.value), 1)
  const valueRange = Math.max(maxValue - minValue, 1)
  const total = safePoints.reduce((sum, point) => sum + Math.abs(point.value), 0)
  const peak = safePoints.reduce((best, point) => (point.value > best.value ? point : best), safePoints[0])
  const coordinates = safePoints.map((point, index) => {
    const x = padding + (safePoints.length === 1 ? usableWidth : (index / (safePoints.length - 1)) * usableWidth)
    const y = padding + usableHeight - ((point.value - minValue) / valueRange) * usableHeight
    return { ...point, x, y }
  })
  const path = buildSmoothPath(coordinates)
  const areaPath = buildAreaPath(coordinates, height - padding)
  const labelStep = Math.max(1, Math.ceil(coordinates.length / 7))

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--surface-outline)] bg-[var(--surface-subtle)] p-3">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} className={`${heightClassName} w-full overflow-visible`}>
        <defs>
          <linearGradient id={`${gradientId}-line`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="55%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id={`${gradientId}-area`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((line) => (
          <line
            key={line}
            x1={padding}
            x2={width - padding}
            y1={padding + usableHeight * line}
            y2={padding + usableHeight * line}
            className="stroke-[var(--border-card)]"
            strokeDasharray="5 8"
          />
        ))}

        {total > 0 ? <path d={areaPath} fill={`url(#${gradientId}-area)`} /> : null}
        {total > 0 ? <path d={path} fill="none" stroke={`url(#${gradientId}-line)`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}

        {coordinates.map((point, index) => {
          const showLabel = showEveryLabel || index === 0 || index === coordinates.length - 1 || index % labelStep === 0 || point.value === peak.value
          const rows = point.tooltipRows?.length ? point.tooltipRows : [{ label: valueLabel, value: formatValue(point.value) }]

          return (
            <g
              key={`${point.label}-${point.x}`}
              tabIndex={0}
              className="group cursor-pointer outline-none"
              aria-label={`${en.reports.date}: ${point.label}. ${valueLabel}: ${formatValue(point.value)}`}
            >
              <title>{`${en.reports.date}: ${point.label} • ${valueLabel}: ${formatValue(point.value)}`}</title>
              <rect x={point.x - 14} y={padding} width="28" height={usableHeight} fill="transparent" />
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
                r={point.value === peak.value && point.value > 0 ? "6" : point.value > 0 ? "4.5" : "3.5"}
                className="fill-[var(--bg-card-strong)]"
                stroke={`url(#${gradientId}-line)`}
                strokeWidth="3"
              />
              {showLabel ? (
                <text x={point.x} y={height - 5} textAnchor="middle" className="fill-[var(--text-muted)] text-[11px]">
                  {point.label}
                </text>
              ) : null}
              <SvgChartTooltip x={point.x} y={point.y} svgWidth={width} title={point.label} rows={rows} width={178} />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
