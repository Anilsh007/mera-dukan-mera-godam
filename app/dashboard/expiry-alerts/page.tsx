"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, BadgePercent, PackageX, Search } from "lucide-react"
import Button from "@/app/components/ui/Button"
import useInventoryData from "@/app/hooks/useInventoryData"
import { Product } from "@/app/lib/db"
import { formatCurrency } from "@/app/lib/formatters"
import { getDaysUntilExpiry } from "@/app/lib/inventory.utils"
import { formatQuantity } from "@/app/lib/quantityUnit"
import StockOutModal from "../all-stock/StockOutModal"
import { en } from "@/app/messages/en"

type ExpiryAction =
  | { type: "discount"; product: Product }
  | { type: "expired-out"; product: Product }
  | null

function getDaysLeft(expiry?: string) {
  if (!expiry) return null
  return getDaysUntilExpiry(expiry)
}

function getExpiryText(daysLeft: number) {
  if (daysLeft < 0) return en.expiry.expired
  if (daysLeft === 0) return en.expiry.expiresToday
  return `${daysLeft} ${en.expiry.daysLeftSuffix}`
}

function getDiscountPrice(price: number, daysLeft: number) {
  const discount = daysLeft < 0 ? 0.5 : daysLeft <= 7 ? 0.7 : 0.85
  return Math.max(1, Math.round(Number(price || 0) * discount))
}

function getExpiryCandidates(products: Product[]) {
  return products
    .filter((product) => product.expiry)
    .map((product) => ({
      ...product,
      daysLeft: getDaysLeft(product.expiry),
    }))
    .filter((product) => product.daysLeft !== null && product.daysLeft <= 30)
}

