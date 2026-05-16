import { en } from "@/app/messages/en"

export function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

export function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

export function formatMonthLabel(value: string) {
  const date = new Date(`${value}-01T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
}

export function formatMoney(value: number) {
  return `${en.common.rupeeSymbol} ${Math.round(safeNumber(value)).toLocaleString("en-IN")}`
}

export function formatNumber(value: number) {
  return safeNumber(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })
}

export function safeNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
