"use client"

import { useEffect, useState } from "react"
import useProducts from "@/app/hooks/useProducts"
import Button from "@/app/components/ui/Button"
import { MdOutlineAddchart, MdAdd, MdDeleteOutline } from "react-icons/md"
import Input from "@/app/components/ui/Input"
import { CiWarning } from "react-icons/ci"
import { toast } from "sonner"
import Suggestions from "@/app/components/inventory/ProductDatalists"
import SuccessReceipt from "@/app/components/ui/SuccessReceipt"
import { DEFAULT_QUANTITY_UNIT, QUANTITY_UNITS } from "@/app/lib/quantityUnit"
import { auth } from "@/app/lib/firebase"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { saveQuickPurchase } from "@/app/dashboard/purchases/purchase.service"
import { DEFAULT_PAYMENT_MODE, PAYMENT_MODES, PAYMENT_STATUSES } from "@/app/dashboard/purchases/purchase.constants"
import { calculatePaymentAmounts, formatCurrency } from "@/app/dashboard/purchases/purchase.utils"
import type { PurchasePaymentStatus } from "@/app/lib/db"

type ProductRow = {
    id: string; name: string; price: string; quantity: string; quantityUnit: string
    category: string; supplier: string; expiry: string; note: string; sku: string; hsnCode: string
}

import { v4 as uuidv4 } from "uuid";

const createEmptyRow = (): ProductRow => ({
    id: uuidv4(),
    name: "",
    price: "",
    quantity: "",
    quantityUnit: DEFAULT_QUANTITY_UNIT,
    category: "",
    supplier: "",
    expiry: "",
    note: "",
    sku: "",
    hsnCode: ""
});

const FIELDS = [
    { key: "name", label: <>Product Name <span className="text-red-500">*</span></>, required: true, type: "text", placeholder: "Enter product name", datalist: "productNames", cols: "col-span-2 sm:col-span-1 lg:col-span-1" },
    { key: "category", label: "Category", required: false, type: "text", placeholder: "Enter category", datalist: "categories", cols: "col-span-2 sm:col-span-1" },
    { key: "expiry", label: <>Expiry Date <span className="text-red-500">*</span></>, required: true, type: "date", placeholder: "", datalist: undefined, cols: "col-span-2 sm:col-span-1" },
    { key: "sku", label: "SKU", required: false, type: "text", placeholder: "Enter SKU", datalist: undefined, cols: "col-span-1 sm:col-span-1" },
    { key: "hsnCode", label: "HSN Code", required: false, type: "text", placeholder: "GST HSN code", datalist: undefined, cols: "col-span-1 sm:col-span-1" },
    { key: "price", label: <>Purchase Price/unit <span className="text-red-500">*</span></>, required: true, type: "number", placeholder: "Enter purchase price", datalist: undefined, cols: "col-span-1" },
    { key: "quantity", label: <>Purchased Qty <span className="text-red-500">*</span></>, required: true, type: "quantity", placeholder: "Quantity", datalist: undefined, cols: "col-span-1" },
    { key: "supplier", label: <>Supplier <span className="text-red-500">*</span></>, required: true, type: "text", placeholder: "Enter supplier", datalist: "suppliers", cols: "col-span-2 sm:col-span-1" },
    { key: "note", label: "Note", required: false, type: "text", placeholder: "Add note (optional)", datalist: undefined, cols: "col-span-2 sm:col-span-2 lg:col-span-1" },
]

function getCurrentDateTime() {
    return new Date()
}

function formatCurrentDateTime(value: Date) {
    return value.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    })
}

