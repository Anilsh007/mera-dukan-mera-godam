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
} from "lucide-react"
import Button from "@/app/components/utility/Button"
import type { CategoryGroup } from "../page"
import ProductGroupCard from "./ProductGroupCard"
import Input from "@/app/components/utility/CommonInput"
import { getGroupStockCounts, getStockLevel, matchesGroupStockFilter, type StockFilter } from "@/app/lib/inventory.utils"

const stockFilters = [
    { key: "all", label: "All", icon: LayoutList, active: "bg-[var(--all-stock)] text-[var(--text-secondary)] border-[var(--all-stock-border)] shadow", iconColor: "text-sky-500", activeIcon: "text-[var(--text-secondary)]", },
    { key: "low", label: "Low", icon: AlertTriangle, active: "bg-[var(--low-stock)] text-[var(--text-secondary)] border-[var(--low-stock-border)] shadow", iconColor: "text-amber-500", activeIcon: "text-[var(--text-secondary)]", },
    { key: "critical", label: "Critical", icon: Siren, active: "bg-[var(--critical-stock)] text-[var(--text-secondary)] border-[var(--critical-stock-border)] shadow", iconColor: "text-red-500", activeIcon: "text-[var(--text-secondary)]", },
    { key: "out", label: "Out", icon: CircleOff, active: "bg-[var(--out-stock)] text-[var(--text-secondary)] border-[var(--out-stock-border)] shadow", iconColor: "text-red-500", activeIcon: "text-[var(--text-secondary)]", },
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

    const categories = useMemo(() => {
        return groups.map((g) => g.label).sort()
    }, [groups])

    const filteredGroups = useMemo(() => {
        return groups
            .map((group) => {
                const visibleProducts =
                    stockFilter === "all"
                        ? group.products
                        : group.products.filter((product) => getStockLevel(product.quantity) === stockFilter)

                return {
                    ...group,
                    visibleProducts,
                }
            })
            .filter((group) => {
            const matchSearch =
                !search ||
                group.label.toLowerCase().includes(search.toLowerCase()) ||
                group.visibleProducts.some(
                    (p) =>
                        p.name.toLowerCase().includes(search.toLowerCase()) ||
                        (p.sku || "").toLowerCase().includes(search.toLowerCase())
                )

            const matchCategory = category === "all" || group.label === category
            const matchStock = matchesGroupStockFilter(group.products, stockFilter)

            return matchSearch && matchCategory && matchStock
        })
    }, [groups, search, category, stockFilter])

    const stockCounts = useMemo(() => {
        return getGroupStockCounts(groups)
    }, [groups])

    if (loading) {
        return (
            <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--surface-card)] p-6 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
                Please wait while products load...
            </div>
        )
    }

    if (groups.length === 0) {
        return (
            <div className="space-y-4 rounded-3xl border border-[var(--border-card)] bg-[var(--surface-card)] p-8 text-center shadow-[var(--shadow-card)]">
                <p className="text-lg font-semibold">
                    There&apos;s no product to display
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                    Please add a product to get started.
                </p>
                <div className="flex justify-center">
                    <Button
                        title="Add Product"
                        onClick={() => router.push("/dashboard/add-product")}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-3 shadow-[var(--shadow-card)] sm:p-4">
                <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">

                {/* Search */}
                <div className="relative w-full xl:flex-1">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />

                    <Input type="text" placeholder="Please Enter Product Name or SKU" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] py-2 pl-9 pr-9 text-sm text-[var(--text-primary)] outline-none transition-all placeholder-[var(--text-muted)] focus:ring-2 focus:ring-emerald-400" />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-600" type="button" > <X size={14} /> </button>
                    )}
                </div>

                {/* Category */}
                {categories.length > 0 && (
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full sm:w-auto rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all focus:ring-2 focus:ring-emerald-400" >
                        <option value="all">All Categories</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                )}

                {/* Stock Filters */}
                <div className="flex gap-2 overflow-x-auto pb-1 2xl:pb-0">
                    {stockFilters.map((f) => {
                        const Icon = f.icon
                        const active = stockFilter === f.key
                        const count = stockCounts[f.key as keyof typeof stockCounts]

                        return (
                            <button key={f.key} onClick={() => setStockFilter(f.key)} type="button" className={`relative cursor-pointer whitespace-nowrap rounded-xl border px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium transition-all ${active ? f.active : "border-[var(--border-input)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:border-emerald-400"}`} >
                                <span className="inline-flex items-center gap-1.5">
                                    <Icon size={14} className={active ? f.activeIcon : f.iconColor} />
                                    <span>{f.label}</span>
                                    <span className={`absolute -top-0 -right-2 min-w-[20px] rounded-full border border-[var(--border-input)] px-1.5 py-0.5 text-[10px] font-semibold ${active ? "bg-white/90 text-zinc-900" : "bg-[var(--surface-primary)] text-[var(--text-primary)]"}`} >
                                        {count}
                                    </span>
                                </span>
                            </button>
                        )
                    })}
                </div>
                </div>
            </div>

            {/* Products */}
            {filteredGroups.length === 0 ? (
                <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-8 text-center shadow-[var(--shadow-card)]">
                    <p className="text-lg font-semibold"> No products to display</p>
                    <p className="text-sm text-[var(--text-secondary)]">Try adjusting your search or filter criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredGroups.map((group) => (
                        <div key={group.key}>
                            <ProductGroupCard group={group} onSelect={() => onSelectGroup(group)} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
