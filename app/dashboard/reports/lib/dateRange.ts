import type { DateRangeKey } from "../types"
import { en } from "@/app/messages/en"

export const RANGE_OPTIONS: Array<{ key: DateRangeKey; label: string }> = [
  { key: "today", label: en.stockHistory.today },
  { key: "7d", label: en.reports.last7Days },
  { key: "30d", label: en.reports.last30Days },
  { key: "90d", label: en.reports.last90Days },
  { key: "all", label: en.reports.allTime },
]

export function getRangeStart(rangeKey: DateRangeKey) {
  if (rangeKey === "all") return null
  const start = getStartOfDay(new Date())
  if (rangeKey === "today") return start
  const days = rangeKey === "7d" ? 7 : rangeKey === "30d" ? 30 : 90
  start.setDate(start.getDate() - (days - 1))
  return start
}

export function filterByDate<T>(items: T[], start: Date | null, getDate: (item: T) => string | undefined) {
  if (!start) return items
  return items.filter((item) => {
    const value = getDate(item)
    if (!value) return false
    const time = new Date(value).getTime()
    return Number.isFinite(time) && time >= start.getTime()
  })
}

export function getStartOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function toMonthKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}
