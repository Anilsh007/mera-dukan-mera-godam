"use client"

import { Crown } from "lucide-react"
import Button from "@/app/components/ui/Button"
import { en } from "@/app/messages/en"

const PLAN_ORDER = ["trial", "free/expired-readonly", "starter", "pro", "business"] as const

export default function PricingPage() {
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

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
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
              {plan === "trial" && en.subscription.trialBannerDescription}
              {plan === "free/expired-readonly" && en.subscription.readOnlyExpiredMessage}
              {plan === "starter" && en.subscription.activeStatus}
              {plan === "pro" && en.subscription.activeAccessBadge}
              {plan === "business" && en.subscription.keepDataSafeDescription}
            </p>
            <Button type="button" variant="primary" title={en.subscription.upgradeNow} className="mt-5 w-full" />
          </article>
        ))}
      </section>
    </main>
  )
}
