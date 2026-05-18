"use client"

import { useState } from "react"
import { notify as toast } from "@/app/lib/notifications"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import SummaryCard from "@/app/components/ui/SummaryCard"
import TransactionOptions from "@/app/components/ui/TransactionOptions"
import { auth } from "@/app/lib/firebase"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { applySupplierPayment } from "@/app/dashboard/purchases/purchase.service"
import { DEFAULT_PAYMENT_MODE, PAYMENT_MODES } from "@/app/dashboard/purchases/purchase.constants"
import { formatCurrency } from "@/app/dashboard/purchases/purchase.utils"
import useProfile from "@/app/dashboard/profile/useProfile"
import {
  buildBusinessDocumentProfile,
  getProfileDocumentWarnings,
  type TransactionDocumentData,
  type TransactionOptionFlags,
} from "@/app/lib/transactionDocument"
import { en } from "@/app/messages/en"
import {
  createTransactionOptions,
  runTransactionDocumentActions,
  validateTransactionOptions,
} from "@/app/lib/transactionActions"

export type SupplierPaymentSummary = {
  name: string
  dueAmount: number
}

export default function SupplierPaymentModal({
  supplier,
  onClose,
}: {
  supplier: SupplierPaymentSummary
  onClose: () => void
}) {
  const { profile } = useProfile()
  const [amount, setAmount] = useState(String(supplier.dueAmount))
  const [paymentMode, setPaymentMode] = useState(DEFAULT_PAYMENT_MODE)
  const [note, setNote] = useState("")
  const [showMore, setShowMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [transactionOptions, setTransactionOptions] = useState<TransactionOptionFlags>(createTransactionOptions())
  const amountNumber = Number(amount || 0)
  const payableAmount = Math.min(Math.max(amountNumber, 0), supplier.dueAmount)
  const remainingDue = Math.max(supplier.dueAmount - payableAmount, 0)
  const sellerProfile = buildBusinessDocumentProfile(profile)
  const profileWarnings = getProfileDocumentWarnings(sellerProfile)

  const setQuickAmount = (value: number) => {
    setAmount(String(Math.round(value)))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (payableAmount <= 0) {
      toast.error(en.suppliers.paymentSaveFailed)
      return
    }

    const optionValidation = validateTransactionOptions(transactionOptions)
    if (!optionValidation.valid) {
      toast.warning(optionValidation.message)
      return
    }

    try {
      setLoading(true)
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      const documentData = buildSupplierPaymentDocument({
        supplier,
        seller: sellerProfile,
        amount: payableAmount,
        remainingDue,
        paymentMode,
        note,
      })
      const result = await applySupplierPayment({
        userId,
        supplierName: supplier.name,
        amount: payableAmount,
        paymentMode,
        note,
      })

      await runTransactionDocumentActions(documentData, transactionOptions)

      toast.success(`${formatCurrency(result.paidAmount)} ${en.suppliers.paymentSaved}`)
      onClose()
    } catch (error) {
      console.error("Supplier payment save failed", error)
      toast.error(en.suppliers.paymentSaveFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      as="form"
      onSubmit={handleSubmit}
      title={en.suppliers.title}
      description={supplier.name}
      onClose={onClose}
      loading={loading}
      size="lg"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="ghost" title={en.common.cancel} onClick={onClose} disabled={loading} className="flex-1" />
          <Button
            type="submit"
            variant="primary"
            title={en.suppliers.savePayment}
            loading={loading}
            disabled={payableAmount <= 0}
            className="flex-1"
          />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          <SummaryCard label={en.suppliers.dueNow} value={formatCurrency(supplier.dueAmount)} tone="amber" />
          <SummaryCard label={en.suppliers.payment} value={formatCurrency(payableAmount)} tone="emerald" />
        </div>

        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-3">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{en.suppliers.howMuchPaid}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
            <Button type="button" variant="outline" title={en.suppliers.quickPay25} onClick={() => setQuickAmount(supplier.dueAmount * 0.25)} disabled={loading} />
            <Button type="button" variant="outline" title={en.suppliers.quickPay50} onClick={() => setQuickAmount(supplier.dueAmount * 0.5)} disabled={loading} />
            <Button type="button" variant="success" title={en.suppliers.full} onClick={() => setQuickAmount(supplier.dueAmount)} disabled={loading} />
          </div>
        </div>

        <datalist id="supplier-payment-modes">
          {PAYMENT_MODES.map((mode) => (
            <option key={mode} value={mode} />
          ))}
        </datalist>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            type="number"
            min={1}
            max={supplier.dueAmount}
            label={en.suppliers.amount}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
          <Input
            label={en.purchases.paymentMode}
            value={paymentMode}
            onChange={(event) => setPaymentMode(event.target.value)}
            datalist="supplier-payment-modes"
          />
          {showMore && (
            <Input
              label={en.inventory.note}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              containerClassName="sm:col-span-2"
            />
          )}
        </div>

        <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-secondary)]">
          {en.suppliers.afterPaymentDue}: <b className="text-[var(--text-primary)]">{formatCurrency(remainingDue)}</b>
        </div>

        <Button
          type="button"
          variant="outline"
          title={showMore ? en.inventory.showLess : en.suppliers.addNote}
          onClick={() => setShowMore((value) => !value)}
          className="w-full sm:w-auto"
          disabled={loading}
        />

        <TransactionOptions
          value={transactionOptions}
          onChange={setTransactionOptions}
          allowPrint
          allowDownloadPdf
          allowShareWhatsApp
          allowShareEmail
          allowCopyDetails
          disabled={loading}
        />

        {profileWarnings.length > 0 && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
            <p className="font-bold">{en.transaction.profileWarningTitle}</p>
            <p>{en.transaction.profileGuide}</p>
            <ul className="mt-2 list-inside list-disc">
              {profileWarnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}

function buildSupplierPaymentDocument({
  supplier,
  seller,
  amount,
  remainingDue,
  paymentMode,
  note,
}: {
  supplier: SupplierPaymentSummary
  seller: ReturnType<typeof buildBusinessDocumentProfile>
  amount: number
  remainingDue: number
  paymentMode: string
  note: string
}): TransactionDocumentData {
  return {
    type: "supplier-payment",
    title: en.transaction.supplierPaymentReceipt,
    reference: `PAY-${Date.now()}`,
    date: new Date().toLocaleString("en-IN"),
    seller,
    partyLabel: en.transaction.paymentPartyLabel,
    party: { name: supplier.name },
    paymentMode,
    items: [{
      name: en.suppliers.payment,
      quantity: 1,
      rate: amount,
      total: amount,
      note,
    }],
    totals: {
      grandTotal: amount,
      paidAmount: amount,
      dueAmount: remainingDue,
    },
    notes: note,
  }
}
