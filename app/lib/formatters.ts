import { en } from "@/app/messages/en"

type DateLike = string | number | Date | null | undefined

const DEFAULT_CURRENCY_OPTIONS: Intl.NumberFormatOptions = {
  maximumFractionDigits: 2,
}

const INDIAN_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
}

const INDIAN_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
}

export function formatNumber(value: number | string | null | undefined, options?: Intl.NumberFormatOptions) {
  return Number(value || 0).toLocaleString("en-IN", options)
}

export function formatCurrency(value: number | string | null | undefined, options?: Intl.NumberFormatOptions) {
  return `${en.common.rupeeSymbol} ${formatNumber(value, options ?? DEFAULT_CURRENCY_OPTIONS)}`
}

export function formatDateTime(value: string | number | Date) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function formatIndianDateTime(value: DateLike, fallback = "-") {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleString("en-IN", INDIAN_DATE_TIME_OPTIONS)
}

export function formatIndianDate(value: DateLike, fallback = en.common.notAvailable) {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleDateString("en-IN", INDIAN_DATE_OPTIONS)
}

export function toDateInputValue(value: DateLike = new Date()) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  return date.toISOString().slice(0, 10)
}

export function toMonthInputValue(value: DateLike = new Date()) {
  return toDateInputValue(value).slice(0, 7)
}
