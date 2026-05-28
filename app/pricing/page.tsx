"use client"

import { useEffect, useMemo, useState } from "react"
import { Crown } from "lucide-react"
import Button from "@/app/components/ui/Button"
import { BILLING_CYCLES, BILLING_PLAN_CATALOG, type PaidSubscriptionPlanId, type SubscriptionBillingCycle } from "@/app/lib/subscription/catalog"
import { createSubscriptionCheckoutSession, fetchSubscriptionStatus } from "@/app/lib/subscription/billing.client"
import type { SubscriptionStatusResponse } from "@/app/lib/subscription/contracts"
import { en } from "@/app/messages/en"
import { toast } from "sonner"

const PLAN_ORDER = ["trial", "free/expired-readonly", "starter", "pro", "business"] as const

function getPlanDescription(plan: (typeof PLAN_ORDER)[number], billingCatalog: typeof BILLING_PLAN_CATALOG) {
  if (plan === "trial") return en.subscription.trialBannerDescription
  if (plan === "free/expired-readonly") return en.subscription.readOnlyExpiredMessage
  return billingCatalog[plan].description
}

export default function PricingPage() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [billingStatus, setBillingStatus] = useState<SubscriptionStatusResponse | null>(null)
  const [statusResolved, setStatusResolved] = useState(false)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const status = await fetchSubscriptionStatus()
        if (active) setBillingStatus(status)
      } catch {
        if (active) setBillingStatus(null)
      } finally {
        if (active) setStatusResolved(true)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const configuredMatrix = useMemo(() => billingStatus?.configuredPlanMatrix || null, [billingStatus])
  const configuredEntries = useMemo(() => {
    if (!configuredMatrix) return []

    return (Object.keys(BILLING_PLAN_CATALOG) as PaidSubscriptionPlanId[]).flatMap((plan) =>
      BILLING_CYCLES
        .filter((cycle) => configuredMatrix[plan]?.[cycle])
        .map((cycle) => ({ plan, cycle })),
    )
  }, [configuredMatrix])

  const hasConfiguredPlans = configuredEntries.length > 0
  const billingCatalog = billingStatus?.catalog || BILLING_PLAN_CATALOG
  const planHasConfiguredCycle = (plan: PaidSubscriptionPlanId) =>
    BILLING_CYCLES.some((cycle) => configuredMatrix?.[plan]?.[cycle])

  const handleUpgrade = async (plan: PaidSubscriptionPlanId, billingCycle: SubscriptionBillingCycle) => {
    const key = `${plan}:${billingCycle}`
    setLoadingKey(key)

    try {
      const result = await createSubscriptionCheckoutSession({
        plan,
        billingCycle,
        returnUrl: "/dashboard/settings/subscription/verify",
      })
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl)
        return
      }
      toast.success(result.message)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not start subscription checkout."
      toast.error(message)
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">{en.subscription.pricingTitle}</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">{en.pages.pricingTitle}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{en.subscription.pricingDescription}</p>
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--surface-primary)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
            {en.subscription.placeholderPayments}
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {PLAN_ORDER.map((plan) => (
          <article key={plan} className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Crown size={16} aria-hidden="true" />
              </span>
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)]">{en.subscription.planLabels[plan]}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
              {getPlanDescription(plan, billingCatalog)}
            </p>

            {plan === "starter" || plan === "pro" || plan === "business" ? (
              <div className="mt-5 space-y-3">
                {statusResolved
                  ? BILLING_CYCLES.filter((cycle) => configuredMatrix?.[plan]?.[cycle]).map((cycle) => {
                  const price = billingCatalog[plan].prices[cycle]
                  const key = `${plan}:${cycle}`
                  const enabled = configuredMatrix ? configuredMatrix[plan]?.[cycle] : false
                  return (
                    <div key={cycle} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-3">
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)] capitalize">{cycle}</p>
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">{price.label} {price.periodLabel}</p>
                        </div>
                        <Button
                          type="button"
                          variant="primary"
                          title={enabled ? "Continue" : "Plan ID needed"}
                          loading={loadingKey === key}
                          disabled={!enabled}
                          onClick={() => void handleUpgrade(plan, cycle)}
                          className="w-full"
                        />
                      </div>
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        {enabled ? price.note : "Add this plan ID in .env.local to enable testing for this billing cycle."}
                      </p>
                    </div>
                  )
                })
                  : (
                    <div className="rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--surface-primary)] p-3 text-xs leading-5 text-[var(--text-muted)]">
                      Checking live checkout availability...
                    </div>
                  )}
                {statusResolved && configuredMatrix && !planHasConfiguredCycle(plan) ? (
                  <div className="rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--surface-primary)] p-3 text-xs leading-5 text-[var(--text-muted)]">
                    This plan is not enabled for test checkout yet.
                  </div>
                ) : null}
              </div>
            ) : (
              <Button type="button" variant="outline" title={plan === "trial" ? "Trial included" : "Read only after trial"} className="mt-5 w-full" disabled />
            )}
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Test Checkout Status</h2>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            Only Razorpay plans with configured IDs are shown for checkout testing.
          </p>
        </div>

        {!statusResolved ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--surface-primary)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
            Checking configured Razorpay checkout options...
          </div>
        ) : hasConfiguredPlans ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {configuredEntries.map(({ plan, cycle }) => (
              <div key={`${plan}:${cycle}`} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-primary)]">
                {billingCatalog[plan].title} {cycle} checkout ready
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--surface-primary)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
            No Razorpay plan ID is configured yet. Add one plan ID in `.env.local` and restart the dev server.
          </div>
        )}
      </section>
    </main>
  )
}
