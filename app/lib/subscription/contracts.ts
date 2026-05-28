import type { SubscriptionRecord } from "@/app/lib/db"
import type { BillingPlanCatalog, PaidSubscriptionPlanId, SubscriptionBillingCycle } from "./catalog"

export type SubscriptionServerRecord = SubscriptionRecord & {
  billingCycle?: SubscriptionBillingCycle
  providerPaymentId?: string
}

export type SubscriptionInvoice = {
  id: string
  status: string
  amountInPaise: number
  amountPaidInPaise: number
  currencySymbol: string
  shortUrl?: string
  invoiceNumber?: string
  paymentId?: string
  issuedAt?: number
  paidAt?: number
  billingStart?: number
  billingEnd?: number
}

export type SubscriptionStatusResponse = {
  ok: boolean
  provider: "razorpay-placeholder" | "razorpay"
  providerConfigured: boolean
  setupRequired: boolean
  subscription: SubscriptionServerRecord | null
  catalog: BillingPlanCatalog
  configuredPlanMatrix?: Record<PaidSubscriptionPlanId, Record<SubscriptionBillingCycle, boolean>>
  message?: string
  nextSteps?: string[]
}

export type CreateCheckoutSessionRequest = {
  plan: PaidSubscriptionPlanId
  billingCycle: SubscriptionBillingCycle
  returnUrl?: string
}

export type CreateCheckoutSessionResponse = {
  ok: boolean
  provider: "razorpay-placeholder" | "razorpay"
  providerConfigured: boolean
  mode: "placeholder" | "live-subscription"
  transactionId: string
  plan: PaidSubscriptionPlanId
  billingCycle: SubscriptionBillingCycle
  amountInPaise: number
  checkoutUrl: string | null
  providerOrderId: string | null
  providerSubscriptionId: string | null
  message: string
  nextSteps: string[]
}

export type VerifyPaymentRequest = {
  plan: PaidSubscriptionPlanId
  billingCycle: SubscriptionBillingCycle
  transactionId?: string
  razorpayPaymentId?: string
  razorpayOrderId?: string
  razorpaySubscriptionId?: string
  razorpaySignature?: string
}

export type VerifyPaymentResponse = {
  ok: boolean
  provider: "razorpay-placeholder" | "razorpay"
  message: string
  nextSteps: string[]
}

export type SubscriptionInvoicesResponse = {
  ok: boolean
  provider: "razorpay-placeholder" | "razorpay"
  invoices: SubscriptionInvoice[]
  message?: string
}
