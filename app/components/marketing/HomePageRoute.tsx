import type { Metadata } from "next"
import PublicPageShell from "@/app/components/layout/PublicPageShell"
import HomePageContent from "@/app/components/marketing/HomePageContent"
import { createPageMetadata, getSeoPage, resolveSeoLanguage, type SeoSearchParams } from "@/app/lib/seo/site"

type PageProps = { searchParams?: SeoSearchParams }

export async function generateHomeMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const language = await resolveSeoLanguage(searchParams)
  return createPageMetadata(getSeoPage("/", language), language)
}

export default async function HomePageRoute({ searchParams }: PageProps) {
  const language = await resolveSeoLanguage(searchParams)
  return (
    <PublicPageShell path="/" language={language}>
      <HomePageContent />
    </PublicPageShell>
  )
}
