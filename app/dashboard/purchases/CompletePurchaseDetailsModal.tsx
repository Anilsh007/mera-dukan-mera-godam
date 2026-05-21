"use client"

import { useEffect, useMemo, useState } from "react"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import SummaryCard from "@/app/components/ui/SummaryCard"
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
  const [paymentStatus, setPaymentStatus] =
    useState<PurchasePaymentStatus>("unpaid")
  const [paymentMode, setPaymentMode] = useState(DEFAULT_PAYMENT_MODE)
  const [amountPaid, setAmountPaid] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    if (!purchase) return

    const timeout = window.setTimeout(() => {
      setBillNo(purchase.billNo.startsWith("QP-") ? makePurchaseBillNo() : purchase.billNo)
      setSupplierName(
        purchase.supplierName === "Details Pending" ? "" : purchase.supplierName
      )
      setPurchaseDate(purchase.purchaseDate)
      setPaymentStatus(purchase.paymentStatus || "unpaid")
      setPaymentMode(purchase.paymentMode || DEFAULT_PAYMENT_MODE)
      setAmountPaid(String(purchase.amountPaid || ""))
      setNote(purchase.note || "")
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [purchase])

  const totalAmount = purchase?.totalAmount || 0

  const { paidAmount, dueAmount } = useMemo(
    () => calculatePaymentAmounts(totalAmount, paymentStatus, amountPaid),
    [amountPaid, paymentStatus, totalAmount]
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
      description={en.purchases.completeQuickPurchaseDescription}
      onClose={onClose}
      size="xl"
      loading={loading}
      primaryLabel={en.purchases.saveDetails}
      primaryVariant="primary"
      cancelLabel={en.common.cancel}
    >
      <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200 sm:text-sm">
        <span>{en.purchases.detailsPendingPurchase}: </span>
        <b className="break-all">{purchase.billNo}</b>
        <span className="mx-1 hidden sm:inline">|</span>
        <span className="block sm:inline">
          {en.purchases.total}: <b>{formatCurrency(purchase.totalAmount)}</b>
        </span>
      </div>

      <datalist id="paymentModes">
        {PAYMENT_MODES.map((mode) => (
          <option key={mode} value={mode} />
        ))}
      </datalist>

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
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            {en.purchases.paymentStatusRequired}
          </label>

          <select
            value={paymentStatus}
            onChange={(event) =>
              setPaymentStatus(event.target.value as PurchasePaymentStatus)
            }
            className="min-h-10 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {PAYMENT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label={en.purchases.paymentMode}
          value={paymentMode}
          onChange={(event) => setPaymentMode(event.target.value)}
          datalist="paymentModes"
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
                  {item.quantity} {item.quantityUnit} × {formatCurrency(item.price)}
                </p>
              </div>

              <p className="text-left font-bold text-emerald-600 sm:text-right">
                {formatCurrency(item.lineTotal)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label={en.purchases.total} value={formatCurrency(totalAmount)} />
        <SummaryCard label={en.purchases.paid} value={formatCurrency(paidAmount)} tone="emerald" />
        <SummaryCard label={en.purchases.due} value={formatCurrency(dueAmount)} tone={dueAmount > 0 ? "rose" : "default"} />
      </div>
    </Modal>
  )
}
