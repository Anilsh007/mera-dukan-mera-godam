import type { Metadata } from "next"
import Link from "next/link"
import PublicPageShell from "@/app/components/layout/PublicPageShell"
import JsonLd from "@/app/components/seo/JsonLd"
import PricingSection from "@/app/components/marketing/PricingSection"
import { createPageMetadata, getSeoPage, resolveSeoLanguage, type SeoSearchParams } from "@/app/lib/seo/site"
import { createPricingPageSchema } from "@/app/lib/seo/schema"
import { dugamSEOData } from "@/src/config/seoConfig"

type PageProps = { searchParams?: SeoSearchParams }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const language = await resolveSeoLanguage(searchParams)
  return createPageMetadata(getSeoPage("/pricing", language), language)
}

const faqs = [
  {
    question: "Does the 14-day free trial include full access?",
    answer:
      "Yes. The trial is designed so shop owners can try the core inventory, billing, and godown workflows before choosing a paid plan.",
  },
  {
    question: "Can I upgrade or switch plans later?",
    answer:
      "Absolutely. You can start small and move to a higher plan when your shop grows. The pricing structure is designed to stay flexible.",
  },
  {
    question: "Will this work on mobile and desktop?",
    answer:
      "Yes. The app is built to stay responsive across desktop browsers and mobile devices so you can manage stock anywhere.",
  },
  {
    question: "Does printing and GST billing stay supported?",
    answer:
      "Yes. The platform keeps invoice creation, receipt printing, and GST-oriented workflows in the core experience.",
  },
]

export default async function PricingPage({ searchParams }: PageProps) {
  const language = await resolveSeoLanguage(searchParams)

  return (
    <>
      <JsonLd id="pricing-page-schema" data={createPricingPageSchema(language)} />
      <PublicPageShell path="/pricing" language={language}>
        <main className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
          <section className="border-b border-[var(--border-card)] bg-[var(--bg-card-strong)]">
            <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
              <div className="max-w-3xl">
                <span className="inline-flex rounded-full border border-[var(--border-card)] bg-[var(--surface-subtle)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  Pricing
                </span>
                <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                  Affordable pricing plans for inventory management and GST billing.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
                  No bloated setups. No expensive yearly commitments. Choose a simple plan, try it free for 14 days, and keep your billing and inventory workflows in one place.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/login"
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:opacity-95"
                  >
                    Start 14-Day Free Trial
                  </Link>
                  <Link
                    href="/support"
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-6 py-3 text-sm font-bold text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                  >
                    Need help choosing?
                  </Link>
                </div>
                <p className="mt-4 text-sm text-[var(--text-secondary)]">
                  Starting at {dugamSEOData.pricing.monthly} or {dugamSEOData.pricing.yearly}. {dugamSEOData.pricing.yearlyHook}
                </p>
              </div>
            </div>
          </section>

          <section className="px-5 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <PricingSection />
            </div>
          </section>

          <section className="px-5 pb-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl rounded-[2rem] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)] sm:p-8">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-black tracking-[-0.04em]">Frequently Asked Questions</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                  Short answers to the most common pricing questions.
                </p>
              </div>

              <div className="mt-8 space-y-4">
                {faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group rounded-3xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-5"
                  >
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
            </div>
          </section>
        </main>
      </PublicPageShell>
    </>
  )
}
