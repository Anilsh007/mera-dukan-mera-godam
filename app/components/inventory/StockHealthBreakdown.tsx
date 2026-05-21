import { en } from "@/app/messages/en"
import type { StockHealth } from "@/app/dashboard/reports/types"

type StockHealthBreakdownProps = {
  health: StockHealth
  chartSizeClassName?: string
  gridClassName?: string
  itemClassName?: string
  barTrackClassName?: string
  showEmpty?: boolean
}

const STOCK_HEALTH_SEGMENTS = [
  { key: "healthy", label: en.inventory.healthy, strokeClass: "stroke-emerald-500", bgClass: "bg-emerald-500" },
  { key: "low", label: en.inventory.low, strokeClass: "stroke-amber-500", bgClass: "bg-amber-500" },
  { key: "critical", label: en.inventory.critical, strokeClass: "stroke-orange-500", bgClass: "bg-orange-500" },
  { key: "out", label: en.inventory.out, strokeClass: "stroke-red-500", bgClass: "bg-red-500" },
] as const

export function getStockHealthTotal(health: StockHealth) {
  return health.healthy + health.low + health.critical + health.out
}

export default function StockHealthBreakdown({
  health,
  chartSizeClassName = "h-44 w-44",
  gridClassName = "grid grid-cols-1 gap-5 min-[460px]:grid-cols-[0.75fr_1fr] min-[460px]:items-center",
  itemClassName = "rounded-2xl border border-[var(--surface-outline)] bg-[var(--surface-subtle)] p-3",
  barTrackClassName = "bg-[var(--chart-grid)]",
  showEmpty = true,
}: StockHealthBreakdownProps) {
  const total = getStockHealthTotal(health)
  const safeTotal = Math.max(total, 1)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const healthyPercent = total > 0 ? Math.round((health.healthy / safeTotal) * 100) : 0
  const chartSegments = STOCK_HEALTH_SEGMENTS.reduce<Array<(typeof STOCK_HEALTH_SEGMENTS)[number] & { dash: string; dashOffset: number; value: number }>>(
    (acc, segment) => {
      const value = health[segment.key]
      const length = (value / safeTotal) * circumference
      const previousOffset = acc.reduce((sum, item) => sum + Number(item.dash.split(" ")[0] || 0), 0)
      if (value > 0) {
        acc.push({
          ...segment,
          value,
          dash: `${length} ${circumference - length}`,
          dashOffset: -previousOffset,
        })
      }
      return acc
    },
    [],
  )

  if (!showEmpty && total === 0) return null

  return (
    <div className={gridClassName}>
      <div className={`relative mx-auto ${chartSizeClassName}`}>
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" role="img" aria-label={en.dashboard.stockHealthChartAriaLabel}>
          <circle cx="60" cy="60" r={radius} className="fill-none stroke-[var(--chart-grid)]" strokeWidth="16" />
          {chartSegments.map((segment) => (
            <circle
              key={segment.key}
              cx="60"
              cy="60"
              r={radius}
              className={`fill-none ${segment.strokeClass}`}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={segment.dash}
              strokeDashoffset={segment.dashOffset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-black text-[var(--text-primary)]">{healthyPercent}%</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{en.dashboard.healthyStock}</p>
        </div>
      </div>

      <div className="space-y-2">
        {STOCK_HEALTH_SEGMENTS.map((segment) => {
          const value = health[segment.key]
          const percent = total > 0 ? Math.round((value / safeTotal) * 100) : 0
          return (
            <div key={segment.key} className={itemClassName}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${segment.bgClass}`} />
                  <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{segment.label}</span>
                </div>
                <span className="text-sm font-bold text-[var(--text-primary)]">{value}</span>
              </div>
              <div className={`h-1.5 overflow-hidden rounded-full ${barTrackClassName}`}>
                <div className={`h-full rounded-full ${segment.bgClass}`} style={{ width: `${Math.max(percent, value > 0 ? 3 : 0)}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