export default function AddProductForm() {
    const { products } = useProducts()
    const [rows, setRows] = useState<ProductRow[]>([createEmptyRow()])
    const [loading, setLoading] = useState(false)
    const [submittedData, setSubmittedData] = useState<ProductRow[] | null>(null)
    const [quickRef, setQuickRef] = useState("")
    const [paymentStatus, setPaymentStatus] = useState<PurchasePaymentStatus>("paid")
    const [paymentMode, setPaymentMode] = useState(DEFAULT_PAYMENT_MODE)
    const [amountPaid, setAmountPaid] = useState("")
    const [currentDateTime, setCurrentDateTime] = useState(getCurrentDateTime)

    useEffect(() => {
        const interval = window.setInterval(() => {
            setCurrentDateTime(getCurrentDateTime())
        }, 30_000)

        return () => window.clearInterval(interval)
    }, [])

    const addRow = () => setRows(r => [...r, createEmptyRow()])
    const removeRow = (id: string) => rows.length > 1 && setRows(r => r.filter(x => x.id !== id))

    const handleChange = (id: string, key: keyof ProductRow, value: string) =>
        setRows(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row))

    const grandTotal = rows.reduce((s, r) => s + (Number(r.price) || 0) * (Number(r.quantity) || 0), 0)
    const { paidAmount, dueAmount } = calculatePaymentAmounts(grandTotal, paymentStatus, amountPaid)

    const isFormValid = rows.every(row =>
        FIELDS.every(f => !f.required || String(row[f.key as keyof ProductRow]).trim() !== "") &&
        row.quantityUnit.trim() !== ""
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        for (const [i, row] of rows.entries()) {
            for (const f of FIELDS) {
                if (f.required && !String(row[f.key as keyof ProductRow]).trim()) {
                    toast.error(`Row ${i + 1}: ${f.key} required hai`)
                    return
                }
            }
        }
        try {
            setLoading(true)
            const userId = requireUserIdentityFromAuthUser(auth.currentUser)
            const dataToSubmit = [...rows]
            const submittedAt = getCurrentDateTime()
            await saveQuickPurchase({
                userId,
                ref: quickRef,
                purchaseDate: submittedAt.toISOString().slice(0, 10),
                purchaseDateTime: submittedAt.toISOString(),
                paymentStatus,
                paymentMode,
                amountPaid: paidAmount,
                dueAmount,
                items: rows.map((row) => ({
                    name: row.name.trim(),
                    price: Number(row.price),
                    quantity: Number(row.quantity),
                    quantityUnit: row.quantityUnit,
                    category: row.category,
                    supplier: row.supplier,
                    expiry: row.expiry,
                    note: row.note,
                    sku: row.sku,
                    hsnCode: row.hsnCode,
                })),
            })
            toast.success(`${rows.length} quick purchase item${rows.length > 1 ? "s" : ""} stock me add ho gaye`)
            setRows([createEmptyRow()])
            setQuickRef("")
            setPaymentStatus("paid")
            setPaymentMode(DEFAULT_PAYMENT_MODE)
            setAmountPaid("")
            setCurrentDateTime(getCurrentDateTime())
            setSubmittedData(dataToSubmit)
        } catch (err) {
            console.error(err)
            toast.error("Kuch gadbad hui")
        } finally {
            setLoading(false)
        }
    }

    const handleCloseReceipt = () => {
        setSubmittedData(null)
        setRows([createEmptyRow()])
        setQuickRef("")
        setPaymentStatus("paid")
        setPaymentMode(DEFAULT_PAYMENT_MODE)
        setAmountPaid("")
        setCurrentDateTime(getCurrentDateTime())
    }

    const handleAddMore = () => {
        setSubmittedData(null)
        setRows([createEmptyRow()])
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 bg-[var(--bg-card-strong)] backdrop-blur-xl border border-[var(--border-card)] rounded-2xl shadow-[var(--shadow-card)]">

                <Suggestions products={products} type="product" />
                <Suggestions products={products} type="category" />
                <Suggestions products={products} type="supplier" />
                <datalist id="quantityUnits">
                    {QUANTITY_UNITS.map((unit) => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                </datalist>
                <datalist id="paymentModes">
                    {PAYMENT_MODES.map((mode) => (
                        <option key={mode} value={mode} />
                    ))}
                </datalist>

                <div className="mb-5 flex flex-col gap-3 p-4 bg-[var(--bg-card-strong)] backdrop-blur-xl border border-[var(--border-card)] rounded-xl shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold">Quick purchase entry</p>
                        <p className="mt-1 text-xs">Date and time will be automatically saved</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 px-3 py-2 text-left shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">Entry Time</p>
                        <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">{formatCurrentDateTime(currentDateTime)}</p>
                    </div>
                </div>

                <div className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] p-4 md:grid-cols-4">
                    <Input
                        label="Quick Bill/Ref No"
                        placeholder="Optional bill no"
                        value={quickRef}
                        onChange={(event) => setQuickRef(event.target.value)}
                    />
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Payment Status</label>
                        <select
                            value={paymentStatus}
                            onChange={(event) => setPaymentStatus(event.target.value as PurchasePaymentStatus)}
                            className="min-h-10 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-emerald-400"
                        >
                            {PAYMENT_STATUSES.map((status) => (
                                <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Payment Mode"
                        value={paymentMode}
                        onChange={(event) => setPaymentMode(event.target.value)}
                        datalist="paymentModes"
                    />
                    <Input
                        type="number"
                        label="Amount Paid"
                        value={paymentStatus === "paid" ? String(grandTotal || "") : paymentStatus === "unpaid" ? "0" : amountPaid}
                        onChange={(event) => setAmountPaid(event.target.value)}
                        disabled={paymentStatus !== "partial"}
                    />
                    <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-3 py-2 md:col-span-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs font-medium text-[var(--text-secondary)]">
                                Quick purchase added direct to inventory Bill/Ref no. <span className="font-bold text-[var(--text-primary)]">{quickRef || "N/A"}</span>
                            </p>
                            <p className="text-sm font-bold text-emerald-600">
                                Total {formatCurrency(grandTotal)}
                                <span className="text-amber-600"> | Due {formatCurrency(dueAmount)}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <p className="flex justify-end text-xs text-rose-400 font-medium mb-4">* Required fields are necessary to submit quick purchase</p>

                <div className="space-y-5">
                    {rows.map((row, index) => (
                        <div key={row.id} className="border border-[var(--border-card)] rounded-xl p-4 space-y-3">

                            {/* Row header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-[var(--bg-primary)] border border-[var(--border-input)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                                        {row.name ? row.name : "Quick purchase item"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {(Number(row.price) > 0 && Number(row.quantity) > 0) && (
                                        <div className="text-right">
                                            <p className="text-[10px] text-[var(--text-muted)] uppercase">Subtotal</p>
                                            <p className="font-bold text-emerald-600 text-sm">
                                                {formatCurrency((Number(row.price)) * (Number(row.quantity)))}
                                            </p>
                                        </div>
                                    )}
                                    {rows.length > 1 && (
                                        <Button type="button" onClick={() => removeRow(row.id)} icon={<MdDeleteOutline />} variant="delete" />
                                    )}
                                </div>
                            </div>

                            {/* Input grid — CSS grid for better mobile layout */}
                            <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-4">
                                {FIELDS.map(f => (
                                    <div key={f.key} className={f.cols}>
                                        {f.type === "quantity" ? (
                                            <div>
                                                <label className="block mb-1 text-sm font-medium text-[var(--text-primary)]">
                                                    {f.label}
                                                </label>
                                                <div className="flex overflow-hidden rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] focus-within:ring-2 focus-within:ring-emerald-400">
                                                    <input
                                                        type="number"
                                                        placeholder={f.placeholder}
                                                        value={row.quantity}
                                                        onChange={(e) => handleChange(row.id, "quantity", e.target.value)}
                                                        className="min-w-0 flex-1 bg-transparent p-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                                                    />
                                                    <input
                                                        list="quantityUnits"
                                                        aria-label="Quantity unit"
                                                        value={row.quantityUnit}
                                                        onChange={(e) => handleChange(row.id, "quantityUnit", e.target.value)}
                                                        className="w-20 shrink-0 border-l border-[var(--border-input)] bg-transparent p-2 text-sm font-semibold text-[var(--text-primary)] outline-none"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <Input type={f.type} label={f.label} placeholder={f.placeholder} value={row[f.key as keyof ProductRow]} onChange={e => handleChange(row.id, f.key as keyof ProductRow, e.target.value)}
                                                datalist={f.datalist} />
                                        )}
                                    </div>
                                ))}
                            </div>

                        </div>
                    ))}
                </div>

                {/* Add another */}
                <div className="mt-4">
                    <Button type="button" title="Add another item" onClick={addRow} variant="dotBorder" icon={<MdAdd />} />
                </div>

                {/* Footer */}
                <div className="mt-5 pt-5 border-t border-[var(--border-card)]">
                    <p className="flex items-center gap-2 text-sm text-rose-400 mb-4">
                        <CiWarning size={18} /> Quick purchase immediately added to inventory, for full supplier ledger use the Purchases module.</p>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs text-[var(--text-muted)] uppercase font-medium">Purchase Total / Due</p>
                            <p className="text-2xl font-black text-emerald-600">
                                {formatCurrency(grandTotal)}
                                <span className="text-base text-amber-600"> / {formatCurrency(dueAmount)}</span>
                            </p>
                        </div>
                        <Button type="submit" title={`Save Quick Purchase (${rows.length})`} variant="primary" disabled={loading || !isFormValid} loading={loading} icon={<MdOutlineAddchart />} />
                    </div>
                </div>
            </form>

            {submittedData && (
                <SuccessReceipt
                    data={submittedData}
                    onClose={handleCloseReceipt}
                    onAddMore={handleAddMore}
                />
            )}
        </>
    )
}
