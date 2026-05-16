import type { Metadata } from "next"
import Login from "@/app/components/auth/Login"
import PublicPageShell from "@/app/components/layout/PublicPageShell"
import { createPageMetadata, getSeoPage, resolveSeoLanguage, type SeoSearchParams } from "@/app/lib/seo/site"

type PageProps = { searchParams?: SeoSearchParams }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const language = await resolveSeoLanguage(searchParams)
  return createPageMetadata(getSeoPage("/login", language), language)
}

export default async function LoginPage({ searchParams }: PageProps) {
  const language = await resolveSeoLanguage(searchParams)

  return (
    <PublicPageShell path="/login" language={language}>
      <Login />
    </PublicPageShell>
  )
}
