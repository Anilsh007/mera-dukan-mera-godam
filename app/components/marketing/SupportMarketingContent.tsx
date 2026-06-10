import Link from "next/link"
import { Mail, MessageSquare, Bug, HelpCircle } from "lucide-react"
import { en } from "@/app/messages/en"

const icons = [HelpCircle, Bug, MessageSquare, Mail]

export default function SupportMarketingContent() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="border-b border-[var(--border-card)] bg-[var(--surface-subtle)]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <span className="inline-flex rounded-full border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-4 py-1 text-sm font-medium text-[var(--text-secondary)]">
            {en.marketing.support.badge}
          </span>
          <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">{en.marketing.support.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--text-secondary)]">{en.marketing.support.description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-8 shadow-[var(--shadow-card)]">
              <h2 className="text-2xl font-semibold">{en.marketing.support.contactTitle}</h2>
              <p className="mt-4 leading-8 text-[var(--text-secondary)]">{en.marketing.support.contactDescription}</p>
            </div>

            <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-8 shadow-[var(--shadow-card)]">
              <h2 className="text-2xl font-semibold">{en.marketing.support.supportAreasTitle}</h2>
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {en.marketing.support.supportAreas.map((area, index) => {
                  const Icon = icons[index] || HelpCircle
                  return (
                    <article key={area.title} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-[var(--text-primary)] p-2 text-[var(--bg-primary)]">
                          <Icon size={18} aria-hidden="true" />
                        </div>
                        <h3 className="font-semibold">{area.title}</h3>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{area.description}</p>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-semibold">{en.marketing.support.resourceTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{en.marketing.support.resourceDescription}</p>
              <div className="mt-5 flex flex-col gap-3">
                <Link href="/faq" className="rounded-2xl border border-[var(--border-card)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
                  {en.marketing.support.links.faq}
                </Link>
                <Link href="/about" className="rounded-2xl border border-[var(--border-card)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
                  {en.marketing.support.links.about}
                </Link>
                <Link href="/login" className="rounded-2xl border border-[var(--border-card)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
                  {en.marketing.support.links.login}
                </Link>
                <Link href="/dashboard" className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90">
                  {en.marketing.support.links.dashboard}
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-semibold">{en.seo.emailSupport}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                {en.uiText["mdmg.ind@gmail.com"]}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

