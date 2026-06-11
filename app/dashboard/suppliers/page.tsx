"use client"

import { useEffect, useMemo, useState } from "react"
import { liveQuery } from "dexie"
import { useRouter } from "next/navigation"
import SummaryCard from "@/app/components/ui/SummaryCard"
import useInventoryData from "@/app/hooks/useInventoryData"
import { auth } from "@/app/lib/firebase"
import { db, type PurchaseRecord } from "@/app/lib/db"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { formatCurrency } from "@/app/dashboard/purchases/purchase.utils"
import SupplierPaymentModal from "./SupplierPaymentModal"
import SupplierCard from "./components/SupplierCard"
import SupplierDetailModal from "./components/SupplierDetailModal"
import SupplierFilters from "./components/SupplierFilters"
import { buildSupplierSummaries, filterSuppliers, getSupplierPurchases } from "./lib/supplierSummary"
import type { SupplierFilter, SupplierSummary } from "./types"
import { en } from "@/app/messages/en"
import { notify as toast } from "@/app/lib/notifications"

export default function SuppliersPage() {
  const router = useRouter()
  const { products, loading } = useInventoryData()
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [paymentSupplier, setPaymentSupplier] = useState<SupplierSummary | null>(null)
  const [detailSupplier, setDetailSupplier] = useState<SupplierSummary | null>(null)
  const [filter, setFilter] = useState<SupplierFilter>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    let purchaseSubscription: { unsubscribe: () => void } | null = null

    if (!auth) {
      const timeout = window.setTimeout(() => setPurchases([]), 0)
      return () => {
        window.clearTimeout(timeout)
        purchaseSubscription?.unsubscribe()
      }
    }

    const authSubscription = auth.onAuthStateChanged((user) => {
      purchaseSubscription?.unsubscribe()
      purchaseSubscription = null

      if (!user) {
        setPurchases([])
        return
      }

      const userId = requireUserIdentityFromAuthUser(user)
      purchaseSubscription = liveQuery(() => db.purchases.where("userId").equals(userId).toArray()).subscribe({
        next: setPurchases,
        error: () => toast.error(en.suppliers.loadFailed),
      })
    })

    return () => {
      purchaseSubscription?.unsubscribe()
      authSubscription()
    }
  }, [])

  const supplierList = useMemo(() => buildSupplierSummaries(products, purchases), [products, purchases])
  const filteredSuppliers = useMemo(() => filterSuppliers(supplierList, filter, search), [filter, search, supplierList])
  const detailPurchases = useMemo(() => getSupplierPurchases(detailSupplier, purchases), [detailSupplier, purchases])

  const dueSuppliers = supplierList.filter((supplier) => supplier.dueAmount > 0).length
  const totalDue = supplierList.reduce((sum, supplier) => sum + supplier.dueAmount, 0)
  const totalPurchaseValue = supplierList.reduce((sum, supplier) => sum + supplier.purchaseValue, 0)

  return (
    <div className="dashboard-page space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{en.pages.suppliersTitle}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.pages.suppliersDescription}</p>
      </header>

      <section className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-3" aria-label={en.suppliers.summaryAriaLabel}>
        <SummaryCard label={en.suppliers.suppliers} value={String(supplierList.length)} />
        <SummaryCard label={en.suppliers.dueSuppliers} value={String(dueSuppliers)} tone="amber" />
        <SummaryCard label={en.suppliers.totalDue} value={formatCurrency(totalDue)} tone="rose" />
      </section>

      <SupplierFilters
        filter={filter}
        search={search}
        supplierCount={supplierList.length}
        dueSupplierCount={dueSuppliers}
        onFilterChange={setFilter}
        onSearchChange={setSearch}
      />

      {loading ? (
        <SupplierMessage text={en.suppliers.loading} />
      ) : filteredSuppliers.length === 0 ? (
        <SupplierMessage text={en.suppliers.noResults} />
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-label={en.suppliers.supplierListAriaLabel}>
          {filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.name}
              supplier={supplier}
              onPay={setPaymentSupplier}
              onViewPurchases={setDetailSupplier}
              onNewPurchase={() => router.push("/dashboard/purchases")}
            />
          ))}
        </section>
      )}

      <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
        {en.suppliers.totalPurchase}: <b className="text-[var(--text-primary)]">{formatCurrency(totalPurchaseValue)}</b>
      </div>

      {paymentSupplier && <SupplierPaymentModal supplier={paymentSupplier} onClose={() => setPaymentSupplier(null)} />}
      {detailSupplier && <SupplierDetailModal supplier={detailSupplier} purchases={detailPurchases} onClose={() => setDetailSupplier(null)} />}
    </div>
  )
}

function SupplierMessage({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-8 text-center text-[var(--text-muted)] shadow-[var(--shadow-card)]">
      {text}
    </div>
  )
}
