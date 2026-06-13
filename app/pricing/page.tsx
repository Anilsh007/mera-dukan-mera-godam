import type { Metadata } from "next"
import Link from "next/link"
import PricingSection from "@/app/components/marketing/PricingSection"

export const metadata: Metadata = {
  title: "Affordable Pricing Plans | Mera Dukan Mera Godam",
  description:
    "Choose the best plan for your shop. Manage inventory, dukan, and godam stock with GST billing starting at just ₹99/month or ₹3.33/day. 14-day free trial.",
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

export default function PricingPage() {
  return (
    <main className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="border-b border-[var(--border-card)] bg-[var(--bg-card-strong)]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-[var(--border-card)] bg-[var(--surface-subtle)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              Pricing
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Affordable pricing made for real shops, dukan, and godown teams.
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
                <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
