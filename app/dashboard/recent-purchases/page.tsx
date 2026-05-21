"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { onAuthStateChanged } from "firebase/auth"
import { ArrowLeft, PlusCircle } from "lucide-react"

import Button from "@/app/components/ui/Button"
import { DASHBOARD_ROUTES } from "@/app/lib/navigation/dashboardRoutes"
import { auth } from "@/app/lib/firebase"
import { notify as toast } from "@/app/lib/notifications"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"

import type { PurchasePaymentStatus, PurchaseRecord } from "@/app/lib/db"
import CompletePurchaseDetailsModal from "../purchases/CompletePurchaseDetailsModal"
import { completeQuickPurchaseDetails, loadPurchases } from "../purchases/purchase.service"

import PurchaseHistory from "./PurchaseHistory"

import { en } from "@/app/messages/en"

export default function RecentPurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPendingPurchase, setSelectedPendingPurchase] = useState<PurchaseRecord | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    if (!auth) return

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setPurchases([])
        setLoading(false)
        return
      }

      try {
        const data = await loadPurchases(
          requireUserIdentityFromAuthUser(user)
        )

        setPurchases(data)
      } catch (error) {
        console.error("Failed to load purchases", error)
        toast.error(en.purchases.loadFailed)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

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
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      await completeQuickPurchaseDetails({
        userId,
        purchaseId: selectedPendingPurchase.id,
        ...values,
      })

      const refreshed = await loadPurchases(userId)
      setPurchases(refreshed)
      toast.success(en.purchases.quickDetailsCompleted)
      setSelectedPendingPurchase(null)
    } catch (error) {
      console.error("Purchase details save failed", error)
      toast.error(error instanceof Error ? error.message : en.purchases.detailsSaveFailed)
    } finally {
      setDetailsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-[var(--text-secondary)]">
        {en.pages.recentPurchasesLoading}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {en.navigation.purchaseStock}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            {en.pages.recentPurchasesTitle}
          </h1>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {en.pages.recentPurchasesDescription}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link href={DASHBOARD_ROUTES.overview} className="w-full sm:w-auto">
            <Button type="button" variant="outline" title={en.navigation.backToDashboard} icon={<ArrowLeft size={16} />} className="w-full sm:w-auto" />
          </Link>
          <Link href={DASHBOARD_ROUTES.quickPurchase} className="w-full sm:w-auto">
            <Button type="button" variant="primary" title={en.navigation.quickPurchase} icon={<PlusCircle size={16} />} className="w-full sm:w-auto" />
          </Link>
        </div>
      </div>

      <PurchaseHistory
        purchases={purchases}
        onCompleteDetails={setSelectedPendingPurchase}
      />

      <CompletePurchaseDetailsModal
        purchase={selectedPendingPurchase}
        loading={detailsLoading}
        onClose={() => setSelectedPendingPurchase(null)}
        onSave={handleCompleteDetails}
      />
    </div>
  )
}
