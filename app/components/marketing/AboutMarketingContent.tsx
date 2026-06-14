import Link from "next/link"
import { en } from "@/app/messages/en"
import { ArrowRight } from "lucide-react"

export default function AboutMarketingContent() {
  return (
    <main className="bg-[var(--bg-primary)] text-[var(--text-primary)] ">
      <section className="border-b border-[var(--border-card)] bg-[var(--surface-subtle)] lg:px-30 px-5">
        <div className="py-20 text-center">
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">{en.marketing.about.title}</h1>
          <p className="mt-6 text-lg leading-8 text-[var(--text-secondary)]">{en.marketing.about.description}</p>
          <Link href="/?scrollTo=pricing" className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-secondary,#8b5cf6))] px-6 py-3 text-sm font-bold text-white shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]" scroll={true}>
            {en.marketing.home.links.dayPlan}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto py-16 lg:px-30 px-5">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            <article className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-8 shadow-[var(--shadow-card)]">
              <h2 className="text-2xl font-semibold">{en.marketing.about.storyTitle}</h2>
              <div className="mt-4 space-y-4 text-[var(--text-secondary)]">
                {en.marketing.about.storyParagraphs.map((paragraph) => (
                  <p key={paragraph} className="leading-8">{paragraph}</p>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-8 shadow-[var(--shadow-card)]">
              <h2 className="text-2xl font-semibold">{en.marketing.about.usersTitle}</h2>
              <p className="mt-4 leading-8 text-[var(--text-secondary)]">{en.marketing.about.usersDescription}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {en.marketing.about.userGroups.map((group) => (
                  <div key={group.title} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-5">
                    <h3 className="font-semibold">{group.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{group.description}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-8 shadow-[var(--shadow-card)]">
              <h2 className="text-2xl font-semibold">{en.marketing.about.benefitsTitle}</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {en.marketing.about.benefitCards.map((card) => (
                  <div key={card.title} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-5">
                    <h3 className="font-semibold">{card.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{card.description}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-semibold">{en.marketing.home.audienceSectionTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{en.marketing.home.audienceSectionDescription}</p>
            </div>

            <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-xl font-semibold">{en.marketing.about.ctaTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{en.marketing.about.ctaDescription}</p>
              <div className="mt-5 flex flex-col gap-3">
                <Link href="/faq" className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90">
                  {en.marketing.about.links.faq}
                </Link>
                <Link href="/support" className="rounded-2xl border border-[var(--border-card)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
                  {en.marketing.about.links.support}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
