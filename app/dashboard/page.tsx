"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Boxes, IndianRupee, PackageOpen, ReceiptText, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import DashboardStatCard from "./components/DashboardStatCard"
import QuickActionCard from "./components/QuickActionCard"
import QuickPill from "./components/QuickPill"
import SalesSparkline from "./components/SalesSparkline"
import DashboardStockHealthChart from "./components/DashboardStockHealthChart"
import { auth } from "@/app/lib/firebase"
import { formatCurrency } from "@/app/lib/formatters"
import { en } from "@/app/messages/en"
import { useReportsData } from "./reports/lib/useReportsData"
import { buildReport } from "./reports/lib/reportBuilder"
import type { ProductLog } from "@/app/lib/db"
import Button from "../components/ui/Button"
import useSubscription from "@/app/hooks/useSubscription"
import DashboardTrialBanner from "@/app/components/subscription/DashboardTrialBanner"
import CurrentPlanCard from "@/app/components/subscription/CurrentPlanCard"
import SubscriptionRequiredModal from "@/app/components/subscription/SubscriptionRequiredModal"
import DashboardOverviewAutoCharts from "./components/DashboardOverviewAutoCharts"

function buildSevenDaySales(logs: ProductLog[]) {
  const today = new Date()
  const dayKeys = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    return date.toISOString().slice(0, 10)
  })

  const totals = new Map(dayKeys.map((key) => [key, 0]))

  logs.forEach((log) => {
    if (log.type !== "out" || log.paymentStatus === "cancelled") return
    const key = new Date(log.date).toISOString().slice(0, 10)
    if (!totals.has(key)) return
    totals.set(key, (totals.get(key) || 0) + Math.abs(Number(log.quantityAdded || log.quantity || 0)) * Number(log.price || 0))
  })

  return dayKeys.map((key) => totals.get(key) || 0)
}

