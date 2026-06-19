export const dugamSEOData = {
  brandName: "Dugam (Mera Dukan Mera Godam)",
  siteUrl: "https://www.dugam.in",
  pricing: {
    monthly: "₹99/month",
    yearly: "₹999/year",
    daily: "₹2.74/day",
    yearlyHook: "Sirf ₹2.74/din me poori dukan aur godam manage karein",
  },
  appDescription:
    "Dugam is an affordable inventory management and GST billing app for Indian MSMEs, kirana stores, wholesalers, retailers, and small business teams.",
  primaryKeywords: [
    "inventory management software",
    "stock management software",
    "inventory software india",
    "warehouse management software",
    "shop management software",
    "GST billing software",
    "invoice software india",
    "billing software india",
    "pos software india",
    "inventory management app",
    "stock management app",
    "free GST billing software",
  ],
  businessKeywords: [
    "kirana store software",
    "grocery shop billing software",
    "hardware shop billing software",
    "electronics shop billing software",
    "pharmacy billing software",
    "garment shop billing software",
    "wholesale inventory software",
    "distributor inventory software",
    "supermarket inventory software",
  ],
  pricingKeywords: [
    "billing software under 100 rupees",
    "billing software 99 rupees monthly",
    "billing software 999 rupees yearly",
    "affordable GST billing software",
    "budget inventory management software",
    "billing software for small business",
    "inventory software for MSME",
  ],
} as const

export const seoKeywordDatabase = {
  // 1. FEATURE & BENEFIT DRIVEN KEYWORDS (focus on what you offer, not competitors)
  featureAndBenefits: {
    affordability: [
      "affordable billing software India",
      "budget-friendly billing app",
      "low-cost inventory software",
      "billing software under 100 rupees",
      "billing app 99 rupees monthly",
      "billing software 999 rupees yearly",
      "transparent billing software pricing",
      "no hidden charges billing app",
    ],
    mobileCloud: [
      "mobile billing app India",
      "cloud-based inventory software",
      "mobile and PC sync billing app",
      "cloud sync billing app",
      "mobile-first billing software",
      "work anywhere billing app",
      "offline billing app India",
      "offline billing auto sync",
    ],
    features: [
      "auto backup billing software",
      "low stock alert software",
      "expiry date tracking billing app",
      "WhatsApp invoice billing software",
      "printable billing app",
      "customer ledger billing app",
      "GST e-invoice billing app",
      "multi-user billing software",
    ],
    gstCompliance: [
      "GST billing app India small shop",
      "GST invoice app for shop",
      "GST compliant billing software",
      "GST e-way bill support",
      "GST compliance software India",
      "automated GST calculations",
    ],
  },

  // 2. RETAIL & SHOP SPECIFIC LONG-TAIL KEYWORDS
  retailAndShopSpecific: {
    kiranaGrocery: [
      "kirana store billing software",
      "grocery shop billing software",
      "kirana store stock management app",
      "small grocery store billing app",
      "kirana GST billing software",
      "offline kirana billing software",
      "kirana low stock alert",
      "kirana printable invoice",
    ],
    hardwareSanitary: [
      "hardware shop billing software",
      "sanitary shop billing software",
      "hardware store GST billing",
      "hardware stock register",
      "offline billing for hardware shop",
    ],
    mobileElectronics: [
      "mobile shop billing software",
      "electronics shop billing software",
      "mobile shop GST billing",
      "electronics stock tracking",
      "mobile shop low stock alert",
    ],
    wholesalersGodowns: [
      "wholesaler billing software India",
      "warehouse inventory app",
      "godown billing software",
      "bulk purchase billing software",
      "wholesaler low stock alert",
    ],
    clothingGarments: [
      "clothing shop billing software",
      "garment store billing software",
      "variant inventory management",
      "offline billing for clothing shops",
    ],
  },

  // 3. INTENT & DISCOVERY BASED KEYWORDS
  intentBased: {
    comparison: [
      "best billing software for small shop",
      "billing software comparison",
      "simple inventory software",
      "easy-to-use billing app",
      "beginner-friendly inventory software",
    ],
    switching: [
      "how to switch billing software",
      "migrate billing data to new app",
      "keep billing data when switching software",
      "billing software switching guide India",
    ],
    discovery: [
      "free trial billing software India",
      "14 day free trial billing app",
      "billing software free trial",
      "billing software demo download",
      "billing software no commitment",
    ],
  },

  // 4. FAQ / REVENUE-DRIVING QUESTIONS
  faqQuestions: [
    "which billing software is best for small shop in India",
    "what is the cheapest billing software for kirana store",
    "how to make GST bill for small shop",
    "which billing app works without internet",
    "what is the best inventory app for small shop",
    "how to manage stock in kirana store",
    "how to send bill on WhatsApp for shop",
    "what is the yearly cost of billing software India",
    "how to backup billing data of shop",
    "which billing software has mobile and PC sync",
    "how to calculate profit and loss of shop",
  ],

  // 5. HINGLISH & REGIONAL KEYWORDS (cleaned)
  hinglishAndRegional: [
    "dukan ka bill banane ka app",
    "dukan ka hisab kitab app",
    "dukan ka khata app",
    "dukan ka stock manager",
    "chhote dukan ke liye billing software",
    "kirana dukan ka bill app",
    "bina internet chalne wala billing app",
    "dukan WhatsApp bill kaise bheje",
    "dukan bill print kaise kare",
    "billing app ka price kya hai",
  ],
} as const

