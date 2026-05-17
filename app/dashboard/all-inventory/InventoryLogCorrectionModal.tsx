"use client"

import { useEffect, useMemo, useState } from "react"
import { notify as toast } from "@/app/lib/notifications"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import SummaryCard from "@/app/components/ui/SummaryCard"
import TransactionOptions from "@/app/components/ui/TransactionOptions"
import { isValidGstin } from "@/app/lib/gst.utils"
import { deleteProductLog, updateProductLog } from "@/app/dashboard/quick-purchase/product.service"
import { en } from "@/app/messages/en"
import { shareTransactionDocument } from "@/app/lib/share"
import useProfile from "@/app/dashboard/profile/useProfile"
import {
  buildBusinessDocumentProfile,
  printTransactionDocument,
  type TransactionDocumentData,
  type TransactionOptionFlags,
} from "@/app/lib/transactionDocument"

const REASONS = [
  { value: "Sold", label: en.inventory.reasons.sold },
  { value: "Expired", label: en.inventory.reasons.expired },
  { value: "Damaged", label: en.inventory.reasons.damaged },
  { value: "Personal use", label: en.inventory.reasons.personalUse },
  { value: "Other", label: en.inventory.reasons.other },
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
  const { profile } = useProfile()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [deleteMode, setDeleteMode] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [transactionOptions, setTransactionOptions] = useState<TransactionOptionFlags>({
    saveOnly: true,
    generateGstInvoice: false,
    printReceipt: false,
    downloadShare: false,
  })

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
    if (!form.quantity || Number(form.quantity) <= 0) return toast.error(en.inventory.enterValidQuantity)
    if (Number(form.price) < 0) return toast.error(en.inventory.negativeRate)
    if (!form.date) return toast.error(en.inventory.selectDateTime)
    if (isSaleFlow && !form.buyerName.trim()) return toast.error(en.inventory.enterBuyerNameForThisSale)
    if (isSaleFlow && form.buyerGstin.trim() && !isValidGstin(form.buyerGstin)) return toast.error(en.profile.invalidGstin)

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
      const adjustmentDocument = buildAdjustmentDocument({ row, form, seller: buildBusinessDocumentProfile(profile) })
      if (transactionOptions.printReceipt) {
        const printed = printTransactionDocument(adjustmentDocument)
        if (printed) toast.success(en.common.printStarted)
        else toast.error(en.common.popupBlocked)
      }
      if (transactionOptions.downloadShare) await shareTransactionDocument(adjustmentDocument)
      toast.success(en.inventory.entryUpdated)
      onSaved(en.inventory.entryUpdatedAdjusted)
      onClose()
    } catch (error) {
      console.error("Inventory log update failed", error)
      toast.error(en.inventory.saveEntryFailed)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setLoading(true)
      await deleteProductLog(row.id)
      toast.success(en.inventory.entryDeleted)
      onSaved(en.inventory.entryDeletedAdjusted)
      onClose()
    } catch (error) {
      console.error("Inventory log delete failed", error)
      toast.error(en.inventory.deleteEntryFailed)
    } finally {
      setLoading(false)
    }
  }

  const description = row.logType === "in"
    ? en.inventory.updateStockInDescription
    : en.inventory.updateStockOutDescription

  return (
    <Modal
      open={open}
      title={row.productName}
      description={description}
      onClose={onClose}
      size="lg"
      loading={loading}
      closeOnOutsideClick={!loading}
      footer={
        deleteMode ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button title={en.modals.back} variant="outline" onClick={() => setDeleteMode(false)} disabled={loading} />
            <Button title={en.modals.deleteEntry} variant="danger" loading={loading} onClick={handleDelete} />
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button title={en.modals.deleteEntry} variant="danger" onClick={() => setDeleteMode(true)} disabled={loading} />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button title={en.modals.cancel} variant="outline" onClick={onClose} disabled={loading} />
              <Button title={en.modals.saveChanges} variant="success" loading={loading} onClick={handleSave} />
            </div>
          </div>
        )
      }
    >
      {deleteMode ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
          <p className="font-semibold">{en.modals.deletePreviousEntryTitle}</p>
          <p className="mt-2">{en.modals.deletePreviousEntryDescription}</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-3 sm:col-span-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{en.modals.updateQuantityAndRate}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{en.modals.updateQuantityAndRateHelp}</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label={en.inventory.quantity} type="number" min={1} value={form.quantity} onChange={(e) => setField("quantity", e.target.value)} />
                <Input label={row.logType === "in" ? en.inventory.purchaseRate : en.inventory.saleRateLabel} type="number" min={0} value={form.price} onChange={(e) => setField("price", e.target.value)} />
              </div>
            </section>

            {row.logType === "out" && (
              <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-3 sm:col-span-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{en.modals.stockRemovalReason}</p>
                <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-5">
                  {REASONS.map((reason) => (
                    <Button
                      key={reason.value}
                      type="button"
                      title={reason.label}
                      onClick={() => setField("reason", reason.value)}
                      variant={form.reason === reason.value ? "success" : "outline"}
                      className="min-h-10 justify-center rounded-xl px-3 py-2 text-sm"
                    />
                  ))}
                </div>
              </section>
            )}

            {isSaleFlow && (
              <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-3 sm:col-span-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{en.modals.buyerNameStep}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{en.modals.buyerRequiredForSale}</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input label={en.inventory.buyerNameLabel} value={form.buyerName} onChange={(e) => setField("buyerName", e.target.value)} />
                  {showMore && (
                    <>
                      <Input label={en.inventory.buyerPhoneLabel} value={form.buyerPhone} onChange={(e) => setField("buyerPhone", e.target.value)} />
                      <Input label={en.inventory.buyerGstinLabel} value={form.buyerGstin} onChange={(e) => setField("buyerGstin", e.target.value.toUpperCase())} containerClassName="sm:col-span-2" />
                    </>
                  )}
                </div>
              </section>
            )}

            {showMore && (
              <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-3 sm:col-span-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{en.modals.extraDetails}</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input label={en.inventory.dateAndTime} type="datetime-local" value={form.date} onChange={(e) => setField("date", e.target.value)} />
                  <Input label={en.inventory.expiry} type="date" value={form.expiry} onChange={(e) => setField("expiry", e.target.value)} />
                  <Input label={en.inventory.note} value={form.note} onChange={(e) => setField("note", e.target.value)} containerClassName="sm:col-span-2" />
                </div>
              </section>
            )}
          </div>

          <Button
            title={showMore ? en.inventory.hideDetails : en.inventory.moreDetails}
            variant="outline"
            onClick={() => setShowMore((value) => !value)}
            className="w-full sm:w-auto"
          />

          <TransactionOptions
            value={transactionOptions}
            onChange={setTransactionOptions}
            allowPrint
            allowDownloadShare
            disabled={loading}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard label={en.inventory.entryType} value={row.logType === "in" ? en.stockHistory.typeLabels.stockIn : form.reason === "Sold" ? en.inventory.reasons.sold : en.stockHistory.typeLabels.stockOut} tone="default" />
            <SummaryCard label={en.inventory.totalValueLabel} value={`${en.common.rupeeSymbol} ${totalValue.toLocaleString("en-IN")}`} tone="emerald" />
            <SummaryCard label={en.inventory.originalDate} value={new Date(row.date).toLocaleDateString("en-IN")} tone="default" />
          </div>
        </div>
      )}
    </Modal>
  )
}

