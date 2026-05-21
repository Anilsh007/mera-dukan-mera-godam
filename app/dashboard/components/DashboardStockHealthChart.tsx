"use client"

import StockHealthBreakdown, { getStockHealthTotal } from "@/app/components/inventory/StockHealthBreakdown"
import ChartCard from "@/app/components/charts/ChartCard"
import { DASHBOARD_ROUTES } from "@/app/lib/navigation/dashboardRoutes"
import { en } from "@/app/messages/en"
import type { StockHealth } from "@/app/dashboard/reports/types"

type DashboardStockHealthChartProps = {
  health: StockHealth
  loading?: boolean
}

export default function DashboardStockHealthChart({ health, loading }: DashboardStockHealthChartProps) {
  const total = getStockHealthTotal(health)

  return (
    <ChartCard
      eyebrow={en.dashboard.stockMix}
      title={en.reports.stockHealth}
      description={en.dashboard.stockHealthSubtitle}
      action={{ href: DASHBOARD_ROUTES.inventory, label: en.dashboard.goToInventory }}
      secondaryAction={{ href: DASHBOARD_ROUTES.quickPurchase, label: en.dashboard.addPurchase }}
      loading={loading}
      empty={total === 0}
      emptyTitle={en.dashboard.addProductsToSeeStockChart}
      emptyDescription={en.dashboard.addProductsToSeeStockChartDescription}
      emptyAction={{ href: DASHBOARD_ROUTES.quickPurchase, label: en.dashboard.addPurchase }}
    >
      <div className="mb-3 flex justify-end">
        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--text-primary)]">
          {total} {en.dashboard.products}
        </span>
      </div>
      <StockHealthBreakdown health={health} />
    </ChartCard>
  )
}
