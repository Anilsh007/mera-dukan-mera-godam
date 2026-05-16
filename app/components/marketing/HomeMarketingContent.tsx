import Link from "next/link"
import { en } from "@/app/messages/en"

export default function HomeMarketingContent() {
  return (
    <section className="bg-[var(--bg-primary)] py-16 text-[var(--text-primary)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6">
        <div className="rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-8">
          <span className="inline-flex rounded-full border border-[var(--border-card)] bg-[var(--surface-subtle)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            {en.marketing.home.badge}
          </span>
          <h2 className="mt-5 max-w-4xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            {en.marketing.home.title}
          </h2>
          <p className="mt-5 max-w-4xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
            {en.marketing.home.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/about" className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
              {en.marketing.home.links.about}
            </Link>
            <Link href="/faq" className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
              {en.marketing.home.links.faq}
            </Link>
            <Link href="/support" className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
              {en.marketing.home.links.support}
            </Link>
          </div>
        </div>

        <section className="rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-8">
          <h2 className="text-2xl font-bold sm:text-3xl">{en.marketing.home.featureSectionTitle}</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            {en.marketing.home.featureSectionDescription}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {en.marketing.home.featureCards.map((card) => (
              <article key={card.title} className="rounded-3xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-5">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-8">
          <h2 className="text-2xl font-bold sm:text-3xl">{en.marketing.home.useCasesTitle}</h2>
          <p className="mt-3 max-w-5xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            {en.marketing.home.useCasesDescription}
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {en.marketing.home.audienceGroups.map((group) => (
              <article key={group.title} className="rounded-3xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-5">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{group.title}</h3>
                <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--text-secondary)] sm:grid-cols-2">
                  {group.items.map((item) => (
                    <li key={item} className="rounded-2xl bg-[var(--bg-card-strong)] px-3 py-2">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-8">
          <h2 className="text-2xl font-bold sm:text-3xl">{en.marketing.home.ctaTitle}</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            {en.marketing.home.ctaDescription}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
              {en.marketing.home.links.login}
            </Link>
            <Link href="/about" className="rounded-2xl border border-[var(--border-card)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
              {en.seo.about}
            </Link>
            <Link href="/support" className="rounded-2xl border border-[var(--border-card)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
              {en.navigation.support}
            </Link>
          </div>
        </section>
      </div>
    </section>
  )
}
