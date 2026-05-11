"use client"

import useInventoryData from "@/app/hooks/useInventoryData"
import { getProductStockLevel } from "@/app/lib/inventory.utils"
import { formatQuantity } from "@/app/lib/quantityUnit"
import { en } from "@/app/messages/en"

function getTodayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return start
}

export default function ReportsPage() {
  const { products, logs, loading } = useInventoryData()

  const todayStart = getTodayRange()
  const todayOutLogs = logs.filter((log) => log.type === "out" && new Date(log.date) >= todayStart)
  const totalStockValue = products.reduce((sum, product) => sum + product.quantity * product.price, 0)
  const totalUnits = products.reduce((sum, product) => sum + product.quantity, 0)
  const totalSalesToday = todayOutLogs.reduce(
    (sum, log) => sum + Math.abs(log.quantityAdded) * Number(log.price || 0),
    0
  )
  const unitsSoldToday = todayOutLogs.reduce((sum, log) => sum + Math.abs(log.quantityAdded), 0)

  const topCategories = Object.entries(
    products.reduce<Record<string, number>>((acc, product) => {
      const category = product.category || "Uncategorized"
      acc[category] = (acc[category] || 0) + product.quantity * product.price
      return acc
    }, {})
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)

  const lowStockProducts = products
    .filter((product) => {
      const stockLevel = getProductStockLevel(product)
      return stockLevel === "low" || stockLevel === "critical"
    })
    .sort((left, right) => left.quantity - right.quantity)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{en.pages.reportsTitle}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {en.pages.reportsDescription}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Inventory Value</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            Rs {totalStockValue.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Units In Hand</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{totalUnits}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Today Sales</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">Rs {totalSalesToday.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Units Sold Today</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{unitsSoldToday}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Top Categories By Value</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading category summary...</p>
            ) : topCategories.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Abhi category data available nahi hai.</p>
            ) : (
              topCategories.map(([category, value]) => (
                <div key={category} className="flex items-center justify-between rounded-xl bg-black/5 px-4 py-3 dark:bg-white/5">
                  <span className="font-medium text-[var(--text-primary)]">{category}</span>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Rs {value.toLocaleString("en-IN")}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Low Stock Watchlist</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading low stock products...</p>
            ) : lowStockProducts.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Low stock products abhi nahi hain.</p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-xl bg-black/5 px-4 py-3 dark:bg-white/5">
                  <div>
                    <p className="font-medium capitalize text-[var(--text-primary)]">{product.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{product.category || "Uncategorized"}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                    {formatQuantity(product.quantity, product.quantityUnit)} left
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
