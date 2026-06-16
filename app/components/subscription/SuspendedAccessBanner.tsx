"use client"

import { AlertTriangle, Crown, ShieldAlert } from "lucide-react"
import Button from "@/app/components/ui/Button"
import { en } from "@/app/messages/en"

type SuspendedAccessBannerProps = {
  title?: string
  description?: string
  featureLabel?: string
  usage?: number
  limit?: number | null
  onOpenUpgrade: () => void
}

export default function SuspendedAccessBanner({
  title = en.subscription.expiredHeadline,
  description = en.subscription.readOnlyExpiredMessage,
  featureLabel = en.subscription.suspendedMode,
  usage = 0,
  limit = 5,
  onOpenUpgrade,
}: SuspendedAccessBannerProps) {
  const resolvedLimit = typeof limit === "number" ? limit : 5
  const remaining = Math.max(resolvedLimit - usage, 0)

  return (
    <section className="rounded-[24px] border border-amber-400/30 bg-amber-500/10 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--bg-card-strong)] text-amber-500">
              {remaining > 0 ? <AlertTriangle size={18} aria-hidden="true" /> : <ShieldAlert size={18} aria-hidden="true" />}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                {en.subscription.expiredBadge}
              </p>
              <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">{title}</h2>
            </div>
          </div>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
            {description}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[var(--text-secondary)]">
            <span className="rounded-full border border-[var(--border-card)] bg-[var(--surface-primary)] px-3 py-1.5">
              {featureLabel}
            </span>
            <span className="rounded-full border border-[var(--border-card)] bg-[var(--surface-primary)] px-3 py-1.5">
              {remaining > 0
                ? en.subscription.usesRemaining
                    .replace("{remaining}", String(remaining))
                    .replace("{limit}", String(resolvedLimit))
                : en.subscription.renewalNeeded}
            </span>
          </div>
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
