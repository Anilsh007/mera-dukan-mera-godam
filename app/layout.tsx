import type { ReactNode } from "react"
import type { Metadata, Viewport } from "next"
import Script from "next/script" // <-- 1. Ye import add kiya hai
import "./globals.css"
import { ThemeProvider } from "@/app/components/theme/ThemeProvider"
import LanguageTextRewriter from "@/app/components/layout/LanguageTextRewriter"
import JsonLd from "@/app/components/seo/JsonLd"
import NetworkStatusNotifier from "@/app/components/ui/NetworkStatusNotifier"
import NotificationToaster from "@/app/components/ui/NotificationToaster"
import { APP_DESCRIPTION, APP_ICON_PATH, APP_NAME, APP_SHORT_NAME, DEFAULT_OG_IMAGE, SEO_KEYWORDS, SITE_URL, absoluteUrl, getPublicRobots } from "@/app/lib/seo/site"
import { createBaseSchema } from "@/app/lib/seo/schema"
import { en } from "@/app/messages/en"


const themeInitScript = `
(function(){
  try {
    var saved = window.localStorage.getItem("mdmg-theme");
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = saved || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (error) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${APP_NAME} | Inventory Management Software, GST Billing App & Affordable Alternative`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  applicationName: APP_NAME,
  authors: [{ name: APP_NAME, url: SITE_URL }],
  creator: APP_NAME,
  publisher: APP_NAME,
  category: "business",
  classification: "Business software",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    locale: "en_IN",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [absoluteUrl(DEFAULT_OG_IMAGE.url)],
  },
  robots: getPublicRobots(),
  icons: {
    icon: [
      { url: "/fevicon.ico" },
      { url: APP_ICON_PATH, type: "image/svg+xml" },
    ],
    shortcut: "/fevicon.ico",
    apple: APP_ICON_PATH,
  },
  appleWebApp: {
    capable: true,
    title: APP_SHORT_NAME,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6faf8" },
    { media: "(prefers-color-scheme: dark)", color: "#06131b" },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  // 2. Live production check aur IDs variables nikaale
  const isProduction = process.env.NODE_ENV === 'production';
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        
        {/* 3. Sirf production par chale validation */}
        {isProduction && (
          <>
            {/* Google Analytics 4 */}
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>

            {/* Microsoft Clarity */}
            <Script id="microsoft-clarity" strategy="afterInteractive">
              {`
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${clarityId}");
              `}
            </Script>
          </>
        )}
      </head>
      <body>
        <a className="skip-link" href="#main-content" data-i18n-skip>{en.navigation.skipToMainContent}</a>
        <JsonLd id="base-structured-data" data={createBaseSchema()} />
        <ThemeProvider>
          <LanguageTextRewriter />
          <NetworkStatusNotifier />
          {children}
          <NotificationToaster />
        </ThemeProvider>
      </body>
    </html>
  )
}