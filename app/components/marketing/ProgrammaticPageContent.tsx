import Link from "next/link"
import { Check, ArrowRight, ShieldCheck, Smartphone, PackageSearch } from "lucide-react"
import { dugamSEOData, type CompetitorComparisonPageConfig, type IndustryPageConfig } from "@/src/config/seoConfig"
import ProgrammaticLinkGrid from "@/app/components/marketing/ProgrammaticLinkGrid"
import { pricingPlans } from "@/app/lib/pricing"

type ProgrammaticPageContentProps = {
  page: CompetitorComparisonPageConfig | IndustryPageConfig
}

export default function ProgrammaticPageContent({ page }: ProgrammaticPageContentProps) {
  const pricingHighlights = [
    { label: "Monthly", value: dugamSEOData.pricing.monthly },
    { label: "Yearly", value: dugamSEOData.pricing.yearly },
    { label: "Daily", value: dugamSEOData.pricing.daily },
  ]

  return (
    <main className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="border-b border-[var(--border-card)] bg-[var(--bg-card-strong)]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <span className="inline-flex rounded-full border border-[var(--border-card)] bg-[var(--surface-subtle)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              {page.kind === "competitor" ? "Alternative / Comparison" : "Industry Page"}
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">{page.h1}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">{page.intro}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {pricingHighlights.map((item) => (
                <div key={item.label} className="rounded-3xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">{item.label}</p>
                  <p className="mt-2 text-2xl font-black text-[var(--text-primary)]">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:opacity-95"
              >
                Start 14-Day Free Trial
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-6 py-3 text-sm font-bold text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              >
                View full pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)] sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                {page.kind === "competitor" ? <ShieldCheck className="h-5 w-5" aria-hidden="true" /> : <PackageSearch className="h-5 w-5" aria-hidden="true" />}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  {page.kind === "competitor" ? "Why Dugam" : "What Dugam fits"}
                </p>
                <h2 className="text-2xl font-black tracking-[-0.03em] text-[var(--text-primary)]">
                  {page.kind === "competitor" ? page.comparisonHeadline : `${page.industryName} workflows`}
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              {page.kind === "competitor"
                ? page.comparisonNote
                : `This page focuses on ${page.industryName.toLowerCase()} workflows and the shop operations that matter most for daily billing, stock, and reporting.`}
            </p>

            {page.kind === "competitor" ? (
              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[var(--border-card)]">
                <table className="min-w-full divide-y divide-[var(--border-card)] text-left text-sm">
                  <thead className="bg-[var(--surface-subtle)]">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-bold text-[var(--text-primary)]">Feature</th>
                      <th scope="col" className="px-4 py-3 font-bold text-[var(--text-primary)]">Dugam</th>
                      <th scope="col" className="px-4 py-3 font-bold text-[var(--text-primary)]">{page.competitorName}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-card)] bg-[var(--bg-card-strong)]">
                    {page.comparisonRows.map((row) => (
                      <tr key={row.feature}>
                        <th scope="row" className="px-4 py-4 font-semibold text-[var(--text-primary)]">{row.feature}</th>
                        <td className="px-4 py-4 text-[var(--text-secondary)]">{row.dugam}</td>
                        <td className="px-4 py-4 text-[var(--text-secondary)]">{row.competitor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {page.useCases.map((useCase) => (
                  <div key={useCase} className="rounded-3xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-4">
                    <Check className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                    <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{useCase}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)] sm:p-8">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--text-primary)]">Key highlights</h2>
              </div>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
                {page.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2 rounded-2xl bg-[var(--surface-subtle)] px-4 py-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[2rem] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)] sm:p-8">
              <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--text-primary)]">Pricing snapshot</h2>
              <div className="mt-5 grid gap-3">
                {pricingPlans.map((plan) => (
                  <div key={plan.name} className="flex items-center justify-between rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] px-4 py-3">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{plan.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{plan.billing}</p>
                    </div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">₹{plan.price}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>

      <section className="px-5 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <ProgrammaticLinkGrid
            title="Related searches and internal links"
            description="Move between pricing, FAQ, industry use cases, and comparison pages to build a stronger topic cluster."
            links={page.relatedLinks}
          />

          <section className="rounded-[2rem] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)] sm:p-8">
            <h2 className="text-2xl font-black tracking-[-0.03em] text-[var(--text-primary)]">Frequently Asked Questions</h2>
            <div className="mt-6 space-y-4">
              {page.faqs.map((faq) => (
                <details key={faq.question} className="group rounded-3xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-5">
                  <summary className="cursor-pointer list-none text-base font-bold text-[var(--text-primary)] focus:outline-none">
                    <span className="flex items-center justify-between gap-4">
                      {faq.question}
                      <span className="text-[var(--text-muted)] transition group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {page.kind === "competitor" ? (
            <footer className="rounded-[2rem] border border-dashed border-[var(--border-card)] bg-[var(--surface-subtle)] p-5 text-sm leading-7 text-[var(--text-secondary)]">
              Disclaimer: All competitor product names, logos, and brands are property of their respective owners. Mentioning them here is purely for comparative and informational purposes based on publicly available market data.
            </footer>
          ) : null}
        </div>
      </section>
    </main>
  )
}
