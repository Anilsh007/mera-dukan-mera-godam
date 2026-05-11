"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import { deleteProductLog, updateProductLog } from "@/app/dashboard/add-product/product.service"

const REASONS = [
  { value: "Sold", label: "Sale" },
  { value: "Expired", label: "Expiry" },
  { value: "Damaged", label: "Damaged" },
  { value: "Personal use", label: "Personal Use" },
  { value: "Other", label: "Other" },
]

type HistoryRow = {
  id: string
  productName: string
  logType: "in" | "out"
  reason: string
  quantity: number
  price: number
  date: string
  expiry: string
  buyerName: string
  buyerPhone: string
  buyerGstin: string
  note: string
  correctedAt?: string
}

type Props = {
  open: boolean
  row: HistoryRow | null
  onClose: () => void
  onSaved: (message: string) => void
}

type FormState = {
  quantity: string
  price: string
  reason: string
  expiry: string
  date: string
  note: string
  buyerName: string
  buyerPhone: string
  buyerGstin: string
}

const emptyForm: FormState = {
  quantity: "",
  price: "",
  reason: "Sold",
  expiry: "",
  date: "",
  note: "",
  buyerName: "",
  buyerPhone: "",
  buyerGstin: "",
}

export default function InventoryLogCorrectionModal({ open, row, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [deleteMode, setDeleteMode] = useState(false)
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    if (!row) return

    setDeleteMode(false)
    setShowMore(false)
    setForm({
      quantity: String(row.quantity),
      price: String(row.price),
      reason: row.reason || "Sold",
      expiry: row.expiry || "",
      date: toDateTimeLocal(row.date),
      note: row.note || "",
      buyerName: row.buyerName || "",
      buyerPhone: row.buyerPhone || "",
      buyerGstin: row.buyerGstin || "",
    })
  }, [row])

  const isSaleFlow = row?.logType === "out" && form.reason === "Sold"
  const totalValue = useMemo(() => {
    return Number(form.quantity || 0) * Number(form.price || 0)
  }, [form.quantity, form.price])

  if (!open || !row) return null

  const setField = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleSave = async () => {
    if (!form.quantity || Number(form.quantity) <= 0) return toast.error("Quantity cannot be zero or negative")
    if (Number(form.price) < 0) return toast.error("Rate cannot be negative")
    if (!form.date) return toast.error("Date and time must be selected")
    if (isSaleFlow && !form.buyerName.trim()) return toast.error("Buyer name is required for sales")

    try {
      setLoading(true)
      await updateProductLog({
        logId: row.id,
        quantity: Number(form.quantity),
        price: Number(form.price || 0),
        type: row.logType,
        reason: row.logType === "out" ? form.reason : undefined,
        expiry: form.expiry,
        date: new Date(form.date).toISOString(),
        note: form.note,
        buyerName: isSaleFlow ? form.buyerName : undefined,
        buyerPhone: isSaleFlow ? form.buyerPhone : undefined,
        buyerGstin: isSaleFlow ? form.buyerGstin : undefined,
      })
      toast.success("Old entry updated successfully")
      onSaved("Old entry updated successfully and stock adjusted accordingly.")
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
      await deleteProductLog(row.id)
      toast.success("Old entry deleted successfully")
      onSaved("Old entry deleted successfully and stock adjusted accordingly.")
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-2xl sm:rounded-[28px] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Old entry correction
            </p>
            <h3 className="mt-1 text-xl font-bold text-[var(--text-primary)] capitalize">{row.productName}</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {row.logType === "in"
                ? "Correct the incoming product entry here. Stock will be adjusted automatically."
                : "Correct the sales or stock removal entry here. Buyer and stock information will be updated."}
            </p>
          </div>
          <Button variant="ghost" title="Close" onClick={onClose} />
        </div>

        {deleteMode ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
              <p className="font-semibold">Delete this old entry?</p>
              <p className="mt-2">
                Are you sure you want to delete this entry? This action cannot be undone. The stock will be adjusted as if this entry never existed.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button title="Wapas" variant="outline" onClick={() => setDeleteMode(false)} />
              <Button title="Entry delete" variant="danger" loading={loading} onClick={handleDelete} />
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-3 sm:col-span-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">1. Fix Quantity and Price</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">Replace the incorrect quantity and price values.</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input label="Quantity" type="number" min={1} value={form.quantity} onChange={(e) => setField("quantity", e.target.value)} />
                  <Input label={row.logType === "in" ? "Purchase rate" : "Sale rate"} type="number" min={0} value={form.price} onChange={(e) => setField("price", e.target.value)} />
                </div>
              </div>

              {row.logType === "out" && (
                <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-3 sm:col-span-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">2. Reason for Correction</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {REASONS.map((reason) => (
                      <button
                        key={reason.value}
                        type="button"
                        onClick={() => setField("reason", reason.value)}
                        className={`min-h-10 rounded-xl border px-3 py-2 text-sm font-semibold ${
                          form.reason === reason.value
                            ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : "border-[var(--border-input)] bg-[var(--bg-card-strong)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {reason.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isSaleFlow && (
                <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-3 sm:col-span-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">3. Buyer Name</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Buyer name is required for sales entries.</p>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input label="Buyer Name" value={form.buyerName} onChange={(e) => setField("buyerName", e.target.value)} />
                    {showMore && (
                      <>
                        <Input label="Buyer Phone" value={form.buyerPhone} onChange={(e) => setField("buyerPhone", e.target.value)} />
                        <Input label="Buyer GSTIN" value={form.buyerGstin} onChange={(e) => setField("buyerGstin", e.target.value)} containerClassName="sm:col-span-2" />
                      </>
                    )}
                  </div>
                </div>
              )}

              {showMore && (
                <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-3 sm:col-span-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Extra detail</p>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input label="Date and Time" type="datetime-local" value={form.date} onChange={(e) => setField("date", e.target.value)} />
                    <Input label="Expiry" type="date" value={form.expiry} onChange={(e) => setField("expiry", e.target.value)} />
                    <Input label="Note" value={form.note} onChange={(e) => setField("note", e.target.value)} containerClassName="sm:col-span-2" />
                  </div>
                </div>
              )}
            </div>

            <Button
              title={showMore ? "Less detail" : "More detail"}
              variant="outline"
              onClick={() => setShowMore((value) => !value)}
              className="mt-4 w-full sm:w-auto"
            />

            <div className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 sm:grid-cols-3">
              <InfoChip label="Entry type" value={row.logType === "in" ? "Product Entry" : form.reason === "Sold" ? "Sale" : "Stock Adjustment"} />
              <InfoChip label="Total Value" value={`Rs ${totalValue.toLocaleString("en-IN")}`} />
              <InfoChip label="Purani date" value={new Date(row.date).toLocaleDateString("en-IN")} />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button title="Entry delete" variant="soft-danger" onClick={() => setDeleteMode(true)} />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button title="Cancel" variant="outline" onClick={onClose} />
                <Button title="Save karo" variant="success" loading={loading} onClick={handleSave} />
              </div>
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

function toDateTimeLocal(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const tzOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}
