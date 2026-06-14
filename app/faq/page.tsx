import type { Metadata } from "next"
import JsonLd from "@/app/components/seo/JsonLd"
import PublicPageShell from "@/app/components/layout/PublicPageShell"
import FaqContent from "@/app/components/marketing/FaqMarketingContent"
import { createFaqPageSchema } from "@/app/lib/seo/schema"
import { createPageMetadata, getSeoPage, resolveSeoLanguage, type SeoSearchParams } from "@/app/lib/seo/site"

type PageProps = { searchParams?: SeoSearchParams }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const language = await resolveSeoLanguage(searchParams)
  return createPageMetadata(getSeoPage("/faq", language), language)
}

export default async function FaqPage({ searchParams }: PageProps) {
  const language = await resolveSeoLanguage(searchParams)

  return (
    <>
      <JsonLd id="faq-page-schema" data={createFaqPageSchema(language)} />
      <PublicPageShell path="/faq" language={language}>
        <FaqContent />
      </PublicPageShell>
    </>
  )
}
