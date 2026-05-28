"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Button from "@/app/components/ui/Button"
import { auth } from "@/app/lib/firebase"
import { verifySubscriptionPayment } from "@/app/lib/subscription/billing.client"
import { en } from "@/app/messages/en"

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: (response: unknown) => void) => void
    }
  }
}

type CheckoutState = {
  loading: boolean
  message: string
}

const DEFAULT_STATE: CheckoutState = {
  loading: true,
  message: "Preparing secure subscription checkout...",
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true })
      existing.addEventListener("error", () => resolve(false), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function SubscriptionCheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const launchedRef = useRef(false)
  const [state, setState] = useState<CheckoutState>(DEFAULT_STATE)

  const checkoutInput = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""
    const subscriptionId = searchParams.get("subscriptionId") || ""
    const transactionId = searchParams.get("transactionId") || ""
    const plan = searchParams.get("plan") || ""
    const billingCycle = searchParams.get("billingCycle") || ""
    const amount = searchParams.get("amount") || ""
    const label = searchParams.get("label") || ""

    if (!key || !subscriptionId || !transactionId || !plan || !billingCycle) {
      return null
    }

    return {
      key,
      subscriptionId,
      transactionId,
      plan,
      billingCycle,
      amount,
      label,
    }
  }, [searchParams])

  useEffect(() => {
    if (launchedRef.current) return
    if (!checkoutInput) {
      setState({
        loading: false,
        message: "Missing checkout parameters. Please start the subscription flow again.",
      })
      return
    }

    launchedRef.current = true

    void (async () => {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded || !window.Razorpay) {
        setState({
          loading: false,
          message: "Could not load Razorpay checkout. Please refresh and try again.",
        })
        return
      }

      const currentUser = auth?.currentUser
      const options: Record<string, unknown> = {
        key: checkoutInput.key,
        subscription_id: checkoutInput.subscriptionId,
        name: en.common.appName,
        description: `${checkoutInput.plan} ${checkoutInput.billingCycle}`,
        image: undefined,
        handler: async (response: unknown) => {
          const data = response as {
            razorpay_payment_id?: string
            razorpay_subscription_id?: string
            razorpay_signature?: string
          }

          setState({
            loading: true,
            message: "Payment received. Verifying subscription and updating your dashboard...",
          })

          try {
            await verifySubscriptionPayment({
              plan: checkoutInput.plan as "starter" | "pro" | "business",
              billingCycle: checkoutInput.billingCycle as "monthly" | "quarterly" | "yearly",
              transactionId: checkoutInput.transactionId,
              razorpayPaymentId: data.razorpay_payment_id,
              razorpaySubscriptionId: data.razorpay_subscription_id,
              razorpaySignature: data.razorpay_signature,
            })

            router.replace("/dashboard/settings/subscription?payment=success")
          } catch (error) {
            setState({
              loading: false,
              message: error instanceof Error ? error.message : "Could not verify the subscription payment.",
            })
          }
        },
        modal: {
          ondismiss: () => {
            router.replace("/dashboard/settings/subscription?payment=cancelled")
          },
        },
        prefill: {
          name: currentUser?.displayName || "",
          email: currentUser?.email || "",
          contact: currentUser?.phoneNumber || "",
        },
        theme: {
          color: "#3b82f6",
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on("payment.failed", () => {
        setState({
          loading: false,
          message: "Payment was not completed. Please try again.",
        })
      })

      razorpay.open()
    })()
  }, [checkoutInput, router])

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <section className="rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-8">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">{en.subscription.billingTitle}</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">Complete Subscription</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            Your payment stays inside Razorpay checkout. After payment, we verify it on the server and bring you back to the dashboard.
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-5">
          <p className="text-base font-semibold text-[var(--text-primary)]">{state.message}</p>
          {checkoutInput?.amount ? (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Subscription amount: {checkoutInput.amount}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" title="Back to billing" onClick={() => router.replace("/dashboard/settings/subscription")} />
          </div>
        </div>
      </section>
    </main>
  )
}
