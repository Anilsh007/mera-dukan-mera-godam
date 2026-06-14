import { en } from "@/app/messages/en"
import { APP_DESCRIPTION, APP_NAME, APP_SHORT_NAME, SEO_LANGUAGES, SITE_URL, absoluteUrl, getSeoPage, normalizePath, type SeoPage } from "./site"

export type JsonLdGraph = {
  "@context": "https://schema.org"
  "@graph": Array<Record<string, unknown>>
}

type FaqSchemaItem = {
  question: string
  answer: string
}

const pricingFaqItems: FaqSchemaItem[] = [
  {
    question: "What is Dugam?",
    answer: "Dugam is an inventory management and GST billing platform for Indian retail shops, wholesalers, and godown workflows.",
  },
  {
    question: "Which shops can use this inventory app?",
    answer: "Kirana stores, hardware shops, stationery shops, wholesale counters, showrooms, and small warehouse teams can use it.",
  },
  {
    question: "Can I create GST invoices?",
    answer: "Yes. You can create GST invoices, manage stock, and handle billing workflows from the same platform.",
  },
]

export type LocalBusinessSchemaInput = {
  name: string
  url?: string
  description?: string
  telephone?: string
  email?: string
  image?: string
  priceRange?: string
  address?: {
    streetAddress?: string
    addressLocality?: string
    addressRegion?: string
    postalCode?: string
    addressCountry?: string
  }
}

const languages = SEO_LANGUAGES.map((language) => language.locale)

const seoSchemaText = en.seo.schema

const featureList = [
  seoSchemaText.inventoryFeature,
  seoSchemaText.stockHistoryFeature,
  seoSchemaText.gstInvoiceFeature,
  seoSchemaText.purchaseSupplierFeature,
  seoSchemaText.quickPurchaseFeature,
  seoSchemaText.detailedPurchaseFeature,
  seoSchemaText.multiItemSaleFeature,
  seoSchemaText.receiptPrintFeature,
  seoSchemaText.whatsappShareFeature,
  seoSchemaText.profileInvoiceFeature,
  seoSchemaText.expiryAlertsFeature,
  seoSchemaText.salesRecoveryFeature,
  seoSchemaText.businessReportsFeature,
  seoSchemaText.multiLanguageFeature,
]
const faqSchemaItems: FaqSchemaItem[] = en.marketing.faqItems.map((item) => ({
  question: item.question,
  answer: item.answer,
}))

export function createBaseSchema(): JsonLdGraph {
  const organizationId = `${SITE_URL}/#organization`
  const websiteId = `${SITE_URL}/#website`
  const softwareId = `${SITE_URL}/#software`

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: APP_NAME,
        alternateName: APP_SHORT_NAME,
        url: SITE_URL,
        description: APP_DESCRIPTION,
        logo: absoluteUrl("/icons/icon.svg"),
        image: absoluteUrl("/og-image.svg"),
        areaServed: { "@type": "Country", name: "India" },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          areaServed: "IN",
          availableLanguage: languages,
          url: absoluteUrl("/support"),
        },
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: SITE_URL,
        name: APP_NAME,
        alternateName: APP_SHORT_NAME,
        description: APP_DESCRIPTION,
        inLanguage: languages,
        publisher: { "@id": organizationId },
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/support?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": ["SoftwareApplication", "WebApplication"],
        "@id": softwareId,
        name: APP_NAME,
        alternateName: APP_SHORT_NAME,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: seoSchemaText.applicationSubCategory,
        operatingSystem: "All",
        browserRequirements: seoSchemaText.browserRequirements,
        url: SITE_URL,
        image: absoluteUrl("/og-image.svg"),
        description: "Modern inventory management and GST billing app for Indian small businesses.",
        inLanguage: languages,
        countryOfOrigin: "IN",
        featureList,
        priceRange: "Starts at ₹3 per day",
        offers: {
          "@type": "Offer",
          price: "3",
          priceCurrency: "INR",
          description: "Starts at ₹3 per day",
          url: absoluteUrl("/pricing"),
        },
        audience: [
          { "@type": "BusinessAudience", audienceType: seoSchemaText.retailerAudience },
          { "@type": "BusinessAudience", audienceType: seoSchemaText.wholesalerAudience },
          { "@type": "BusinessAudience", audienceType: seoSchemaText.smallBusinessAudience },
          { "@type": "BusinessAudience", audienceType: seoSchemaText.distributorAudience },
          { "@type": "BusinessAudience", audienceType: seoSchemaText.showroomAudience },
          { "@type": "BusinessAudience", audienceType: seoSchemaText.shopkeeperAudience },
          { "@type": "BusinessAudience", audienceType: seoSchemaText.storekeeperAudience },
        ],
        keywords: APP_DESCRIPTION,
        publisher: { "@id": organizationId },
      },
    ],
  }
}

