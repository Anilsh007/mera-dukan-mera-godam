import type { Metadata } from "next"
import PublicPageShell from "@/app/components/layout/PublicPageShell"
import SupportContent from "@/app/components/marketing/SupportMarketingContent"
import { createPageMetadata, getSeoPage, resolveSeoLanguage, type SeoSearchParams } from "@/app/lib/seo/site"

type PageProps = { searchParams?: SeoSearchParams }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const language = await resolveSeoLanguage(searchParams)
  return createPageMetadata(getSeoPage("/support", language), language)
}

export default async function SupportPage({ searchParams }: PageProps) {
  const language = await resolveSeoLanguage(searchParams)

  return (
    <PublicPageShell path="/support" language={language}>
      <SupportContent />
    </PublicPageShell>
  )
}
