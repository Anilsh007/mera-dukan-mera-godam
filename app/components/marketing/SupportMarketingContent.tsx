import Link from "next/link"
import { Mail, MessageSquare, Bug, HelpCircle, ArrowRight } from "lucide-react"
import { en } from "@/app/messages/en"
import { BsWhatsapp } from "react-icons/bs"

const icons = [HelpCircle, Bug, MessageSquare, Mail]

export default function SupportMarketingContent() {
  return (
    <main className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="border-b border-[var(--border-card)] bg-[var(--surface-subtle)] lg:px-30 px-5">
        <div className="py-20 text-center">
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">{en.marketing.support.title}</h1>
          <p className="mt-6 text-lg leading-8 text-[var(--text-secondary)]">{en.marketing.support.description}</p>
          <Link href="/?scrollTo=pricing" className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-secondary,#8b5cf6))] px-6 py-3 text-sm font-bold text-white shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]" scroll={true}>
            {en.marketing.home.links.dayPlan}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="py-16 lg:px-30 px-5">
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
              <p className="flex items-center gap-2 text-sm leading-7 text-[var(--text-secondary)] border-b border-[var(--border-card)] pb-4">
                {en.uiText["mdmg.ind@gmail.com"]} 
                <a href="mailto:mdmg.ind@gmail.com" target="_blank" rel="noopener noreferrer" aria-label={en.seo.emailSupport} className="rounded-xl p-2 border border-[var(--border-card)] text-[#EA4335] transition hover:border-[var(--accent)] hover:bg-[#EA4335] hover:text-[#ffffff]" >
                  <Mail size={18} aria-hidden="true" />
                </a>
              </p>

              <h2 className="text-lg font-semibold pt-4">{en.seo.whatsappSupport}</h2>
              <p className="flex items-center gap-2 text-sm leading-7 text-[var(--text-secondary)]">
                9301848229 
                <a href="https://wa.me/9301848229" target="_blank" rel="noopener noreferrer" aria-label={en.seo.whatsappSupport} className="rounded-xl p-2 border border-[var(--border-card)] text-[#25D366] transition hover:border-[var(--accent)] hover:bg-[#25D366] hover:text-[#ffffff]" >
                  <BsWhatsapp size={18} aria-hidden="true" />
                </a>
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

