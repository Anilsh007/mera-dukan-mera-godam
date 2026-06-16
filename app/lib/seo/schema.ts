import { en } from "@/app/messages/en"
import { APP_DESCRIPTION, APP_NAME, APP_SHORT_NAME, SEO_LANGUAGES, SITE_URL, absoluteUrl, getSeoPage, normalizePath, type SeoPage } from "./site"
import { allSeoKeywords, dugamSEOData, type ProgrammaticFaq } from "@/src/config/seoConfig"

export type JsonLdGraph = {
  "@context": "https://schema.org"
  "@graph": Array<Record<string, unknown>>
}

type FaqSchemaItem = {
  question: string
  answer: string
}

const faqSchemaItems: FaqSchemaItem[] = en.marketing.faqItems.map((item) => ({
  question: item.question,
  answer: item.answer,
}))

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
        priceRange: dugamSEOData.pricing.daily,
        offers: {
          "@type": "Offer",
          price: "2.74",
          priceCurrency: "INR",
          description: dugamSEOData.pricing.daily,
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
        keywords: Array.from(new Set([...dugamSEOData.primaryKeywords, ...dugamSEOData.businessKeywords, ...dugamSEOData.pricingKeywords, ...allSeoKeywords])).join(", "),
        publisher: { "@id": organizationId },
      },
    ],
  }
}

export function createPageSchema(path: string, language = "en"): JsonLdGraph {
  const normalizedPath = normalizePath(path)
  const page = getSeoPage(normalizedPath, language)
  const locale = SEO_LANGUAGES.find((item) => item.code === language)?.locale || "en-IN"
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageSchema(page, locale),
      buildBreadcrumbSchema(page),
    ],
  }
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
        mainEntity: faqSchemaItems.map((item) => buildQuestion(item.question, item.answer)),
      },
    ],
  }
}

export function createPricingPageSchema(language = "en"): JsonLdGraph {
  const locale = SEO_LANGUAGES.find((item) => item.code === language)?.locale || "en-IN"
  const monthly = 99
  const quarterly = 299
  const halfYearly = 599
  const yearly = 999

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${absoluteUrl("/pricing")}#product`,
        name: `${APP_NAME} Pricing`,
        description: "Affordable inventory management and GST billing plans for Indian shops and MSMEs.",
        brand: {
          "@type": "Brand",
          name: APP_NAME,
        },
        offers: [
          {
            "@type": "Offer",
            name: "Monthly",
            price: monthly,
            priceCurrency: "INR",
            url: absoluteUrl("/pricing"),
          },
          {
            "@type": "Offer",
            name: "Quarterly",
            price: quarterly,
            priceCurrency: "INR",
            url: absoluteUrl("/pricing"),
          },
          {
            "@type": "Offer",
            name: "Half-Yearly",
            price: halfYearly,
            priceCurrency: "INR",
            url: absoluteUrl("/pricing"),
          },
          {
            "@type": "Offer",
            name: "Yearly",
            price: yearly,
            priceCurrency: "INR",
            url: absoluteUrl("/pricing"),
          },
        ],
      },
      {
        "@type": "AggregateOffer",
        "@id": `${absoluteUrl("/pricing")}#aggregate-offer`,
        priceCurrency: "INR",
        lowPrice: monthly,
        highPrice: yearly,
        offerCount: 4,
        url: absoluteUrl("/pricing"),
      },
      {
        "@type": "FAQPage",
        "@id": `${absoluteUrl("/pricing")}#faq`,
        inLanguage: locale,
        mainEntity: [
          {
            "@type": "Question",
            name: "Is there a free trial?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Dugam includes a trial or launch offer so shop owners can explore the app before subscribing.",
            },
          },
          {
            "@type": "Question",
            name: "Can I upgrade later?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. You can start with a lower plan and move to a higher plan as your shop grows.",
            },
          },
          {
            "@type": "Question",
            name: "Does it work for kirana and wholesale businesses?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The pricing and product are designed for kirana stores, wholesalers, distributors, and other Indian MSMEs.",
            },
          },
        ],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${absoluteUrl("/pricing")}#software`,
        name: APP_NAME,
        operatingSystem: "All",
        applicationCategory: "BusinessApplication",
        description: dugamSEOData.appDescription,
        offers: {
          "@type": "Offer",
          price: yearly,
          priceCurrency: "INR",
          url: absoluteUrl("/pricing"),
        },
      },
    ],
  }
}

export function createCompetitorComparisonPageSchema(input: {
  path: string
  title: string
  description: string
  competitorName: string
  faqItems: ProgrammaticFaq[]
}): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${absoluteUrl(input.path)}#webpage`,
        url: absoluteUrl(input.path),
        name: input.title,
        description: input.description,
        about: {
          "@type": "SoftwareApplication",
          name: APP_NAME,
          applicationCategory: "BusinessApplication",
        },
      },
      {
        "@type": "Article",
        "@id": `${absoluteUrl(input.path)}#article`,
        headline: input.title,
        description: input.description,
        mainEntityOfPage: { "@id": `${absoluteUrl(input.path)}#webpage` },
        author: {
          "@type": "Organization",
          name: APP_NAME,
          url: SITE_URL,
        },
        publisher: {
          "@type": "Organization",
          name: APP_NAME,
          url: SITE_URL,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${absoluteUrl(input.path)}#faq`,
        mainEntity: input.faqItems.map((item) => buildQuestion(item.question, item.answer)),
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${absoluteUrl(input.path)}#software`,
        name: APP_NAME,
        alternateName: APP_SHORT_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "All",
        description: `${APP_NAME} comparison page for ${input.competitorName}.`,
        offers: {
          "@type": "Offer",
          price: 99,
          priceCurrency: "INR",
          url: absoluteUrl("/pricing"),
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${absoluteUrl(input.path)}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Alternatives",
            item: absoluteUrl("/alternatives"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: input.competitorName,
            item: absoluteUrl(input.path),
          },
        ],
      },
    ],
  }
}

export function createIndustryPageSchema(input: {
  path: string
  title: string
  description: string
  industryName: string
  faqItems: ProgrammaticFaq[]
}): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${absoluteUrl(input.path)}#page`,
        url: absoluteUrl(input.path),
        name: input.title,
        description: input.description,
        about: {
          "@type": "Thing",
          name: input.industryName,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${absoluteUrl(input.path)}#faq`,
        mainEntity: input.faqItems.map((item) => buildQuestion(item.question, item.answer)),
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${absoluteUrl(input.path)}#software`,
        name: APP_NAME,
        alternateName: APP_SHORT_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "All",
        description: APP_DESCRIPTION,
        offers: {
          "@type": "Offer",
          price: 99,
          priceCurrency: "INR",
          url: absoluteUrl("/pricing"),
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${absoluteUrl(input.path)}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Industries",
            item: absoluteUrl("/industries"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: input.industryName,
            item: absoluteUrl(input.path),
          },
        ],
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
