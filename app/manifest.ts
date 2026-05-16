import type { MetadataRoute } from "next"
import { APP_DESCRIPTION, APP_ICON_PATH, APP_NAME, APP_SHORT_NAME, MASKABLE_ICON_PATH } from "@/app/lib/seo/site"
import { en } from "@/app/messages/en"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_NAME,
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f6faf8",
    theme_color: "#0f9f7f",
    categories: ["business", "productivity", "finance"],
    lang: "en-IN",
    dir: "ltr",
    icons: [
      {
        src: "/fevicon.ico",
        sizes: "any",
        type: "image/x-icon",
        purpose: "any",
      },
      {
        src: APP_ICON_PATH,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: MASKABLE_ICON_PATH,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: en.seo.manifest.openDashboardName,
        short_name: en.seo.manifest.openDashboardShortName,
        description: en.seo.manifest.openDashboardDescription,
        url: "/dashboard",
        icons: [{ src: APP_ICON_PATH, sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: en.seo.manifest.createGstInvoiceName,
        short_name: en.seo.manifest.createGstInvoiceShortName,
        description: en.seo.manifest.createGstInvoiceDescription,
        url: "/dashboard/gst-invoice",
        icons: [{ src: APP_ICON_PATH, sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: en.seo.manifest.viewReportsName,
        short_name: en.seo.manifest.viewReportsShortName,
        description: en.seo.manifest.viewReportsDescription,
        url: "/dashboard/reports",
        icons: [{ src: APP_ICON_PATH, sizes: "any", type: "image/svg+xml" }],
      },
    ],
  }
}
