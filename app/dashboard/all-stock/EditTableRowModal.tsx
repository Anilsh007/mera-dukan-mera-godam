"use client"

import { useEffect, useMemo, useState } from "react"
import { TableItem } from "@/app/components/utility/CommonTable"
import Button from "@/app/components/utility/Button"
import Input from "@/app/components/utility/CommonInput"

type Props = {
  open: boolean
  item: TableItem | null
  onClose: () => void
  onSave: (item: TableItem) => void
}

type EditableKey =
  | "name"
  | "category"
  | "supplier"
  | "expiry"
  | "price"
  | "quantity"
  | "createdAt"
  | "note"

type FieldConfig = {
  key: EditableKey
  label: string
  placeholder: string
  type?: "text" | "number"
  full?: boolean
}

const emptyForm: TableItem = { id: undefined, name: "", category: "", supplier: "", expiry: "", price: 0, quantity: 0, createdAt: "", note: "", }

const fields: FieldConfig[] = [
  { key: "name", label: "Product", placeholder: "Enter product name" },
  { key: "category", label: "Type / Category", placeholder: "Type / Category" },
  { key: "supplier", label: "Supplier / Reason", placeholder: "Enter supplier or reason" },
  { key: "expiry", label: "Expiry", placeholder: "DD MMM YYYY" },
  { key: "price", label: "Price", placeholder: "Enter price", type: "number" },
  { key: "quantity", label: "Quantity", placeholder: "Enter quantity", type: "number" },
  { key: "createdAt", label: "Date & Time", placeholder: "Enter date/time" },
  { key: "note", label: "Note", placeholder: "Enter note", full: true },
]

export default function EditTableRowModal({ open, item, onClose, onSave, }: Props) {
  const [form, setForm] = useState<TableItem>(emptyForm)

  useEffect(() => {
    if (!item) return
    setForm({
      id: item.id,
      name: item.name || "",
      category: item.category || "",
      supplier: item.supplier || "",
      expiry: item.expiry || "",
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 0),
      createdAt: item.createdAt || "",
      note: item.note || "",
    })
  }, [item])

  const total = useMemo(
    () => (Number(form.price) || 0) * (Number(form.quantity) || 0),
    [form.price, form.quantity]
  )

  if (!open || !item) return null

  const handleChange = (key: EditableKey, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: key === "price" || key === "quantity" ? Number(value) : value,
    }))
  }

  const handleSave = () => {
    onSave({
      ...form,
      price: Number(form.price || 0),
      quantity: Number(form.quantity || 0),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-5 shadow-[var(--shadow-card)]" onClick={(e) => e.stopPropagation()} >
        <div className="mb-5 flex items-start justify-between gap-4">
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {form.name || "Selected record"}
          </p>
          <Button variant="danger" icon="✕" onClick={onClose} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className={field.full ? "sm:col-span-2" : ""}>
              <Input label={field.label} type={field.type || "text"} value={String(form[field.key] ?? "")} onChange={(e) => handleChange(field.key, e.target.value)} placeholder={field.placeholder} />
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-4 py-2">
            <p className="text-xs text-[var(--text-secondary)]">Total</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              ₹{total.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button title="Cancel" variant="outline" onClick={onClose} />
            <Button title="Save Changes" variant="success" onClick={handleSave} />
          </div>
        </div>
      </div>
    </div>
  )
}