function toDateTimeLocal(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const tzOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}


function buildAdjustmentDocument({
  row,
  form,
  seller,
}: {
  row: HistoryRow
  form: FormState
  seller: ReturnType<typeof buildBusinessDocumentProfile>
}): TransactionDocumentData {
  const quantity = Number(form.quantity || 0)
  const price = Number(form.price || 0)
  const isSale = row.logType === "out" && form.reason === "Sold"

  return {
    type: "stock-adjustment",
    title: en.transaction.stockAdjustmentReceipt,
    reference: `ADJ-${Date.now()}`,
    date: form.date ? new Date(form.date).toLocaleString("en-IN") : new Date().toLocaleString("en-IN"),
    seller,
    partyLabel: isSale ? en.receipt.buyer : en.inventory.reason,
    party: isSale ? { name: form.buyerName, phone: form.buyerPhone, gstin: form.buyerGstin } : { name: form.reason },
    items: [{
      name: row.productName,
      description: [row.logType === "in" ? en.stockHistory.typeLabels.stockIn : en.stockHistory.typeLabels.stockOut, form.expiry ? `${en.inventory.expiry}: ${form.expiry}` : "", form.note].filter(Boolean).join(" | "),
      quantity,
      rate: price,
      total: quantity * price,
      note: form.note,
    }],
    totals: { grandTotal: quantity * price },
    notes: form.note,
  }
}
