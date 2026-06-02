import { en } from "@/app/messages/en"
import { formatIndianDateTime } from "@/app/lib/formatters"
import type { SaleRecord } from "@/app/lib/db"

export function buildItemsSummary(sale: SaleRecord) {
  const first = sale.items[0]
  if (!first) return en.common.notAvailable
  if (sale.items.length === 1) return `${first.name} x ${first.quantity}`
  return `${first.name} x ${first.quantity} + ${sale.items.length - 1} ${en.sales.moreItemsSuffix}`
}

export function formatDateTime(value: string) {
  return formatIndianDateTime(value)
}
