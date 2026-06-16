import type { MetadataRoute } from "next"
import { SITE_URL } from "@/app/lib/seo/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/login",
          "/about",
          "/faq",
          "/pricing",
          "/alternatives",
          "/industries",
          "/privacy-policy",
          "/support",
          "/terms",
          "/manifest.webmanifest",
          "/fevicon.ico",
          "/icons/",
          "/og-image.svg",
        ],
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/api/",
          "/_next/",
          "/*.json$",
          "/*.map$",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
