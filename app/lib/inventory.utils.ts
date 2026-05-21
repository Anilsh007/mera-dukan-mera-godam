import type { Product } from "@/app/lib/db"
import { formatQuantity, normalizeQuantityUnit } from "./quantityUnit"
import { en } from "@/app/messages/en"

export const STOCK_THRESHOLDS = {
  criticalMax: 25,
  lowMax: 50,
} as const

export type StockLevel = "out" | "critical" | "low" | "healthy"
export type StockFilter = "all" | "low" | "critical" | "out"
export type ExpiryFilter = "all" | "expired" | "next7" | "next30" | "none"
export type ProductSortKey = "name" | "stockAsc" | "valueDesc" | "expiryAsc" | "recentDesc"
export type StockThresholds = {
  criticalMax?: number
  lowMax?: number
}

export function getStockLevel(quantity: number, thresholds?: StockThresholds): StockLevel {
  const criticalMax = normalizeThreshold(thresholds?.criticalMax, STOCK_THRESHOLDS.criticalMax)
  const lowMax = Math.max(normalizeThreshold(thresholds?.lowMax, STOCK_THRESHOLDS.lowMax), criticalMax)

  if (quantity <= 0) return "out"
  if (quantity <= criticalMax) return "critical"
  if (quantity <= lowMax) return "low"
  return "healthy"
}

export function getProductStockLevel(product: Product): StockLevel {
  return getStockLevel(product.quantity, getProductThresholds(product))
}

export function getProductThresholds(product: Product) {
  const lowMax = product.lowStockThreshold ?? product.reorderLevel
  const criticalMax = product.criticalStockThreshold ?? (lowMax !== undefined ? Math.max(Math.floor(lowMax / 2), 0) : undefined)

  return {
    criticalMax,
    lowMax,
  }
}

export function getGroupStockLevel(products: Product[]): StockLevel {
  const totalQty = products.reduce((sum, product) => sum + product.quantity, 0)
  if (totalQty <= 0) return "out"
  if (products.some((product) => getProductStockLevel(product) === "critical")) {
    return "critical"
  }
  if (products.some((product) => getProductStockLevel(product) === "low")) {
    return "low"
  }
  return "healthy"
}

export function matchesGroupStockFilter(products: Product[], filter: StockFilter): boolean {
  if (filter === "all") return true
  return getGroupStockLevel(products) === filter
}

export function getGroupStockCounts(groups: Array<{ products: Product[] }>) {
  return groups.reduce(
    (acc, group) => {
      const level = getGroupStockLevel(group.products)
      acc.all += 1
      if (level === "out") acc.out += 1
      if (level === "critical") acc.critical += 1
      if (level === "low") acc.low += 1
      return acc
    },
    { all: 0, low: 0, critical: 0, out: 0 }
  )
}

export function getExpiryInfo(expiry?: string): { label: string; cls: string } | null {
  if (!expiry) return null

  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000)

  if (days < 0) {
    return {
      label: en.expiry.expired,
      cls: "bg-[var(--out-stock)] text-[var(--out-stock-text)] border border-[var(--out-stock-border)] shadow",
    }
  }

  if (days <= 7) {
    return {
      label: `${days} ${en.expiry.daysLeftSuffix}`,
      cls: "bg-[var(--expired)] text-[var(--expired-text)]",
    }
  }

  if (days <= 30) {
    return {
      label: `${days} ${en.expiry.daysLeftSuffix}`,
      cls: "bg-[var(--low-expiry)] text-[var(--low-expiry-text)]",
    }
  }

  return null
}

export function matchesExpiryFilter(expiry: string | undefined, filter: ExpiryFilter): boolean {
  if (filter === "all") return true
  if (filter === "none") return !expiry
  if (!expiry) return false

  const days = getDaysUntilExpiry(expiry)
  if (filter === "expired") return days < 0
  if (filter === "next7") return days >= 0 && days <= 7
  if (filter === "next30") return days >= 0 && days <= 30

  return true
}

export function getDaysUntilExpiry(expiry: string) {
  return Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000)
}

export function getNearestExpiry(products: Product[]) {
  let nearestExpiry: string | undefined
  let nearestTime = Number.POSITIVE_INFINITY

  for (const product of products) {
    if (!product.expiry) continue
    const time = new Date(product.expiry).getTime()
    if (!Number.isFinite(time) || time >= nearestTime) continue
    nearestTime = time
    nearestExpiry = product.expiry
  }

  return nearestExpiry
}

export function sortProducts(products: Product[], sort: ProductSortKey) {
  return [...products].sort((left, right) => {
    if (sort === "stockAsc") return left.quantity - right.quantity
    if (sort === "valueDesc") return right.price * right.quantity - left.price * left.quantity
    if (sort === "expiryAsc") return getExpiryTime(left.expiry) - getExpiryTime(right.expiry)
    if (sort === "recentDesc") return getTime(right.createdAt) - getTime(left.createdAt)
    return left.name.localeCompare(right.name)
  })
}

export function formatQuantityBreakdown(products: Product[]) {
  const totals = new Map<string, number>()

  products.forEach((product) => {
    const unit = normalizeQuantityUnit(product.quantityUnit)
    totals.set(unit, (totals.get(unit) || 0) + Number(product.quantity || 0))
  })

  const parts = Array.from(totals.entries())
    .filter(([, quantity]) => quantity !== 0)
    .sort(([leftUnit], [rightUnit]) => leftUnit.localeCompare(rightUnit))
    .map(([unit, quantity]) => formatQuantity(trimTrailingZeros(quantity), unit))

  return parts.length ? parts.join(" + ") : formatQuantity(0, undefined)
}

function getExpiryTime(expiry?: string) {
  if (!expiry) return Number.MAX_SAFE_INTEGER
  return getTime(expiry)
}

function getTime(value?: string) {
  const time = value ? new Date(value).getTime() : 0
  return Number.isFinite(time) ? time : 0
}

function trimTrailingZeros(value: number) {
  return Number.isInteger(value) ? value : Number(value.toFixed(2))
}

function normalizeThreshold(value: number | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}
