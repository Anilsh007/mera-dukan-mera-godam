"use client"

import useInventoryData from "@/app/hooks/useInventoryData"
import StockHistoryTabs from "../all-stock/StockHistoryTabs"
import { en } from "@/app/messages/en"

export default function StockHistoryPage() {
  const { products, logs, loading } = useInventoryData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{en.pages.stockHistoryTitle}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {en.pages.stockHistoryDescription}
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-8 text-center text-[var(--text-muted)] shadow-[var(--shadow-card)]">
          Purani entry load ho rahi hai...
        </div>
      ) : (
        <StockHistoryTabs logs={logs} products={products} />
      )}
    </div>
  )
}
