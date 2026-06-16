import type { Metadata } from "next"
import PublicPageShell from "@/app/components/layout/PublicPageShell"
import ProgrammaticLinkGrid from "@/app/components/marketing/ProgrammaticLinkGrid"
import { createPageMetadata, resolveSeoLanguage, type SeoSearchParams } from "@/app/lib/seo/site"
import { competitorComparisonPages } from "@/src/config/seoConfig"

type PageProps = { searchParams?: SeoSearchParams }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const language = await resolveSeoLanguage(searchParams)
  return createPageMetadata(
    {
      path: "/alternatives",
      title: "Inventory and GST Billing Software Alternatives | Dugam",
      description: "Compare Dugam with popular inventory and billing software alternatives for Indian shops and MSMEs.",
      keywords: ["inventory software alternative", "GST billing alternative", "shop software comparison"],
    },
    language,
  )
}

export default async function AlternativesHub({ searchParams }: PageProps) {
  const language = await resolveSeoLanguage(searchParams)

  return (
    <PublicPageShell path="/alternatives" language={language}>
      <main className="bg-[var(--bg-primary)] px-5 py-16 text-[var(--text-primary)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="max-w-4xl">
            <h1 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl">Inventory and GST Billing Software Alternatives</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--text-secondary)]">
              Explore Dugam against popular shop software options and see why a simpler pricing model can work better for Indian MSMEs.
            </p>
          </section>

          <ProgrammaticLinkGrid
            title="Popular comparison pages"
            description="Open a detailed alternative page to compare workflows, pricing, and fit for your shop."
            links={competitorComparisonPages.map((page) => ({
              label: page.competitorName,
              href: `/alternatives/${page.slug}`,
            }))}
          />
        </div>
      </main>
    </PublicPageShell>
  )
}
