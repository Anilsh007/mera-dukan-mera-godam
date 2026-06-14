import type { MetadataRoute } from "next"
import { SEO_LAST_MODIFIED, absoluteUrl, buildLanguageAlternates, normalizePath } from "@/app/lib/seo/site"

const SITEMAP_PATHS = ["/", "/about", "/faq", "/support", "/privacy-policy", "/terms"]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(SEO_LAST_MODIFIED)
  const uniquePaths = Array.from(new Set(SITEMAP_PATHS.map((path) => normalizePath(path))))

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
