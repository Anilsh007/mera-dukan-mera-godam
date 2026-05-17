"use client"

import {
    AlertTriangle,
    CalendarClock,
    Pencil,
    IndianRupee,
    Package2,
    Layers3,
    ScanBarcode,
    TrendingDown,
    TrendingUp,
    Truck,
    Trash2,
    type LucideIcon,
} from "lucide-react"
import Button from "@/app/components/ui/Button"
import { Product } from "@/app/lib/db"
import { getProductStockLevel, STOCK_THRESHOLDS } from "@/app/lib/inventory.utils"
import { formatQuantity } from "@/app/lib/quantityUnit"
import { en } from "@/app/messages/en"

type Log = {
    id: string
    quantityAdded: number
    price: number
    expiry?: string
    type?: "in" | "out"
    reason?: string
}

export default function ProductStats({
    product,
    logs,
    setModal,
    onEditProduct,
    onDeleteProduct,
}: {
    product: Product
    logs: Log[]
    setModal: (type: "in" | "out" | null) => void
    onEditProduct: () => void
    onDeleteProduct: () => void
}) {
    const stockLevel = getProductStockLevel(product)
    const isOut = stockLevel === "out"
    const isCritical = stockLevel === "critical"
    const isLow = stockLevel === "low"

    const totalInQty = logs
        .filter((log) => log.quantityAdded > 0)
        .reduce((sum, log) => sum + log.quantityAdded, 0)

    const totalOutQty = logs
        .filter((log) => log.quantityAdded < 0)
        .reduce((sum, log) => sum + Math.abs(log.quantityAdded), 0)

    const soldLogs = logs.filter(
        (log) => log.quantityAdded < 0 && (log.reason || "Sold") === "Sold"
    )

    const soldQty = soldLogs.reduce(
        (sum, log) => sum + Math.abs(log.quantityAdded),
        0
    )

    const nonSaleOutQty = logs
        .filter((log) => log.quantityAdded < 0 && (log.reason || "Sold") !== "Sold")
        .reduce((sum, log) => sum + Math.abs(log.quantityAdded), 0)

    const totalInValue = logs
        .filter((log) => log.quantityAdded > 0)
        .reduce((sum, log) => sum + log.quantityAdded * Number(log.price || 0), 0)

    const totalOutValue = soldLogs.reduce(
        (sum, log) => sum + Math.abs(log.quantityAdded) * Number(log.price || 0),
        0
    )

    const inventoryValue = Number(product.quantity || 0) * Number(product.price || 0)
    const avgPurchasePrice = totalInQty > 0 ? totalInValue / totalInQty : Number(product.price || 0)
    const costOfSoldGoods = soldQty * avgPurchasePrice
    const netProfit = totalOutValue - costOfSoldGoods

    const expiryBatches = logs
        .filter((log) => log.expiry)
        .reduce((map, log) => {
            const expiry = log.expiry as string
            const current = map.get(expiry) || { quantity: 0, inValue: 0, inQty: 0 }
            const quantity = current.quantity + Number(log.quantityAdded || 0)
            const isStockIn = log.quantityAdded > 0

            map.set(expiry, {
                quantity,
                inValue: current.inValue + (isStockIn ? Number(log.price || 0) * Number(log.quantityAdded || 0) : 0),
                inQty: current.inQty + (isStockIn ? Number(log.quantityAdded || 0) : 0),
            })

            return map
        }, new Map<string, { quantity: number; inValue: number; inQty: number }>())

    const activeExpiryBatches = Array.from(expiryBatches.entries())
        .map(([expiry, batch]) => ({
            expiry,
            quantity: Math.max(0, batch.quantity),
            avgPrice: batch.inQty > 0 ? batch.inValue / batch.inQty : Number(product.price || 0),
        }))
        .filter((batch) => batch.quantity > 0)
        .sort((left, right) => new Date(left.expiry).getTime() - new Date(right.expiry).getTime())

    const nearestExpiry = activeExpiryBatches[0]?.expiry || product.expiry || "-"

    const movementSignal =
        soldQty === 0 && totalInQty > 0
            ? en.inventory.noSalesYet
            : soldQty >= totalInQty * 0.7
                ? en.inventory.fastMoving
                : nonSaleOutQty > soldQty
                    ? en.inventory.mostlyAdjusted
                    : en.inventory.stableMovement

    const stockStatus = isOut
        ? {
            label: en.inventory.outOfStock,
            tone: "bg-[var(--out-stock)] text-[var(--out-stock-text)] border-[var(--out-stock-border)]",
            icon: AlertTriangle,
        }
        : isCritical
            ? {
            label: en.inventory.criticalStock,
                tone: "bg-[var(--critical-stock)] text-[var(--critical-stock-text)] border-[var(--critical-stock-border)]",
                icon: AlertTriangle,
            }
            : isLow
                ? {
                    label: en.inventory.lowStockLabel,
                    tone: "bg-[var(--low-stock)] text-[var(--low-stock-text)] border-[var(--low-stock-border)]",
                    icon: AlertTriangle,
                }
                : {
            label: en.inventory.stockLooksHealthy,
                    tone: "bg-[var(--all-inventory)] text-[var(--all-inventory-text)] border-[var(--all-inventory-border)]",
                    icon: Package2,
                }

    const StatusIcon = stockStatus.icon
    const cardClass = "rounded-xl sm:rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-3 sm:p-4 shadow-[var(--shadow-card)]"
    const criticalThreshold = product.criticalStockThreshold ?? STOCK_THRESHOLDS.criticalMax
    const lowThreshold = product.lowStockThreshold ?? STOCK_THRESHOLDS.lowMax

    const stats = [
        {
            label: en.inventory.totalIn,
            value: formatQuantity(totalInQty, product.quantityUnit),
            sub: totalInValue > 0 ? `${en.common.rupeeSymbol} ${totalInValue.toLocaleString("en-IN")} ${en.inventory.receivedSuffix}` : null,
            icon: TrendingUp,
            tone: "text-[var(--all-inventory-text)] bg-[var(--all-inventory)]",
        },
        {
            label: en.inventory.productManagement.availableNow,
            value: formatQuantity(product.quantity, product.quantityUnit),
            sub: en.inventory.currentlyAvailable,
            icon: Package2,
            tone: "text-[var(--all-inventory-text)] bg-[var(--all-inventory)]",
        },
        {
            label: en.inventory.totalOut,
            value: formatQuantity(totalOutQty, product.quantityUnit),
            sub: soldQty > 0
                ? `${formatQuantity(soldQty, product.quantityUnit)} ${en.inventory.soldSuffix}${nonSaleOutQty > 0 ? `, ${formatQuantity(nonSaleOutQty, product.quantityUnit)} ${en.inventory.adjustedSuffix}` : ""}`
                : nonSaleOutQty > 0
                    ? `${formatQuantity(nonSaleOutQty, product.quantityUnit)} ${en.inventory.adjustedSuffix}`
                    : null,
            icon: TrendingDown,
            tone: "text-[var(--out-stock-text)] bg-[var(--out-stock)]",
        },
        {
            label: en.inventory.currentInventoryValue,
            value: inventoryValue > 0 ? `${en.common.rupeeSymbol} ${inventoryValue.toLocaleString("en-IN")}` : "-",
            sub: product.quantity > 0
                ? `${formatQuantity(product.quantity, product.quantityUnit)} x ${en.common.rupeeSymbol} ${Number(product.price).toLocaleString("en-IN")}`
                : null,
            icon: IndianRupee,
            tone: "text-[var(--all-inventory-text)] bg-[var(--all-inventory)]",
        },
        {
            label: en.inventory.profit,
            value: soldQty > 0
                ? `${netProfit >= 0 ? "+" : ""}${en.common.rupeeSymbol} ${Math.round(netProfit).toLocaleString("en-IN")}`
                : "-",
            sub: soldQty > 0
                ? netProfit >= 0 ? en.inventory.profitFromSales : en.inventory.lossOnSales
                : en.inventory.noSalesYet,
            icon: IndianRupee,
            tone: soldQty > 0
                ? netProfit >= 0
                    ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20"
                    : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
                : "text-[var(--all-inventory-text)] bg-[var(--all-inventory)]",
        },
        {
            label: en.inventory.nearestExpiry,
            value: nearestExpiry,
            sub: null,
            icon: CalendarClock,
            tone: "text-[var(--all-inventory-text)] bg-[var(--all-inventory)]",
        },
    ] as const

    return (
        <div className="space-y-4 sm:space-y-5">
            <div className="overflow-hidden rounded-2xl sm:rounded-[28px]">
                <div className="border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 shadow-[var(--shadow-card)] sm:p-6 md:flex md:items-center md:justify-between">
                    <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold sm:text-xl">{product.name}</h3>
                        <div className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${stockStatus.tone}`}>
                            <StatusIcon size={14} />
                            {stockStatus.label}
                        </div>
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--border-card)] bg-[var(--bg-input)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                            <Layers3 size={13} />
                            {movementSignal}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 sm:gap-3 md:mt-0">
                        <Button
                            onClick={onEditProduct}
                            title={en.inventory.editItem}
                            icon={<Pencil size={16} />}
                            variant="secondary"
                            className="w-full text-xs sm:w-auto sm:text-sm"
                        />
                        <Button
                            onClick={() => setModal("in")}
                            title={en.inventory.stockInTitle}
                            icon={<TrendingUp size={16} />}
                            variant="success"
                            className="w-full text-xs sm:w-auto sm:text-sm"
                        />
                        <Button
                            onClick={() => setModal("out")}
                            title={en.inventory.removeStock}
                            icon={<TrendingDown size={16} />}
                            variant="danger"
                            className="w-full text-xs sm:w-auto sm:text-sm"
                        />
                        <Button
                            onClick={onDeleteProduct}
                            title={en.inventory.deleteItem}
                            icon={<Trash2 size={16} />}
                            variant="danger"
                            className="w-full text-xs sm:w-auto sm:text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-zinc-400/40 bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-4">
                    <InfoMiniCard icon={ScanBarcode} label={en.inventory.codeLabel} value={product.sku || "-"} className={cardClass} />
                    <InfoMiniCard icon={Truck} label={en.inventory.supplierLabel} value={product.supplier || "-"} className={cardClass} />
                    <InfoMiniCard
                        icon={AlertTriangle}
                        label={en.inventory.warningLevels}
                        value={`${en.inventory.critical} ${criticalThreshold} / ${en.inventory.low} ${lowThreshold}`}
                        className={cardClass}
                    />

                    {stats.map((stat) => (
                        <div key={stat.label} className={cardClass}>
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-[var(--text-secondary)] sm:text-sm">{stat.label}</p>
                                    <p className="mt-1 truncate text-base font-bold sm:text-xl">
                                        {stat.value}
                                    </p>
                                    {stat.sub && (
                                        <p className="mt-0.5 truncate text-[11px] text-[var(--text-secondary)]">
                                            {stat.sub}
                                        </p>
                                    )}
                                </div>
                                <div className={`ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${stat.tone}`}>
                                    <stat.icon size={16} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-zinc-400/40 bg-[var(--bg-card-strong)] p-4 sm:p-5">
                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--text-primary)]">{en.inventory.stockByExpiry}</h4>
                            <p className="text-xs text-[var(--text-secondary)]">
                                {en.inventory.stockByExpiryHelp}
                            </p>
                        </div>
                        <span className="w-fit rounded-full border border-[var(--border-card)] bg-[var(--bg-input)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                            {activeExpiryBatches.length} {en.inventory.batchesSuffix}
                        </span>
                    </div>

                    {activeExpiryBatches.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--surface-primary)] px-4 py-5 text-sm text-[var(--text-secondary)]">
                            {en.inventory.noExpiryWiseStock}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {activeExpiryBatches.map((batch) => (
                                <div key={batch.expiry} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-card)]">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{en.inventory.expiryDate}</p>
                                            <p className="mt-1 font-bold text-[var(--text-primary)]">{batch.expiry}</p>
                                        </div>
                                        <CalendarClock size={17} className="text-amber-500" />
                                    </div>
                                    <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 text-xs">
                                        <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] px-3 py-2">
                                            <p className="text-[var(--text-secondary)]">{en.inventory.availableLabel}</p>
                                            <p className="mt-1 font-semibold text-[var(--text-primary)]">
                                                {formatQuantity(batch.quantity, product.quantityUnit)}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] px-3 py-2">
                                            <p className="text-[var(--text-secondary)]">{en.inventory.avgRate}</p>
                                            <p className="mt-1 font-semibold text-[var(--text-primary)]">
                                                {en.common.rupeeSymbol} {Math.round(batch.avgPrice).toLocaleString("en-IN")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function InfoMiniCard({
    icon: Icon,
    label,
    value,
    className,
}: {
    icon: LucideIcon
    label: string
    value: string
    className?: string
}) {
    return (
        <div className={className}>
            <div className="flex items-center justify-between">
                <div className="min-w-0">
                    <p className="text-xs text-[var(--text-secondary)] sm:text-sm">{label}</p>
                    <p className="mt-1 truncate text-base font-bold sm:text-xl">{value || "-"}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--btn-primary)]/10 text-[var(--btn-primary)] sm:h-11 sm:w-11">
                    <Icon size={16} />
                </div>
            </div>
        </div>
    )
}
