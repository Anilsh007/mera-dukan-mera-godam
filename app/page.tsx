import type { Metadata } from "next"
import Login from "@/app/components/auth/Login"
import PublicPageShell from "@/app/components/layout/PublicPageShell"
import HomeMarketingContent from "@/app/components/marketing/HomeMarketingContent"
import JsonLd from "@/app/components/seo/JsonLd"
import { createPageMetadata, getSeoPage, resolveSeoLanguage, type SeoSearchParams } from "@/app/lib/seo/site"
import { createPageSchema } from "@/app/lib/seo/schema"

type PageProps = { searchParams?: SeoSearchParams }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const language = await resolveSeoLanguage(searchParams)
  return createPageMetadata(getSeoPage("/", language), language)
}

export default async function HomePage({ searchParams }: PageProps) {
  const language = await resolveSeoLanguage(searchParams)

  return (
    <>
      <JsonLd id="home-page-schema" data={createPageSchema("/", language)} />
      <PublicPageShell path="/" language={language}>
        <>
          <Login />
          <HomeMarketingContent />
        </>
      </PublicPageShell>
    </>
  )
}
