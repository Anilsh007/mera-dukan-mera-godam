"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import { Product } from "@/app/lib/db"
import { STOCK_THRESHOLDS } from "@/app/lib/inventory.utils"
import { formatQuantity, normalizeQuantityUnit, QUANTITY_UNITS } from "@/app/lib/quantityUnit"
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
  quantityUnit: string
  sku: string
  hsnCode: string
  note: string
  lowStockThreshold: string
  criticalStockThreshold: string
}

const emptyForm: FormState = {
  name: "",
  category: "",
  supplier: "",
  expiry: "",
  price: "",
  quantityUnit: "pcs",
  sku: "",
  hsnCode: "",
  note: "",
  lowStockThreshold: "",
  criticalStockThreshold: "",
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
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (!product) return

    setForm({
      name: product.name || "",
      category: product.category || "",
      supplier: product.supplier || "",
      expiry: product.expiry || "",
      price: String(product.price ?? ""),
      quantityUnit: normalizeQuantityUnit(product.quantityUnit),
      sku: product.sku || "",
      hsnCode: product.hsnCode || "",
      note: product.note || "",
      lowStockThreshold: product.lowStockThreshold !== undefined ? String(product.lowStockThreshold) : "",
      criticalStockThreshold: product.criticalStockThreshold !== undefined ? String(product.criticalStockThreshold) : "",
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
    if (!form.name.trim()) return toast.error("Please Please enter the item name.")
    if (!form.price || Number(form.price) < 0) return toast.error("Please enter a valid price")
    if (!form.quantityUnit.trim()) return toast.error("Please enter a quantity unit")
    const lowStockThreshold = parseOptionalNumber(form.lowStockThreshold)
    const criticalStockThreshold = parseOptionalNumber(form.criticalStockThreshold)
    if (lowStockThreshold !== undefined && lowStockThreshold < 0) return toast.error("Some value cannot be less than 0")
    if (criticalStockThreshold !== undefined && criticalStockThreshold < 0) return toast.error("Critical stock value cannot be less than 0.")
    if (
      lowStockThreshold !== undefined &&
      criticalStockThreshold !== undefined &&
      criticalStockThreshold > lowStockThreshold
    ) {
      return toast.error("The critical-stock value must be less than or equal to the low-stock value.")
    }

    try {
      setLoading(true)
      await updateProductDetails({
        productId: product.id,
        name: form.name,
        price: Number(form.price),
        quantityUnit: form.quantityUnit,
        category: form.category,
        supplier: form.supplier,
        expiry: form.expiry,
        sku: form.sku,
        hsnCode: form.hsnCode,
        note: form.note,
        lowStockThreshold,
        criticalStockThreshold,
      })
      toast.success("Product information has been saved.")
      onSaved("Product information has been saved.")
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save value")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setLoading(true)
      await deleteProductWithLogs(product.id)
      toast.success("The goods and their old entries have been deleted.")
      onSaved("The goods and their old entries have been deleted.")
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to Delete")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-2xl sm:rounded-[28px] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        {mode === "edit" ? (
          <>
            <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Information of Product
                </p>
                <h3 className="mt-1 text-xl font-bold text-[var(--text-primary)]">Edit Product</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                 Change the name, rate, supplier, and warning here. Add or remove stock using the separate buttons.
                </p>
              </div>
              <Button variant="ghost" title="Close" onClick={onClose} />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <datalist id="product-management-quantity-units">
                {QUANTITY_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </datalist>
              <Input label="Product name" value={form.name} onChange={(e) => setField("name", e.target.value)} />
              <Input label="Category / Type" value={form.category} onChange={(e) => setField("category", e.target.value)} />
              <Input label="Supplier" value={form.supplier} onChange={(e) => setField("supplier", e.target.value)} />
              <Input label="Code" value={form.sku} onChange={(e) => setField("sku", e.target.value)} />
              <Input label="HSN Code" value={form.hsnCode} onChange={(e) => setField("hsnCode", e.target.value)} />
              <Input label="Expiry" type="date" value={form.expiry} onChange={(e) => setField("expiry", e.target.value)} />
              <Input label="Rate" type="number" min={0} value={form.price} onChange={(e) => setField("price", e.target.value)} />
              <Input
                label={<>Unit <span className="text-red-400">*</span></>}
                value={form.quantityUnit}
                onChange={(e) => setField("quantityUnit", e.target.value)}
                datalist="product-management-quantity-units"
              />
              <Input
                label="Note"
                value={form.note}
                onChange={(e) => setField("note", e.target.value)}
                containerClassName="sm:col-span-2"
              />
              <div className="sm:col-span-2">
                <Button
                  variant="outline"
                  title={showWarning ? "Stop warning" : "Set Stock warning"}
                  onClick={() => setShowWarning((value) => !value)}
                  className="w-full sm:w-auto"
                />
              </div>
              {showWarning && (
                <StockWarningSection
                  product={product}
                  criticalValue={form.criticalStockThreshold}
                  lowValue={form.lowStockThreshold}
                  onChange={setField}
                />
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 sm:grid-cols-3">
              <InfoChip label="Current Stock" value={formatQuantity(product.quantity, product.quantityUnit)} />
              <InfoChip label="Purani entry" value={String(historyCount)} />
              <InfoChip label="Value" value={`Rs ${inventoryValue.toLocaleString("en-IN")}`} />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button title="Cancel" variant="outline" onClick={onClose} />
              <Button title="Save it" variant="success" loading={loading} onClick={handleSave} />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500">
                  Delete Product
                </p>
                <h3 className="mt-1 text-xl font-bold text-[var(--text-primary)]">{product.name}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  This will permanently delete the product, its stock, and previous entries.
                </p>
              </div>
              <Button variant="ghost" title="Close" onClick={onClose} />
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
              <p>Current Stock: <b>{formatQuantity(product.quantity, product.quantityUnit)}</b></p>
              <p>Purani entry: <b>{historyCount}</b></p>
              <p>Delete karne ke baad ye sync me bhi hat jayega.</p>
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

function parseOptionalNumber(value: string) {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function StockWarningSection({
  product,
  criticalValue,
  lowValue,
  onChange,
}: {
  product: Product
  criticalValue: string
  lowValue: string
  onChange: (key: keyof FormState, value: string) => void
}) {
  const unit = normalizeQuantityUnit(product.quantityUnit)
  const critical = parseOptionalNumber(criticalValue) ?? STOCK_THRESHOLDS.criticalMax
  const low = parseOptionalNumber(lowValue) ?? STOCK_THRESHOLDS.lowMax

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 sm:col-span-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-base font-bold text-amber-800 dark:text-amber-200">
            Stock warning kab dikhani hai?
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            Jab maal kam ho jaye, app aapko color se warning dikhayega.
          </p>
        </div>
        <div className="w-fit rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-700 shadow-sm dark:border-amber-900/50 dark:bg-slate-950 dark:text-amber-300">
          Abhi stock: {formatQuantity(product.quantity, unit)}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-red-200 bg-white p-3 shadow-sm dark:border-red-900/40 dark:bg-slate-950">
          <label className="text-sm font-semibold text-[var(--text-primary)]">
            Bahut kam stock
          </label>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Itna ya isse kam bache to red warning dikhani hai.
          </p>
          <div className="mt-3 flex overflow-hidden rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] focus-within:ring-2 focus-within:ring-red-300">
            <input
              type="number"
              min={0}
              value={criticalValue}
              onChange={(e) => onChange("criticalStockThreshold", e.target.value)}
              placeholder={String(STOCK_THRESHOLDS.criticalMax)}
              className="min-h-10 min-w-0 flex-1 bg-transparent px-3 py-2 text-[var(--text-primary)] outline-none"
            />
            <span className="border-l border-[var(--border-input)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)]">
              {unit}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-white p-3 shadow-sm dark:border-amber-900/40 dark:bg-slate-950">
          <label className="text-sm font-semibold text-[var(--text-primary)]">
            Kam stock
          </label>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Itna ya isse kam bache to yellow warning dikhani hai.
          </p>
          <div className="mt-3 flex overflow-hidden rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] focus-within:ring-2 focus-within:ring-amber-300">
            <input
              type="number"
              min={0}
              value={lowValue}
              onChange={(e) => onChange("lowStockThreshold", e.target.value)}
              placeholder={String(STOCK_THRESHOLDS.lowMax)}
              className="min-h-10 min-w-0 flex-1 bg-transparent px-3 py-2 text-[var(--text-primary)] outline-none"
            />
            <span className="border-l border-[var(--border-input)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)]">
              {unit}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-white/80 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-slate-950/80 dark:text-amber-200">
        <p className="font-semibold">Example</p>
        <p className="mt-1">
          Agar Bahut kam = {critical} aur Kam = {low}, to stock {critical} {unit} ya kam hoga to red warning,
          aur {critical + 1} se {low} {unit} tak yellow warning dikhegi.
        </p>
        <p className="mt-2 text-[var(--text-secondary)]">
          Dono box khali chhod sakte ho. Tab app default value use karega.
        </p>
      </div>
    </div>
  )
}
