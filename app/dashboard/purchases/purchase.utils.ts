import type { PurchasePaymentStatus, PurchaseRecord } from "@/app/lib/db"
import { formatCurrency as formatIndianCurrency } from "@/app/lib/formatters"

export function calculatePaymentAmounts(
  totalAmount: number,
  paymentStatus: PurchasePaymentStatus | "",
  amountPaid: number | string
) {
  const parsedPaid = Number(amountPaid || 0)
  const safePaid = Math.min(Math.max(parsedPaid, 0), totalAmount)
  const paidAmount =
    paymentStatus === "paid" ? totalAmount : paymentStatus === "unpaid" ? 0 : safePaid

  return {
    paidAmount,
    dueAmount: Math.max(totalAmount - paidAmount, 0),
  }
}

export function formatPurchaseDate(purchase: PurchaseRecord) {
  if (!purchase.purchaseDateTime) return purchase.purchaseDate

  return new Date(purchase.purchaseDateTime).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function getPaymentStatusClass(status: PurchasePaymentStatus) {
  const base = "rounded-full px-3 py-1 text-xs font-semibold capitalize"
  if (status === "paid") return `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300`
  if (status === "partial") return `${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`
  return `${base} bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300`
}

export function formatCurrency(value: number) {
  return formatIndianCurrency(value)
}
