import type { SubscriptionPlanId } from "@/app/lib/db"

export type SubscriptionFeatureKey =
  | "products"
  | "sales"
  | "quickSales"
  | "purchases"
  | "gstInvoices"
  | "estimates"
  | "returns"
  | "accounting"
  | "customers"
  | "suppliers"
  | "exports"
  | "businesses"
  | "staffUsers"
  | "godowns"
  | "barcodeScanner"
  | "reports"
  | "printShareDownload"

export type SubscriptionFeatureLimit = number | boolean | null

export type PlanFeatureConfig = Record<SubscriptionFeatureKey, SubscriptionFeatureLimit>

export const TRIAL_DAYS = 90

export const TRIAL_LIMITS: PlanFeatureConfig = {
  products: 500,
  sales: 300,
  quickSales: 300,
  purchases: 300,
  gstInvoices: 100,
  estimates: 300,
  returns: 150,
  accounting: 300,
  customers: 100,
  suppliers: 50,
  exports: 20,
  businesses: 1,
  staffUsers: 1,
  godowns: 1,
  barcodeScanner: true,
  reports: true,
  printShareDownload: true,
}

export const PLAN_LIMITS: Record<SubscriptionPlanId, PlanFeatureConfig> = {
  trial: TRIAL_LIMITS,
  "free/expired-readonly": {
    products: 5,
    sales: 5,
    quickSales: 5,
    purchases: 5,
    gstInvoices: 5,
    estimates: 5,
    returns: 5,
    accounting: 5,
    customers: 5,
    suppliers: 5,
    exports: 5,
    businesses: 5,
    staffUsers: 5,
    godowns: 5,
    barcodeScanner: 5,
    reports: 5,
    printShareDownload: 5,
  },
  starter: {
    products: null,
    sales: null,
    quickSales: null,
    purchases: null,
    gstInvoices: null,
    estimates: null,
    returns: null,
    accounting: null,
    customers: null,
    suppliers: null,
    exports: null,
    businesses: 1,
    staffUsers: 3,
    godowns: 2,
    barcodeScanner: true,
    reports: true,
    printShareDownload: true,
  },
  pro: {
    products: null,
    sales: null,
    quickSales: null,
    purchases: null,
    gstInvoices: null,
    estimates: null,
    returns: null,
    accounting: null,
    customers: null,
    suppliers: null,
    exports: null,
    businesses: 3,
    staffUsers: 10,
    godowns: 5,
    barcodeScanner: true,
    reports: true,
    printShareDownload: true,
  },
  business: {
    products: null,
    sales: null,
    quickSales: null,
    purchases: null,
    gstInvoices: null,
    estimates: null,
    returns: null,
    accounting: null,
    customers: null,
    suppliers: null,
    exports: null,
    businesses: null,
    staffUsers: null,
    godowns: null,
    barcodeScanner: true,
    reports: true,
    printShareDownload: true,
  },
}

export const PREMIUM_PLANS: SubscriptionPlanId[] = ["starter", "pro", "business"]
