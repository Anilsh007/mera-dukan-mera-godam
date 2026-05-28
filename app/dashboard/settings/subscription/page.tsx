"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Button from "@/app/components/ui/Button"
import CurrentPlanCard from "@/app/components/subscription/CurrentPlanCard"
import SubscriptionRequiredModal from "@/app/components/subscription/SubscriptionRequiredModal"
import useSubscription from "@/app/hooks/useSubscription"
import useUsageLimit from "@/app/hooks/useUsageLimit"
import { auth } from "@/app/lib/firebase"
import { BILLING_CYCLES, BILLING_PLAN_CATALOG, type PaidSubscriptionPlanId, type SubscriptionBillingCycle } from "@/app/lib/subscription/catalog"
import { createSubscriptionCheckoutSession, fetchSubscriptionInvoices, fetchSubscriptionStatus } from "@/app/lib/subscription/billing.client"
import { refreshSubscriptionFromServer } from "@/app/lib/subscription/subscription.service"
import { getUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import type { SubscriptionInvoice, SubscriptionStatusResponse } from "@/app/lib/subscription/contracts"
import { PLAN_LIMITS } from "@/app/lib/subscription/plans"
import { en } from "@/app/messages/en"
import { toast } from "sonner"

const LIMIT_FEATURES = ["products", "purchases", "gstInvoices", "suppliers", "exports"] as const

function getBillingLifecycleLabel(subscriptionActive: boolean, trialActive: boolean) {
  if (subscriptionActive) return "Active subscription"
  if (trialActive) return "Trial access"
  return "Read-only access"
}

export default function SubscriptionSettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [billingStatus, setBillingStatus] = useState<SubscriptionStatusResponse | null>(null)
  const [statusResolved, setStatusResolved] = useState(false)
  const [checkoutKey, setCheckoutKey] = useState<string | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([])
  const { subscription, effectivePlan, trialDaysLeft, subscriptionExpired, trialActive, subscriptionActive, loading } = useSubscription()
  const productsUsage = useUsageLimit("products")
  const purchasesUsage = useUsageLimit("purchases")
  const gstInvoicesUsage = useUsageLimit("gstInvoices")
  const suppliersUsage = useUsageLimit("suppliers")
  const exportsUsage = useUsageLimit("exports")

  const usageMap = {
    products: productsUsage.usage,
    purchases: purchasesUsage.usage,
    gstInvoices: gstInvoicesUsage.usage,
    suppliers: suppliersUsage.usage,
    exports: exportsUsage.usage,
  }

  const statusLabel = useMemo(() => {
    if (subscriptionActive) return en.subscription.activeStatus
    if (trialActive) return en.subscription.trialStatus
    return en.subscription.expiredStatus
  }, [subscriptionActive, trialActive])

  const configuredEntries = useMemo(() => {
    if (!billingStatus?.configuredPlanMatrix) return []

    return (Object.keys(BILLING_PLAN_CATALOG) as PaidSubscriptionPlanId[]).flatMap((plan) =>
      BILLING_CYCLES
        .filter((cycle) => billingStatus.configuredPlanMatrix?.[plan]?.[cycle])
        .map((cycle) => ({ plan, cycle })),
    )
  }, [billingStatus])
  const billingCatalog = billingStatus?.catalog || BILLING_PLAN_CATALOG
  const planHasConfiguredCycle = (plan: PaidSubscriptionPlanId) =>
    BILLING_CYCLES.some((cycle) => billingStatus?.configuredPlanMatrix?.[plan]?.[cycle])

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        const [statusResponse, invoiceResponse] = await Promise.all([
          fetchSubscriptionStatus(),
          fetchSubscriptionInvoices().catch(() => ({ invoices: [] as SubscriptionInvoice[] })),
        ])
        if (active) {
          setBillingStatus(statusResponse)
          setInvoices(invoiceResponse.invoices || [])
        }
      } catch (error) {
        console.warn("Billing status load failed", error)
      } finally {
        if (active) setStatusResolved(true)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const paymentStatus = searchParams.get("payment")
    if (!paymentStatus) return

    if (paymentStatus === "success") {
      toast.success("Subscription payment verified and dashboard updated.")
      void (async () => {
        try {
          const userId = getUserIdentityFromAuthUser(auth?.currentUser)
          if (userId) {
            await refreshSubscriptionFromServer(userId)
          }
          const response = await fetchSubscriptionStatus()
          setBillingStatus(response)
          router.refresh()
        } catch (error) {
          console.warn("Billing status refresh after payment failed", error)
        }
      })()
    } else if (paymentStatus === "cancelled") {
      toast.message("Subscription checkout was closed before completion.")
    }

    router.replace("/dashboard/settings/subscription")
  }, [router, searchParams])

  const handleUpgrade = async (plan: PaidSubscriptionPlanId, billingCycle: SubscriptionBillingCycle) => {
    const key = `${plan}:${billingCycle}`
    setCheckoutKey(key)

    try {
      const response = await createSubscriptionCheckoutSession({
        plan,
        billingCycle,
        returnUrl: "/dashboard/settings/subscription/verify",
      })
      if (response.checkoutUrl) {
        window.location.assign(response.checkoutUrl)
        return
      }
      toast.success(response.message)
      const statusResponse = await fetchSubscriptionStatus()
      setBillingStatus(statusResponse)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not start subscription checkout."
      toast.error(message)
    } finally {
      setCheckoutKey(null)
      setUpgradeOpen(false)
    }
  }

  const handleRefreshBilling = async () => {
    try {
      setInvoiceLoading(true)
      const userId = getUserIdentityFromAuthUser(auth?.currentUser)
      if (userId) {
        await refreshSubscriptionFromServer(userId)
      }
      const [response, invoiceResponse] = await Promise.all([
        fetchSubscriptionStatus(),
        fetchSubscriptionInvoices(),
      ])
      setBillingStatus(response)
      setInvoices(invoiceResponse.invoices)
      router.refresh()
      toast.success("Billing status refreshed.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not refresh billing status."
      toast.error(message)
    } finally {
      setInvoiceLoading(false)
    }
  }

  const formatAmount = (invoice: SubscriptionInvoice) =>
    `${invoice.currencySymbol} ${Math.round((invoice.amountPaidInPaise || invoice.amountInPaise) / 100).toLocaleString("en-IN")}`

  const formatUnixDate = (timestamp?: number) =>
    timestamp ? new Date(timestamp * 1000).toLocaleDateString("en-IN") : "N/A"

  return (
    <div className="dashboard-page space-y-6 pb-8">
      <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{en.subscription.billingTitle}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{en.subscription.billingDescription}</p>
      </section>

      <CurrentPlanCard
        plan={effectivePlan}
        statusLabel={statusLabel}
        trialDaysLeft={trialDaysLeft}
        subscriptionExpired={subscriptionExpired}
        secondaryLabel="Refresh Billing"
        onSecondary={() => void handleRefreshBilling()}
        primaryLabel={subscriptionActive ? "Change Plan" : en.subscription.upgradeNow}
        onUpgrade={() => setUpgradeOpen(true)}
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.subscription.featureLimits}</h2>
          <div className="mt-4 space-y-3">
            {LIMIT_FEATURES.map((feature) => {
              const limit = PLAN_LIMITS[effectivePlan][feature]
              return (
                <div key={feature} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] px-4 py-3">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{en.subscription.features[feature]}</span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {typeof limit === "number" ? `${usageMap[feature]} / ${limit}` : en.subscription.activeAccessBadge}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.subscription.monthlyUsage}</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {LIMIT_FEATURES.map((feature) => (
              <div key={feature} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{en.subscription.features[feature]}</p>
                <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--text-primary)]">{usageMap[feature]}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--surface-primary)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
            <p>{en.subscription.placeholderPayments}</p>
            {billingStatus && (
              <div className="mt-3 space-y-2 text-xs">
                <p>Billing table setup: {billingStatus.setupRequired ? "Pending" : "Ready"}</p>
                <p>Razorpay env keys: {billingStatus.providerConfigured ? "Detected" : "Missing"}</p>
                <p>Current billing mode: {getBillingLifecycleLabel(subscriptionActive, trialActive)}</p>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="primary" title={en.subscription.upgradeNow} onClick={() => setUpgradeOpen(true)} className="w-full sm:w-auto" />
              <Button type="button" variant="outline" title={en.subscription.pricingTitle} onClick={() => router.push("/pricing")} className="w-full sm:w-auto" />
            </div>
          </div>

          {!loading && subscription && (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{en.subscription.startDate}</p>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{new Date(subscription.trialStartedAt).toLocaleDateString("en-IN")}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{en.subscription.endDate}</p>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{new Date(subscription.trialEndsAt).toLocaleDateString("en-IN")}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Upgrade Plans</h2>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            Only configured Razorpay plan IDs are shown as active checkout options here.
          </p>
        </div>

        {!statusResolved ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--surface-primary)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
            Checking configured Razorpay checkout options...
          </div>
        ) : configuredEntries.length ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {configuredEntries.map(({ plan, cycle }) => (
              <div key={`${plan}:${cycle}`} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-primary)]">
                {billingCatalog[plan].title} {cycle}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--surface-primary)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
            No Razorpay plan ID is active yet. Add one plan ID in `.env.local`, restart the app, then this section will enable that checkout option.
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          {(Object.keys(BILLING_PLAN_CATALOG) as PaidSubscriptionPlanId[]).map((plan) => (
            <article key={plan} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">{billingCatalog[plan].title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{billingCatalog[plan].description}</p>

              <div className="mt-4 space-y-3">
                {statusResolved
                  ? BILLING_CYCLES.filter((cycle) => billingStatus?.configuredPlanMatrix?.[plan]?.[cycle]).map((cycle) => {
                  const price = billingCatalog[plan].prices[cycle]
                  const key = `${plan}:${cycle}`
                  const enabled = billingStatus?.configuredPlanMatrix?.[plan]?.[cycle] ?? false
                  return (
                    <div key={cycle} className="rounded-2xl border border-[var(--border-card)] px-3 py-3">
                      <div>
                        <p className="text-sm font-semibold capitalize text-[var(--text-primary)]">{cycle}</p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">{price.label} {price.periodLabel}</p>
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        title={enabled ? "Continue" : "Plan ID needed"}
                        loading={checkoutKey === key}
                        disabled={!enabled}
                        onClick={() => void handleUpgrade(plan, cycle)}
                        className="mt-3 w-full"
                      />
                    </div>
                  )
                })
                  : (
                    <div className="rounded-2xl border border-dashed border-[var(--border-card)] px-3 py-3 text-xs leading-5 text-[var(--text-muted)]">
                      Checking live checkout availability...
                    </div>
                  )}
                {statusResolved && billingStatus?.configuredPlanMatrix && !planHasConfiguredCycle(plan) ? (
                  <div className="rounded-2xl border border-dashed border-[var(--border-card)] px-3 py-3 text-xs leading-5 text-[var(--text-muted)]">
                    This plan is not enabled for test checkout yet.
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Billing Invoices</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              View paid subscription invoices generated by Razorpay for this account.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            title={invoiceLoading ? "Refreshing..." : "Refresh Invoices"}
            loading={invoiceLoading}
            onClick={() => void handleRefreshBilling()}
            className="w-full sm:w-auto"
          />
        </div>

        {invoices.length ? (
          <div className="mt-5 space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-base font-semibold text-[var(--text-primary)]">
                      {invoice.invoiceNumber || invoice.id}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                      <span className="rounded-full border border-[var(--border-card)] px-3 py-1.5">{invoice.status}</span>
                      <span className="rounded-full border border-[var(--border-card)] px-3 py-1.5">Amount: {formatAmount(invoice)}</span>
                      <span className="rounded-full border border-[var(--border-card)] px-3 py-1.5">Paid: {formatUnixDate(invoice.paidAt || invoice.issuedAt)}</span>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                    {invoice.shortUrl ? (
                      <Button
                        type="button"
                        variant="primary"
                        title="View Invoice"
                        onClick={() => window.open(invoice.shortUrl, "_blank", "noopener,noreferrer")}
                        className="w-full sm:w-auto"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--surface-primary)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
            No billing invoices are available yet. Once Razorpay generates paid subscription invoices, they will appear here.
          </div>
        )}
      </section>

      <SubscriptionRequiredModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  )
}
