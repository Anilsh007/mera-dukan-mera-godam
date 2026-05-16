"use client"

import { useMemo, useState } from "react"
import ReportsHeader from "./components/ReportsHeader"
import MetricCard from "./components/MetricCard"
import Panel from "./components/Panel"
import EmptyState from "./components/EmptyState"
import LineChart from "./components/LineChart"
import HorizontalBarChart from "./components/HorizontalBarChart"
import StockHealthSummary from "./components/StockHealthSummary"
import BusinessComparisonChart from "./components/BusinessComparisonChart"
import TopProductsTable from "./components/TopProductsTable"
import LowStockList from "./components/LowStockList"
import ExpiryRiskList from "./components/ExpiryRiskList"
import SupplierDueList from "./components/SupplierDueList"
import InvoiceSummaryTable from "./components/InvoiceSummaryTable"
import SlowMovingProductsTable from "./components/SlowMovingProductsTable"
import RecentTransactionsList from "./components/RecentTransactionsList"
import type { DateRangeKey } from "./types"
import { buildReport } from "./lib/reportBuilder"
import { formatMoney, formatNumber } from "./lib/format"
import { useReportsData } from "./lib/useReportsData"
import { en } from "@/app/messages/en"

export default function ReportsPage() {
  const [rangeKey, setRangeKey] = useState<DateRangeKey>("30d")
  const { data, loading } = useReportsData()
  const report = useMemo(() => buildReport(data, rangeKey), [data, rangeKey])

  return (
    <div className="space-y-6 pb-8">
      <ReportsHeader rangeKey={rangeKey} onRangeChange={setRangeKey} report={report} />

      <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 2xl:grid-cols-4">
        <MetricCard label={en.reports.inventoryValue} value={formatMoney(report.inventoryValue)} helper={`${report.productCount} ${en.reports.activeProductsSuffix}`} />
        <MetricCard label={en.reports.salesInPeriod} value={formatMoney(report.periodSales)} helper={`${formatNumber(report.periodUnitsSold)} ${en.dashboard.unitsSoldSuffix}`} positive />
        <MetricCard label={en.reports.purchaseValue} value={formatMoney(report.purchaseTotal)} helper={`${report.purchaseCount} ${en.reports.purchaseBillsSuffix}`} />
        <MetricCard label={en.reports.supplierDue} value={formatMoney(report.supplierDue)} helper={`${report.unpaidPurchaseCount} ${en.reports.billsPendingSuffix}`} warning={report.supplierDue > 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 2xl:grid-cols-4">
        <MetricCard label={en.reports.todaySale} value={formatMoney(report.todaySales)} helper={en.stockHistory.today} positive />
        <MetricCard label={en.reports.todayPurchase} value={formatMoney(report.todayPurchase)} helper={en.stockHistory.today} />
        <MetricCard label={en.reports.monthlySale} value={formatMoney(report.monthlySales)} helper={en.dashboard.currentMonth} positive />
        <MetricCard label={en.reports.monthlyPurchase} value={formatMoney(report.monthlyPurchase)} helper={en.dashboard.currentMonth} />
      </div>

      <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 2xl:grid-cols-4">
        <MetricCard label={en.reports.gstBilled} value={formatMoney(report.invoiceTotal)} helper={`${report.invoiceCount} ${en.reports.invoicesSuffix}`} />
        <MetricCard label={en.reports.gstCollected} value={formatMoney(report.gstCollected)} helper={en.dashboard.gstOnSales} positive={report.gstCollected > 0} />
        <MetricCard label={en.reports.gstPaid} value={formatMoney(report.gstPaid)} helper={en.dashboard.gstOnPurchases} />
        <MetricCard label={en.reports.lowCriticalStock} value={String(report.lowStockCount)} helper={`${report.criticalStockCount} ${en.reports.criticalStock} • ${report.outOfStockCount} ${en.reports.outOfStock}`} warning={report.lowStockCount > 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 2xl:grid-cols-4">
        <MetricCard label={en.reports.expiryRisk} value={String(report.expiryRiskCount)} helper={`${report.expiredCount} ${en.reports.alreadyExpiredSuffix}`} warning={report.expiryRiskCount > 0} />
        <MetricCard label={en.reports.estimatedMargin} value={formatMoney(report.estimatedMargin)} helper={`${report.marginPercent.toFixed(1)}% ${en.reports.loggedSalesSuffix}`} positive={report.estimatedMargin >= 0} warning={report.estimatedMargin < 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.3fr_0.7fr]">
        <Panel title={en.reports.salesTrend} subtitle={en.reports.salesTrendSubtitle}>
          {loading ? <EmptyState text={en.reports.loadingSalesTrend} /> : <LineChart points={report.salesTrend} />}
        </Panel>

        <Panel title={en.reports.stockHealth} subtitle={en.reports.stockHealthSubtitle}>
          {loading ? <EmptyState text={en.reports.loadingStockHealth} /> : <StockHealthSummary health={report.stockHealth} />}
        </Panel>
      </div>

      <Panel title={en.reports.salesPurchaseTrend} subtitle={en.reports.salesPurchaseTrendSubtitle}>
        {loading ? <EmptyState text={en.reports.loadingBusinessTrend} /> : <BusinessComparisonChart points={report.businessTrend} />}
      </Panel>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <Panel title={en.reports.topCategoriesByValue} subtitle={en.reports.topCategoriesSubtitle}>
          {loading ? <EmptyState text={en.reports.loadingCategorySummary} /> : <HorizontalBarChart items={report.topCategories} />}
        </Panel>

        <Panel title={en.reports.topSellingProducts} subtitle={en.reports.topSellingProductsSubtitle}>
          {loading ? <EmptyState text={en.reports.loadingSellingProducts} /> : <TopProductsTable items={report.topSellingProducts} />}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <Panel title={en.reports.slowMovingProducts} subtitle={en.reports.slowMovingProductsSubtitle}>
          {loading ? <EmptyState text={en.reports.loadingSellingProducts} /> : <SlowMovingProductsTable items={report.slowMovingProducts} />}
        </Panel>

        <Panel title={en.reports.recentTransactions} subtitle={en.reports.recentTransactionsSubtitle}>
          {loading ? <EmptyState text={en.stockHistory.loadingEntries} /> : <RecentTransactionsList items={report.recentTransactions} />}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
        <Panel title={en.reports.lowStockWatchlist} subtitle={en.reports.lowStockSubtitle}>
          {loading ? <EmptyState text={en.reports.loadingLowStockProducts} /> : <LowStockList products={report.lowStockProducts} />}
        </Panel>

        <Panel title={en.reports.expiryRisk} subtitle={en.reports.expiryRiskSubtitle}>
          {loading ? <EmptyState text={en.reports.loadingExpiryRisk} /> : <ExpiryRiskList products={report.expiryRiskProducts} />}
        </Panel>

        <Panel title={en.reports.supplierDues} subtitle={en.reports.supplierDuesSubtitle}>
          {loading ? <EmptyState text={en.reports.loadingSupplierDues} /> : <SupplierDueList suppliers={report.topSupplierDues} />}
        </Panel>
      </div>

      <Panel title={en.reports.gstInvoiceSummary} subtitle={en.reports.gstInvoiceSummarySubtitle}>
        {loading ? <EmptyState text={en.reports.loadingGstInvoices} /> : <InvoiceSummaryTable invoices={report.recentInvoices} />}
      </Panel>
    </div>
  )
}
