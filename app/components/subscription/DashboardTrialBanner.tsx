"use client"

import { AlertTriangle, CalendarClock, Crown } from "lucide-react"
import Button from "@/app/components/ui/Button"
import { en } from "@/app/messages/en"

type DashboardTrialBannerProps = {
  trialDaysLeft: number
  subscriptionExpired: boolean
  onOpenUpgrade: () => void
}

export default function DashboardTrialBanner({
  trialDaysLeft,
  subscriptionExpired,
  onOpenUpgrade,
}: DashboardTrialBannerProps) {
  if (!subscriptionExpired && trialDaysLeft <= 0) return null

  return (
    <section
      className={`rounded-[28px] border p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5 ${
        subscriptionExpired
          ? "border-rose-400/40 bg-rose-500/10"
          : "border-cyan-400/35 bg-cyan-500/10"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--bg-card-strong)] text-[var(--accent)]">
              {subscriptionExpired ? <AlertTriangle size={18} aria-hidden="true" /> : <CalendarClock size={18} aria-hidden="true" />}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                {subscriptionExpired ? en.subscription.expiredBadge : en.subscription.trialBadge}
              </p>
              <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                {subscriptionExpired
                  ? en.subscription.expiredHeadline
                  : en.subscription.trialBannerTitle.replace("{days}", String(trialDaysLeft))}
              </h2>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
            {subscriptionExpired ? en.subscription.readOnlyExpiredMessage : en.subscription.trialBannerDescription}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          title={en.subscription.upgradeNow}
          icon={<Crown size={16} aria-hidden="true" />}
          onClick={onOpenUpgrade}
          className="w-full lg:w-auto"
        />
      </div>
    </section>
  )
}
