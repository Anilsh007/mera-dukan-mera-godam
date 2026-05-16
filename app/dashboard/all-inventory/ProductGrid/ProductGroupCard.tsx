"use client"

import { memo } from "react"
import {
    AlertTriangle,
    Boxes,
    CircleOff,
    Package2,
    IndianRupee,
    Tag,
    Truck,
    CalendarClock,
    ChevronDown,
    Siren,
} from "lucide-react"
import type { Product } from "@/app/lib/db"
import { formatQuantityBreakdown, getExpiryInfo, getGroupStockLevel, getNearestExpiry, getProductStockLevel } from "@/app/lib/inventory.utils"
import { formatQuantity } from "@/app/lib/quantityUnit"
import { en } from "@/app/messages/en"

type CategoryGroup = {
    label: string
    products: Product[]
    totalQty: number
    totalValue: number
    visibleProducts?: Product[]
}

type ProductGroupCardProps = {
    group: CategoryGroup
    onSelect: () => void
}

function ProductGroupCard({
    group,
    onSelect,
}: ProductGroupCardProps) {
    const visibleProducts = group.visibleProducts ?? group.products
    const previewProducts = visibleProducts.slice(0, 2)
    const stockLevel = getGroupStockLevel(visibleProducts)
    const quantityBreakdown = formatQuantityBreakdown(visibleProducts)
    const nearestExpiry = getNearestExpiry(visibleProducts)
    const nearestExpiryInfo = getExpiryInfo(nearestExpiry)
    const stockState = stockLevel === "out"
        ? {
            label: en.inventory.outOfStock,
            cls: "bg-[var(--out-stock)] text-[var(--out-stock-text)] border border-[var(--out-stock-border)] shadow",
        }
        : stockLevel === "critical"
            ? {
                label: en.inventory.critical,
                cls: "bg-[var(--critical-stock)] text-[var(--critical-stock-text)] border border-[var(--critical-stock-border)] shadow",
            }
            : stockLevel === "low"
                ? {
                    label: en.inventory.lowStockLabel,
                    cls: "bg-[var(--low-stock)] text-[var(--low-stock-text)] border border-[var(--low-stock-border)] shadow",
                }
                : {
                    label: en.inventory.healthy,
                    cls: "bg-[var(--all-inventory)] text-[var(--all-inventory-text)] border border-[var(--all-inventory-border)] shadow",
                }
    return (
        <div className="group/card h-auto w-full cursor-pointer rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.99]">

            {/* Clickable Area */}
            <div onClick={onSelect} className="p-3" role="button" tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onSelect()
                    }
                }} >
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                    {/* Left */}
                    <div className="min-w-0 flex items-center gap-2">
                        <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 shrink-0"> <Boxes className="h-4 w-4" /> </div>

                        <h3 className="truncate text-base sm:text-lg font-semibold capitalize"> {group.label} </h3>
                    </div>

                    {/* Badge */}
                    <span className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-medium ${stockState.cls}`} > {stockState.label} </span>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 sm:gap-3">
                    <div className="rounded-xl sm:rounded-2xl bg-[var(--surface-primary)] p-2.5 sm:p-3 text-center">
                        <div className="mb-1 flex items-center justify-center gap-1 text-sky-500">
                            <Package2 className="h-3.5 w-3.5" />
                            <span className="text-[10px] sm:text-xs text-[var(--text-secondary)]">{en.inventory.itemSingular}</span>
                        </div>
                        <p className="text-sm font-semibold"> {visibleProducts.length} </p>
                    </div>

                    <div className="rounded-xl sm:rounded-2xl bg-[var(--surface-primary)] p-2.5 sm:p-3 text-center">
                        <div className="mb-1 flex items-center justify-center gap-1 text-violet-500">
                            <Tag className="h-3.5 w-3.5" />
                            <span className="text-[10px] sm:text-xs text-[var(--text-secondary)]">{en.inventory.availableLabel}</span>
                        </div>
                        <p className="truncate text-sm font-semibold">{quantityBreakdown}</p>
                    </div>

                    <div className="rounded-xl sm:rounded-2xl bg-[var(--surface-primary)] p-2.5 sm:p-3 text-center">
                        <div className="mb-1 flex items-center justify-center gap-1 text-emerald-500">
                            <IndianRupee className="h-3.5 w-3.5" />
                            <span className="text-[10px] sm:text-xs text-[var(--text-secondary)]">{en.inventory.valueLabel}</span>
                        </div>
                        <p className="text-sm font-semibold truncate"> {en.common.rupeeSymbol} {group.totalValue.toLocaleString("en-IN")} </p>
                    </div>
                </div>

                {nearestExpiry && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-card)] bg-[var(--surface-primary)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                        <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-medium text-[var(--text-primary)]">{en.inventory.nearestExpiry}</span>
                        <span className={`rounded-full px-2 py-0.5 ${nearestExpiryInfo?.cls || "bg-[var(--expire-date)] text-[var(--expire-date-text)]"}`}>
                            {nearestExpiryInfo?.label || nearestExpiry}
                        </span>
                    </div>
                )}

                {/* Preview Products */}
                {previewProducts.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {previewProducts.map((product) => {
                            const expInfo = getExpiryInfo(product.expiry)
                            const productStockLevel = getProductStockLevel(product)
                            const stockIndicator =
                                productStockLevel === "out"
                                    ? {
                                        icon: CircleOff,
                                        label: en.inventory.outOfStock,
                                        cls: "bg-[var(--out-stock)] text-[var(--out-stock-text)] border border-[var(--out-stock-border)]",
                                    }
                                    : productStockLevel === "critical"
                                        ? {
                                            icon: Siren,
                                            label: en.inventory.critical,
                                            cls: "bg-[var(--critical-stock)] text-[var(--critical-stock-text)] border border-[var(--critical-stock-border)]",
                                        }
                                        : productStockLevel === "low"
                                            ? {
                                                icon: AlertTriangle,
                                                label: en.inventory.low,
                                                cls: "bg-[var(--low-stock)] text-[var(--low-stock-text)] border border-[var(--low-stock-border)]",
                                            }
                                            : null

                            return (
                                <div key={product.id} className="rounded-xl sm:rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-card)]" >
                                    {/* Top */}
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                                        <p className="truncate font-semibold capitalize"> {product.name} </p>

                                        {(product.expiry || product.supplier || stockIndicator) && (
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {product.supplier && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">
                                                        <Truck className="h-3 w-3" />
                                                        {product.supplier}
                                                    </span>
                                                )}

                                                {stockIndicator && (
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${stockIndicator.cls}`}>
                                                        <stockIndicator.icon className="h-3 w-3" />
                                                        {stockIndicator.label}
                                                    </span>
                                                )}

                                                {(expInfo || product.expiry) && (
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${expInfo?.cls || "bg-[var(--expire-date)] text-[var(--expire-date-text)] border border-[var(--expire-date-border)]"}`} >
                                                        <CalendarClock className="h-3 w-3" />
                                                        {expInfo ? expInfo.label : `${en.inventory.expPrefix}: ${product.expiry}`}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Stats */}
                                    <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 text-xs text-center">
                                        <div>
                                            <p className="text-[var(--text-secondary)]">{en.inventory.rateLabel}</p>
                                            <p className="font-medium"> {en.common.rupeeSymbol} {product.price.toLocaleString("en-IN")} </p>
                                        </div>

                                        <div>
                                            <p className="text-[var(--text-secondary)]">{en.inventory.valueLabel}</p>
                                            <p className="font-medium"> {en.common.rupeeSymbol} {(product.price * product.quantity).toLocaleString("en-IN")} </p>
                                        </div>

                                        <div>
                                            <p className="text-[var(--text-secondary)]">{en.inventory.availableLabel}</p>
                                            <p className="font-medium"> {formatQuantity(product.quantity, product.quantityUnit)} </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {/* See More */}
                        {visibleProducts.length > 2 && (
                            <button onClick={(event) => { event.stopPropagation(); onSelect() }} type="button" className="flex w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-dashed border-[var(--border-card)] px-4 py-2.5 text-xs sm:text-xs font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-primary)] hover:text-[var(--text-primary)] hover:shadow-md hover:border-[var(--border-primary)]" >
                                <ChevronDown className="h-3.5 w-3.5 -rotate-90 transition-transform duration-200 group-hover/card:rotate-0" />
                                +{visibleProducts.length - 2} {en.inventory.moreItemsSuffix}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default memo(ProductGroupCard)
