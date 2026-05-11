import type { PurchasePaymentStatus } from "@/app/lib/db"

export const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Card", "Cheque", "Credit"]

export const PAYMENT_STATUSES: Array<{ value: PurchasePaymentStatus; label: string }> = [
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "unpaid", label: "Unpaid" },
]

export const DEFAULT_PAYMENT_MODE = "Cash"
