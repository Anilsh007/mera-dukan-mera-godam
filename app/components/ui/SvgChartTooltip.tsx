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

export default function SvgChartTooltip({ x, y, svgWidth, title, rows, width = 156 }: SvgChartTooltipProps) {
  const height = 26 + rows.length * 18
  const edgePadding = 8
  const tooltipX = Math.min(Math.max(x - width / 2, edgePadding), svgWidth - width - edgePadding)
  const tooltipY = Math.max(y - height - 14, edgePadding)

  return (
    <g className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
      <rect
        x={tooltipX}
        y={tooltipY}
        width={width}
        height={height}
        rx="12"
        className="fill-[var(--bg-card-strong)] stroke-[var(--border-card)] drop-shadow-sm"
      />
      <text x={tooltipX + 12} y={tooltipY + 17} className="fill-[var(--text-primary)] text-[10px] font-bold">
        {title}
      </text>
      {rows.map((row, index) => (
        <text key={`${row.label}-${index}`} x={tooltipX + 12} y={tooltipY + 34 + index * 18} className="fill-[var(--text-secondary)] text-[10px]">
          <tspan>{row.label}: </tspan>
          <tspan className="font-bold fill-[var(--text-primary)]">{row.value}</tspan>
        </text>
      ))}
    </g>
  )
}
