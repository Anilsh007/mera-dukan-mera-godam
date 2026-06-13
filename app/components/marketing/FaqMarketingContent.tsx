"use client"

import { useId, useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { en } from "@/app/messages/en"

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  const answerId = useId()

  return (
    <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] shadow-[var(--shadow-card)]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={answerId}
        className="flex w-full items-center justify-between gap-4 p-6 text-left"
      >
        <h2 className="text-base font-semibold md:text-lg">{question}</h2>
        <ChevronDown className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} size={20} aria-hidden="true" />
      </button>

      {open ? (
        <div id={answerId} className="border-t border-[var(--border-card)] px-6 pb-6 pt-4">
          <p className="leading-8 text-[var(--text-secondary)]">{answer}</p>
        </div>
      ) : null}
    </div>
  )
}

export default function FaqMarketingContent() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="border-b border-[var(--border-card)] bg-[var(--surface-subtle)] lg:px-30 px-5">
        <div className="py-20 text-center">
          <h1 className="text-4xl font-bold md:text-5xl">{en.marketing.faq.title}</h1>
          <p className="mt-6 text-lg leading-8 text-[var(--text-secondary)]">{en.marketing.faq.description}</p>
        </div>
      </section>

      <section className="py-16 lg:px-30 px-5">
        <div className="space-y-5">
          {en.marketing.faqItems.map((faq) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto  px-4 sm:px-6">
          <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-8 py-12 text-center shadow-[var(--shadow-card)]">
            <h2 className="text-3xl font-bold">{en.marketing.faq.moreHelpTitle}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">{en.marketing.faq.moreHelpDescription}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/support" className="inline-flex rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90">
                {en.marketing.faq.contactSupport}
              </Link>
              <Link href="/about" className="inline-flex rounded-xl border border-[var(--border-card)] px-6 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
                {en.seo.about}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}