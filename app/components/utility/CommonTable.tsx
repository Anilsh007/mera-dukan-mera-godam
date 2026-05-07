"use client"

import Button from "@/app/components/utility/Button"
import { getStockLevel } from "@/app/lib/inventory.utils"

export interface TableItem {
    id?: string | number
    name?: string
    category?: string
    supplier?: string
    expiry?: string
    price?: number
    quantity?: number
    quantityUnit?: string
    createdAt?: string
    note?: string
}

type Props = {
    data: TableItem[]
    onEdit?: (item: TableItem) => void

    // for print
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

// Already-formatted strings (from StockHistoryTabs) ko dobara parse mat karo
function smartDate(val?: string) {
    if (!val || val === "-") return "-"
    const d = new Date(val)
    if (isNaN(d.getTime())) return val  // already a human-readable string
    return d.toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
    })
}

function ExpiryCell({ val }: { val?: string }) {
    if (!val || val === "-") return <span className="text-[var(--text-muted)]">—</span>
    const d = new Date(val)
    const now = new Date()
    const days = Math.ceil((d.getTime() - now.getTime()) / 86400000)
    if (isNaN(d.getTime())) return <span>{val}</span>
    const cls = days < 0 ? "text-red-500 font-semibold" : days <= 30 ? "text-amber-500 font-medium" : "text-[var(--text-secondary)]"
    const label = days < 0 ? `${val} (Expired)` : days <= 30 ? `${val} (${days}d)` : val
    return <span className={cls}>{label}</span>
}

function QtyCell({ qty, unit }: { qty?: number; unit?: string }) {
    const q = qty ?? 0
    const stockLevel = getStockLevel(q)
    const dot = stockLevel === "out" ? "bg-red-500" : stockLevel === "critical" ? "bg-red-400" : stockLevel === "low" ? "bg-amber-400" : "bg-emerald-500"
    const txt = stockLevel === "out" ? "text-red-500 font-semibold" : stockLevel === "critical" || stockLevel === "low" ? "text-amber-600" : "text-[var(--text-primary)]"
    return (
        <span className={`inline-flex items-center gap-1.5 ${txt}`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
            {q} {unit || "pcs"}
        </span>
    )
}

const COLS = [
    { key: "name", label: "Product" },
    { key: "category", label: "Type / Category" },
    { key: "supplier", label: "Supplier / Reason" },
    { key: "expiry", label: "Expiry" },
    { key: "price", label: "Price" },
    { key: "quantity", label: "Qty" },
    { key: "total", label: "Total" },
    { key: "createdAt", label: "Date & Time" },
    { key: "note", label: "Note" },
] as const

export default function TableComponent({
    data,
    onEdit,
    showSelection,
    selectedIds,
    onToggleSelect,
    onSelectAll,
    showActions = false,
    actionLabel = "Edit",
    minWidth = 780,
}: Props) {
    if (data.length === 0) {
        return (
            <div className="py-14 text-center text-[var(--text-muted)]">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm">No records found</p>
            </div>
        )
    }

    return (
        <div className="w-full rounded-xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl shadow-[var(--shadow-card)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm" style={{ minWidth }}>

                    <thead className="bg-black/5 dark:bg-white/5">
                        <tr className="border-b border-[var(--border-card)]">
                            {showSelection && (
                                <th className="w-12 p-4 text-center">
                                    <input type="checkbox" checked={selectedIds?.size === data.length && data.length > 0} onChange={onSelectAll} className="w-4 h-4 cursor-pointer" />
                                </th>
                            )}
                            {COLS.map(c => (
                                <th key={c.key} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] whitespace-nowrap">
                                    {c.label}
                                </th>
                            ))}
                            {showActions && (
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Action</th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-[var(--border-card)]">
                        {data.map((item, i) => {
                            const total = (item.price ?? 0) * (item.quantity ?? 0)
                            const rowId = getRowId(item, i)
                            return (
                                <tr key={rowId} className={selectedIds?.has(rowId) ? 'bg-[var(--selected-row)]' : 'hover:bg-emerald-50/40 dark:hover:bg-emerald/[0.03] transition-colors'}>

                                    {showSelection && (
                                        <td className="p-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds?.has(rowId) || false}
                                                onChange={() => onToggleSelect?.(rowId)}
                                                className="w-4 h-4 cursor-pointer"
                                            />
                                        </td>
                                    )}
                                    {/* Product name */}
                                    <td className="px-4 py-3 whitespace-nowrap font-medium capitalize text-[var(--text-primary)]">
                                        {item.name || "—"}
                                    </td>

                                    {/* Type / Category */}
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {item.category}
                                    </td>

                                    {/* Supplier / Reason */}
                                    <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                                        {item.supplier && item.supplier !== "-" ? item.supplier : <span className="text-[var(--text-muted)]">—</span>}
                                    </td>

                                    {/* Expiry */}
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <ExpiryCell val={item.expiry} />
                                    </td>

                                    {/* Price */}
                                    <td className="px-4 py-3 whitespace-nowrap font-medium text-[var(--text-primary)]">
                                        ₹{Number(item.price ?? 0).toLocaleString("en-IN")}
                                    </td>

                                    {/* Quantity */}
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <QtyCell qty={item.quantity} unit={item.quantityUnit} />
                                    </td>

                                    {/* Total */}
                                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-emerald-600 dark:text-emerald-400">
                                        ₹{total.toLocaleString("en-IN")}
                                    </td>

                                    {/* Date */}
                                    <td className="px-4 py-3 text-xs text-[var(--text-muted)] whitespace-nowrap">
                                        {smartDate(item.createdAt)}
                                    </td>

                                    {/* Note */}
                                    <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[140px]">
                                        <span className="block truncate" title={item.note}>
                                            {item.note && item.note !== "-" ? item.note : <span className="text-[var(--text-muted)]">—</span>}
                                        </span>
                                    </td>

                                    {showActions && (
                                        <td className="px-4 py-3 whitespace-nowrap">
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
