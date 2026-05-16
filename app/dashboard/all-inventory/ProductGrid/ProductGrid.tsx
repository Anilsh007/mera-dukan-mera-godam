"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
    LayoutList,
    AlertTriangle,
    CircleOff,
    Search,
    X,
    Siren,
    SlidersHorizontal,
    CalendarClock,
    ArrowDownUp,
} from "lucide-react"
import Button from "@/app/components/ui/Button"
import type { CategoryGroup } from "../page"
import ProductGroupCard from "./ProductGroupCard"
import Input from "@/app/components/ui/Input"
import {
    getNearestExpiry,
    getProductStockLevel,
    matchesExpiryFilter,
    sortProducts,
    type ExpiryFilter,
    type ProductSortKey,
    type StockFilter,
} from "@/app/lib/inventory.utils"
import { en } from "@/app/messages/en"
import useDebouncedValue from "@/app/hooks/useDebouncedValue"

const stockFilters = [
    { key: "all", label: en.inventory.all, icon: LayoutList, active: "bg-[var(--all-inventory)] text-[var(--text-secondary)] border-[var(--all-inventory-border)] shadow", iconColor: "text-sky-500", activeIcon: "text-[var(--text-secondary)]", },
    { key: "low", label: en.inventory.low, icon: AlertTriangle, active: "bg-[var(--low-stock)] text-[var(--text-secondary)] border-[var(--low-stock-border)] shadow", iconColor: "text-amber-500", activeIcon: "text-[var(--text-secondary)]", },
    { key: "critical", label: en.inventory.critical, icon: Siren, active: "bg-[var(--critical-stock)] text-[var(--text-secondary)] border-[var(--critical-stock-border)] shadow", iconColor: "text-red-500", activeIcon: "text-[var(--text-secondary)]", },
    { key: "out", label: en.inventory.out, icon: CircleOff, active: "bg-[var(--out-stock)] text-[var(--text-secondary)] border-[var(--out-stock-border)] shadow", iconColor: "text-red-500", activeIcon: "text-[var(--text-secondary)]", },
] as const

const expiryFilters = [
    { value: "all", label: en.inventory.allExpiry },
    { value: "expired", label: en.inventory.expired },
    { value: "next7", label: en.inventory.expiringIn7Days },
    { value: "next30", label: en.inventory.expiringIn30Days },
    { value: "none", label: en.inventory.noExpiry },
] as const

const sortOptions = [
    { value: "name", label: en.inventory.sortNameAz },
    { value: "stockAsc", label: en.inventory.lowestStockFirst },
    { value: "valueDesc", label: en.inventory.highestValueFirst },
    { value: "expiryAsc", label: en.inventory.earliestExpiryFirst },
    { value: "recentDesc", label: en.inventory.newestStockFirst },
] as const

type ProductGridProps = {
    groups: CategoryGroup[]
    loading: boolean
    onSelectGroup: (group: CategoryGroup) => void
}

