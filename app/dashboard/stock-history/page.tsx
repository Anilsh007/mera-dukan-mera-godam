"use client"

import useInventoryData from "../hooks/useInventoryData"
import StockHistoryTabs from "../all-stock/StockHistoryTabs"

export default function StockHistoryPage() {
  const { products, logs, loading } = useInventoryData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Stock History</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Different categories ke stock in aur sale out rows yahan se filter, print aur GST draft ke saath manage karo.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-8 text-center text-[var(--text-muted)] shadow-[var(--shadow-card)]">
          Loading stock history...
        </div>
      ) : (
        <StockHistoryTabs logs={logs} products={products} />
      )}
    </div>
  )
}
