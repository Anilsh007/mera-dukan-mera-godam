import type { Metadata } from "next"
import PublicPageShell from "@/app/components/layout/PublicPageShell"
import PrivacyPolicyContent from "@/app/dashboard/other-pages/privacy-policy"
import { createPageMetadata, getSeoPage, resolveSeoLanguage, type SeoSearchParams } from "@/app/lib/seo/site"

type PageProps = { searchParams?: SeoSearchParams }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const language = await resolveSeoLanguage(searchParams)
  return createPageMetadata(getSeoPage("/privacy-policy", language), language)
}

export default async function PrivacyPolicyPage({ searchParams }: PageProps) {
  const language = await resolveSeoLanguage(searchParams)

  return (
    <PublicPageShell path="/privacy-policy" language={language}>
      <PrivacyPolicyContent />
    </PublicPageShell>
  )
}