export default function ExpiryAlertsPage() {
  const router = useRouter()
  const { products, loading } = useInventoryData()
  const [action, setAction] = useState<ExpiryAction>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "expired" | "week" | "month">("all")

  const expiringProducts = useMemo(
    () =>
      getExpiryCandidates(products)
        .filter((product) => {
          const days = product.daysLeft ?? 0
          if (filter === "expired") return days < 0
          if (filter === "week") return days >= 0 && days <= 7
          if (filter === "month") return days > 7 && days <= 30
          return true
        })
        .filter((product) => {
          const q = search.trim().toLowerCase()
          if (!q) return true
          return (
            product.name.toLowerCase().includes(q) ||
            (product.category || "").toLowerCase().includes(q) ||
            (product.supplier || "").toLowerCase().includes(q)
          )
        })
        .sort((left, right) => (left.daysLeft ?? 0) - (right.daysLeft ?? 0)),
    [filter, products, search]
  )

  const allExpiryProducts = useMemo(() => getExpiryCandidates(products), [products])

  const expiredCount = allExpiryProducts.filter((product) => (product.daysLeft ?? 0) < 0).length
  const weekCount = allExpiryProducts.filter((product) => {
    const days = product.daysLeft ?? 0
    return days >= 0 && days <= 7
  }).length
  const monthCount = allExpiryProducts.filter((product) => {
    const days = product.daysLeft ?? 0
    return days > 7 && days <= 30
  }).length

  const closeAction = () => setAction(null)
  const actionProduct = action?.product ?? null
  const actionType = action?.type
  const actionDaysLeft = actionProduct ? getDaysLeft(actionProduct.expiry) ?? 0 : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{en.pages.expiryTitle}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {en.pages.expiryDescription}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-3">
        <SummaryTile label={en.expiry.expired} value={expiredCount} tone="rose" />
        <SummaryTile label={en.expiry.in7Days} value={weekCount} tone="amber" />
        <SummaryTile label={en.expiry.in30Days} value={monthCount} tone="yellow" />
      </div>

      <div className="space-y-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button title={`${en.expiry.all} (${allExpiryProducts.length})`} variant={filter === "all" ? "success" : "outline"} onClick={() => setFilter("all")} />
          <Button title={`Expired (${expiredCount})`} variant={filter === "expired" ? "success" : "outline"} onClick={() => setFilter("expired")} />
          <Button title={`${en.expiry.in7Days} (${weekCount})`} variant={filter === "week" ? "success" : "outline"} onClick={() => setFilter("week")} />
          <Button title={`${en.expiry.in30Days} (${monthCount})`} variant={filter === "month" ? "success" : "outline"} onClick={() => setFilter("month")} />
        </div>

        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={en.expiry.searchPlaceholder}
            className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-9 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {loading ? (
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-8 text-center text-[var(--text-muted)] shadow-[var(--shadow-card)] backdrop-blur-xl">
            {en.expiry.loading}
          </div>
        ) : expiringProducts.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-8 text-center text-[var(--text-muted)] shadow-[var(--shadow-card)] backdrop-blur-xl">
            {en.expiry.noResults}
          </div>
        ) : (
          expiringProducts.map((product) => {
            const daysLeft = product.daysLeft ?? 0
            const isExpired = daysLeft < 0
            const discountPrice = getDiscountPrice(product.price, daysLeft)

            return (
              <div
                key={product.id}
                className={`rounded-2xl border p-5 shadow-[var(--shadow-card)] backdrop-blur-xl ${
                  isExpired
                    ? "border-rose-200 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/20"
                    : daysLeft <= 7
                      ? "border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20"
                      : "border-[var(--border-card)] bg-[var(--bg-card-strong)]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold capitalize text-[var(--text-primary)]">{product.name}</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {product.category || en.expiry.categoryUnavailable}{product.supplier ? ` - ${product.supplier}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      isExpired
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                    }`}
                  >
                    {getExpiryText(daysLeft)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <InfoBox label={en.expiry.remaining} value={formatQuantity(product.quantity, product.quantityUnit)} />
                  <InfoBox label="Expiry" value={product.expiry || "-"} />
                  <InfoBox label={en.inventory.rate} value={formatCurrency(product.price)} />
                </div>

                {!isExpired && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-white/70 p-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-slate-950/40 dark:text-emerald-300">
                    {en.expiry.suggestedDiscountRate}: <b>{formatCurrency(discountPrice)}</b>
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  {!isExpired && (
                    <Button
                      title={en.expiry.discountSale}
                      variant="success"
                      icon={<BadgePercent size={16} />}
                      onClick={() => setAction({ type: "discount", product })}
                      className="flex-1"
                    />
                  )}
                  {isExpired && (
                    <Button
                      title={en.expiry.removeExpiredStock}
                      variant="danger"
                      icon={<PackageX size={16} />}
                      onClick={() => setAction({ type: "expired-out", product })}
                      className="flex-1"
                    />
                  )}
                  <Button
                    title={en.expiry.viewInInventory}
                    variant="outline"
                    onClick={() => router.push("/dashboard/all-stock")}
                    className="flex-1"
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {actionProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4"
          onClick={closeAction}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[var(--bg-card-strong)] shadow-2xl sm:rounded-[28px]"
            onClick={(event) => event.stopPropagation()}
          >
            <StockOutModal
              product={actionProduct}
              onClose={closeAction}
              defaultReason={actionType === "discount" ? "Sold" : "Expired"}
              defaultSalePrice={actionType === "discount" ? getDiscountPrice(actionProduct.price, actionDaysLeft) : 0}
              defaultExpiry={actionProduct.expiry}
              defaultQuantity={actionType === "expired-out" ? actionProduct.quantity : ""}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone: "rose" | "amber" | "yellow" }) {
  const toneClass =
    tone === "rose"
      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
        : "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/40 dark:bg-yellow-950/20 dark:text-yellow-300"

  return (
    <div className={`rounded-2xl border p-4 shadow-[var(--shadow-card)] ${toneClass}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
        <AlertTriangle size={14} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/5 p-3 dark:bg-white/5">
      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 truncate font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  )
}
