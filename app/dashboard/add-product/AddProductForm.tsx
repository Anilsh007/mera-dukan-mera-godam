"use client"

import { useState } from "react"
import { addProduct } from "./product.service"
import useProducts from "../all-stock/useProducts"
import Button from "@/app/components/utility/Button"
import { MdOutlineAddchart, MdAdd, MdDeleteOutline } from "react-icons/md"
import Input from "@/app/components/utility/CommonInput"
import { CiWarning } from "react-icons/ci"
import { toast } from "sonner"
import Suggestions from "./Suggestions"
import SuccessReceipt from "@/app/components/utility/SuccessReceipt"
import { autoSyncToSupabase } from "@/app/lib/autoSupabaseSync.service"
import { DEFAULT_QUANTITY_UNIT, QUANTITY_UNITS } from "@/app/lib/quantityUnit"
import { auth } from "@/app/lib/firebase"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"

type ProductRow = {
    id: string; name: string; price: string; quantity: string; quantityUnit: string
    category: string; supplier: string; expiry: string; note: string; sku: string
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
    sku: ""
});

const FIELDS = [
    { key: "name", label: <>Product Name <span className="text-red-500">*</span></>, required: true, type: "text", placeholder: "Enter product name", datalist: "productNames", cols: "col-span-2 sm:col-span-1 lg:col-span-1" },
    { key: "category", label: "Category", required: false, type: "text", placeholder: "Enter category", datalist: "categories", cols: "col-span-2 sm:col-span-1" },
    { key: "expiry", label: <>Expiry Date <span className="text-red-500">*</span></>, required: true, type: "date", placeholder: "", datalist: undefined, cols: "col-span-2 sm:col-span-1" },
    { key: "sku", label: "SKU", required: false, type: "text", placeholder: "Enter SKU", datalist: undefined, cols: "col-span-1 sm:col-span-1" },
    { key: "price", label: <>Price/unit <span className="text-red-500">*</span></>, required: true, type: "number", placeholder: "Enter price", datalist: undefined, cols: "col-span-1" },
    { key: "quantity", label: <>Quantity <span className="text-red-500">*</span></>, required: true, type: "quantity", placeholder: "Quantity", datalist: undefined, cols: "col-span-1" },
    { key: "supplier", label: <>Supplier <span className="text-red-500">*</span></>, required: true, type: "text", placeholder: "Enter supplier", datalist: "suppliers", cols: "col-span-2 sm:col-span-1" },
    { key: "note", label: "Note", required: false, type: "text", placeholder: "Add note (optional)", datalist: undefined, cols: "col-span-2 sm:col-span-2 lg:col-span-1" },
]

export default function AddProductForm() {
    const { products } = useProducts()
    const [rows, setRows] = useState<ProductRow[]>([createEmptyRow()])
    const [loading, setLoading] = useState(false)
    const [submittedData, setSubmittedData] = useState<ProductRow[] | null>(null)

    const addRow = () => setRows(r => [...r, createEmptyRow()])
    const removeRow = (id: string) => rows.length > 1 && setRows(r => r.filter(x => x.id !== id))

    const handleChange = (id: string, key: keyof ProductRow, value: string) =>
        setRows(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row))

    const grandTotal = rows.reduce((s, r) => s + (Number(r.price) || 0) * (Number(r.quantity) || 0), 0)

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
            for (const row of rows) {
                await addProduct({
                    name: row.name.trim(),
                    price: Number(row.price),
                    quantity: Number(row.quantity),
                    quantityUnit: row.quantityUnit,
                    category: row.category,
                    supplier: row.supplier,
                    expiry: row.expiry,
                    note: row.note,
                    sku: row.sku,
                    userId,
                }, { skipImmediateSync: true })
            }
            await autoSyncToSupabase()
            toast.success(`✅ ${rows.length} product${rows.length > 1 ? "s" : ""} It will be added to your stock list.`)
            setRows([createEmptyRow()])
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

                <p className="flex justify-end text-xs text-rose-400 font-medium mb-4">* Required fields are necessary to submit the form</p>

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
                                        {row.name ? row.name : "Naya Product"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {(Number(row.price) > 0 && Number(row.quantity) > 0) && (
                                        <div className="text-right">
                                            <p className="text-[10px] text-[var(--text-muted)] uppercase">Subtotal</p>
                                            <p className="font-bold text-emerald-600 text-sm">
                                                ₹{((Number(row.price)) * (Number(row.quantity))).toLocaleString("en-IN")}
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
                    <Button type="button" title="+ Ek aur product" onClick={addRow} variant="dotBorder" icon={<MdAdd />} />
                </div>

                {/* Footer */}
                <div className="mt-5 pt-5 border-t border-[var(--border-card)]">
                    <p className="flex items-center gap-2 text-sm text-rose-400 mb-4">
                        <CiWarning size={18} /> Submit se pehle data check kar lo.
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs text-[var(--text-muted)] uppercase font-medium">Grand Total</p>
                            <p className="text-2xl font-black text-emerald-600">₹{grandTotal.toLocaleString("en-IN")}</p>
                        </div>
                        <Button type="submit" title={`Entry Complete Karo (${rows.length})`} variant="primary" disabled={loading || !isFormValid} loading={loading} icon={<MdOutlineAddchart />} />
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
