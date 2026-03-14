"use client"

import { useState } from "react"
import useAddProduct from "./useAddProduct"
import Button from "@/app/components/utility/Button"
import { MdOutlineAddchart, MdAdd, MdDeleteOutline } from "react-icons/md"
import Input from "@/app/components/utility/CommonInput"
import { CiWarning } from "react-icons/ci"

type ProductRow = {
    id: string
    name: string
    price: string
    quantity: string
    category: string
}

const createEmptyRow = (): ProductRow => ({
    id: Math.random().toString(36).substr(2, 9),
    name: "",
    price: "",
    quantity: "",
    category: ""
})

/* INPUT CONFIG */
const productInputs = [
    { name: "name", placeholder: "Product Name", type: "text", col: "md:col-span-3" },
    { name: "category", placeholder: "Category", type: "text", col: "md:col-span-2" },
    { name: "price", placeholder: "Price per item", type: "number", col: "md:col-span-2" },
    { name: "quantity", placeholder: "Qty", type: "number", col: "md:col-span-2" }
]

export default function AddProductForm() {

    const { createProduct } = useAddProduct()
    const [rows, setRows] = useState<ProductRow[]>([createEmptyRow()])
    const [loading, setLoading] = useState(false)

    const grandTotal = rows.reduce((sum, row) =>
        sum + (Number(row.price) || 0) * (Number(row.quantity) || 0), 0
    )

    const addRow = () => setRows([...rows, createEmptyRow()])

    const removeRow = (id: string) => {
        if (rows.length > 1) {
            setRows(rows.filter(r => r.id !== id))
        }
    }

    const handleChange = (id: string, name: string, value: string) => {
        setRows(prev =>
            prev.map(row =>
                row.id === id ? { ...row, [name]: value } : row
            )
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            for (const row of rows) {
                await createProduct(
                    { ...row, name: row.name.trim() },
                    () => { }
                )
            }
            setRows([createEmptyRow()])
        } finally {
            setLoading(false)
        }
    }

    const isFormValid = rows.every(
        row => row.name.trim() && row.price && row.quantity
    )

    return (
        <form onSubmit={handleSubmit} className="p-5 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl shadow-2xl overflow-hidden" >

            {/* Table Body */}
            <div className=" overflow-y-auto custom-scrollbar">

                {rows.map((row, index) => (

                    <div key={row.id} className="group grid grid-cols-1 md:grid-cols-12 gap-4 pt-5">

                        {/* Row Number */}
                        <div className=" md:flex md:col-span-1 justify-center">
                            <span className="w-8 h-8 rounded-full border text-slate-500 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                        </div>

                        {/* Dynamic Inputs */}
                        {productInputs.map((input) => (

                            <div key={input.name} className={input.col}>
                                <Input type={input.type} placeholder={input.placeholder} value={(row as any)[input.name]}
                                    onChange={(e) =>
                                        handleChange(
                                            row.id,
                                            input.name,
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                        ))}

                        {/* Row Result & Action */}
                        <div className="md:col-span-2 flex items-center justify-end gap-4">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Subtotal</p>

                                <p className="font-bold text-slate-700">₹{(Number(row.price) * Number(row.quantity)).toLocaleString()}</p>
                            </div>

                            {rows.length > 1 && (
                                <Button type="button" onClick={() => removeRow(row.id)} icon={<MdDeleteOutline />} variant="delete" />
                            )}
                        </div>

                    </div>

                ))}

                <div className="float-right mt-5 mr-5">
                    <Button type="button" title="Add Another Product" onClick={addRow} variant="dotBorder" icon={<MdAdd />} />
                </div>

            </div>  
            
            <div className="mt-5 border-t border-[var(--border-card)]">

                <p className="flex item-center gap-1 text-sm text-rose-400 pb-2"><CiWarning size={20} />Review your items before adding them to the inventory. Once added, stock will be updated instantly.</p>

                <div className="flex flex-col flex-row items-center justify-between gap-6">

                    <div className="">
                        <p className="text-xs font-bold text-slate-400 uppercase">Grand Total</p>

                        <p className="text-2xl font-black">₹{grandTotal.toLocaleString('en-IN')}</p>
                    </div>

                    <Button type="submit" title={loading ? "Saving Inventory..." : `Complete Entry (${rows.length} Items)`} variant="primary" disabled={loading || !isFormValid} icon={<MdOutlineAddchart />} />

                </div>

            </div>

        </form>
    )
}