export const DASHBOARD_ROUTES = {
  overview: "/dashboard",
  quickSale: "/dashboard/quick-sale",
  pos: "/dashboard/pos",
  sales: "/dashboard/sales",
  estimates: "/dashboard/estimates",
  returns: "/dashboard/returns",
  exchange: "/dashboard/exchange",
  quickPurchase: "/dashboard/quick-purchase",
  purchases: "/dashboard/purchases",
  recentPurchases: "/dashboard/recent-purchases",
  inventory: "/dashboard/all-inventory",
  advancedInventory: "/dashboard/advanced-inventory",
  stockHistory: "/dashboard/stock-history",
  expiryAlerts: "/dashboard/expiry-alerts",
  parties: "/dashboard/parties",
  customers: "/dashboard/customers",
  suppliers: "/dashboard/suppliers",
  expenses: "/dashboard/expenses",
  cashbook: "/dashboard/cashbook",
  profitLoss: "/dashboard/profit-loss",
  gstInvoice: "/dashboard/gst-invoice",
  gstReports: "/dashboard/gst-reports",
  reports: "/dashboard/reports",
  profile: "/dashboard/profile",
  downloadData: "/dashboard/settings/download",
  backupRestore: "/dashboard/backup-restore",
  accountSettings: "/dashboard/settings/account",
  subscriptionSettings: "/dashboard/settings/subscription",
} as const;

export type DashboardRouteKey = keyof typeof DASHBOARD_ROUTES;
export type DashboardRouteHref = (typeof DASHBOARD_ROUTES)[DashboardRouteKey];

export const dashboardRouteHrefs = Object.values(DASHBOARD_ROUTES);
export const dashboardRouteHrefSet = new Set<string>(dashboardRouteHrefs);
