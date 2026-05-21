"use client"

import SvgChartTooltip from "@/app/components/ui/SvgChartTooltip"
import { en } from "@/app/messages/en"

export type MetricBar = {
  label: string
  value: number
  secondaryValue?: string
  tooltipRows?: { label: string; value: string }[]
}

type MetricBarChartProps = {
  bars: MetricBar[]
  ariaLabel: string
  valueLabel: string
  formatValue: (value: number) => string
  heightClassName?: string
}

export default function MetricBarChart({ bars, ariaLabel, valueLabel, formatValue, heightClassName = "h-64" }: MetricBarChartProps) {
  const safeBars = bars.slice(0, 8)
  const width = 720
  const height = 260
  const padding = 28
  const chartHeight = height - padding * 2
  const chartWidth = width - padding * 2
  const maxValue = Math.max(...safeBars.map((bar) => bar.value), 1)
  const barGap = 14
  const barWidth = safeBars.length ? Math.max(20, (chartWidth - barGap * (safeBars.length - 1)) / safeBars.length) : chartWidth

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--surface-outline)] bg-[var(--surface-subtle)] p-3">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} className={`${heightClassName} w-full overflow-visible`}>
        {[0, 0.5, 1].map((line) => (
          <line
            key={line}
            x1={padding}
            x2={width - padding}
            y1={padding + chartHeight * line}
            y2={padding + chartHeight * line}
            className="stroke-[var(--border-card)]"
            strokeDasharray="5 8"
          />
        ))}

        {safeBars.map((bar, index) => {
          const x = padding + index * (barWidth + barGap)
          const barHeight = (bar.value / maxValue) * chartHeight
          const y = padding + chartHeight - barHeight
          const center = x + barWidth / 2
          const rows = bar.tooltipRows?.length
            ? bar.tooltipRows
            : [
                { label: valueLabel, value: formatValue(bar.value) },
                ...(bar.secondaryValue ? [{ label: en.reports.units, value: bar.secondaryValue }] : []),
              ]

          return (
            <g
              key={`${bar.label}-${index}`}
              tabIndex={0}
              className="group cursor-pointer outline-none"
              aria-label={`${bar.label}. ${valueLabel}: ${formatValue(bar.value)}`}
            >
              <title>{`${bar.label} • ${valueLabel}: ${formatValue(bar.value)}`}</title>
              <rect x={x} y={padding} width={barWidth} height={chartHeight} rx="12" fill="transparent" />
              <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 4)} rx="12" className="fill-[var(--accent)] opacity-80 transition-opacity group-hover:opacity-100 group-focus:opacity-100" />
              <circle cx={center} cy={y} r="4" className="fill-[var(--bg-card-strong)] opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100" stroke="var(--accent)" strokeWidth="2.5" />
              <text x={center} y={height - 6} textAnchor="middle" className="fill-[var(--text-muted)] text-[10px]">
                {bar.label.length > 10 ? `${bar.label.slice(0, 10)}…` : bar.label}
              </text>
              <SvgChartTooltip x={center} y={Math.max(y, padding + 12)} svgWidth={width} title={bar.label} rows={rows} width={190} />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