export const seoKeywordSources = {
  marketResearch: [
    "Small business owner discussions",
    "Shop management community forums",
    "Industry-specific user groups",
  ],
  searchTrends: [
    "Google Play Store: GST billing app India",
    "App Store & Play Store keyword trends",
  ],
  industryInsights: [
    "MSME industry reports",
    "Small business billing best practices",
  ],
} as const

export type SeoKeywordRouteRule = {
  label: string
  paths: readonly string[]
  keywords: readonly string[]
}

function normalizeSeoRoutePath(routePath: string) {
  if (!routePath || routePath === "#") return "/"
  const strippedPath = routePath.split("?")[0].split("#")[0]
  if (!strippedPath || strippedPath === "/") return "/"
  return `/${strippedPath.replace(/^\/+|\/+$/g, "")}`
}

function collectSeoKeywordValues(value: unknown, collected: string[]) {
  if (typeof value === "string") {
    collected.push(value)
    return
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      collectSeoKeywordValues(entry, collected)
    }
    return
  }

  if (value && typeof value === "object") {
    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      collectSeoKeywordValues(nestedValue, collected)
    }
  }
}

export function flattenSeoKeywordDatabase(database: unknown = seoKeywordDatabase) {
  const keywords: string[] = []
  collectSeoKeywordValues(database, keywords)
  return Array.from(new Set(keywords))
}

export const allSeoKeywords = Array.from(
  new Set([
    ...flattenSeoKeywordDatabase(),
    ...dugamSEOData.primaryKeywords,
    ...dugamSEOData.businessKeywords,
    ...dugamSEOData.pricingKeywords,
  ]),
)

export const programmaticKeywordRouteRules: SeoKeywordRouteRule[] = [
  {
    label: "Affordability and pricing",
    paths: ["/pricing"],
    keywords: seoKeywordDatabase.featureAndBenefits.affordability,
  },
  {
    label: "Mobile and cloud features",
    paths: ["/pricing", "/features"],
    keywords: seoKeywordDatabase.featureAndBenefits.mobileCloud,
  },
  {
    label: "Core features",
    paths: ["/features", "/pricing"],
    keywords: seoKeywordDatabase.featureAndBenefits.features,
  },
  {
    label: "GST compliance features",
    paths: ["/pricing", "/faq"],
    keywords: seoKeywordDatabase.featureAndBenefits.gstCompliance,
  },
  {
    label: "Kirana and grocery workflows",
    paths: ["/industries", "/industries/kirana-store"],
    keywords: seoKeywordDatabase.retailAndShopSpecific.kiranaGrocery,
  },
  {
    label: "Hardware and sanitary workflows",
    paths: ["/industries", "/industries/hardware-shop"],
    keywords: seoKeywordDatabase.retailAndShopSpecific.hardwareSanitary,
  },
  {
    label: "Mobile and electronics workflows",
    paths: ["/industries", "/industries/electronics-and-mobile"],
    keywords: seoKeywordDatabase.retailAndShopSpecific.mobileElectronics,
  },
  {
    label: "Wholesale and godown workflows",
    paths: ["/industries", "/industries/wholesalers-and-godown"],
    keywords: seoKeywordDatabase.retailAndShopSpecific.wholesalersGodowns,
  },
  {
    label: "Clothing and garments workflows",
    paths: ["/industries", "/industries/clothing-garments"],
    keywords: seoKeywordDatabase.retailAndShopSpecific.clothingGarments,
  },
  {
    label: "Comparison and discovery",
    paths: ["/", "/pricing"],
    keywords: seoKeywordDatabase.intentBased.comparison,
  },
  {
    label: "Software switching guide",
    paths: ["/faq", "/support"],
    keywords: seoKeywordDatabase.intentBased.switching,
  },
  {
    label: "Trial and conversion",
    paths: ["/pricing", "/login"],
    keywords: seoKeywordDatabase.intentBased.discovery,
  },
  {
    label: "FAQ questions",
    paths: ["/faq"],
    keywords: seoKeywordDatabase.faqQuestions,
  },
  {
    label: "Regional and Hinglish discovery",
    paths: ["/", "/pricing", "/industries"],
    keywords: seoKeywordDatabase.hinglishAndRegional,
  },
]

