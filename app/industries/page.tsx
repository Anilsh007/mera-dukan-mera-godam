import type { Metadata } from "next"
import PublicPageShell from "@/app/components/layout/PublicPageShell"
import ProgrammaticLinkGrid from "@/app/components/marketing/ProgrammaticLinkGrid"
import { createPageMetadata, resolveSeoLanguage, type SeoSearchParams } from "@/app/lib/seo/site"
import { industryPages } from "@/src/config/seoConfig"

type PageProps = { searchParams?: SeoSearchParams }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const language = await resolveSeoLanguage(searchParams)
  return createPageMetadata(
    {
      path: "/industries",
      title: "Industry-Specific Inventory and Billing Pages | Dugam",
      description: "Find industry-specific pages for kirana, hardware, electronics, mobile, wholesaler, and godown workflows.",
      keywords: ["industry inventory software", "shop billing software", "wholesale inventory software"],
    },
    language,
  )
}

export default async function IndustriesHub({ searchParams }: PageProps) {
  const language = await resolveSeoLanguage(searchParams)

  return (
    <PublicPageShell path="/industries" language={language}>
      <main className="bg-[var(--bg-primary)] px-5 py-16 text-[var(--text-primary)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="max-w-4xl">
            <h1 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl">Industry pages for Indian shop workflows</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--text-secondary)]">
              Browse Dugam pages tailored to retail, hardware, electronics, mobile, wholesale, and godown-driven businesses.
            </p>
          </section>

          <ProgrammaticLinkGrid
            title="Industry-specific pages"
            description="Pick the use case that matches your business and see the features most relevant to that workflow."
            links={industryPages.map((page) => ({
              label: page.industryName,
              href: `/industries/${page.slug}`,
            }))}
          />
        </div>
      </main>
    </PublicPageShell>
  )
}
