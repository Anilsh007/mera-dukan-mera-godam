"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Button from "@/app/components/ui/Button"
import CurrentPlanCard from "@/app/components/subscription/CurrentPlanCard"
import SubscriptionRequiredModal from "@/app/components/subscription/SubscriptionRequiredModal"
import useSubscription from "@/app/hooks/useSubscription"
import useUsageLimit from "@/app/hooks/useUsageLimit"
import { PLAN_LIMITS } from "@/app/lib/subscription/plans"
import { en } from "@/app/messages/en"

const LIMIT_FEATURES = ["products", "purchases", "gstInvoices", "suppliers", "exports"] as const

export default function SubscriptionSettingsPage() {
  const router = useRouter()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
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
        onManage={() => router.push("/dashboard/settings/subscription")}
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

      <SubscriptionRequiredModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  )
}