export function createPageSchema(path: string, language = "en"): JsonLdGraph {
  const normalizedPath = normalizePath(path)
  const page = getSeoPage(normalizedPath, language)
  const locale = SEO_LANGUAGES.find((item) => item.code === language)?.locale || "en-IN"
  const graph: Array<Record<string, unknown>> = [
    buildWebPageSchema(page, locale),
    buildBreadcrumbSchema(page),
  ]

  return { "@context": "https://schema.org", "@graph": graph }
}

export function createFaqPageSchema(language = "en"): JsonLdGraph {
  const locale = SEO_LANGUAGES.find((item) => item.code === language)?.locale || "en-IN"
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${absoluteUrl("/faq")}#faq`,
        inLanguage: locale,
        mainEntity: pricingFaqItems.map((item) => buildQuestion(item.question, item.answer)),
      },
    ],
  }
}

export function createLocalBusinessSchema(input: LocalBusinessSchemaInput): JsonLdGraph {
  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "LocalBusiness",
      "@id": `${input.url || SITE_URL}#local-business`,
      name: input.name,
      url: input.url || SITE_URL,
      description: input.description,
      telephone: input.telephone,
      email: input.email,
      image: input.image,
      priceRange: input.priceRange,
      address: input.address
        ? {
            "@type": "PostalAddress",
            ...input.address,
            addressCountry: input.address.addressCountry || "IN",
          }
        : undefined,
    },
  ]

  return { "@context": "https://schema.org", "@graph": removeUndefinedFromGraph(graph) }
}

function buildWebPageSchema(page: SeoPage, locale: string) {
  return {
    "@type": getPageType(page.path),
    "@id": `${absoluteUrl(page.path)}#webpage`,
    url: absoluteUrl(page.path),
    name: page.title,
    description: page.description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#software` },
    inLanguage: locale,
    breadcrumb: { "@id": `${absoluteUrl(page.path)}#breadcrumb` },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: absoluteUrl("/og-image.svg"),
      width: 1200,
      height: 630,
    },
  }
}

function buildBreadcrumbSchema(page: SeoPage) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(page.path)}#breadcrumb`,
    itemListElement: buildBreadcrumb(page),
  }
}

function buildFaqSchema(locale: string) {
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl("/faq")}#faq`,
    inLanguage: locale,
    mainEntity: faqSchemaItems.map((item) => buildQuestion(item.question, item.answer)),
  }
}

function buildBreadcrumb(page: SeoPage) {
  const items: Array<Record<string, unknown>> = [
    {
      "@type": "ListItem",
      position: 1,
      name: seoSchemaText.homeBreadcrumb,
      item: SITE_URL,
    },
  ]

  if (page.path !== "/") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: page.title,
      item: absoluteUrl(page.path),
    })
  }

  return items
}

function buildQuestion(name: string, text: string) {
  return {
    "@type": "Question",
    name,
    acceptedAnswer: {
      "@type": "Answer",
      text,
    },
  }
}

function getPageType(path: string) {
  switch (path) {
    case "/about":
      return "AboutPage"
    case "/support":
      return "ContactPage"
    case "/privacy-policy":
    case "/terms":
      return "WebPage"
    default:
      return "WebPage"
  }
}

function removeUndefinedFromGraph(graph: Array<Record<string, unknown>>) {
  return graph.map((node) => Object.fromEntries(Object.entries(node).filter(([, value]) => value !== undefined)))
}
