"use client"

import Button from "@/app/components/ui/Button"
import StatusBadge from "@/app/components/ui/StatusBadge"
import { getStockLevel } from "@/app/lib/inventory.utils"
import { en } from "@/app/messages/en"

export interface TableItem {
    id?: string | number
    name?: string
    category?: string
    supplier?: string
    expiry?: string
    price?: number
    quantity?: number
    quantityUnit?: string
    lowStockThreshold?: number
    criticalStockThreshold?: number
    createdAt?: string
    note?: string
}

type Props = {
    data: TableItem[]
    onEdit?: (item: TableItem) => void
    showSelection?: boolean
    selectedIds?: Set<string | number>
    onToggleSelect?: (id: string | number) => void
    onSelectAll?: () => void
    onPrintRow?: (row: TableItem) => void
    showActions?: boolean
    actionLabel?: string
    minWidth?: number
}

function getRowId(item: TableItem, index: number) {
    return item.id ?? `row-${index}`
}

function smartDate(val?: string) {
    if (!val || val === "-") return "-"
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return val
    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    })
}

function ExpiryCell({ val }: { val?: string }) {
    if (!val || val === "-") return <span className="text-[var(--text-muted)]">-</span>
    const d = new Date(val)
    const now = new Date()
    const days = Math.ceil((d.getTime() - now.getTime()) / 86400000)
    if (Number.isNaN(d.getTime())) return <span>{val}</span>
    const tone = days < 0 ? "danger" : days <= 30 ? "warning" : "neutral"
    const label = days < 0 ? `${val} ${en.inventory.batchExpired}` : days <= 30 ? `${val} (${days} ${en.reports.daysLeftSuffix})` : val
    return <StatusBadge tone={tone}>{label}</StatusBadge>
}

function QtyCell({
    qty,
    unit,
    lowStockThreshold,
    criticalStockThreshold,
}: {
    qty?: number
    unit?: string
    lowStockThreshold?: number
    criticalStockThreshold?: number
}) {
    const q = qty ?? 0
    const stockLevel = getStockLevel(q, {
        lowMax: lowStockThreshold,
        criticalMax: criticalStockThreshold,
    })
    const dot = stockLevel === "out" ? "bg-red-500" : stockLevel === "critical" ? "bg-red-400" : stockLevel === "low" ? "bg-amber-400" : "bg-emerald-500"
    const txt = stockLevel === "out" ? "font-semibold text-red-500" : stockLevel === "critical" || stockLevel === "low" ? "text-amber-600" : "text-[var(--text-primary)]"
    return (
        <span className={`inline-flex items-center gap-1.5 ${txt}`}>
            <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
            {q} {unit || en.inventory.defaultUnitPcs}
        </span>
    )
}

const COLS = [
    { key: "name", label: en.stockHistory.labels.product },
    { key: "supplier", label: en.stockHistory.labels.supplierReason },
    { key: "expiry", label: en.inventory.expiry },
    { key: "price", label: en.inventory.rateLabel },
    { key: "quantity", label: en.stockHistory.labels.qty },
    { key: "total", label: en.reports.total },
    { key: "createdAt", label: en.stockHistory.labels.date },
    { key: "note", label: en.stockHistory.labels.note },
] as const

export default function TableComponent({
    data,
    onEdit,
    showSelection,
    selectedIds,
    onToggleSelect,
    onSelectAll,
    showActions = false,
    actionLabel = en.common.edit,
    minWidth = 780,
}: Props) {
    if (data.length === 0) {
        return (
            <div className="py-14 text-center text-[var(--text-muted)]">
                <p className="text-sm">{en.emptyStates.noEntries}</p>
            </div>
        )
    }

    return (
        <div className="premium-surface w-full overflow-hidden rounded-xl">
            <div className="mobile-safe-table">
                <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
                    <thead className="bg-[var(--surface-subtle)]">
                        <tr className="border-b border-[var(--border-card)]">
                            {showSelection && (
                                <th className="w-12 p-4 text-center">
                                    <input type="checkbox" checked={selectedIds?.size === data.length && data.length > 0} onChange={onSelectAll} className="h-4 w-4 cursor-pointer" />
                                </th>
                            )}
                            {COLS.map((column) => (
                                <th key={column.key} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                                    {column.label}
                                </th>
                            ))}
                            {showActions && (
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{en.gstInvoice.action}</th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-[var(--border-card)]">
                        {data.map((item, index) => {
                            const total = (item.price ?? 0) * (item.quantity ?? 0)
                            const rowId = getRowId(item, index)
                            return (
                                <tr key={rowId} className={selectedIds?.has(rowId) ? "bg-[var(--selected-row)]" : "transition-colors hover:bg-[var(--surface-subtle)]"}>
                                    {showSelection && (
                                        <td className="p-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds?.has(rowId) || false}
                                                onChange={() => onToggleSelect?.(rowId)}
                                                className="h-4 w-4 cursor-pointer"
                                            />
                                        </td>
                                    )}

                                    <td className="whitespace-nowrap px-4 py-3 font-medium capitalize text-[var(--text-primary)]">
                                        {item.name || "-"}
                                    </td>

                                    <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">
                                        {item.supplier && item.supplier !== "-" ? item.supplier : <span className="text-[var(--text-muted)]">-</span>}
                                    </td>

                                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                                        <ExpiryCell val={item.expiry} />
                                    </td>

                                    <td className="whitespace-nowrap px-4 py-3 font-medium text-[var(--text-primary)]">
                                        {en.common.rupeeSymbol} {Number(item.price ?? 0).toLocaleString("en-IN")}
                                    </td>

                                    <td className="whitespace-nowrap px-4 py-3">
                                        <QtyCell
                                            qty={item.quantity}
                                            unit={item.quantityUnit}
                                            lowStockThreshold={item.lowStockThreshold}
                                            criticalStockThreshold={item.criticalStockThreshold}
                                        />
                                    </td>

                                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                                        {en.common.rupeeSymbol} {total.toLocaleString("en-IN")}
                                    </td>

                                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--text-muted)]">
                                        {smartDate(item.createdAt)}
                                    </td>

                                    <td className="max-w-[140px] px-4 py-3 text-[var(--text-secondary)]">
                                        <span className="block truncate" title={item.note}>
                                            {item.note && item.note !== "-" ? item.note : <span className="text-[var(--text-muted)]">-</span>}
                                        </span>
                                    </td>

                                    {showActions && (
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <Button title={actionLabel} variant="outline" onClick={() => onEdit?.(item)} />
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
