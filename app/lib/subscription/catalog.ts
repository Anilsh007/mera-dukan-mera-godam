import type { SubscriptionPlanId } from "@/app/lib/db"

export type PaidSubscriptionPlanId = Exclude<SubscriptionPlanId, "trial" | "free/expired-readonly">
export type SubscriptionBillingCycle = "monthly" | "quarterly" | "yearly"

export type BillingPrice = {
  amountInPaise: number
  label: string
  periodLabel: string
  note: string
}

export type BillingPlanCatalog = Record<
  PaidSubscriptionPlanId,
  {
    title: string
    description: string
    prices: Record<SubscriptionBillingCycle, BillingPrice>
  }
>

export const BILLING_CYCLES: SubscriptionBillingCycle[] = ["monthly", "quarterly", "yearly"]

export const BILLING_PLAN_CATALOG: BillingPlanCatalog = {
  starter: {
    title: "Starter",
    description: "For one active shop with day-to-day billing, stock, and GST work.",
    prices: {
      monthly: {
        amountInPaise: 29900,
        label: "Rs 299",
        periodLabel: "per month",
        note: "Placeholder price. Update before launch.",
      },
      quarterly: {
        amountInPaise: 79900,
        label: "Rs 799",
        periodLabel: "every 3 months",
        note: "Placeholder price. Update before launch.",
      },
      yearly: {
        amountInPaise: 299900,
        label: "Rs 2,999",
        periodLabel: "per year",
        note: "Placeholder price. Update before launch.",
      },
    },
  },
  pro: {
    title: "Pro",
    description: "For growing shops that need more staff, more businesses, and more godowns.",
    prices: {
      monthly: {
        amountInPaise: 59900,
        label: "Rs 599",
        periodLabel: "per month",
        note: "Placeholder price. Update before launch.",
      },
      quarterly: {
        amountInPaise: 159900,
        label: "Rs 1,599",
        periodLabel: "every 3 months",
        note: "Placeholder price. Update before launch.",
      },
      yearly: {
        amountInPaise: 599900,
        label: "Rs 5,999",
        periodLabel: "per year",
        note: "Placeholder price. Update before launch.",
      },
    },
  },
  business: {
    title: "Business",
    description: "For larger operations that want broad limits and future multi-location scale.",
    prices: {
      monthly: {
        amountInPaise: 99900,
        label: "Rs 999",
        periodLabel: "per month",
        note: "Placeholder price. Update before launch.",
      },
      quarterly: {
        amountInPaise: 269900,
        label: "Rs 2,699",
        periodLabel: "every 3 months",
        note: "Placeholder price. Update before launch.",
      },
      yearly: {
        amountInPaise: 999900,
        label: "Rs 9,999",
        periodLabel: "per year",
        note: "Placeholder price. Update before launch.",
      },
    },
  },
}

export function isPaidSubscriptionPlanId(value: string): value is PaidSubscriptionPlanId {
  return value === "starter" || value === "pro" || value === "business"
}

export function isSubscriptionBillingCycle(value: string): value is SubscriptionBillingCycle {
  return value === "monthly" || value === "quarterly" || value === "yearly"
}
