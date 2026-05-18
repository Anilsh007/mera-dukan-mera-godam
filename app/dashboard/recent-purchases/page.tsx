"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"

import { auth } from "@/app/lib/firebase"
import { notify as toast } from "@/app/lib/notifications"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"

import type { PurchaseRecord } from "@/app/lib/db"
import { loadPurchases } from "../purchases/purchase.service"

import PurchaseHistory from "./PurchaseHistory"

import { en } from "@/app/messages/en"

export default function RecentPurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="p-4 text-sm text-[var(--text-secondary)]">
        Loading purchases...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Recent Purchases
        </h1>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          View all recent purchase history.
        </p>
      </div>

      <PurchaseHistory
        purchases={purchases}
        onCompleteDetails={() => {}}
      />
    </div>
  )
}