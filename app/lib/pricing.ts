export type PricingPlan = {
  name: string
  price: number
  billing: string
  daily?: string
  highlight?: string
  description: string
  accent: string
}

export type feature = {
  name: string
}

export const pricingFeatures: feature[] = [
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
    description: "Ideal for shop owners who want flexible access without a long commitment.",
    accent: "from-sky-500/20 to-cyan-500/10",
  },
  {
    name: "Quarterly",
    price: 299,
    billing: "per 3 months",
    description: "A balanced plan for growing stores that need steady cost control.",
    accent: "from-emerald-500/20 to-teal-500/10",
  },
  {
    name: "Half-Yearly",
    price: 599,
    billing: "per 6 months",
    description: "Great for businesses that want predictable pricing and smooth continuity.",
    accent: "from-violet-500/20 to-fuchsia-500/10",
  },
  {
    name: "Yearly",
    price: 999,
    billing: "per year",
    description: "For serious sellers who want the lowest effective cost with the full feature set.",
    accent: "from-amber-400/20 via-emerald-400/15 to-cyan-400/10",
  },
]