export function getProgrammaticKeywordsForPath(routePath: string) {
  const normalizedPath = normalizeSeoRoutePath(routePath)
  const routeKeywords = programmaticKeywordRouteRules.flatMap((rule) =>
    rule.paths.some((candidatePath) => normalizeSeoRoutePath(candidatePath) === normalizedPath)
      ? rule.keywords
      : [],
  )
  return Array.from(new Set(routeKeywords))
}

export type SeoKeywordTier = "tier1" | "tier2" | "tier3"

export const seoKeywordRankingTiers: Record<SeoKeywordTier, readonly string[]> = {
  tier1: [
    "billing software under 100 rupees",
    "billing app 99 rupees monthly",
    "billing software 999 rupees yearly",
    "kirana store billing software",
    "wholesaler billing software India",
    "inventory software for MSME",
    "mobile and PC sync billing app",
    "GST billing app India small shop",
  ],
  tier2: [
    "affordable billing software India",
    "billing software for small business",
    "affordable GST billing software",
    "cloud sync billing app",
    "offline billing app India",
    "low stock alert software",
    "simple inventory software",
  ],
  tier3: [
    "billing software",
    "inventory software",
    "GST billing software",
    "inventory management software",
    "stock management app",
    "POS software india",
    "invoice software india",
  ],
}

export function getSeoKeywordTier(keyword: string): SeoKeywordTier | null {
  const normalizedKeyword = keyword.trim().toLowerCase()
  if (seoKeywordRankingTiers.tier1.some((item) => item.toLowerCase() === normalizedKeyword)) return "tier1"
  if (seoKeywordRankingTiers.tier2.some((item) => item.toLowerCase() === normalizedKeyword)) return "tier2"
  if (seoKeywordRankingTiers.tier3.some((item) => item.toLowerCase() === normalizedKeyword)) return "tier3"
  return null
}

export type ProgrammaticLink = {
  label: string
  href: string
  description?: string
}

export type ProgrammaticFaq = {
  question: string
  answer: string
}

export type ComparisonRow = {
  feature: string
  dugam: string
  typical_alternative: string
}

export type IndustryPageConfig = {
  kind: "industry"
  slug: string
  industryName: string
  title: string
  description: string
  h1: string
  intro: string
  highlights: string[]
  useCases: string[]
  faqs: ProgrammaticFaq[]
  relatedLinks: ProgrammaticLink[]
}

const industryFaqs: ProgrammaticFaq[] = [
  {
    question: "Can this app work for my shop type?",
    answer: "Dugam is built for kirana, hardware, electronics, mobile, wholesale, and godown-centric workflows.",
  },
  {
    question: "Can I print GST invoices and receipts?",
    answer: "Yes. The app supports billing, printable receipts, and business record workflows from the same dashboard.",
  },
  {
    question: "Will this help with stock tracking?",
    answer: "Yes. Stock movement, low-stock signals, purchase records, and reporting are part of the core flow.",
  },
]

const industryRelatedLinks: ProgrammaticLink[] = [
  { label: "View pricing", href: "/pricing" },
  { label: "Read FAQ", href: "/faq" },
  { label: "Features & benefits", href: "/features" },
  { label: "Get support", href: "/support" },
]

const businessCategories = {
  retail: ["Kirana stores", "Grocery shops", "General stores", "Provision stores", "Mini marts", "Retail counters"],
  hardware: ["Hardware shops", "Paint shops", "Plumbing shops", "Pipe & fitting shops", "Sanitary shops", "Tiles & cement stores"],
  electronics: ["Electrical shops", "Electronics shops", "Mobile accessory shops", "Battery & inverter shops", "Automobile spare parts"],
  wholesale: ["Wholesalers", "Distributors", "Stockists", "Showrooms", "Storekeepers", "Warehouse teams"],
} as const