export default function ProductGrid({
    groups,
    loading,
    onSelectGroup,
}: ProductGridProps) {
    const router = useRouter()
    const [search, setSearch] = useState("")
    const [category, setCategory] = useState("all")
    const [stockFilter, setStockFilter] = useState<StockFilter>("all")
    const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("all")
    const [sortBy, setSortBy] = useState<ProductSortKey>("name")
    const debouncedSearch = useDebouncedValue(search, 180)

    const categories = useMemo(() => {
        return groups.map((g) => g.label).sort()
    }, [groups])

    const filteredGroups = useMemo(() => {
        const normalizedSearch = debouncedSearch.trim().toLowerCase()

        return groups
            .map((group) => {
                const stockFilteredProducts =
                    stockFilter === "all"
                        ? group.products
                        : group.products.filter((product) => getProductStockLevel(product) === stockFilter)
                const expiryFilteredProducts = stockFilteredProducts.filter((product) =>
                    matchesExpiryFilter(product.expiry, expiryFilter)
                )
                const groupMatchesSearch = normalizedSearch
                    ? group.label.toLowerCase().includes(normalizedSearch)
                    : false

                const visibleProducts = normalizedSearch
                    ? groupMatchesSearch
                        ? expiryFilteredProducts
                        : expiryFilteredProducts.filter((product) =>
                            getSearchText(product, group.label).includes(normalizedSearch)
                        )
                    : expiryFilteredProducts

                const sortedProducts = sortProducts(visibleProducts, sortBy)

                return {
                    ...group,
                    visibleProducts: sortedProducts,
                    totalQty: sortedProducts.reduce((sum, product) => sum + product.quantity, 0),
                    totalValue: sortedProducts.reduce((sum, product) => sum + product.quantity * product.price, 0),
                }
            })
            .filter((group) => {
                const hasVisibleProducts = group.visibleProducts.length > 0
                const hasActiveProductFilter = Boolean(normalizedSearch) || stockFilter !== "all" || expiryFilter !== "all"
                const matchCategory = category === "all" || group.label === category

                return matchCategory && (!hasActiveProductFilter || hasVisibleProducts)
            })
            .sort((left, right) => {
                if (sortBy === "valueDesc") return right.totalValue - left.totalValue
                if (sortBy === "stockAsc") return left.totalQty - right.totalQty
                if (sortBy === "expiryAsc") return getExpirySortTime(left.visibleProducts) - getExpirySortTime(right.visibleProducts)
                if (sortBy === "recentDesc") return getNewestProductTime(right.visibleProducts) - getNewestProductTime(left.visibleProducts)
                return left.label.localeCompare(right.label)
            })
    }, [groups, debouncedSearch, category, stockFilter, expiryFilter, sortBy])

    const resetFilters = () => {
        setSearch("")
        setCategory("all")
        setStockFilter("all")
        setExpiryFilter("all")
        setSortBy("name")
    }

    const stockCounts = useMemo(() => {
        return groups.reduce(
            (acc, group) => {
                group.products.forEach((product) => {
                    const level = getProductStockLevel(product)
                    acc.all += 1
                    if (level === "out") acc.out += 1
                    if (level === "critical") acc.critical += 1
                    if (level === "low") acc.low += 1
                })
                return acc
            },
            { all: 0, low: 0, critical: 0, out: 0 }
        )
    }, [groups])

    if (loading) {
        return (
            <div className="premium-surface rounded-3xl p-6 text-sm text-[var(--text-secondary)]">
                {en.inventory.loadingInventory}
            </div>
        )
    }

    if (groups.length === 0) {
        return (
            <div className="space-y-4 premium-surface rounded-3xl p-8 text-center">
                <p className="text-lg font-semibold">
                    {en.emptyStates.noInventory}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                    {en.emptyStates.noInventoryHelp}
                </p>
                <div className="flex justify-center">
                    <Button
                        title={en.inventory.addStockButton}
                        onClick={() => router.push("/dashboard/quick-purchase")}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="overflow-hidden rounded-[24px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] shadow-[var(--shadow-card)] backdrop-blur-xl">
                <div className="flex flex-col gap-3 border-b border-[var(--border-card)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                            <SlidersHorizontal size={18} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{en.inventory.findInventory}</p>
                            <p className="text-xs text-[var(--text-secondary)]">
                                {en.inventory.findInventoryHelp}
                            </p>
                        </div>
                    </div>
                    {(search || category !== "all" || stockFilter !== "all" || expiryFilter !== "all" || sortBy !== "name") && (
                        <Button type="button" variant="outline" title={en.inventory.clear} icon={<X size={14} />} onClick={resetFilters} />
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3 p-4 sm:p-5 xl:grid-cols-[minmax(280px,1fr)_180px_180px_190px] xl:items-center">

                    {/* Search */}
                    <div className="relative w-full">
                        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />

                        <Input type="text" placeholder={en.inventory.itemCodeSupplierPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] py-2 pl-9 pr-9 text-sm text-[var(--text-primary)] outline-none transition-all placeholder-[var(--text-muted)] focus:ring-2 focus:ring-emerald-400" />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-600" type="button" > <X size={14} /> </button>
                        )}
                    </div>

                    {/* Category */}
                    {categories.length > 0 && (
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] outline-none transition-all focus:ring-2 focus:ring-emerald-400" >
                            <option value="all">{en.inventory.allCategories}</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    )}

                    <div className="relative">
                        <CalendarClock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                        <select
                            value={expiryFilter}
                            onChange={(e) => setExpiryFilter(e.target.value as ExpiryFilter)}
                            className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] py-2 pl-9 pr-3 text-sm font-medium text-[var(--text-primary)] outline-none transition-all focus:ring-2 focus:ring-emerald-400"
                        >
                            {expiryFilters.map((filter) => (
                                <option key={filter.value} value={filter.value}>
                                    {filter.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <ArrowDownUp size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-500" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as ProductSortKey)}
                            className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] py-2 pl-9 pr-3 text-sm font-medium text-[var(--text-primary)] outline-none transition-all focus:ring-2 focus:ring-emerald-400"
                        >
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Stock Filters */}
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 border-t border-[var(--border-card)] px-4 pb-4 pt-1 min-[520px]:grid-cols-4 sm:px-5 sm:pb-5 xl:flex xl:justify-end xl:overflow-visible">
                    {stockFilters.map((f) => {
                        const Icon = f.icon
                        const active = stockFilter === f.key
                        const count = stockCounts[f.key as keyof typeof stockCounts]

                        return (
                            <button key={f.key} onClick={() => setStockFilter(f.key)} type="button" className={`relative cursor-pointer whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-semibold transition-all sm:px-4 ${active ? f.active : "border-[var(--border-input)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:border-emerald-400 hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"}`} >
                                <span className="inline-flex items-center justify-center gap-1.5">
                                    <Icon size={14} className={active ? f.activeIcon : f.iconColor} />
                                    <span>{f.label}</span>
                                    <span className={`absolute -right-2 -top-2 min-w-[20px] rounded-full border border-[var(--border-input)] px-1.5 py-0.5 text-[10px] font-semibold ${active ? "bg-white/90 text-zinc-900" : "bg-[var(--surface-primary)] text-[var(--text-primary)]"}`}>
                                        {count}
                                    </span>
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Products */}
            {filteredGroups.length === 0 ? (
                <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-8 text-center shadow-[var(--shadow-card)]">
                    <p className="text-lg font-semibold text-[var(--text-primary)]">{en.emptyStates.noInventoryMatches}</p>
                    <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
                        {en.emptyStates.adjustFilters}
                    </p>
                    <div className="mt-4 flex justify-center">
                        <Button type="button" variant="outline" title={en.inventory.clear} icon={<X size={14} />} onClick={resetFilters} />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredGroups.map((group) => (
                        <ProductGroupCard
                            key={group.key}
                            group={group}
                            onSelect={() =>
                                onSelectGroup({
                                    ...group,
                                    products: group.visibleProducts.length
                                        ? group.visibleProducts
                                        : group.products,
                                })
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function getSearchText(product: CategoryGroup["products"][number], groupLabel: string) {
    return [
        product.name,
        product.sku,
        product.hsnCode,
        product.supplier,
        product.category,
        groupLabel,
    ].filter(Boolean).join(" ").toLowerCase()
}

function getNewestProductTime(products: CategoryGroup["products"]) {
    return products.reduce((latest, product) => Math.max(latest, getTime(product.createdAt)), 0)
}

function getExpirySortTime(products: CategoryGroup["products"]) {
    const expiry = getNearestExpiry(products)
    return expiry ? new Date(expiry).getTime() : Number.MAX_SAFE_INTEGER
}

function getTime(value?: string) {
    const time = value ? new Date(value).getTime() : 0
    return Number.isFinite(time) ? time : 0
}
