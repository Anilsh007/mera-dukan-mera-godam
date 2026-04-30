"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import Button from "@/app/components/utility/Button"
import Input from "@/app/components/utility/CommonInput"
import { Product } from "@/app/lib/db"
import {
  deleteProductWithLogs,
  updateProductDetails,
} from "@/app/dashboard/add-product/product.service"

type Props = {
  open: boolean
  mode: "edit" | "delete"
  product: Product | null
  historyCount: number
  onClose: () => void
  onSaved: (message: string) => void
}

type FormState = {
  name: string
  category: string
  supplier: string
  expiry: string
  price: string
  sku: string
  note: string
}

const emptyForm: FormState = {
  name: "",
  category: "",
  supplier: "",
  expiry: "",
  price: "",
  sku: "",
  note: "",
}

export default function ProductManagementModal({
  open,
  mode,
  product,
  historyCount,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!product) return

    setForm({
      name: product.name || "",
      category: product.category || "",
      supplier: product.supplier || "",
      expiry: product.expiry || "",
      price: String(product.price ?? ""),
      sku: product.sku || "",
      note: product.note || "",
    })
  }, [product])

  const inventoryValue = useMemo(() => {
    const price = Number(form.price || 0)
    return price * Number(product?.quantity || 0)
  }, [form.price, product?.quantity])

  if (!open || !product) return null

  const setField = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Product name required hai")
    if (!form.price || Number(form.price) < 0) return toast.error("Valid price dalo")

    try {
      setLoading(true)
      await updateProductDetails({
        productId: product.id,
        name: form.name,
        price: Number(form.price),
        category: form.category,
        supplier: form.supplier,
        expiry: form.expiry,
        sku: form.sku,
        note: form.note,
      })
      toast.success("Product details update ho gaye")
      onSaved("Product details saved successfully.")
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setLoading(true)
      await deleteProductWithLogs(product.id)
      toast.success("Product aur uski history delete ho gayi")
      onSaved("Product and related history deleted.")
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        {mode === "edit" ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Product Management
                </p>
                <h3 className="mt-1 text-xl font-bold text-[var(--text-primary)]">Edit product details</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Yahan master product info update karo. Quantity correction history entries se karo taaki audit trail safe rahe.
                </p>
              </div>
              <Button variant="ghost" title="Close" onClick={onClose} />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Product name" value={form.name} onChange={(e) => setField("name", e.target.value)} />
              <Input label="Category" value={form.category} onChange={(e) => setField("category", e.target.value)} />
              <Input label="Supplier" value={form.supplier} onChange={(e) => setField("supplier", e.target.value)} />
              <Input label="SKU" value={form.sku} onChange={(e) => setField("sku", e.target.value)} />
              <Input label="Expiry date" type="date" value={form.expiry} onChange={(e) => setField("expiry", e.target.value)} />
              <Input label="Default price" type="number" min={0} value={form.price} onChange={(e) => setField("price", e.target.value)} />
              <Input
                label="Product note"
                value={form.note}
                onChange={(e) => setField("note", e.target.value)}
                containerClassName="sm:col-span-2"
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 sm:grid-cols-3">
              <InfoChip label="Current Qty" value={String(product.quantity)} />
              <InfoChip label="History Entries" value={String(historyCount)} />
              <InfoChip label="Inventory Value" value={`Rs ${inventoryValue.toLocaleString("en-IN")}`} />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button title="Cancel" variant="outline" onClick={onClose} />
              <Button title="Save Product" variant="success" loading={loading} onClick={handleSave} />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500">
                  Delete Product
                </p>
                <h3 className="mt-1 text-xl font-bold text-[var(--text-primary)]">{product.name}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Ye action product, current stock aur uski poori history permanently hata dega.
                </p>
              </div>
              <Button variant="ghost" title="Close" onClick={onClose} />
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
              <p>Current quantity: <b>{product.quantity}</b></p>
              <p>History entries: <b>{historyCount}</b></p>
              <p>Delete tab ke through ki gayi removal sync me bhi reflect hogi.</p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button title="Cancel" variant="outline" onClick={onClose} />
              <Button title="Delete Product" variant="danger" loading={loading} onClick={handleDelete} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  )
}