export default function DashboardHome() {
  const router = useRouter()
  const { data, loading } = useReportsData()
  const [userName, setUserName] = useState("")
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const { effectivePlan, trialDaysLeft, subscriptionExpired, subscriptionActive, trialActive } = useSubscription()

  useEffect(() => {
    [
      "/dashboard/all-inventory",
      "/dashboard/quick-purchase",
      "/dashboard/quick-sale",
      "/dashboard/purchases",
      "/dashboard/sales",
      "/dashboard/stock-history",
      "/dashboard/expiry-alerts",
      "/dashboard/reports",
    ].forEach((route) => router.prefetch(route))
  }, [router])

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setUserName(user?.displayName?.split(" ")[0] || "")
    })
    return () => unsub()
  }, [])

  const stats = useMemo(() => {
    const report = buildReport(data, "30d")
    const now = new Date()
    const soon = new Date()
    soon.setDate(soon.getDate() + 30)
    const nearExpiry = data.products.filter((product) => {
      if (!product.expiry) return false
      const expiry = new Date(product.expiry)
      return expiry <= soon && expiry >= now
    }).length

    return {
      totalProducts: report.productCount,
      lowStock: report.lowOnlyStockCount + report.criticalStockCount,
      outOfStock: report.outOfStockCount,
      totalStockValue: report.inventoryValue,
      salesToday: report.todaySales,
      purchaseToday: report.todayPurchase,
      monthlySales: report.monthlySales,
      monthlyPurchase: report.monthlyPurchase,
      gstCollected: report.gstCollected,
      gstPaid: report.gstPaid,
      unitsSold: report.todayUnitsSold,
      nearExpiry,
      pendingPurchaseDetails: data.purchases.filter((purchase) => purchase.entryMode === "quick" && purchase.detailsStatus !== "completed").length,
      sevenDaySales: buildSevenDaySales(data.logs),
      stockHealth: report.stockHealth,
    }
  }, [data])

  const cards = [
    {
      label: en.dashboard.totalProducts,
      value: stats.totalProducts,
      icon: <Boxes size={20} aria-hidden="true" />,
      accentClass: "from-blue-600 to-sky-400",
      sub: stats.outOfStock > 0 ? `${stats.outOfStock} ${en.dashboard.outOfStockSuffix}` : en.dashboard.allInStock,
      onClick: () => router.push("/dashboard/all-inventory"),
    },
    {
      label: en.dashboard.lowStock,
      value: stats.lowStock,
      icon: <AlertTriangle size={20} aria-hidden="true" />,
      accentClass: "from-amber-500 to-rose-400",
      sub: stats.lowStock > 0 ? en.dashboard.needsRestocking : en.dashboard.stockHealthy,
      onClick: () => router.push("/dashboard/all-inventory"),
    },
    {
      label: en.dashboard.todaysSales,
      value: formatCurrency(stats.salesToday),
      icon: <TrendingUp size={20} aria-hidden="true" />,
      accentClass: "from-emerald-500 to-teal-500",
      sub: `${stats.unitsSold} ${en.dashboard.unitsSoldSuffix}`,
      onClick: () => router.push("/dashboard/stock-history"),
    },
    {
      label: en.dashboard.todaysPurchase,
      value: formatCurrency(stats.purchaseToday),
      icon: <PackageOpen size={20} aria-hidden="true" />,
      accentClass: "from-sky-600 to-cyan-400",
      sub: en.stockHistory.today,
      onClick: () => router.push("/dashboard/purchases"),
    },
    {
      label: en.dashboard.stockValue,
      value: formatCurrency(stats.totalStockValue),
      icon: <IndianRupee size={20} aria-hidden="true" />,
      accentClass: "from-violet-600 to-blue-600",
      sub: en.dashboard.currentInventoryValue,
      onClick: () => router.push("/dashboard/reports"),
    },
    {
      label: en.dashboard.monthlySales,
      value: formatCurrency(stats.monthlySales),
      icon: <TrendingUp size={20} aria-hidden="true" />,
      accentClass: "from-emerald-600 to-lime-500",
      sub: en.dashboard.currentMonth,
      onClick: () => router.push("/dashboard/reports"),
    },
    {
      label: en.dashboard.monthlyPurchase,
      value: formatCurrency(stats.monthlyPurchase),
      icon: <ReceiptText size={20} aria-hidden="true" />,
      accentClass: "from-orange-500 to-amber-400",
      sub: en.dashboard.currentMonth,
      onClick: () => router.push("/dashboard/reports"),
    },
    {
      label: en.dashboard.gstCollected,
      value: formatCurrency(stats.gstCollected),
      icon: <ReceiptText size={20} aria-hidden="true" />,
      accentClass: "from-purple-600 to-fuchsia-500",
      sub: `${en.dashboard.gstPaid}: ${formatCurrency(stats.gstPaid)}`,
      onClick: () => router.push("/dashboard/reports"),
    },
  ]

  const subscriptionStatusLabel = subscriptionActive
    ? en.subscription.activeStatus
    : trialActive
      ? en.subscription.trialStatus
      : en.subscription.expiredStatus
  const secondaryLabel = subscriptionActive ? "Open Billing" : trialActive ? "View Billing" : "View Plans"
  const primaryLabel = subscriptionActive ? "Change Plan" : en.subscription.upgradeNow

  return (
    <div className="dashboard-page space-y-6 pb-8">
      <DashboardOverviewAutoCharts />
      <DashboardTrialBanner
        trialDaysLeft={trialDaysLeft}
        subscriptionExpired={subscriptionExpired}
        onOpenUpgrade={() => setUpgradeOpen(true)}
      />

      <section className="dashboard-hero-panel rounded-[28px] p-4 sm:p-6" aria-labelledby="dashboard-title">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-[var(--text-secondary)]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em]">{en.dashboard.overviewLabel}</p>
            <h1 id="dashboard-title" className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              {userName ? `${en.dashboard.greeting}, ${userName}` : en.dashboard.fallbackTitle}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6">{en.dashboard.overviewDescription}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
            <QuickPill icon={<PackageOpen size={16} aria-hidden="true" />} label={en.dashboard.products} value={String(stats.totalProducts)} />
            <QuickPill icon={<TrendingUp size={16} aria-hidden="true" />} label={en.dashboard.unitsSold} value={String(stats.unitsSold)} />
            <QuickPill icon={<AlertTriangle size={16} aria-hidden="true" />} label={en.dashboard.expiry} value={String(stats.nearExpiry)} />
          </div>
        </div>
      </section>

      <CurrentPlanCard
        plan={effectivePlan}
        statusLabel={subscriptionStatusLabel}
        trialDaysLeft={trialDaysLeft}
        subscriptionExpired={subscriptionExpired}
        secondaryLabel={secondaryLabel}
        onSecondary={() => router.push("/dashboard/settings/subscription")}
        primaryLabel={primaryLabel}
        onUpgrade={() => setUpgradeOpen(true)}
      />

      {stats.pendingPurchaseDetails > 0 && (
        <>
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold">{stats.pendingPurchaseDetails} {stats.pendingPurchaseDetails > 1 ? en.dashboard.quickPurchasesPlural : en.dashboard.quickPurchaseSingular} {en.dashboard.needDetails}</p>
                <p className="mt-1 text-sm">{en.dashboard.pendingPurchaseDetailsDescription}</p>
              </div>
              <Button type="button" onClick={() => router.push("/dashboard/purchases")} variant="warning" className="w-full sm:ml-auto sm:w-auto" title={en.purchases.reviewNow} />
            </div>
          </div>
        </>
      )}

      <section className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4" aria-label={en.dashboard.summaryAriaLabel}>
        {cards.map((card) => (
          <DashboardStatCard key={card.label} {...card} loading={loading} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <SalesSparkline values={stats.sevenDaySales} label={en.dashboard.salesTrend} />
        <DashboardStockHealthChart health={stats.stockHealth} loading={loading} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        {!loading && stats.nearExpiry > 0 ? (
          <button
            type="button"
            onClick={() => router.push("/dashboard/expiry-alerts")}
            className="dashboard-action-card flex min-h-[11rem] cursor-pointer flex-col items-start gap-4 rounded-[24px] border border-amber-300/70 bg-amber-50 p-5 text-left transition hover:-translate-y-0.5 hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 dark:border-amber-400/20 dark:bg-[linear-gradient(145deg,rgba(72,38,15,0.72),rgba(48,28,12,0.52))] dark:hover:bg-[linear-gradient(145deg,rgba(92,48,18,0.76),rgba(58,34,14,0.6))] sm:flex-row sm:items-center"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white">
              <AlertTriangle size={18} aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                {stats.nearExpiry} {en.dashboard.nearExpiryTitle}
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-700 dark:text-amber-600">{en.dashboard.nearExpiryDescription}</p>
            </div>
          </button>
        ) : (
          <div className="dashboard-chart-shell rounded-[24px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{en.dashboard.priority}</p>
            <h3 className="mt-2 text-lg font-bold text-[var(--text-primary)]">{en.dashboard.inventoryLooksStable}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{en.dashboard.stableInventoryDescription}</p>
          </div>
        )}

        <div aria-labelledby="quick-actions-title">
          <h2 id="quick-actions-title" className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">{en.dashboard.quickActions}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <QuickActionCard
              title={en.dashboard.addStock}
              description={en.dashboard.addStockDescription}
              icon={<PackageOpen size={18} aria-hidden="true" />}
              accentClass="bg-emerald-500"
              onClick={() => router.push("/dashboard/quick-purchase")}
            />
            <QuickActionCard
              title={en.dashboard.quickSaleAction}
              description={en.dashboard.quickSaleDescription}
              icon={<IndianRupee size={18} aria-hidden="true" />}
              accentClass="bg-cyan-500"
              onClick={() => router.push("/dashboard/quick-sale")}
            />
            <QuickActionCard
              title={en.dashboard.reviewHistory}
              description={en.dashboard.reviewHistoryDescription}
              icon={<TrendingUp size={18} aria-hidden="true" />}
              accentClass="bg-blue-600"
              onClick={() => router.push("/dashboard/stock-history")}
            />
          </div>
        </div>
      </section>

      <SubscriptionRequiredModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  )
}