const industryPagesBase = [
  {
    slug: "kirana-store",
    industryName: "Kirana Store",
    title: "Kirana Store Billing Software for Fast Billing and Stock Tracking | Dugam",
    description:
      "Use Dugam as a kirana dukan stock manager app with fast billing, WhatsApp receipt sharing, and simple inventory tracking.",
    h1: "Kirana Store Billing Software for Faster Billing",
    intro:
      "Built for kirana shops that need quick counter billing, simple stock movement, and easy receipt sharing from mobile or desktop.",
    highlights: [
      "Fast billing at the counter",
      "WhatsApp receipt sharing",
      "Low-stock alerts for fast-moving items",
      "Simple daily stock updates",
    ],
    useCases: [
      "Counter billing for daily walk-in customers",
      "Quick stock checks for fast-moving grocery items",
      "Receipt sharing and GST invoice workflows",
    ],
  },
  {
    slug: "hardware-shop",
    industryName: "Hardware Shop",
    title: "Hardware Store Billing Software and Inventory Management | Dugam",
    description:
      "Track hardware items, purchase records, and GST billing with Dugam for hardware and building-material stores.",
    h1: "Hardware Store Billing Software for Inventory Control",
    intro:
      "Ideal for hardware shops that need purchase tracking, stock visibility, and billing that works across desktop and mobile devices.",
    highlights: [
      "Purchase and supplier records",
      "Stock tracking for bolts, tools, and fittings",
      "GST billing for retail and trade invoices",
      "Responsive mobile and desktop experience",
    ],
    useCases: [
      "Track mixed-item hardware inventory",
      "Manage supplier purchases and bill details",
      "Create customer invoices quickly",
    ],
  },
  {
    slug: "electronics-and-mobile",
    industryName: "Electronics and Mobile Shop",
    title: "Electronics and Mobile Shop Inventory Software | Dugam",
    description:
      "Manage electronics and mobile stock, billing, and GST invoices with a streamlined app for showroom and counter teams.",
    h1: "Electronics and Mobile Shop Inventory Software",
    intro:
      "Dugam helps electronics and mobile shops handle device stock, accessory billing, and daily sales in a clean workflow.",
    highlights: [
      "Accessory and device stock tracking",
      "Counter billing for walk-in customers",
      "GST invoice generation",
      "Easy product search and quick sale actions",
    ],
    useCases: [
      "Track high-value device stock",
      "Manage accessories and add-on items",
      "Keep invoices ready for customer support and warranty use",
    ],
  },
  {
    slug: "wholesalers-and-godown",
    industryName: "Wholesalers and Godown",
    title: "Wholesale Inventory Management Software for Godown Teams | Dugam",
    description:
      "Control large stock movement, purchase records, and GST billing with a wholesale and godown-ready inventory platform.",
    h1: "Wholesale Inventory Management Software for Godown Teams",
    intro:
      "Designed for wholesalers and godown teams that need low-stock visibility, purchase history, and cleaner stock control.",
    highlights: [
      "Bulk purchase records",
      "Godown-oriented stock tracking",
      "Low-stock alerts and movement visibility",
      "Reporting for stock-heavy businesses",
    ],
    useCases: [
      "Record incoming bulk stock and purchases",
      "Track inventory across godown workflows",
      "Review sales and movement patterns",
    ],
  },
  {
    slug: "clothing-garments",
    industryName: "Clothing and Garments",
    title: "Clothing and Garments Billing Software for Fashion Shops | Dugam",
    description:
      "Manage apparel inventory, size variants, stock movement, and GST billing for clothing and garments businesses with Dugam.",
    h1: "Clothing and Garments Billing Software for Fashion Shops",
    intro:
      "Built for clothing stores and garment businesses that need variant-aware inventory tracking, quick billing, and clean reporting.",
    highlights: [
      "Track sizes, colors, and variants",
      "Fast billing for walk-in fashion customers",
      "Stock visibility for seasonal inventory",
      "Simple reporting for garments and apparel teams",
    ],
    useCases: [
      "Manage apparel stock by size and variant",
      "Create fast invoices for fashion retail counters",
      "Track seasonal sales and inventory movement",
    ],
  },
] as const

export const industryPages: IndustryPageConfig[] = industryPagesBase.map((item) => ({
  kind: "industry",
  ...item,
  faqs: industryFaqs,
  relatedLinks: industryRelatedLinks,
}))

export const programmaticPagePaths = [
  ...industryPages.map((page) => `/industries/${page.slug}`),
] as const

export function getIndustryPage(slug: string) {
  return industryPages.find((page) => page.slug === slug)
}
