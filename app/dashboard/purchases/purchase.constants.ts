import type { PurchasePaymentStatus } from "@/app/lib/db"
import { en } from "@/app/messages/en"

export const PAYMENT_MODES = [
  en.purchases.paymentModes.cash,
  en.purchases.paymentModes.upi,
  en.purchases.paymentModes.bankTransfer,
  en.purchases.paymentModes.card,
  en.purchases.paymentModes.cheque,
  en.purchases.paymentModes.credit,
]

export const PAYMENT_STATUSES: Array<{ value: PurchasePaymentStatus; label: string }> = [
  { value: "paid", label: en.purchases.paymentStatuses.paid },
  { value: "partial", label: en.purchases.paymentStatuses.partial },
  { value: "unpaid", label: en.purchases.paymentStatuses.unpaid },
]

export const DEFAULT_PAYMENT_MODE = " "