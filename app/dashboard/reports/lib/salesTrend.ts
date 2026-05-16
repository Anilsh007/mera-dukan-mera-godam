import type { ProductLog } from "@/app/lib/db"
import type { ChartPoint, DateRangeKey } from "../types"
import { safeNumber, formatMonthLabel, formatShortDate } from "./format"
import { getStartOfDay, toDateKey, toMonthKey } from "./dateRange"

export function buildSalesTrend(logs: ProductLog[], rangeKey: DateRangeKey): ChartPoint[] {
  if (rangeKey === "all") return buildMonthlySalesTrend(logs)

  const days = rangeKey === "today" ? 1 : rangeKey === "7d" ? 7 : rangeKey === "30d" ? 30 : 90
  const start = getStartOfDay(new Date())
  start.setDate(start.getDate() - (days - 1))
  const buckets = new Map<string, number>()

  for (let index = 0; index < days; index += 1) {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    buckets.set(toDateKey(day), 0)
  }

  logs.forEach((log) => {
    const key = toDateKey(new Date(log.date))
    if (!buckets.has(key)) return
    buckets.set(key, (buckets.get(key) || 0) + Math.abs(safeNumber(log.quantityAdded)) * safeNumber(log.price))
  })

  return Array.from(buckets.entries()).map(([dateKey, value]) => ({ label: formatShortDate(dateKey), value }))
}

function buildMonthlySalesTrend(logs: ProductLog[]): ChartPoint[] {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth() - 11, 1)
  const buckets = new Map<string, number>()

  for (let index = 0; index < 12; index += 1) {
    const month = new Date(start.getFullYear(), start.getMonth() + index, 1)
    buckets.set(toMonthKey(month), 0)
  }

  logs.forEach((log) => {
    const date = new Date(log.date)
    if (Number.isNaN(date.getTime()) || date < start) return
    const key = toMonthKey(date)
    if (!buckets.has(key)) return
    buckets.set(key, (buckets.get(key) || 0) + Math.abs(safeNumber(log.quantityAdded)) * safeNumber(log.price))
  })

  return Array.from(buckets.entries()).map(([monthKey, value]) => ({ label: formatMonthLabel(monthKey), value }))
}
