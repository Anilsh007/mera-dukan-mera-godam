import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  FileText,
  PackageCheck,
  PackagePlus,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Store,
  Truck,
} from "lucide-react"
import logo from "@/assets/logo.webp"
import { en } from "@/app/messages/en"

const heroHighlights = en.auth.keywords

const dashboardCards = [
  {
    title: en.dashboard.totalProducts,
    description: en.dashboard.stockHealthy,
    Icon: Boxes,
  },
  {
    title: en.dashboard.stockValue,
    description: en.dashboard.currentInventoryValue,
    Icon: BarChart3,
  },
  {
    title: en.dashboard.gstCollected,
    description: en.dashboard.gstOnSales,
    Icon: ReceiptText,
  },
]

const workflowCards = [
  {
    title: en.dashboard.addStock,
    description: en.dashboard.addStockDescription,
    Icon: PackagePlus,
  },
  {
    title: en.navigation.purchases,
    description: en.pages.purchasesDescription,
    Icon: Truck,
  },
  {
    title: en.navigation.gstInvoice,
    description: en.pages.gstInvoiceTitle,
    Icon: FileText,
  },
  {
    title: en.navigation.reports,
    description: en.pages.reportsDescription,
    Icon: ClipboardList,
  },
]

const trustCards = [
  {
    title: en.seo.schema.profileInvoiceFeature,
    Icon: ShieldCheck,
  },
  {
    title: en.seo.schema.receiptPrintFeature,
    Icon: ReceiptText,
  },
  {
    title: en.seo.schema.whatsappShareFeature,
    Icon: Smartphone,
  },
]

export default function HomePageContent() {
  return (
    <div className="relative isolate overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute left-[-14rem] top-[-16rem] h-[34rem] w-[34rem] rounded-full bg-[var(--accent-soft)] blur-3xl" />
      <div className="absolute right-[-12rem] top-24 h-[30rem] w-[30rem] rounded-full bg-[var(--surface-soft-strong)] blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,var(--surface-highlight),transparent)]" />
    </div>

    <section className="mx-auto grid min-h-[calc(100vh-3.5rem)] w-full  items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-soft)]">
            <Store aria-hidden="true" className="h-4 w-4 text-[var(--accent)]" />
          </span>
          {en.marketing.home.badge}
        </div>

        <h1 className="mt-7 text-balance text-4xl font-black leading-[1.05] tracking-[-0.04em] text-[var(--text-primary)] sm:text-5xl lg:text-7xl">
          {en.marketing.home.title}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
          {en.marketing.home.description}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {en.marketing.home.links.login}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link
            href="/about"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-6 py-3 text-sm font-bold text-[var(--text-primary)] shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {en.marketing.home.links.about}
          </Link>
        </div>

        <div className="mt-9 grid gap-3 sm:grid-cols-2">
          {heroHighlights.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)]">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
              <p className="text-sm font-semibold leading-6 text-[var(--text-secondary)]">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
        <div aria-hidden="true" className="absolute -inset-4 rounded-[2.5rem] bg-[var(--accent-soft)] blur-2xl" />
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-lifted)] sm:p-5">
          <div className="flex items-center justify-between rounded-3xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-4">
            <div className="flex items-center gap-3">
              <Image src={logo} alt={en.profile.logoAlt} width={52} height={52} priority className="rounded-2xl" />
              <div>
                <p className="text-sm font-black text-[var(--text-primary)]">{en.common.appName}</p>
                <p className="text-xs font-semibold text-[var(--text-secondary)]">{en.navigation.workspaceTagline}</p>
              </div>
            </div>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent)]">
              {en.dashboard.overviewLabel}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {dashboardCards.map(({ title, description, Icon }) => (
              <article key={title} className="rounded-3xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-4">
                <Icon aria-hidden="true" className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="mt-3 text-sm font-black text-[var(--text-primary)]">{title}</h2>
                <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{description}</p>
              </article>
            ))}
          </div>

          <div className="mt-4 rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-[var(--text-primary)]">{en.dashboard.quickActions}</h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{en.dashboard.overviewDescription}</p>
              </div>
              <PackageCheck aria-hidden="true" className="h-8 w-8 shrink-0 text-[var(--accent)]" />
            </div>
            <div className="mt-4 grid gap-3">
              {workflowCards.map(({ title, description, Icon }) => (
                <article key={title} className="flex items-start gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                    <Icon aria-hidden="true" className="h-5 w-5 text-[var(--accent)]" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-primary)]">{title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto w-full  px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
      <div className="rounded-[2rem] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)] sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">{en.marketing.home.featureSectionTitle}</span>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[var(--text-primary)] sm:text-4xl">
              {en.marketing.home.audienceSectionTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
              {en.marketing.home.featureSectionDescription}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {trustCards.map(({ title, Icon }) => (
              <article key={title} className="rounded-3xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-4">
                <Icon aria-hidden="true" className="h-5 w-5 text-[var(--accent)]" />
                <p className="mt-3 text-sm font-bold leading-6 text-[var(--text-primary)]">{title}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {en.marketing.home.featureCards.map((card, index) => (
            <article key={card.title} className="group rounded-3xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-5 transition hover:-translate-y-1 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--bg-card-strong)] text-sm font-black text-[var(--accent)] shadow-[var(--shadow-card)]">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)]">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{card.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="mx-auto w-full  px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
      <div className="grid gap-4 lg:grid-cols-4">
        {en.marketing.home.audienceGroups.map((group) => (
          <article key={group.title} className="rounded-[1.75rem] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-black text-[var(--text-primary)]">{group.title}</h2>
            <ul className="mt-4 grid gap-2 text-sm font-semibold leading-6 text-[var(--text-secondary)]">
              {group.items.map((item) => (
                <li key={item} className="rounded-2xl bg-[var(--surface-subtle)] px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>

    <section className="mx-auto w-full  px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-lifted)] sm:p-8 lg:p-10">
        <div aria-hidden="true" className="absolute right-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-[var(--accent-soft)] blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">{en.marketing.home.useCasesTitle}</span>
            <h2 className="mt-3 max-w-4xl text-3xl font-black tracking-[-0.03em] text-[var(--text-primary)] sm:text-4xl">
              {en.marketing.home.ctaTitle}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
              {en.marketing.home.ctaDescription}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {en.marketing.home.links.login}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              href="/support"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-6 py-3 text-sm font-bold text-[var(--text-primary)] shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {en.marketing.home.links.support}
            </Link>
          </div>
        </div>
      </div>
    </section>
  </div>
  )
}
