import Link from "next/link"
import { Check, Sparkles } from "lucide-react"
import { pricingFeatures, pricingPlans } from "@/app/lib/pricing"
import { en } from "@/app/messages/en"

type PricingSectionProps = {
    compact?: boolean
}

export default function PricingSection({ compact = false }: PricingSectionProps) {
    return (
        <section className={compact ? "" : "relative overflow-hidden"}>
            <div className={compact ? "" : "absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_45%)] rounded-[32px]"} aria-hidden="true" />

            <div className={compact ? "space-y-6" : "relative space-y-8 rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-8 lg:p-10"}>
                <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">{en.subscription.pricingTable}</p>
                    <h2 className="text-3xl font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">
                        Affordable pricing that feels friendly for real businesses.
                    </h2>
                    <p className="text-sm leading-7 text-[var(--text-secondary)] sm:text-base">No hidden charges. No costly yearly commitments. Get premium inventory & GST features for just <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹3.33/day</span>.</p>


                    <div className="mt-5 flex text-sm flex flex-wrap text-[var(--text-secondary)]">
                        {pricingFeatures.map((feature) => (
                            <span key={feature.name} className="border border-[var(--border-card)] flex items-start gap-2 rounded-[28px] mr-2 mb-2 p-2">
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
                            ].join(" ")}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${plan.accent} opacity-80`} aria-hidden="true" />
                            <div className="relative z-10 flex h-full flex-col">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-xl font-bold text-[var(--text-primary)]">{plan.name}</h3>
                                        <span className="text-sm text-[var(--text-muted)]">{plan.billing}</span>
                                    </div>

                                    <div>
                                        <span className="text-[var(--text-primary)]">₹{plan.price}</span>
                                        <span className="text-sm font-semibold text-emerald-300">{plan.daily}</span>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <Link href="/login" className={["inline-flex min-h-11 w-full items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                                    ].join(" ")} aria-label={`Start 14-Day Free Trial for ${plan.name} plan`} >Start 14-Day Free Trial </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}
