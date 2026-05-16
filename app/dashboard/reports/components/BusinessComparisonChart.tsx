import type { BusinessTrendPoint } from "../types"
import { formatMoney } from "../lib/format"
import EmptyState from "./EmptyState"
import { en } from "@/app/messages/en"

type BusinessComparisonChartProps = {
  points: BusinessTrendPoint[]
}

function shouldShowLabel(index: number, total: number) {
  if (total <= 8) return true
  const step = Math.ceil(total / 6)
  return index === 0 || index === total - 1 || index % step === 0
}

export default function BusinessComparisonChart({ points }: BusinessComparisonChartProps) {
  const visiblePoints = points.filter((point) => point.sales > 0 || point.purchases > 0)
  if (!visiblePoints.length) return <EmptyState text={en.reports.noData} />

  const width = 760
  const height = 300
  const paddingX = 34
  const paddingY = 30
  const usableWidth = width - paddingX * 2
  const usableHeight = height - paddingY * 2
  const maxValue = points.reduce((max, point) => Math.max(max, point.sales, point.purchases), 1)
  const barGroupWidth = usableWidth / Math.max(points.length, 1)
  const barWidth = Math.max(Math.min(barGroupWidth * 0.28, 18), 5)
  const totalSales = points.reduce((sum, point) => sum + point.sales, 0)
  const totalPurchases = points.reduce((sum, point) => sum + point.purchases, 0)
  const margin = totalSales - totalPurchases

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[var(--surface-subtle)] p-4">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-orange-400/20 blur-3xl" aria-hidden="true" />

      <div className="relative mb-4 grid grid-cols-1 gap-3 min-[560px]:grid-cols-3">
        <div className="rounded-2xl bg-[var(--bg-card-strong)] px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{en.reports.sales}</p>
          <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(totalSales)}</p>
        </div>
        <div className="rounded-2xl bg-[var(--bg-card-strong)] px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{en.reports.purchaseValue}</p>
          <p className="mt-1 text-lg font-bold text-orange-600 dark:text-orange-300">{formatMoney(totalPurchases)}</p>
        </div>
        <div className="rounded-2xl bg-[var(--bg-card-strong)] px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{en.reports.netMovement}</p>
          <p className={`mt-1 text-lg font-bold ${margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-300"}`}>{formatMoney(margin)}</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="relative h-80 w-full" role="img" aria-label={en.reports.businessTrendChartAriaLabel}>
        <defs>
          <linearGradient id="salesBarGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.58" />
          </linearGradient>
          <linearGradient id="purchaseBarGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#facc15" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((line) => {
          const y = paddingY + usableHeight * line
          return <line key={line} x1={paddingX} x2={width - paddingX} y1={y} y2={y} className="stroke-[var(--border-card)]" strokeDasharray="5 8" />
        })}
        {points.map((point, index) => {
          const centerX = paddingX + barGroupWidth * index + barGroupWidth / 2
          const salesHeight = (point.sales / maxValue) * usableHeight
          const purchaseHeight = (point.purchases / maxValue) * usableHeight
          const salesY = paddingY + usableHeight - salesHeight
          const purchaseY = paddingY + usableHeight - purchaseHeight
          return (
            <g key={`${point.label}-${index}`}>
              <rect x={centerX - barWidth - 2} y={salesY} width={barWidth} height={Math.max(salesHeight, point.sales > 0 ? 3 : 0)} rx={barWidth / 2} fill="url(#salesBarGradient)" />
              <rect x={centerX + 2} y={purchaseY} width={barWidth} height={Math.max(purchaseHeight, point.purchases > 0 ? 3 : 0)} rx={barWidth / 2} fill="url(#purchaseBarGradient)" />
              {shouldShowLabel(index, points.length) ? (
                <text x={centerX} y={height - 7} textAnchor="middle" className="fill-[var(--text-muted)] text-[11px]">
                  {point.label}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>

      <div className="relative mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{en.reports.sales}</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" />{en.reports.purchaseValue}</span>
      </div>
    </div>
  )
}
