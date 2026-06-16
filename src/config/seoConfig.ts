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
    "godown management software",
    "shop management software",
    "retail management software",
    "GST billing software",
    "GST invoice software",
    "GST bill generator",
    "GST bill maker",
    "billing software india",
    "retail billing software",
    "invoice software india",
    "stock inventory tracker",
    "inventory tracker app",
    "purchase management software",
    "sales management software",
    "expense management software",
    "POS software india",
    "retail POS software",
    "inventory management app",
    "stock management app",
    "free inventory software",
    "free GST billing software",
  ],
  businessKeywords: [
    "kirana store software",
    "grocery shop billing software",
    "hardware shop billing software",
    "electronics shop billing software",
    "mobile shop inventory software",
    "medical store inventory software",
    "pharmacy billing software",
    "garment shop billing software",
    "footwear shop inventory software",
    "stationery shop billing software",
    "wholesale inventory software",
    "distributor inventory software",
    "supermarket inventory software",
  ],
  pricingKeywords: [
    "billing software under 1000 rupees",
    "inventory software under 999 rupees",
    "affordable GST billing software",
    "budget inventory management software",
    "billing software for small business",
    "inventory software for MSME",
    "billing software under 100 rupees per month",
    "GST software for small shops",
  ],
  competitorKeywords: [
    "Vyapar alternative",
    "TallyPrime alternative",
    "myBillBook alternative",
    "Swipe alternative",
    "Busy Accounting alternative",
    "Marg ERP alternative",
    "Zoho Inventory alternative",
    "QuickBooks alternative",
    "Khatabook alternative",
  ],
} as const

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
  competitor: string
}

