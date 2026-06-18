import type { Metadata } from "next"
import { getLocalizedSeoCopy } from "@/app/messages/locales/seo"
import { en } from "@/app/messages/en"
import { allSeoKeywords, dugamSEOData, getProgrammaticKeywordsForPath } from "@/src/config/seoConfig"

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
const defaultProductionSiteUrl = dugamSEOData.siteUrl
export const SITE_URL = configuredSiteUrl && /^https?:\/\//i.test(configuredSiteUrl)
  ? configuredSiteUrl.replace(/\/$/, "")
  : process.env.NODE_ENV === "production"
    ? defaultProductionSiteUrl
    : "http://localhost:3000"
export const APP_NAME = "Dugam"
export const APP_SHORT_NAME = "MDMG"
export const APP_DESCRIPTION = dugamSEOData.appDescription || getLocalizedSeoCopy("en").appDescription
export const SEO_LAST_MODIFIED = new Date().toISOString().split("T")[0]
export const SEO_LOCALE = "en-IN"
export const OG_IMAGE_PATH = "/og-image.svg"
export const APP_ICON_PATH = "/icons/icon.svg"
export const MASKABLE_ICON_PATH = "/icons/maskable-icon.svg"

export const DEFAULT_OG_IMAGE = {
  url: OG_IMAGE_PATH,
  width: 1200,
  height: 630,
  alt: en.seo.ogImageAlt,
}

export const SEO_KEYWORDS = Array.from(
  new Set([
    ...dugamSEOData.primaryKeywords,
    ...dugamSEOData.businessKeywords,
    ...dugamSEOData.pricingKeywords,
    ...dugamSEOData.competitorKeywords,
    ...allSeoKeywords,
    "stock inventory management system",
    "inventory management software India",
    "stock management app for small business",
    "GST billing software for shopkeepers",
    "GST invoice software India",
    "purchase and sales management software",
    "inventory billing software",
    "shop billing software with GST",
    "stock register software",
    "small business inventory app India",
    "print receipt and GST invoice software",
    "WhatsApp invoice sharing software",
    "simple inventory software for Indian shops",
    "stock purchase sale management app",
    "inventory and billing software for retail shops",
    "wholesale inventory management software",
    "warehouse stock management app",
    "showroom billing software",
    "supplier payment tracking software",
    "low stock alert inventory app",
  ]),
)

export const SEO_LANGUAGES = [
  { code: "en", locale: "en-IN", label: "English" },
  { code: "hi", locale: "hi-IN", label: "Hindi" },
  { code: "bn", locale: "bn-IN", label: "Bengali" },
  { code: "te", locale: "te-IN", label: "Telugu" },
  { code: "mr", locale: "mr-IN", label: "Marathi" },
  { code: "ta", locale: "ta-IN", label: "Tamil" },
  { code: "ur", locale: "ur-IN", label: "Urdu" },
  { code: "gu", locale: "gu-IN", label: "Gujarati" },
  { code: "kn", locale: "kn-IN", label: "Kannada" },
  { code: "ml", locale: "ml-IN", label: "Malayalam" },
  { code: "or", locale: "or-IN", label: "Odia" },
  { code: "pa", locale: "pa-IN", label: "Punjabi" },
] as const

export type SeoSearchParams = Promise<{ lang?: string | string[] } | undefined> | undefined
export type SeoLanguageCode = (typeof SEO_LANGUAGES)[number]["code"]

export function normalizeSeoLanguage(language?: string | string[]) {
  const raw = Array.isArray(language) ? language[0] : language
  if (!raw) return "en"
  const shortCode = raw.toLowerCase().split("-")[0]
  return SEO_LANGUAGES.some((item) => item.code === shortCode) ? shortCode : "en"
}

export async function resolveSeoLanguage(searchParams?: SeoSearchParams) {
  const params = await Promise.resolve(searchParams)
  return normalizeSeoLanguage(params?.lang)
}

export type SeoPage = {
  path: string
  title: string
  description: string
  keywords?: string[]
  index?: boolean
  priority?: number
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
}

