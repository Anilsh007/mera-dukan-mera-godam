"use client"

import { useState } from "react"
import { toast } from "sonner"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import SummaryCard from "@/app/components/ui/SummaryCard"
import { auth } from "@/app/lib/firebase"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { applySupplierPayment } from "@/app/dashboard/purchases/purchase.service"
import { DEFAULT_PAYMENT_MODE, PAYMENT_MODES } from "@/app/dashboard/purchases/purchase.constants"
import { formatCurrency } from "@/app/dashboard/purchases/purchase.utils"
import { en } from "@/app/messages/en"

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
  const [amount, setAmount] = useState(String(supplier.dueAmount))
  const [paymentMode, setPaymentMode] = useState(DEFAULT_PAYMENT_MODE)
  const [note, setNote] = useState("")
  const [showMore, setShowMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const amountNumber = Number(amount || 0)
  const payableAmount = Math.min(Math.max(amountNumber, 0), supplier.dueAmount)
  const remainingDue = Math.max(supplier.dueAmount - payableAmount, 0)

  const setQuickAmount = (value: number) => {
    setAmount(String(Math.round(value)))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      setLoading(true)
      const userId = requireUserIdentityFromAuthUser(auth.currentUser)
      const result = await applySupplierPayment({
        userId,
        supplierName: supplier.name,
        amount: payableAmount,
        paymentMode,
        note,
      })

      toast.success(`${formatCurrency(result.paidAmount)} ${en.suppliers.paymentSaved}`)
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : en.suppliers.paymentSaveFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{en.suppliers.title}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{supplier.name}</p>
          </div>
          <Button type="button" variant="ghost" title={en.common.close} onClick={onClose} />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <SummaryCard label={en.suppliers.dueNow} value={formatCurrency(supplier.dueAmount)} tone="amber" />
          <SummaryCard label={en.suppliers.payment} value={formatCurrency(payableAmount)} tone="emerald" />
        </div>

        <div className="mb-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-3">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{en.suppliers.howMuchPaid}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Button type="button" variant="outline" title="25%" onClick={() => setQuickAmount(supplier.dueAmount * 0.25)} />
            <Button type="button" variant="outline" title="50%" onClick={() => setQuickAmount(supplier.dueAmount * 0.5)} />
            <Button type="button" variant="success" title="Full" onClick={() => setQuickAmount(supplier.dueAmount)} />
          </div>
        </div>

        <datalist id="supplier-payment-modes">
          {PAYMENT_MODES.map((mode) => (
            <option key={mode} value={mode} />
          ))}
        </datalist>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            type="number"
            min={1}
            max={supplier.dueAmount}
            label="Amount"
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

        <div className="mt-4 rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-secondary)]">
          {en.suppliers.afterPaymentDue}: <b className="text-[var(--text-primary)]">{formatCurrency(remainingDue)}</b>
        </div>

        <Button
          type="button"
          variant="outline"
          title={showMore ? en.inventory.showLess : en.suppliers.addNote}
          onClick={() => setShowMore((value) => !value)}
          className="mt-4 w-full sm:w-auto"
        />

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="ghost" title="Cancel" onClick={onClose} className="flex-1" />
          <Button
            type="submit"
            variant="primary"
            title={en.suppliers.savePayment}
            loading={loading}
            disabled={payableAmount <= 0}
            className="flex-1"
          />
        </div>
      </form>
    </div>
  )
}
