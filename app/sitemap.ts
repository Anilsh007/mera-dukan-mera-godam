import type { MetadataRoute } from "next"
import { PUBLIC_SEO_PAGES, SEO_LAST_MODIFIED, absoluteUrl, buildLanguageAlternates, normalizePath } from "@/app/lib/seo/site"
import { competitorComparisonPages, industryPages } from "@/src/config/seoConfig"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(SEO_LAST_MODIFIED)
  const programmaticPaths = [
    "/alternatives",
    "/industries",
    ...competitorComparisonPages.map((page) => `/alternatives/${page.slug}`),
    ...industryPages.map((page) => `/industries/${page.slug}`),
  ]
  const uniquePaths = Array.from(new Set([...PUBLIC_SEO_PAGES.map((page) => normalizePath(page.path)), ...programmaticPaths.map((path) => normalizePath(path))]))

  return uniquePaths.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: path === "/" ? "daily" : path.startsWith("/alternatives") || path.startsWith("/industries") ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.8,
    alternates: {
      languages: buildLanguageAlternates(path, true),
    },
  }))
}
