"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, ArrowRight, Boxes, IndianRupee, PackageOpen, TrendingUp } from "lucide-react"
import { auth } from "@/app/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import useInventoryData from "@/app/hooks/useInventoryData"
import { formatCurrency } from "@/app/lib/formatters"
import { getProductStockLevel } from "@/app/lib/inventory.utils"
import { en } from "@/app/messages/en"

function StatCard({ label, value, sub, icon, color, loading, onClick }) {
  return (
    <div onClick={onClick}
      className={`group rounded-[24px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-5 shadow-[var(--shadow-card)] transition-all duration-200 ${
        onClick ? "cursor-pointer hover:-translate-y-1" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl flex-shrink-0" style={{ background: color }}>
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
          {loading ? (
            <div className="skeleton mt-1 h-7 w-24" />
          ) : (
            <p className="mt-0.5 truncate text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          )}
          {sub && !loading && <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{sub}</p>}
        </div>

        {onClick && <ArrowRight size={16} className="text-[var(--text-muted)] transition group-hover:text-[var(--text-primary)]" />}
      </div>
    </div>
  )
}

export default function DashboardHome() {
  const router = useRouter()
  const { products, logs, loading } = useInventoryData()
  const [userName, setUserName] = useState("")

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserName(user.displayName?.split(" ")[0] || "")
    })
    return () => unsub()
  }, [])

  const stats = useMemo(() => {
    const totalProducts = products.length
    const lowStock = products.filter((product) => {
      const stockLevel = getProductStockLevel(product)
      return stockLevel === "low" || stockLevel === "critical"
    }).length
    const outOfStock = products.filter((product) => product.quantity === 0).length
    const totalStockValue = products.reduce((sum, product) => sum + product.price * product.quantity, 0)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayOut = logs.filter((log) => log.type === "out" && new Date(log.date) >= todayStart)
    const salesToday = todayOut.reduce((sum, log) => sum + Math.abs(log.quantityAdded) * log.price, 0)
    const unitsSold = todayOut.reduce((sum, log) => sum + Math.abs(log.quantityAdded), 0)

    const now = new Date()
    const soon = new Date()
    soon.setDate(soon.getDate() + 30)
    const nearExpiry = products.filter((product) => {
      if (!product.expiry) return false
      const expiry = new Date(product.expiry)
      return expiry <= soon && expiry >= now
    }).length

    return { totalProducts, lowStock, outOfStock, totalStockValue, salesToday, unitsSold, nearExpiry }
  }, [products, logs])

  const cards = [
    {
      label: en.dashboard.totalProducts,
      value: stats ? stats.totalProducts : "-",
      icon: <Boxes size={20} className="text-white" />,
      color: "linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)",
      sub: stats?.outOfStock > 0 ? `${stats.outOfStock} ${en.dashboard.outOfStockSuffix}` : en.dashboard.allInStock,
      onClick: () => router.push("/dashboard/all-stock"),
    },
    {
      label: en.dashboard.lowStock,
      value: stats ? stats.lowStock : "-",
      icon: <AlertTriangle size={20} className="text-white" />,
      color: "linear-gradient(135deg, #f59e0b 0%, #fb7185 100%)",
      sub: stats?.lowStock > 0 ? en.dashboard.needsRestocking : en.dashboard.stockHealthy,
      onClick: () => router.push("/dashboard/all-stock"),
    },
    {
      label: en.dashboard.todaysSales,
      value: stats ? formatCurrency(stats.salesToday) : "-",
      icon: <TrendingUp size={20} className="text-white" />,
      color: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
      sub: stats ? `${stats.unitsSold} ${en.dashboard.unitsSoldSuffix}` : "",
      onClick: () => router.push("/dashboard/stock-history"),
    },
    {
      label: en.dashboard.stockValue,
      value: stats ? formatCurrency(stats.totalStockValue) : "-",
      icon: <IndianRupee size={20} className="text-white" />,
      color: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
      sub: en.dashboard.currentInventoryValue,
      onClick: () => router.push("/dashboard/reports"),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 shadow-[var(--shadow-card)] sm:rounded-[28px] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">{en.dashboard.overviewLabel}</p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
              {userName ? `${en.dashboard.greeting}, ${userName}` : en.dashboard.fallbackTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
              {en.dashboard.overviewDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3 sm:grid-cols-3">
            <QuickPill icon={<PackageOpen size={16} />} label={en.dashboard.products} value={stats ? String(stats.totalProducts) : "-"} />
            <QuickPill icon={<TrendingUp size={16} />} label={en.dashboard.unitsSold} value={stats ? String(stats.unitsSold) : "-"} />
            <QuickPill icon={<AlertTriangle size={16} />} label={en.dashboard.expiry} value={stats ? String(stats.nearExpiry) : "-"} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {!loading && stats?.nearExpiry > 0 && (
        <div
          onClick={() => router.push("/dashboard/expiry-alerts")}
          className="flex cursor-pointer flex-col items-start gap-4 rounded-[24px] border border-amber-200 bg-amber-50 p-4 transition hover:-translate-y-0.5 hover:bg-amber-100 dark:border-amber-900/30 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 sm:flex-row sm:items-center sm:p-5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-400">
              {stats.nearExpiry} {en.dashboard.nearExpiryTitle}
            </p>
            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-500">
              {en.dashboard.nearExpiryDescription}
            </p>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">{en.dashboard.quickActions}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => router.push("/dashboard/add-product")}
            className="group rounded-[24px] border border-emerald-400/20 bg-[var(--bg-card-strong)] backdrop-blur-xl p-5 text-left shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <PackageOpen size={18} />
            </div>
            <p className="font-semibold text-[var(--text-primary)]">{en.dashboard.addStock}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {en.dashboard.addStockDescription}
            </p>
          </button>

          <button
            onClick={() => router.push("/dashboard/stock-history")}
            className="group rounded-[24px] border border-blue-400/20 bg-[var(--bg-card-strong)] backdrop-blur-xl p-5 text-left shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <TrendingUp size={18} />
            </div>
            <p className="font-semibold text-[var(--text-primary)]">{en.dashboard.reviewHistory}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {en.dashboard.reviewHistoryDescription}
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}

function QuickPill({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-elevated)] px-4 py-3 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-base font-bold text-[var(--text-primary)] sm:text-lg">{value}</p>
    </div>
  )
}
