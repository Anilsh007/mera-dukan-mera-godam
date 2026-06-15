import type { MetadataRoute } from "next"
import { PUBLIC_SEO_PAGES, SEO_LAST_MODIFIED, absoluteUrl, buildLanguageAlternates, normalizePath } from "@/app/lib/seo/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(SEO_LAST_MODIFIED)
  const uniquePaths = Array.from(new Set(PUBLIC_SEO_PAGES.map((page) => normalizePath(page.path))))

  return uniquePaths.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: path === "/" ? "daily" : "monthly",
    priority: path === "/" ? 1 : 0.8,
    alternates: {
      languages: buildLanguageAlternates(path, true),
    },
  }))
}
