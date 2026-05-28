"use client"

import { db } from "@/app/lib/db"
import { authHeaders, getFirebaseIdToken, readApiError } from "@/app/lib/apiClient"
import type {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  SubscriptionInvoicesResponse,
  SubscriptionStatusResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from "./contracts"

async function requireIdToken() {
  const token = await getFirebaseIdToken()
  if (!token) {
    throw new Error("You need to sign in first.")
  }
  return token
}

export async function fetchSubscriptionStatus() {
  const token = await requireIdToken()
  const response = await fetch("/api/subscription/status", {
    method: "GET",
    headers: authHeaders(token),
    cache: "no-store",
  })

  if (!response.ok) {
    throw await readApiError(response, "Subscription status request")
  }

  return (await response.json()) as SubscriptionStatusResponse
}

export async function syncSubscriptionFromServer(userId: string) {
  const response = await fetchSubscriptionStatus()
  if (response.subscription) {
    await db.subscriptions.put({
      ...response.subscription,
      id: response.subscription.id || userId,
      userId,
    })
  }
  return response
}

export async function createSubscriptionCheckoutSession(payload: CreateCheckoutSessionRequest) {
  const token = await requireIdToken()
  const response = await fetch("/api/subscription/checkout", {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await readApiError(response, "Subscription checkout request")
  }

  return (await response.json()) as CreateCheckoutSessionResponse
}

export async function verifySubscriptionPayment(payload: VerifyPaymentRequest) {
  const token = await requireIdToken()
  const response = await fetch("/api/subscription/verify", {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await readApiError(response, "Subscription verification request")
  }

  return (await response.json()) as VerifyPaymentResponse
}

export async function fetchSubscriptionInvoices() {
  const token = await requireIdToken()
  const response = await fetch("/api/subscription/invoices", {
    method: "GET",
    headers: authHeaders(token),
    cache: "no-store",
  })

  if (!response.ok) {
    throw await readApiError(response, "Subscription invoices request")
  }

  return (await response.json()) as SubscriptionInvoicesResponse
}