export type CompetitorComparisonPageConfig = {
  kind: "competitor"
  slug: string
  competitorName: string
  title: string
  description: string
  h1: string
  intro: string
  comparisonHeadline: string
  comparisonNote: string
  comparisonRows: ComparisonRow[]
  highlights: string[]
  faqs: ProgrammaticFaq[]
  relatedLinks: ProgrammaticLink[]
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

const competitorComparisonRows: ComparisonRow[] = [
  {
    feature: "Multi-device sync",
    dugam: "Built for mobile + desktop workflows with a single inventory source of truth",
    competitor: "Often placed behind a higher-tier desktop sync plan",
  },
  {
    feature: "GST billing",
    dugam: "Included for Indian shop billing and invoice workflows",
    competitor: "Available, but frequently tied to setup complexity or premium modules",
  },
  {
    feature: "Pricing clarity",
    dugam: "₹99/month and ₹999/year with a clear daily-cost hook",
    competitor: "Pricing can grow quickly as users add devices, staff, or sync features",
  },
  {
    feature: "Mobile-first experience",
    dugam: "Fast, responsive, and built for shop floor usage",
    competitor: "Many desktop-first tools need extra steps on mobile",
  },
  {
    feature: "Shop and godown workflows",
    dugam: "Inventory, sales, purchases, and godown tracking in one app",
    competitor: "Often split across modules or add-ons",
  },
]

const competitorFaqs: ProgrammaticFaq[] = [
  {
    question: "Can Dugam replace my current billing or inventory app?",
    answer: "Yes. Dugam is designed as a practical alternative for shops that want a simpler, more affordable billing and stock workflow.",
  },
  {
    question: "Does Dugam support mobile and desktop use?",
    answer: "Yes. The app is built to stay responsive on both desktop browsers and mobile devices so shop teams can work anywhere.",
  },
  {
    question: "Is there a cheaper way to manage inventory and GST billing?",
    answer: "Dugam focuses on a low-entry pricing model with monthly and yearly options that fit small and medium Indian businesses.",
  },
]

const industryFaqs: ProgrammaticFaq[] = [
  {
    question: "Can this app work for my shop type?",
    answer: "Yes. Dugam is built for kirana, hardware, electronics, mobile, wholesale, and godown-centric workflows.",
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

const competitorRelatedLinks: ProgrammaticLink[] = [
  { label: "View pricing", href: "/pricing" },
  { label: "Read FAQ", href: "/faq" },
  { label: "Kirana store billing software", href: "/industries/kirana-store" },
  { label: "Wholesale inventory software", href: "/industries/wholesalers-and-godown" },
  { label: "Get support", href: "/support" },
]

const industryRelatedLinks: ProgrammaticLink[] = [
  { label: "View pricing", href: "/pricing" },
  { label: "Read FAQ", href: "/faq" },
  { label: "Vyapar alternative", href: "/alternatives/vyapar" },
  { label: "Hardware shop software", href: "/industries/hardware-shop" },
  { label: "Get support", href: "/support" },
]

const competitorComparisonPagesBase = [
  {
    slug: "vyapar",
    competitorName: "Vyapar",
    title: "Best Free Vyapar Alternative for PC with Multi-Device Sync | Dugam",
    description:
      "Explore Dugam as a lightweight Vyapar alternative for Indian shops that want simpler inventory management, GST billing, and responsive mobile + desktop workflows.",
  },
  {
    slug: "tally",
    competitorName: "TallyPrime",
    title: "Best TallyPrime Alternative for Small Shops and MSMEs | Dugam",
    description:
      "See how Dugam compares as a modern TallyPrime alternative for inventory management and GST billing without heavyweight desktop complexity.",
  },
  {
    slug: "mybillbook",
    competitorName: "myBillBook",
    title: "Best myBillBook Alternative for Stock and GST Billing | Dugam",
    description:
      "Dugam is a practical myBillBook alternative for shops that need affordable inventory tracking, GST invoices, and simple daily workflows.",
  },
  {
    slug: "swipe",
    competitorName: "Swipe",
    title: "Best Swipe Alternative for Inventory and Billing Teams | Dugam",
    description:
      "Compare Dugam with Swipe for inventory management, GST billing, and mobile-friendly shop operations that stay easy to use.",
  },
  {
    slug: "busy",
    competitorName: "Busy Accounting",
    title: "Best Busy Accounting Alternative for Retail and Wholesale | Dugam",
    description:
      "Dugam offers a streamlined Busy Accounting alternative for retail and wholesale businesses that want clearer pricing and faster workflows.",
  },
  {
    slug: "marg",
    competitorName: "Marg ERP",
    title: "Best Marg ERP Alternative for Indian Shop Billing | Dugam",
    description:
      "Compare Dugam against Marg ERP for affordable shop management, GST billing, and inventory workflows built for MSMEs.",
  },
  {
    slug: "khatabook",
    competitorName: "Khatabook",
    title: "Best Khatabook Alternative for Inventory and GST Billing | Dugam",
    description:
      "Dugam is a full inventory and GST billing alternative for shops moving beyond ledger-only tools into proper stock management.",
  },
] as const

export const competitorComparisonPages: CompetitorComparisonPageConfig[] = competitorComparisonPagesBase.map((item) => ({
  kind: "competitor",
  ...item,
  h1: `Best ${item.competitorName} Alternative for Indian Shops`,
  intro:
    "Dugam is built for Indian MSMEs that want a simpler, mobile-friendly inventory and GST billing workflow with pricing that stays easy to understand.",
  comparisonHeadline: `How Dugam compares with ${item.competitorName}`,
  comparisonNote:
    "The comparison below focuses on publicly visible product positioning and typical market expectations for shop software. Exact vendor features and tiers can change over time.",
  comparisonRows: competitorComparisonRows,
  highlights: [
    "Fast stock and billing workflow",
    "Mobile + desktop friendly",
    "Affordable monthly and yearly plans",
    "Built for kirana, wholesale, and godown teams",
  ],
  faqs: competitorFaqs,
  relatedLinks: competitorRelatedLinks,
}))

export const industryPages: IndustryPageConfig[] = [
  {
    kind: "industry",
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
    faqs: industryFaqs,
    relatedLinks: [
      { label: "View pricing", href: "/pricing" },
      { label: "Vyapar alternative", href: "/alternatives/vyapar" },
      { label: "Hardware shop billing software", href: "/industries/hardware-shop" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    kind: "industry",
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
    faqs: industryFaqs,
    relatedLinks: [
      { label: "View pricing", href: "/pricing" },
      { label: "Busy alternative", href: "/alternatives/busy" },
      { label: "Kirana store billing software", href: "/industries/kirana-store" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    kind: "industry",
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
    faqs: industryFaqs,
    relatedLinks: [
      { label: "View pricing", href: "/pricing" },
      { label: "Swipe alternative", href: "/alternatives/swipe" },
      { label: "Kirana store billing software", href: "/industries/kirana-store" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    kind: "industry",
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
    faqs: industryFaqs,
    relatedLinks: [
      { label: "View pricing", href: "/pricing" },
      { label: "Vyapar alternative", href: "/alternatives/vyapar" },
      { label: "Electronics and mobile shop software", href: "/industries/electronics-and-mobile" },
      { label: "Support", href: "/support" },
    ],
  },
]

export const programmaticPagePaths = [
  ...competitorComparisonPages.map((page) => `/alternatives/${page.slug}`),
  ...industryPages.map((page) => `/industries/${page.slug}`),
] as const

export function getCompetitorComparisonPage(slug: string) {
  return competitorComparisonPages.find((page) => page.slug === slug)
}

export function getIndustryPage(slug: string) {
  return industryPages.find((page) => page.slug === slug)
}
