"use client"

import { CheckCircle2, Crown, ShieldAlert } from "lucide-react"
import Button from "@/app/components/ui/Button"
import type { SubscriptionPlanId } from "@/app/lib/db"
import { en } from "@/app/messages/en"

type CurrentPlanCardProps = {
  plan: SubscriptionPlanId
  statusLabel: string
  trialDaysLeft: number
  subscriptionExpired: boolean
  secondaryLabel: string
  onSecondary: () => void
  primaryLabel?: string
  onUpgrade: () => void
}

function getPlanLabel(plan: SubscriptionPlanId) {
  if (plan === "free/expired-readonly") return en.subscription.planLabels["free/expired-readonly"]
  return en.subscription.planLabels[plan]
}

function getAccessBadgeLabel(subscriptionExpired: boolean, trialDaysLeft: number) {
  if (subscriptionExpired) return en.subscription.expiredBadge
  if (trialDaysLeft > 0) return en.subscription.trialBadge
  return en.subscription.activeAccessBadge
}

export default function CurrentPlanCard({
  plan,
  statusLabel,
  trialDaysLeft,
  subscriptionExpired,
  secondaryLabel,
  onSecondary,
  primaryLabel = en.subscription.upgradeNow,
  onUpgrade,
}: CurrentPlanCardProps) {
  return (
    <section className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{en.subscription.currentPlan}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              {subscriptionExpired ? <ShieldAlert size={18} aria-hidden="true" /> : <Crown size={18} aria-hidden="true" />}
            </span>
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em] text-[var(--text-primary)]">{getPlanLabel(plan)}</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{statusLabel}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
            {trialDaysLeft > 0 ? (
              <span className="rounded-full border border-[var(--border-card)] bg-[var(--surface-primary)] px-3 py-1.5">
                {en.subscription.daysLeft.replace("{days}", String(Math.max(trialDaysLeft, 0)))}
              </span>
            ) : null}
            <span className="rounded-full border border-[var(--border-card)] bg-[var(--surface-primary)] px-3 py-1.5">
              {getAccessBadgeLabel(subscriptionExpired, trialDaysLeft)}
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-auto">
          <Button type="button" variant="outline" title={secondaryLabel} onClick={onSecondary} className="w-full lg:w-auto" />
          <Button type="button" variant="primary" title={primaryLabel} onClick={onUpgrade} className="w-full lg:w-auto" />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden="true" />
          <p className="text-sm leading-6 text-[var(--text-secondary)]">{en.subscription.keepDataSafeDescription}</p>
        </div>
      </div>
    </section>
  )
}
