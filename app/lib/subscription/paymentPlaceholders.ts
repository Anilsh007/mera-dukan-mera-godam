"use client"

import type { CreateCheckoutSessionRequest, VerifyPaymentRequest } from "./contracts"
import { createSubscriptionCheckoutSession, verifySubscriptionPayment } from "./billing.client"

export type CheckoutPlaceholderInput = {
  userId: string
  plan: "starter" | "pro" | "business"
}

export async function createCheckoutSession(input: CheckoutPlaceholderInput) {
  const payload: CreateCheckoutSessionRequest = {
    plan: input.plan,
    billingCycle: "monthly",
  }

  return createSubscriptionCheckoutSession(payload)
}

export async function verifyPayment(reference: string) {
  const payload: VerifyPaymentRequest = {
    plan: "starter",
    billingCycle: "monthly",
    razorpayPaymentId: reference,
  }

  return verifySubscriptionPayment(payload)
}

export async function handleWebhook(payload: unknown) {
  return {
    ok: false,
    provider: "razorpay-placeholder",
    payload,
    message: "Webhook placeholder moved to /api/subscription/webhook.",
  }
}
