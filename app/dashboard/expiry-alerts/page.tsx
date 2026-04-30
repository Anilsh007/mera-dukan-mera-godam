"use client"

import useInventoryData from "../hooks/useInventoryData"

function getDaysLeft(expiry?: string) {
  if (!expiry) return null
  return Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000)
}

export default function ExpiryAlertsPage() {
  const { products, loading } = useInventoryData()

  const expiringProducts = products
    .filter((product) => product.expiry)
    .map((product) => ({
      ...product,
      daysLeft: getDaysLeft(product.expiry),
    }))
    .filter((product) => product.daysLeft !== null && product.daysLeft <= 30)
    .sort((left, right) => (left.daysLeft ?? 0) - (right.daysLeft ?? 0))

  const expiredCount = expiringProducts.filter((product) => (product.daysLeft ?? 0) < 0).length
  const dueSoonCount = expiringProducts.filter((product) => (product.daysLeft ?? 0) >= 0).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Expiry Alerts</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          30 din ke andar expire hone wale products yahan dikh rahe hain.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Alert Products</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{expiringProducts.length}</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-[var(--shadow-card)] dark:border-rose-900/40 dark:bg-rose-950/30">
          <p className="text-xs uppercase tracking-wide text-rose-600 dark:text-rose-300">Expired</p>
          <p className="mt-2 text-2xl font-bold text-rose-700 dark:text-rose-300">{expiredCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-[var(--shadow-card)] dark:border-amber-900/40 dark:bg-amber-950/30 min-[420px]:col-span-2 xl:col-span-1">
          <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">Due Soon</p>
          <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-300">{dueSoonCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {loading ? (
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-8 text-center text-[var(--text-muted)] shadow-[var(--shadow-card)]">
            Loading expiry data...
          </div>
        ) : expiringProducts.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-8 text-center text-[var(--text-muted)] shadow-[var(--shadow-card)]">
            Koi expiry alert abhi pending nahi hai.
          </div>
        ) : (
          expiringProducts.map((product) => {
            const isExpired = (product.daysLeft ?? 0) < 0
            return (
              <div
                key={product.id}
                className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold capitalize text-[var(--text-primary)]">{product.name}</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {product.category || "Uncategorized"}{product.supplier ? ` • ${product.supplier}` : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isExpired
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                    }`}
                  >
                    {isExpired ? "Expired" : `${product.daysLeft} days left`}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-black/5 p-3 dark:bg-white/5">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Quantity</p>
                    <p className="mt-1 font-semibold text-[var(--text-primary)]">{product.quantity}</p>
                  </div>
                  <div className="rounded-xl bg-black/5 p-3 dark:bg-white/5">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Expiry Date</p>
                    <p className="mt-1 font-semibold text-[var(--text-primary)]">{product.expiry}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
