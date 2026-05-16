type SvgChartTooltipRow = {
  label: string
  value: string
}

type SvgChartTooltipProps = {
  x: number
  y: number
  svgWidth: number
  title: string
  rows: SvgChartTooltipRow[]
  width?: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function SvgChartTooltip({ x, y, svgWidth, title, rows, width = 150 }: SvgChartTooltipProps) {
  const rowHeight = 15
  const height = 24 + rows.length * rowHeight
  const tooltipX = clamp(x - width / 2, 4, svgWidth - width - 4)
  const tooltipY = clamp(y - height - 14, 4, Number.POSITIVE_INFINITY)
  const pointerY = tooltipY + height

  return (
    <g className="pointer-events-none opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100">
      <line
        x1={x}
        x2={x}
        y1={Math.min(pointerY, y)}
        y2={y}
        className="stroke-[var(--accent)] opacity-60"
        strokeWidth="1.5"
        strokeDasharray="3 4"
      />
      <rect
        x={tooltipX}
        y={tooltipY}
        width={width}
        height={height}
        rx="12"
        className="fill-[var(--bg-card-strong)] stroke-[var(--border-card)] drop-shadow-md"
      />
      <text x={tooltipX + 10} y={tooltipY + 16} className="fill-[var(--text-primary)] text-[10px] font-bold">
        <tspan>{title}</tspan>
        {rows.map((row, index) => (
          <tspan key={`${row.label}-${index}`} x={tooltipX + 10} dy={rowHeight} className="fill-[var(--text-secondary)] font-semibold">
            {row.label}: {row.value}
          </tspan>
        ))}
      </text>
    </g>
  )
}
