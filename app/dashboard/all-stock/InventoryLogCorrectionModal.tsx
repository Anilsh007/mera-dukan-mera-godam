"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import Button from "@/app/components/utility/Button"
import Input from "@/app/components/utility/CommonInput"
import { deleteProductLog, updateProductLog } from "@/app/dashboard/add-product/product.service"

const REASONS = ["Sold", "Expired", "Damaged", "Personal use", "Other"]

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

  useEffect(() => {
    if (!row) return

    setDeleteMode(false)
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
    if (!form.quantity || Number(form.quantity) <= 0) return toast.error("Valid quantity dalo")
    if (Number(form.price) < 0) return toast.error("Price negative nahi ho sakta")
    if (!form.date) return toast.error("Date and time select karo")
    if (isSaleFlow && !form.buyerName.trim()) return toast.error("Sale correction me buyer name dalo")

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
      toast.success("History correction save ho gaya")
      onSaved("History correction saved and stock adjusted.")
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Correction failed")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setLoading(true)
      await deleteProductLog(row.id)
      toast.success("History entry delete ho gayi")
      onSaved("History entry deleted and stock reversed.")
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
              History Correction
            </p>
            <h3 className="mt-1 text-xl font-bold text-[var(--text-primary)] capitalize">{row.productName}</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {row.logType === "in"
                ? "Stock in entry ko yahin se correct karo. Current product quantity automatically adjust ho jayegi."
                : "Sale or stock out entry yahin se correct karo. Buyer details aur stock quantity dono sync honge."}
            </p>
          </div>
          <Button variant="ghost" title="Close" onClick={onClose} />
        </div>

        {deleteMode ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
              <p className="font-semibold">Delete this history entry?</p>
              <p className="mt-2">
                Ye row remove hote hi current stock quantity reverse-adjust ho jayegi. Agar ye latest correction hai to numbers turant change dikhेंगे.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button title="Back" variant="outline" onClick={() => setDeleteMode(false)} />
              <Button title="Delete Entry" variant="danger" loading={loading} onClick={handleDelete} />
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Quantity" type="number" min={1} value={form.quantity} onChange={(e) => setField("quantity", e.target.value)} />
              <Input label={row.logType === "in" ? "Price per unit" : "Sale / recovery price"} type="number" min={0} value={form.price} onChange={(e) => setField("price", e.target.value)} />
              <Input label="Date and time" type="datetime-local" value={form.date} onChange={(e) => setField("date", e.target.value)} />
              <Input label="Expiry date" type="date" value={form.expiry} onChange={(e) => setField("expiry", e.target.value)} />

              {row.logType === "out" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Reason</label>
                  <select
                    value={form.reason}
                    onChange={(e) => setField("reason", e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)]"
                  >
                    {REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Input
                label="Note"
                value={form.note}
                onChange={(e) => setField("note", e.target.value)}
                containerClassName={row.logType === "out" ? "" : "sm:col-span-2"}
              />

              {isSaleFlow && (
                <>
                  <Input label="Buyer name" value={form.buyerName} onChange={(e) => setField("buyerName", e.target.value)} />
                  <Input label="Buyer phone" value={form.buyerPhone} onChange={(e) => setField("buyerPhone", e.target.value)} />
                  <Input label="Buyer GSTIN" value={form.buyerGstin} onChange={(e) => setField("buyerGstin", e.target.value)} containerClassName="sm:col-span-2" />
                </>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 sm:grid-cols-3">
              <InfoChip label="Entry Type" value={row.logType === "in" ? "Stock In" : form.reason === "Sold" ? "Sale Out" : "Stock Out"} />
              <InfoChip label="Total Value" value={`Rs ${totalValue.toLocaleString("en-IN")}`} />
              <InfoChip label="Original Date" value={new Date(row.date).toLocaleDateString("en-IN")} />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button title="Delete Entry" variant="soft-danger" onClick={() => setDeleteMode(true)} />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button title="Cancel" variant="outline" onClick={onClose} />
                <Button title="Save Correction" variant="success" loading={loading} onClick={handleSave} />
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
