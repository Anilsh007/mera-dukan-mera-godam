"use client"

import { useEffect, useMemo, useState } from "react"
import { liveQuery } from "dexie"
import { onAuthStateChanged } from "firebase/auth"
import { CreditCard, Eye, Plus, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import Button from "@/app/components/ui/Button"
import SummaryCard from "@/app/components/ui/SummaryCard"
import useInventoryData from "@/app/hooks/useInventoryData"
import { auth } from "@/app/lib/firebase"
import { db, type PurchaseRecord } from "@/app/lib/db"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { formatCurrency, formatPurchaseDate, getPaymentStatusClass } from "@/app/dashboard/purchases/purchase.utils"
import SupplierPaymentModal from "./SupplierPaymentModal"
import { en } from "@/app/messages/en"

type SupplierSummary = {
  name: string
  totalProducts: number
  totalQuantity: number
  totalValue: number
  purchaseBills: number
  purchaseValue: number
  paidAmount: number
  dueAmount: number
  dueBills: number
  lastPurchaseDate: string
  categories: string[]
}

type SupplierFilter = "all" | "due" | "settled"

function cleanSupplierName(name?: string) {
  return name?.trim() || "Supplier not available"
}

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

    const authSubscription = onAuthStateChanged(auth, (user) => {
      purchaseSubscription?.unsubscribe()
      purchaseSubscription = null

      if (!user) {
        setPurchases([])
        return
      }

      const userId = requireUserIdentityFromAuthUser(user)
      purchaseSubscription = liveQuery(() => db.purchases.where("userId").equals(userId).toArray()).subscribe({
        next: setPurchases,
        error: console.error,
      })
    })

    return () => {
      purchaseSubscription?.unsubscribe()
      authSubscription()
    }
  }, [])

  const supplierList = useMemo(() => {
    const summaries: Record<string, SupplierSummary> = {}

    const ensureSupplier = (name: string) => {
      if (!summaries[name]) {
        summaries[name] = {
          name,
          totalProducts: 0,
          totalQuantity: 0,
          totalValue: 0,
          purchaseBills: 0,
          purchaseValue: 0,
          paidAmount: 0,
          dueAmount: 0,
          dueBills: 0,
          lastPurchaseDate: "",
          categories: [],
        }
      }

      return summaries[name]
    }

    for (const product of products) {
      const supplier = ensureSupplier(cleanSupplierName(product.supplier))
      supplier.totalProducts += 1
      supplier.totalQuantity += product.quantity
      supplier.totalValue += product.quantity * product.price

      if (product.category && !supplier.categories.includes(product.category)) {
        supplier.categories.push(product.category)
      }
    }

    for (const purchase of purchases) {
      const supplier = ensureSupplier(cleanSupplierName(purchase.supplierName))
      supplier.purchaseBills += 1
      supplier.purchaseValue += purchase.totalAmount
      supplier.paidAmount += purchase.amountPaid
      supplier.dueAmount += purchase.dueAmount
      if (purchase.dueAmount > 0) supplier.dueBills += 1

      const purchaseTime = purchase.purchaseDateTime || purchase.purchaseDate
      if (!supplier.lastPurchaseDate || purchaseTime > supplier.lastPurchaseDate) {
        supplier.lastPurchaseDate = purchaseTime
      }

      for (const item of purchase.items) {
        if (item.category && !supplier.categories.includes(item.category)) {
          supplier.categories.push(item.category)
        }
      }
    }

    return Object.values(summaries).sort((left, right) => {
      const rightValue = right.dueAmount || right.purchaseValue || right.totalValue
      const leftValue = left.dueAmount || left.purchaseValue || left.totalValue
      return rightValue - leftValue
    })
  }, [products, purchases])

  const filteredSuppliers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return supplierList.filter((supplier) => {
      const matchesFilter = filter === "all" ? true : filter === "due" ? supplier.dueAmount > 0 : supplier.dueAmount <= 0
      const matchesSearch =
        !q ||
        supplier.name.toLowerCase().includes(q) ||
        supplier.categories.some((category) => category.toLowerCase().includes(q))
      return matchesFilter && matchesSearch
    })
  }, [filter, search, supplierList])

  const dueSuppliers = supplierList.filter((supplier) => supplier.dueAmount > 0).length
  const totalDue = supplierList.reduce((sum, supplier) => sum + supplier.dueAmount, 0)
  const totalPurchaseValue = supplierList.reduce((sum, supplier) => sum + supplier.purchaseValue, 0)
  const detailPurchases = detailSupplier
    ? purchases
        .filter((purchase) => cleanSupplierName(purchase.supplierName).toLowerCase() === detailSupplier.name.toLowerCase())
        .sort((left, right) => (right.purchaseDateTime || right.purchaseDate).localeCompare(left.purchaseDateTime || left.purchaseDate))
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{en.pages.suppliersTitle}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {en.pages.suppliersDescription}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-3">
        <SummaryCard label={en.suppliers.suppliers} value={String(supplierList.length)} />
        <SummaryCard label={en.suppliers.dueSuppliers} value={String(dueSuppliers)} tone="amber" />
        <SummaryCard label={en.suppliers.totalDue} value={formatCurrency(totalDue)} tone="rose" />
      </div>

      <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative flex-1">
            <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">{en.suppliers.searchLabel}</label>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 translate-y-1 text-emerald-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={en.suppliers.searchPlaceholder}
              className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-9 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button title={`${en.suppliers.all} (${supplierList.length})`} variant={filter === "all" ? "success" : "outline"} onClick={() => setFilter("all")} />
            <Button title={`${en.suppliers.due} (${dueSuppliers})`} variant={filter === "due" ? "success" : "outline"} onClick={() => setFilter("due")} />
            <Button title={en.suppliers.settled} variant={filter === "settled" ? "success" : "outline"} onClick={() => setFilter("settled")} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-8 text-center text-[var(--text-muted)] shadow-[var(--shadow-card)]">
          {en.suppliers.loading}
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-8 text-center text-[var(--text-muted)] shadow-[var(--shadow-card)]">
          {en.suppliers.noResults}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredSuppliers.map((supplier) => {
            const hasDue = supplier.dueAmount > 0

            return (
              <div
                key={supplier.name}
                className={`rounded-2xl border p-4 shadow-[var(--shadow-card)] backdrop-blur-xl ${
                  hasDue
                    ? "border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20"
                    : "border-[var(--border-card)] bg-[var(--bg-card-strong)]"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold capitalize text-[var(--text-primary)]">{supplier.name}</h2>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {supplier.purchaseBills} {en.suppliers.billsSuffix}, {supplier.totalProducts} {en.suppliers.productsSuffix}
                      {supplier.lastPurchaseDate ? `, ${en.suppliers.lastPrefix} ${new Date(supplier.lastPurchaseDate).toLocaleDateString("en-IN")}` : ""}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      hasDue
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    }`}
                  >
                    {hasDue ? `${formatCurrency(supplier.dueAmount)} ${en.suppliers.due}` : en.suppliers.settled}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <InfoBox label={en.suppliers.purchase} value={formatCurrency(supplier.purchaseValue)} />
                  <InfoBox label={en.purchases.paid} value={formatCurrency(supplier.paidAmount)} />
                  <InfoBox label={en.suppliers.dueBills} value={String(supplier.dueBills)} />
                  <InfoBox label={en.suppliers.stockValue} value={formatCurrency(supplier.totalValue)} />
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant={hasDue ? "primary" : "outline"}
                    title={hasDue ? en.suppliers.payNow : en.suppliers.paymentCleared}
                    icon={<CreditCard size={16} />}
                    disabled={!hasDue}
                    onClick={() => setPaymentSupplier(supplier)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    title={en.suppliers.viewPurchases}
                    icon={<Eye size={16} />}
                    onClick={() => setDetailSupplier(supplier)}
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    title={en.suppliers.newPurchase}
                    icon={<Plus size={16} />}
                    onClick={() => router.push("/dashboard/purchases")}
                    className="flex-1"
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
        {en.suppliers.totalPurchase}: <b className="text-[var(--text-primary)]">{formatCurrency(totalPurchaseValue)}</b>
      </div>

      {paymentSupplier && (
        <SupplierPaymentModal
          supplier={paymentSupplier}
          onClose={() => setPaymentSupplier(null)}
        />
      )}

      {detailSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm" onClick={() => setDetailSupplier(null)}>
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold capitalize text-[var(--text-primary)]">{detailSupplier.name}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.suppliers.purchaseBillsAndDue}</p>
              </div>
              <Button variant="ghost" title={en.common.close} onClick={() => setDetailSupplier(null)} />
            </div>

            <div className="space-y-3">
              {detailPurchases.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border-card)] p-6 text-center text-[var(--text-muted)]">
                  {en.suppliers.noPurchaseBills}
                </div>
              ) : (
                detailPurchases.map((purchase) => (
                  <div key={purchase.id} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{en.suppliers.bill}: {purchase.billNo}</p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">{formatPurchaseDate(purchase)} - {purchase.items.length} {en.inventory.itemsSuffix}</p>
                      </div>
                      <span className={getPaymentStatusClass(purchase.paymentStatus)}>{purchase.paymentStatus}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <InfoBox label={en.purchases.total} value={formatCurrency(purchase.totalAmount)} />
                      <InfoBox label={en.purchases.paid} value={formatCurrency(purchase.amountPaid)} />
                      <InfoBox label={en.suppliers.due} value={formatCurrency(purchase.dueAmount)} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 truncate font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  )
}
