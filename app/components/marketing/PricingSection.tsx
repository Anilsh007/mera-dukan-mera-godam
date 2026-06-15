import Link from "next/link"
import { Check, Sparkles } from "lucide-react"
import { pricingFeatures, pricingPlans } from "@/app/lib/pricing"
import { en } from "@/app/messages/en"
import { dugamSEOData } from "@/src/config/seoConfig"

type PricingSectionProps = {
  compact?: boolean
}

export default function PricingSection({ compact = false }: PricingSectionProps) {
  return (
    <section className={compact ? "" : "relative overflow-hidden"}>
      <div
        aria-hidden="true"
        className={
          compact
            ? ""
            : "absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_45%)]"
        }
      />

      <div className={compact ? "space-y-6" : "relative space-y-8 rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-8 lg:p-10"}>
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">{en.subscription.pricingTable}</p>
          <h2 className="text-3xl font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">
            Affordable pricing that feels friendly for real businesses.
          </h2>
          <p className="text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            No hidden charges. No costly yearly commitments. Get premium inventory & GST features for just{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{dugamSEOData.pricing.daily}</span>.
          </p>
          <p className="text-sm leading-7 text-[var(--text-secondary)] sm:text-base">{dugamSEOData.pricing.yearlyHook}</p>

          <div className="mt-5 flex flex-wrap gap-2 text-sm text-[var(--text-secondary)]">
            {pricingFeatures.map((feature) => (
              <span key={feature.name} className="inline-flex items-start gap-2 rounded-[28px] border border-[var(--border-card)] p-2">
                <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                <span>{feature.name}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {pricingPlans.map((plan) => (
            <article
              key={plan.name}
              className={[
                "relative overflow-hidden rounded-[28px] border p-5 shadow-[var(--shadow-card)] transition-transform duration-300 hover:-translate-y-1",
                plan.featured
                  ? "border-amber-300/50 bg-[linear-gradient(180deg,rgba(19,27,46,0.96),rgba(7,13,24,0.98))] ring-1 ring-amber-300/30"
                  : "border-[var(--border-card)] bg-[linear-gradient(180deg,var(--bg-card-strong),color-mix(in_srgb,var(--surface-primary)_92%,#0b1220_8%))]",
              ].join(" ")}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.accent} opacity-80`} aria-hidden="true" />
              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{plan.name}</h3>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{plan.billing}</p>
                  </div>
                  {plan.highlight ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/50 bg-amber-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                      <Sparkles size={12} />
                      {plan.highlight}
                    </span>
                  ) : null}
                </div>

                <div className="mt-5">
                  <p className="text-4xl font-black tracking-[-0.05em] text-[var(--text-primary)]">₹{plan.price}</p>
                  {plan.daily ? (
                    <p className="mt-2 text-sm font-semibold text-emerald-300">{plan.daily}</p>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--text-muted)]">Simple, transparent billing with no hidden setup costs.</p>
                  )}
                </div>

                <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{plan.description}</p>

                <ul className="mt-5 space-y-2 text-sm text-[var(--text-secondary)]">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Link
                    href="/login"
                    className={[
                      "inline-flex min-h-11 w-full items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                      plan.featured
                        ? "border-amber-300/60 bg-[linear-gradient(135deg,rgba(245,158,11,0.95),rgba(16,185,129,0.92))] text-slate-950 shadow-[0_18px_40px_rgba(245,158,11,0.22)] hover:-translate-y-0.5"
                        : "border-[var(--border-input)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]",
                    ].join(" ")}
                    aria-label={`Start 14-Day Free Trial for ${plan.name} plan`}
                  >
                    Start 14-Day Free Trial
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
