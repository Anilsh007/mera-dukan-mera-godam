import type { Metadata } from "next"
import PublicPageShell from "@/app/components/layout/PublicPageShell"
import FaqContent from "@/app/components/marketing/FaqMarketingContent"
import { createPageMetadata, getSeoPage, resolveSeoLanguage, type SeoSearchParams } from "@/app/lib/seo/site"

type PageProps = { searchParams?: SeoSearchParams }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const language = await resolveSeoLanguage(searchParams)
  return createPageMetadata(getSeoPage("/faq", language), language)
}

export default async function FaqPage({ searchParams }: PageProps) {
  const language = await resolveSeoLanguage(searchParams)

  return (
    <PublicPageShell path="/faq" language={language}>
      <FaqContent />
    </PublicPageShell>
  )
}
