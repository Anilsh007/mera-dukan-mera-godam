"use client"

import { useEffect, useMemo, useState } from "react"
import { CircleAlert, ReceiptText } from "lucide-react"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import SummaryCard from "@/app/components/ui/SummaryCard"
import SelectField from "@/app/components/ui/SelectField"
import { notify as toast } from "@/app/lib/notifications"
import type { PurchasePaymentStatus, PurchaseRecord } from "@/app/lib/db"
import {
  DEFAULT_PAYMENT_MODE,
  PAYMENT_MODES,
  PAYMENT_STATUSES,
} from "./purchase.constants"
import { calculatePaymentAmounts, formatCurrency } from "./purchase.utils"
import { makePurchaseBillNo } from "./purchase.form"
import { en } from "@/app/messages/en"

type Props = {
  purchase: PurchaseRecord | null
  loading: boolean
  onClose: () => void
  onSave: (values: {
    billNo: string
    supplierName: string
    purchaseDate: string
    paymentStatus: PurchasePaymentStatus
    paymentMode: string
    amountPaid: number
    note: string
  }) => Promise<void>
}

export default function CompletePurchaseDetailsModal({
  purchase,
  loading,
  onClose,
  onSave,
}: Props) {
  const [billNo, setBillNo] = useState("")
  const [supplierName, setSupplierName] = useState("")
  const [purchaseDate, setPurchaseDate] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<PurchasePaymentStatus | "">("")
  const [paymentMode, setPaymentMode] = useState<string>(DEFAULT_PAYMENT_MODE)
  const [amountPaid, setAmountPaid] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    if (!purchase) return

    const timeout = window.setTimeout(() => {
      setBillNo(purchase.billNo.startsWith("QP-") ? makePurchaseBillNo() : purchase.billNo)
      setSupplierName(
        purchase.supplierName === "Details Pending" ? "" : purchase.supplierName,
      )
      setPurchaseDate(purchase.purchaseDate)
      setPaymentStatus(purchase.paymentStatus || "")
      setPaymentMode(purchase.paymentMode || DEFAULT_PAYMENT_MODE)
      setAmountPaid(String(purchase.amountPaid || ""))
      setNote(purchase.note || "")
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [purchase])

  const totalAmount = purchase?.totalAmount || 0

  const { paidAmount, dueAmount } = useMemo(
    () => calculatePaymentAmounts(totalAmount, paymentStatus, amountPaid),
    [amountPaid, paymentStatus, totalAmount],
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (paymentStatus === "paid") setAmountPaid(String(totalAmount || ""))
      if (paymentStatus === "unpaid") setAmountPaid("0")
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [paymentStatus, totalAmount])

  if (!purchase) return null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!paymentStatus) {
      toast.error(en.purchases.validation.paymentStatusRequired)
      return
    }

    await onSave({
      billNo,
      supplierName,
      purchaseDate,
      paymentStatus,
      paymentMode,
      amountPaid: paidAmount,
      note,
    })
  }

  return (
    <Modal
      as="form"
      onSubmit={handleSubmit}
      title={en.purchases.completeQuickPurchaseDetails}
      titleIcon={<ReceiptText size={18} aria-hidden="true" />}
      description={en.purchases.completeQuickPurchaseDescription}
      onClose={onClose}
      size="xl"
      loading={loading}
      primaryLabel={en.purchases.saveDetails}
      primaryVariant="primary"
      cancelLabel={en.common.cancel}
    >
      <div className="mb-5 rounded-2xl border border-amber-300/70 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(245,158,11,0.08))] p-4 text-sm leading-6 text-amber-900 shadow-[var(--shadow-card)] dark:border-amber-400/25 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.44),rgba(69,26,3,0.24))] dark:text-amber-100">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-amber-700 dark:bg-white/10 dark:text-amber-600">
            <CircleAlert size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">
              {en.purchases.detailsPendingPurchase}:{" "}
              <span className="break-all font-bold">{purchase.billNo}</span>
            </p>
            <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-100/90">
              {en.purchases.total}:{" "}
              <span className="font-bold">{formatCurrency(purchase.totalAmount)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label={en.purchases.billInvoiceNoRequired}
          value={billNo}
          onChange={(event) => setBillNo(event.target.value)}
          placeholder={en.purchases.supplierBillPlaceholder}
        />

        <Input
          label={en.purchases.supplierNameRequired}
          value={supplierName}
          onChange={(event) => setSupplierName(event.target.value)}
          datalist="suppliers"
          placeholder={en.purchases.enterSupplierPlaceholder}
        />

        <Input
          type="date"
          label={en.purchases.purchaseDateRequired}
          value={purchaseDate}
          onChange={(event) => setPurchaseDate(event.target.value)}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          label={en.purchases.paymentStatusRequired}
          value={paymentStatus}
          onChange={(event) => setPaymentStatus(event.target.value as PurchasePaymentStatus)}
          options={PAYMENT_STATUSES}
        />

        <SelectField
          label={en.purchases.paymentMode}
          value={paymentMode}
          onChange={(event) => setPaymentMode(event.target.value)}
          options={PAYMENT_MODES.map((mode) => ({ value: mode, label: mode }))}
        />

        {paymentStatus === "partial" ? (
          <Input
            type="number"
            label={en.purchases.amountPaidRequired}
            value={amountPaid}
            onChange={(event) => setAmountPaid(event.target.value)}
          />
        ) : (
          <Input
            type="number"
            label={en.purchases.paidAmount}
            value={String(paidAmount)}
            disabled
          />
        )}
      </div>

      <div className="mt-3">
        <Input
          label={en.purchases.purchaseNote}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={en.purchases.optionalNote}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-3 sm:p-4">
        <p className="mb-3 text-sm font-bold text-[var(--text-primary)]">
          {en.purchases.itemsFromQuickPurchase}
        </p>

        <div className="space-y-2">
          {purchase.items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 gap-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--text-primary)]">
                  {item.name}
                </p>

                <p className="mt-0.5 break-words text-xs text-[var(--text-muted)]">
                  {item.quantity} {item.quantityUnit} x {formatCurrency(item.price)}
                </p>
              </div>

              <p className="text-left font-bold text-emerald-700 dark:text-emerald-300 sm:text-right">
                {formatCurrency(item.lineTotal)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label={en.purchases.total} value={formatCurrency(totalAmount)} />
        <SummaryCard label={en.purchases.paid} value={formatCurrency(paidAmount)} tone="emerald" />
        <SummaryCard
          label={en.purchases.due}
          value={formatCurrency(dueAmount)}
          tone={dueAmount > 0 ? "rose" : "default"}
        />
      </div>
    </Modal>
  )
}
