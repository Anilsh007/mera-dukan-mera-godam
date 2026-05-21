import {
  BadgeIndianRupee,
  BarChart3,
  BookOpen,
  Calculator,
  CreditCard,
  Download,
  FileText,
  History,
  Landmark,
  LayoutDashboard,
  Package,
  PlusCircle,
  ReceiptText,
  RotateCcw,
  Settings,
  ShoppingCart,
  SlidersHorizontal,
  TriangleAlert,
  Truck,
  UserCog,
  WalletCards,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import { en } from "@/app/messages/en";

import { DASHBOARD_ROUTES, type DashboardRouteHref } from "@/app/lib/navigation/dashboardRoutes";

export type SidebarNavChild = {
  id: string;
  href: DashboardRouteHref;
  label: string;
  icon?: LucideIcon;
};

export type SidebarNavItem = {
  id: string;
  href?: DashboardRouteHref;
  label: string;
  icon: LucideIcon;
  children?: SidebarNavChild[];
};

export const sidebarNavItems: SidebarNavItem[] = [
  { id: "overview", href: DASHBOARD_ROUTES.overview, label: en.navigation.overview, icon: LayoutDashboard },
  {
    id: "sales-billing",
    label: en.navigation.salesBilling,
    icon: ReceiptText,
    children: [
      { id: "quick-sale", href: DASHBOARD_ROUTES.quickSale, label: en.navigation.quickSale, icon: BadgeIndianRupee },
      { id: "pos", href: DASHBOARD_ROUTES.pos, label: en.navigation.pos, icon: ShoppingCart },
      { id: "sales", href: DASHBOARD_ROUTES.sales, label: en.navigation.sales, icon: ReceiptText },
      { id: "estimates", href: DASHBOARD_ROUTES.estimates, label: en.navigation.estimates, icon: FileText },
      { id: "returns", href: DASHBOARD_ROUTES.returns, label: en.navigation.returns, icon: RotateCcw },
    ],
  },
  {
    id: "purchase-stock",
    label: en.navigation.purchaseStock,
    icon: PlusCircle,
    children: [
      { id: "quick-purchase", href: DASHBOARD_ROUTES.quickPurchase, label: en.navigation.quickPurchase, icon: PlusCircle },
      { id: "purchases", href: DASHBOARD_ROUTES.purchases, label: en.navigation.purchases, icon: ShoppingCart },
      { id: "recent-purchases", href: DASHBOARD_ROUTES.recentPurchases, label: en.navigation.recentPurchases, icon: History },
    ],
  },
  {
    id: "inventory-management",
    label: en.navigation.inventoryManagement,
    icon: Package,
    children: [
      { id: "inventory", href: DASHBOARD_ROUTES.inventory, label: en.navigation.inventory, icon: Package },
      { id: "advanced-inventory", href: DASHBOARD_ROUTES.advancedInventory, label: en.navigation.advancedInventory, icon: Warehouse },
      { id: "stock-history", href: DASHBOARD_ROUTES.stockHistory, label: en.navigation.stockHistory, icon: History },
      { id: "expiry-alerts", href: DASHBOARD_ROUTES.expiryAlerts, label: en.navigation.expiryAlerts, icon: TriangleAlert },
    ],
  },
  {
    id: "people-parties",
    label: en.navigation.peopleParties,
    icon: Truck,
    children: [
      { id: "parties", href: DASHBOARD_ROUTES.parties, label: en.navigation.parties, icon: Truck },
      { id: "customers", href: DASHBOARD_ROUTES.customers, label: en.navigation.customers, icon: UserCog },
      { id: "suppliers", href: DASHBOARD_ROUTES.suppliers, label: en.navigation.suppliers, icon: Truck },
    ],
  },
  {
    id: "accounting-money",
    label: en.navigation.accountingMoney,
    icon: WalletCards,
    children: [
      { id: "expenses", href: DASHBOARD_ROUTES.expenses, label: en.navigation.expenses, icon: WalletCards },
      { id: "cashbook", href: DASHBOARD_ROUTES.cashbook, label: en.navigation.cashbook, icon: BookOpen },
      { id: "profit-loss", href: DASHBOARD_ROUTES.profitLoss, label: en.navigation.profitLoss, icon: Calculator },
    ],
  },
  {
    id: "gst-compliance",
    label: en.navigation.gstCompliance,
    icon: Landmark,
    children: [
      { id: "gst-invoice", href: DASHBOARD_ROUTES.gstInvoice, label: en.navigation.gstInvoice, icon: SlidersHorizontal },
      { id: "gst-reports", href: DASHBOARD_ROUTES.gstReports, label: en.navigation.gstReports, icon: Landmark },
    ],
  },
  { id: "reports", href: DASHBOARD_ROUTES.reports, label: en.navigation.reports, icon: BarChart3 },
  {
    id: "settings",
    label: en.navigation.settings,
    icon: Settings,
    children: [
      { id: "download-data", href: DASHBOARD_ROUTES.downloadData, label: en.navigation.downloadData, icon: Download },
      { id: "backup-restore", href: DASHBOARD_ROUTES.backupRestore, label: en.navigation.backupRestore, icon: Download },
      { id: "account-settings", href: DASHBOARD_ROUTES.accountSettings, label: en.navigation.accountSettings, icon: UserCog },
      { id: "subscription-settings", href: DASHBOARD_ROUTES.subscriptionSettings, label: en.navigation.subscriptionSettings, icon: CreditCard },
    ],
  },
];

export const sidebarNavHrefs = sidebarNavItems.flatMap((item) => [
  ...(item.href ? [item.href] : []),
  ...(item.children?.map((child) => child.href) ?? []),
]);

export const sidebarNavHrefSet = new Set<string>(sidebarNavHrefs);
