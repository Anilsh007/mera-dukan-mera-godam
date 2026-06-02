"use client"

import { useState } from "react"
import Button from "@/app/components/ui/Button"
import { auth } from "@/app/lib/firebase"
import { notify as toast } from "@/app/lib/notifications"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import type { PurchasePaymentStatus, PurchaseRecord } from "@/app/lib/db"
import StockHistoryTabs from "../all-inventory/StockHistoryTabs"
import PurchaseHistory from "../recent-purchases/PurchaseHistory"
import CompletePurchaseDetailsModal from "../purchases/CompletePurchaseDetailsModal"
import { completeQuickPurchaseDetails } from "../purchases/purchase.service"
import useInventoryData from "@/app/hooks/useInventoryData"
import usePurchases from "@/app/hooks/usePurchases"
import { en } from "@/app/messages/en"

type ViewTab = "history" | "recent-purchases"

export default function StockHistoryPage() {
  const { products, logs, loading } = useInventoryData()
  const { purchases, loading: purchasesLoading } = usePurchases()
  const [viewTab, setViewTab] = useState<ViewTab>("history")
  const [selectedPendingPurchase, setSelectedPendingPurchase] = useState<PurchaseRecord | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const handleCompleteDetails = async (values: {
    billNo: string
    supplierName: string
    purchaseDate: string
    paymentStatus: PurchasePaymentStatus
    paymentMode: string
    amountPaid: number
    note: string
  }) => {
    if (!selectedPendingPurchase) return

    try {
      setDetailsLoading(true)
      await completeQuickPurchaseDetails({
        userId: requireUserIdentityFromAuthUser(auth?.currentUser),
        purchaseId: selectedPendingPurchase.id,
        ...values,
      })
      toast.success(en.purchases.quickDetailsCompleted)
      setSelectedPendingPurchase(null)
    } catch (error) {
      console.error("Purchase details save failed", error)
      toast.error(en.purchases.detailsSaveFailed)
    } finally {
      setDetailsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{en.pages.stockHistoryTitle}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {en.pages.stockHistoryDescription}
        </p>
      </div>

      <div className="filter-scroll">
        <Button
          title={en.navigation.stockHistory}
          variant={viewTab === "history" ? "success" : "outline"}
          onClick={() => setViewTab("history")}
        />
        <Button
          title={en.navigation.recentPurchases}
          variant={viewTab === "recent-purchases" ? "success" : "outline"}
          onClick={() => setViewTab("recent-purchases")}
        />
      </div>

      {viewTab === "history" ? (
        loading ? (
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-8 text-center text-[var(--text-muted)] shadow-[var(--shadow-card)]">
            {en.stockHistory.loadingEntries}
          </div>
        ) : (
          <StockHistoryTabs logs={logs} products={products} />
        )
      ) : purchasesLoading ? (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-8 text-center text-[var(--text-muted)] shadow-[var(--shadow-card)]">
          {en.common.loading}
        </div>
      ) : (
        <PurchaseHistory purchases={purchases} onCompleteDetails={setSelectedPendingPurchase} />
      )}

      <CompletePurchaseDetailsModal
        purchase={selectedPendingPurchase}
        loading={detailsLoading}
        onClose={() => setSelectedPendingPurchase(null)}
        onSave={handleCompleteDetails}
      />
    </div>
  )
}
