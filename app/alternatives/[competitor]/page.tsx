import type { Metadata } from "next"
import { notFound } from "next/navigation"
import PublicPageShell from "@/app/components/layout/PublicPageShell"
import ProgrammaticPageContent from "@/app/components/marketing/ProgrammaticPageContent"
import { createCompetitorComparisonPageSchema } from "@/app/lib/seo/schema"
import { createPageMetadata, resolveSeoLanguage, type SeoSearchParams } from "@/app/lib/seo/site"
import { competitorComparisonPages, getCompetitorComparisonPage } from "@/src/config/seoConfig"

type PageProps = {
  params: Promise<{ competitor: string }>
  searchParams?: SeoSearchParams
}

export function generateStaticParams() {
  return competitorComparisonPages.map((page) => ({ competitor: page.slug }))
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { competitor } = await params
  const page = getCompetitorComparisonPage(competitor)
  const language = await resolveSeoLanguage(searchParams)

  if (!page) {
    return createPageMetadata(
      {
        path: "/alternatives",
        title: "Alternatives | Dugam",
        description: "Compare Dugam with popular inventory and billing software alternatives.",
        keywords: ["inventory alternative", "GST billing alternative"],
      },
      language,
    )
  }

  return createPageMetadata(
    {
      path: `/alternatives/${page.slug}`,
      title: page.title,
      description: page.description,
      keywords: [
        page.competitorName,
        `${page.competitorName} alternative`,
        "inventory management software",
        "GST billing software",
        "affordable inventory software",
      ],
    },
    language,
  )
}

export default async function CompetitorComparisonPage({ params, searchParams }: PageProps) {
  const { competitor } = await params
  const page = getCompetitorComparisonPage(competitor)
  const language = await resolveSeoLanguage(searchParams)

  if (!page) notFound()

  return (
    <PublicPageShell
      path={`/alternatives/${page.slug}`}
      language={language}
      schemaData={createCompetitorComparisonPageSchema({
        path: `/alternatives/${page.slug}`,
        title: page.title,
        description: page.description,
        competitorName: page.competitorName,
        faqItems: page.faqs,
      })}
    >
      <ProgrammaticPageContent page={page} />
    </PublicPageShell>
  )
}
