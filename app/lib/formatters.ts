import { en } from "@/app/messages/en"

export function formatCurrency(value: number | string | null | undefined) {
  return `${en.common.rupeeSymbol} ${Number(value || 0).toLocaleString("en-IN")}`
}

export function formatDateTime(value: string | number | Date) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}
