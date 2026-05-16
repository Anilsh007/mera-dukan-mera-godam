import type { Metadata } from "next"
import PublicPageShell from "@/app/components/layout/PublicPageShell"
import TermsContent from "@/app/dashboard/other-pages/terms"
import { createPageMetadata, getSeoPage, resolveSeoLanguage, type SeoSearchParams } from "@/app/lib/seo/site"

type PageProps = { searchParams?: SeoSearchParams }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const language = await resolveSeoLanguage(searchParams)
  return createPageMetadata(getSeoPage("/terms", language), language)
}

export default async function TermsPage({ searchParams }: PageProps) {
  const language = await resolveSeoLanguage(searchParams)

  return (
    <PublicPageShell path="/terms" language={language}>
      <TermsContent />
    </PublicPageShell>
  )
}
