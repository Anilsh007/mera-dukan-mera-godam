"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Button from "@/app/components/ui/Button"
import { verifySubscriptionPayment } from "@/app/lib/subscription/billing.client"
import type { PaidSubscriptionPlanId, SubscriptionBillingCycle } from "@/app/lib/subscription/catalog"
import { en } from "@/app/messages/en"

type VerificationState = {
  loading: boolean
  success: boolean | null
  message: string
  details: string[]
}

const DEFAULT_STATE: VerificationState = {
  loading: true,
  success: null,
  message: "Checking subscription payment details...",
  details: [],
}

function isPlan(value: string | null): value is PaidSubscriptionPlanId {
  return value === "starter" || value === "pro" || value === "business"
}

function isCycle(value: string | null): value is SubscriptionBillingCycle {
  return value === "monthly" || value === "quarterly" || value === "yearly"
}

export default function SubscriptionVerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<VerificationState>(DEFAULT_STATE)

  const verificationInput = useMemo(() => {
    const plan = searchParams.get("plan")
    const billingCycle = searchParams.get("billingCycle")
    const transactionId = searchParams.get("transactionId") || undefined
    const razorpayPaymentId = searchParams.get("razorpay_payment_id") || undefined
    const razorpayOrderId = searchParams.get("razorpay_order_id") || undefined
    const razorpaySubscriptionId = searchParams.get("razorpay_subscription_id") || undefined
    const razorpaySignature = searchParams.get("razorpay_signature") || undefined

    if (!isPlan(plan) || !isCycle(billingCycle)) {
      return null
    }

    return {
      plan,
      billingCycle,
      transactionId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySubscriptionId,
      razorpaySignature,
    }
  }, [searchParams])

  useEffect(() => {
    let active = true

    void (async () => {
      if (!verificationInput) {
        if (active) {
          setState({
            loading: false,
            success: false,
            message: "Missing subscription payment details in the URL.",
            details: [
              "Expected plan and billingCycle query parameters.",
              "After Razorpay setup, redirect the user back to this page with payment identifiers.",
            ],
          })
        }
        return
      }

      try {
        const response = await verifySubscriptionPayment(verificationInput)
        if (!active) return

        setState({
          loading: false,
          success: response.ok,
          message: response.message,
          details: response.nextSteps,
        })
      } catch (error) {
        if (!active) return

        setState({
          loading: false,
          success: false,
          message: error instanceof Error ? error.message : "Could not verify the subscription payment.",
          details: [],
        })
      }
    })()

    return () => {
      active = false
    }
  }, [verificationInput])

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <section className="rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">{en.subscription.billingTitle}</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">Subscription Verification</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            This page is the handoff point for Razorpay success redirects and server-side payment verification.
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-5">
          <p className="text-base font-semibold text-[var(--text-primary)]">{state.message}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {state.loading ? "Please wait while the payment verification flow runs." : state.success ? "Verification finished." : "Verification is not complete yet."}
          </p>

          {state.details.length ? (
            <div className="mt-4 space-y-2">
              {state.details.map((detail) => (
                <div key={detail} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {detail}
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="primary" title="Back to billing" onClick={() => router.push("/dashboard/settings/subscription")} />
            <Button type="button" variant="outline" title="Open pricing" onClick={() => router.push("/pricing")} />
          </div>
        </div>
      </section>
    </main>
  )
}
