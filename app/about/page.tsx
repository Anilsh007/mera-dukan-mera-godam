import type { Metadata } from "next"
import PublicPageShell from "@/app/components/layout/PublicPageShell"
import AboutContent from "@/app/components/marketing/AboutMarketingContent"
import { createPageMetadata, getSeoPage, resolveSeoLanguage, type SeoSearchParams } from "@/app/lib/seo/site"

type PageProps = { searchParams?: SeoSearchParams }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const language = await resolveSeoLanguage(searchParams)
  return createPageMetadata(getSeoPage("/about", language), language)
}

export default async function AboutPage({ searchParams }: PageProps) {
  const language = await resolveSeoLanguage(searchParams)

  return (
    <PublicPageShell path="/about" language={language}>
      <AboutContent />
    </PublicPageShell>
  )
}