const pageDefaults: Array<Pick<SeoPage, "path" | "priority" | "changeFrequency">> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/about", priority: 0.75, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.72, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/alternatives", priority: 0.74, changeFrequency: "monthly" },
  { path: "/industries", priority: 0.74, changeFrequency: "monthly" },
  { path: "/support", priority: 0.7, changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: 0.55, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.55, changeFrequency: "yearly" },
  { path: "/login", priority: 0.35, changeFrequency: "monthly" },
]

export const ALL_SEO_PAGES: SeoPage[] = pageDefaults.map((page) => ({
  ...page,
  ...getLocalizedPageCopy(page.path),
  ...(page.path === "/login" ? { index: false } : {}),
}))

export const PUBLIC_SEO_PAGES: SeoPage[] = ALL_SEO_PAGES.filter((page) => page.index !== false)

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${SITE_URL}${normalizedPath}`
}

export function getSeoPage(path: string, language = "en") {
  const normalizedPath = normalizePath(path)
  const defaults = ALL_SEO_PAGES.find((page) => page.path === normalizedPath) ?? ALL_SEO_PAGES[0]
  return {
    ...defaults,
    ...getLocalizedPageCopy(defaults.path, language),
    ...(defaults.path === "/login" ? { index: false } : {}),
  }
}

export function createPageMetadata(page: SeoPage, language = "en"): Metadata {
  const canonical = normalizePath(page.path)
  const title = page.title
  const description = page.description
  const keywords = Array.from(new Set([...SEO_KEYWORDS, ...getProgrammaticKeywordsForPath(page.path), ...(page.keywords ?? [])]))
  const currentLanguage = SEO_LANGUAGES.find((item) => item.code === language) ?? SEO_LANGUAGES[0]

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords,
    alternates: {
      canonical: absoluteUrl(canonical),
      languages: buildLanguageAlternates(canonical, true),
    },
    openGraph: {
      type: "website",
      url: absoluteUrl(canonical),
      siteName: APP_NAME,
      title,
      description,
      locale: currentLanguage.locale.replace("-", "_"),
      alternateLocale: SEO_LANGUAGES.filter((item) => item.locale !== currentLanguage.locale).map((item) => item.locale.replace("-", "_")),
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(OG_IMAGE_PATH)],
    },
    robots: page.index === false ? getLoginRobots() : getPublicRobots(),
  }
}

export function createPrivatePageMetadata(title: string, description = `${APP_NAME} private business dashboard.`): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    robots: getPrivateRobots(),
    alternates: {
      canonical: absoluteUrl("/dashboard"),
    },
  }
}

export function getPublicRobots(): Metadata["robots"] {
  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  }
}

export function getPrivateRobots(): Metadata["robots"] {
  return {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-image-preview": "none",
      "max-snippet": 0,
      "max-video-preview": 0,
    },
  }
}

export function getLoginRobots(): Metadata["robots"] {
  return {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  }
}

export function buildLanguageAlternates(path: string, absolute = false) {
  const normalizedPath = normalizePath(path)
  const alternates = SEO_LANGUAGES.reduce<Record<string, string>>((items, language) => {
    const languagePath = language.code === "en" ? normalizedPath : `${normalizedPath}?lang=${language.code}`
    items[language.locale] = absolute ? absoluteUrl(languagePath) : languagePath
    return items
  }, {})

  alternates["x-default"] = absolute ? absoluteUrl(normalizedPath) : normalizedPath
  return alternates
}

export function normalizePath(path: string) {
  if (!path || path === "#") return "/"
  const urlPath = path.split("?")[0].split("#")[0]
  if (!urlPath || urlPath === "/") return "/"
  return `/${urlPath.replace(/^\/+|\/+$/g, "")}`
}

function getLocalizedPageCopy(path: string, language = "en") {
  const copy = getLocalizedSeoCopy(language)
  return copy.pages[path] || getLocalizedSeoCopy("en").pages[path] || getLocalizedSeoCopy("en").pages["/"]
}
