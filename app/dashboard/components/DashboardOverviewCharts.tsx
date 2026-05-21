"use client"

import { AlertTriangle, BadgeIndianRupee, Landmark, Package, ReceiptText, ShoppingCart, TrendingUp, WalletCards } from "lucide-react"
import ChartCard from "@/app/components/charts/ChartCard"
import MetricBarChart from "@/app/components/charts/MetricBarChart"
import MetricLineAreaChart from "@/app/components/charts/MetricLineAreaChart"
import { formatCurrency } from "@/app/lib/formatters"
import { DASHBOARD_ROUTES } from "@/app/lib/navigation/dashboardRoutes"
import type { OverviewChartData } from "@/app/lib/dashboard/overviewChartData"
import { en } from "@/app/messages/en"

type DashboardOverviewChartsProps = {
  data: OverviewChartData
  loading?: boolean
  error?: string | null
}

export default function DashboardOverviewCharts({ data, loading, error }: DashboardOverviewChartsProps) {
  const hasSales = hasUsefulLineData(data.salesTrend)
  const hasPurchases = hasUsefulLineData(data.purchaseTrend)
  const hasStockValue = hasUsefulLineData(data.stockValueTrend)
  const hasGst = hasUsefulLineData(data.gstTrend) || hasAnyTooltipAmount(data.gstTrend)
  const hasProfitLoss = hasUsefulLineData(data.profitLossTrend)
  const hasStockRisk = hasUsefulLineData(data.stockRiskTrend)
  const hasDues = hasUsefulLineData(data.dueTrend)

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ChartCard
        eyebrow={en.dashboard.tracking}
        title={en.dashboard.salesTrend}
        description={en.dashboard.salesTrendDescription}
        action={{ href: DASHBOARD_ROUTES.sales, label: en.dashboard.viewSales }}
        secondaryAction={{ href: DASHBOARD_ROUTES.quickSale, label: en.navigation.quickSale }}
        loading={loading}
        error={error}
        empty={!hasSales}
        emptyTitle={en.dashboard.noSalesYet}
        emptyDescription={en.dashboard.noSalesYetDescription}
        emptyAction={{ href: DASHBOARD_ROUTES.quickSale, label: en.navigation.quickSale }}
        icon={ReceiptText}
      >
        <MetricLineAreaChart points={data.salesTrend} ariaLabel={en.reports.salesTrendChartAriaLabel} valueLabel={en.dashboard.saleAmount} formatValue={formatCurrency} showEveryLabel />
      </ChartCard>

      <ChartCard
        eyebrow={en.dashboard.tracking}
        title={en.dashboard.purchaseTrend}
        description={en.dashboard.purchaseTrendDescription}
        action={{ href: DASHBOARD_ROUTES.quickPurchase, label: en.dashboard.addPurchase }}
        secondaryAction={{ href: DASHBOARD_ROUTES.purchases, label: en.navigation.purchases }}
        loading={loading}
        error={error}
        empty={!hasPurchases}
        emptyTitle={en.dashboard.noPurchasesYet}
        emptyDescription={en.dashboard.noPurchasesYetDescription}
        emptyAction={{ href: DASHBOARD_ROUTES.quickPurchase, label: en.dashboard.addPurchase }}
        icon={ShoppingCart}
      >
        <MetricLineAreaChart points={data.purchaseTrend} ariaLabel={en.dashboard.purchaseTrendChartAriaLabel} valueLabel={en.dashboard.purchaseAmount} formatValue={formatCurrency} showEveryLabel />
      </ChartCard>

      <ChartCard
        eyebrow={en.dashboard.currentInventoryValue}
        title={en.dashboard.stockValueTrend}
        description={en.dashboard.stockValueTrendDescription}
        action={{ href: DASHBOARD_ROUTES.inventory, label: en.dashboard.goToInventory }}
        secondaryAction={{ href: DASHBOARD_ROUTES.quickPurchase, label: en.dashboard.addPurchase }}
        loading={loading}
        error={error}
        empty={!hasStockValue}
        emptyTitle={en.dashboard.addProductsToSeeStockChart}
        emptyDescription={en.dashboard.addProductsToSeeStockChartDescription}
        emptyAction={{ href: DASHBOARD_ROUTES.quickPurchase, label: en.dashboard.addPurchase }}
        icon={Package}
      >
        <MetricLineAreaChart points={data.stockValueTrend} ariaLabel={en.dashboard.stockValueTrendChartAriaLabel} valueLabel={en.dashboard.stockValue} formatValue={formatCurrency} />
      </ChartCard>

      <ChartCard
        eyebrow={en.navigation.gstCompliance}
        title={en.dashboard.gstTrend}
        description={en.dashboard.gstTrendDescription}
        action={{ href: DASHBOARD_ROUTES.gstReports, label: en.dashboard.viewGstReport }}
        secondaryAction={{ href: DASHBOARD_ROUTES.gstInvoice, label: en.dashboard.createInvoice }}
        loading={loading}
        error={error}
        empty={!hasGst}
        emptyTitle={en.dashboard.noGstDataYet}
        emptyDescription={en.dashboard.noGstDataYetDescription}
        emptyAction={{ href: DASHBOARD_ROUTES.gstInvoice, label: en.dashboard.createInvoice }}
        icon={Landmark}
      >
        <MetricLineAreaChart points={data.gstTrend} ariaLabel={en.dashboard.gstTrendChartAriaLabel} valueLabel={en.dashboard.netGst} formatValue={formatCurrency} />
      </ChartCard>

      <ChartCard
        eyebrow={en.navigation.accountingMoney}
        title={en.dashboard.profitLossTrend}
        description={en.dashboard.profitLossTrendDescription}
        action={{ href: DASHBOARD_ROUTES.profitLoss, label: en.dashboard.viewProfitLoss }}
        secondaryAction={{ href: DASHBOARD_ROUTES.cashbook, label: en.dashboard.viewCashbook }}
        loading={loading}
        error={error}
        empty={!hasProfitLoss}
        emptyTitle={en.dashboard.noProfitDataYet}
        emptyDescription={en.dashboard.noProfitDataYetDescription}
        emptyAction={{ href: DASHBOARD_ROUTES.quickSale, label: en.navigation.quickSale }}
        icon={TrendingUp}
      >
        <MetricLineAreaChart points={data.profitLossTrend} ariaLabel={en.dashboard.profitLossTrendChartAriaLabel} valueLabel={en.dashboard.profitLoss} formatValue={formatCurrency} />
      </ChartCard>

      <ChartCard
        eyebrow={en.dashboard.priority}
        title={en.dashboard.stockRiskTrend}
        description={en.dashboard.stockRiskTrendDescription}
        action={{ href: DASHBOARD_ROUTES.inventory, label: en.dashboard.viewLowStock }}
        secondaryAction={{ href: DASHBOARD_ROUTES.expiryAlerts, label: en.navigation.expiryAlerts }}
        loading={loading}
        error={error}
        empty={!hasStockRisk}
        emptyTitle={en.dashboard.inventoryLooksStable}
        emptyDescription={en.dashboard.stableInventoryDescription}
        emptyAction={{ href: DASHBOARD_ROUTES.inventory, label: en.dashboard.goToInventory }}
        icon={AlertTriangle}
      >
        <MetricLineAreaChart points={data.stockRiskTrend} ariaLabel={en.dashboard.stockRiskTrendChartAriaLabel} valueLabel={en.dashboard.lowStockCount} formatValue={(value) => value.toLocaleString("en-IN")} />
      </ChartCard>

      <ChartCard
        eyebrow={en.navigation.accountingMoney}
        title={en.dashboard.duesTrend}
        description={en.dashboard.duesTrendDescription}
        action={{ href: DASHBOARD_ROUTES.parties, label: en.navigation.parties }}
        secondaryAction={{ href: DASHBOARD_ROUTES.cashbook, label: en.dashboard.viewCashbook }}
        loading={loading}
        error={error}
        empty={!hasDues}
        emptyTitle={en.dashboard.noDuesYet}
        emptyDescription={en.dashboard.noDuesYetDescription}
        emptyAction={{ href: DASHBOARD_ROUTES.parties, label: en.navigation.parties }}
        icon={WalletCards}
      >
        <MetricLineAreaChart points={data.dueTrend} ariaLabel={en.dashboard.duesTrendChartAriaLabel} valueLabel={en.dashboard.dueAmount} formatValue={formatCurrency} />
      </ChartCard>

      <ChartCard
        eyebrow={en.reports.topSellingProducts}
        title={en.dashboard.topProductsChart}
        description={en.dashboard.topProductsDescription}
        action={{ href: DASHBOARD_ROUTES.reports, label: en.dashboard.viewReports }}
        loading={loading}
        error={error}
        empty={!data.topProducts.length}
        emptyTitle={en.dashboard.noProductRankingYet}
        emptyDescription={en.dashboard.noProductRankingYetDescription}
        emptyAction={{ href: DASHBOARD_ROUTES.quickSale, label: en.navigation.quickSale }}
        icon={BadgeIndianRupee}
      >
        <MetricBarChart bars={data.topProducts} ariaLabel={en.dashboard.topProductsChartAriaLabel} valueLabel={en.dashboard.saleAmount} formatValue={formatCurrency} />
      </ChartCard>

      <ChartCard
        eyebrow={en.reports.slowMovingProducts}
        title={en.dashboard.slowProductsChart}
        description={en.dashboard.slowProductsDescription}
        action={{ href: DASHBOARD_ROUTES.reports, label: en.dashboard.viewReports }}
        secondaryAction={{ href: DASHBOARD_ROUTES.inventory, label: en.dashboard.goToInventory }}
        loading={loading}
        error={error}
        empty={!data.slowProducts.length}
        emptyTitle={en.dashboard.noSlowProductsYet}
        emptyDescription={en.dashboard.noSlowProductsYetDescription}
        emptyAction={{ href: DASHBOARD_ROUTES.inventory, label: en.dashboard.goToInventory }}
        icon={Package}
      >
        <MetricBarChart bars={data.slowProducts} ariaLabel={en.dashboard.slowProductsChartAriaLabel} valueLabel={en.dashboard.stockValue} formatValue={formatCurrency} />
      </ChartCard>
    </div>
  )
}

function hasUsefulLineData(points: { value: number }[]) {
  return points.some((point) => point.value !== 0)
}

function hasAnyTooltipAmount(points: { tooltipRows?: { value: string }[] }[]) {
  return points.some((point) =>
    point.tooltipRows?.some((row) => Number(row.value.replace(/[^0-9.-]/g, "")) > 0),
  )
}
