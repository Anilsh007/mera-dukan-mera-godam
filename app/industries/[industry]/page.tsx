import type { Metadata } from "next"
import { notFound } from "next/navigation"
import PublicPageShell from "@/app/components/layout/PublicPageShell"
import ProgrammaticPageContent from "@/app/components/marketing/ProgrammaticPageContent"
import { createIndustryPageSchema } from "@/app/lib/seo/schema"
import { createPageMetadata, resolveSeoLanguage, type SeoSearchParams } from "@/app/lib/seo/site"
import { getIndustryPage, industryPages } from "@/src/config/seoConfig"

type PageProps = {
  params: Promise<{ industry: string }>
  searchParams?: SeoSearchParams
}

export function generateStaticParams() {
  return industryPages.map((page) => ({ industry: page.slug }))
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { industry } = await params
  const page = getIndustryPage(industry)
  const language = await resolveSeoLanguage(searchParams)

  if (!page) {
    return createPageMetadata(
      {
        path: "/industries",
        title: "Industries | Dugam",
        description: "Explore Dugam for retail, wholesale, and inventory-focused business workflows.",
        keywords: ["industry inventory software", "shop management software"],
      },
      language,
    )
  }

  return createPageMetadata(
    {
      path: `/industries/${page.slug}`,
      title: page.title,
      description: page.description,
      keywords: [
        page.industryName,
        `${page.industryName} billing software`,
        `${page.industryName} inventory software`,
        "inventory management software",
        "GST billing software",
      ],
    },
    language,
  )
}

export default async function IndustryPage({ params, searchParams }: PageProps) {
  const { industry } = await params
  const page = getIndustryPage(industry)
  const language = await resolveSeoLanguage(searchParams)

  if (!page) notFound()

  return (
    <PublicPageShell
      path={`/industries/${page.slug}`}
      language={language}
      schemaData={createIndustryPageSchema({
        path: `/industries/${page.slug}`,
        title: page.title,
        description: page.description,
        industryName: page.industryName,
        faqItems: page.faqs,
      })}
    >
      <ProgrammaticPageContent page={page} />
    </PublicPageShell>
  )
}
