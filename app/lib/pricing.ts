import { dugamSEOData } from "@/src/config/seoConfig"

export type PricingPlan = {
  name: string
  price: number
  billing: string
  daily?: string
  highlight?: string
  description: string
  features: string[]
  accent: string
  featured?: boolean
}

export const pricingFeatures = [
  { name: "Inventory & godown tracking" },
  { name: "GST billing & invoicing" },
  { name: "Mobile-friendly dashboard" },
  { name: "No hidden setup charges" },
  { name: "Full features in every plan" },
  { name: "Save more with longer plans" },
]

export const pricingPlans: PricingPlan[] = [
  {
    name: "Monthly",
    price: 99,
    billing: "per month",
    description: `Ideal for shop owners who want flexible access without a long commitment. Starts at ${dugamSEOData.pricing.monthly}.`,
    features: [
      "Inventory and godown tracking",
      "GST billing and invoice tools",
      "Mobile-friendly dashboard",
    ],
    accent: "from-sky-500/20 to-cyan-500/10",
  },
  {
    name: "Quarterly",
    price: 299,
    billing: "per 3 months",
    description: "A balanced plan for growing stores that need steady cost control.",
    features: [
      "All Monthly features",
      "Better value for recurring use",
      "Priority-ready for upgrades",
    ],
    accent: "from-emerald-500/20 to-teal-500/10",
  },
  {
    name: "Half-Yearly",
    price: 599,
    billing: "per 6 months",
    description: "Great for businesses that want predictable pricing and smooth continuity.",
    features: [
      "All Quarterly features",
      "Lower effective monthly cost",
      "Perfect for semi-annual planning",
    ],
    accent: "from-violet-500/20 to-fuchsia-500/10",
  },
  {
    name: "Yearly",
    price: 999,
    billing: "per year",
    daily: dugamSEOData.pricing.yearlyHook,
    //highlight: "Best Value / Most Popular",
    description: `For serious sellers who want the lowest effective cost with the full feature set. ${dugamSEOData.pricing.yearly} plan.`,
    features: [
      "All Half-Yearly features",
      "Lowest effective daily cost",
      "Best for long-term business planning",
    ],
    accent: "from-amber-400/20 via-emerald-400/15 to-cyan-400/10",
    featured: true,
  },
]
