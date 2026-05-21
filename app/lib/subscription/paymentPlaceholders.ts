"use client"

import { en } from "@/app/messages/en"

export type CheckoutPlaceholderInput = {
  userId: string
  plan: "starter" | "pro" | "business"
}

export async function createCheckoutSession(input: CheckoutPlaceholderInput) {
  return {
    ok: false,
    provider: "placeholder",
    checkoutUrl: null,
    message: `${en.subscription.placeholderPayments} (${input.plan})`,
  }
}

export async function verifyPayment(reference: string) {
  return {
    ok: false,
    provider: "placeholder",
    reference,
    message: en.subscription.placeholderPayments,
  }
}

export async function handleWebhook(payload: unknown) {
  return {
    ok: false,
    provider: "placeholder",
    payload,
    message: en.subscription.placeholderPayments,
  }
}
