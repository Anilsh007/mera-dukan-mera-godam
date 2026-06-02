"use client"

import { Plus, Save } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import SelectField from "@/app/components/ui/SelectField"
import type { PurchasePaymentStatus } from "@/app/lib/db"
import { PAYMENT_MODES, PAYMENT_STATUSES } from "./purchase.constants"
import { formatCurrency } from "./purchase.utils"
import type { PurchaseRow } from "./purchase.types"
import { en } from "@/app/messages/en"
import { PurchaseItemFields, RequiredMark, ValidationErrors } from "./PurchaseItemFields"

type Props = {
  rows: PurchaseRow[]
  billNo: string
  supplierName: string
  purchaseDate: string
  supplierDatalistId?: string
  paymentStatus: PurchasePaymentStatus | ""
  paymentMode: string
  amountPaid: string
  purchaseNote: string
  totalAmount: number
  paidAmount: number
  dueAmount: number
  loading: boolean
  validationErrors: string[]
  onBillNoChange: (value: string) => void
  onSupplierChange: (value: string) => void
  onPurchaseDateChange: (value: string) => void
  onPaymentStatusChange: (value: PurchasePaymentStatus | "") => void
  onPaymentModeChange: (value: string) => void
  onAmountPaidChange: (value: string) => void
  onPurchaseNoteChange: (value: string) => void
  onUpdateRow: (id: string, key: keyof PurchaseRow, value: string) => void
  onAddRow: () => void
  onRemoveRow: (id: string) => void
}

export default function PurchaseFields({
  rows,
  billNo,
  supplierName,
  purchaseDate,
  supplierDatalistId = "suppliers",
  paymentStatus,
  paymentMode,
  amountPaid,
  purchaseNote,
  totalAmount,
  paidAmount,
  dueAmount,
  loading,
  validationErrors,
  onBillNoChange,
  onSupplierChange,
  onPurchaseDateChange,
  onPaymentStatusChange,
  onPaymentModeChange,
  onAmountPaidChange,
  onPurchaseNoteChange,
  onUpdateRow,
  onAddRow,
  onRemoveRow,
}: Props) {
  return (
    <>
      <p className="flex justify-end text-xs font-medium text-rose-400">
        <RequiredMark /> {en.quickPurchase.requiredFieldsOnly}
      </p>

      {validationErrors.length > 0 && <ValidationErrors errors={validationErrors} />}

      <datalist id="paymentModes">
        {PAYMENT_MODES.map((mode) => (
          <option key={mode} value={mode} />
        ))}
      </datalist>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <Input label={en.purchases.billNo} value={billNo} onChange={(event) => onBillNoChange(event.target.value)} placeholder={en.purchases.billNoPlaceholder} />

        <Input id="purchase-supplier" label={<>{en.purchases.supplierNameRequired.replace(" *", "")} <RequiredMark /> </>} value={supplierName} onChange={(event) => onSupplierChange(event.target.value)} datalist={supplierDatalistId} placeholder={en.purchases.supplierPlaceholder} />

        <SelectField
          id="purchase-payment-status"
          label={<>{en.purchases.payment} <RequiredMark /></>}
          value={paymentStatus}
          onChange={(event) => onPaymentStatusChange(event.target.value as PurchasePaymentStatus)}
          options={PAYMENT_STATUSES}
        />

        <Input id="purchase-date" type="date" label={<>{en.purchases.purchaseDate} <RequiredMark /></>} value={purchaseDate} onChange={(event) => onPurchaseDateChange(event.target.value)} />

        <Input label={en.purchases.paymentMode} value={paymentMode} onChange={(event) => onPaymentModeChange(event.target.value)} datalist="paymentModes" placeholder={en.purchases.paymentModePlaceholder} />

        {paymentStatus === "partial" && (
          <div>
            <Input id="purchase-paid-amount" type="number" label={<>{en.purchases.paidAmount} <RequiredMark /> </>} value={amountPaid} onChange={(event) => onAmountPaidChange(event.target.value)} placeholder={en.purchases.paidAmountPlaceholder} />
          </div>
        )}

        <Input label={en.purchases.purchaseNote} value={purchaseNote} onChange={(event) => onPurchaseNoteChange(event.target.value)} placeholder={en.purchases.purchaseNotePlaceholder} />
      </div>

      <div className="mt-5 space-y-4">
        <p className="text-sm font-black text-[var(--text-primary)]">
          {en.purchases.productDetails}
        </p>

        {rows.map((row, index) => (
          <PurchaseItemFields key={row.id} row={row} index={index} showRemove={rows.length > 1} onChange={(key, value) => onUpdateRow(row.id, key, value)} onRemove={() => onRemoveRow(row.id)} />
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-card)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="dotBorder" title={en.purchases.addAnotherProduct} icon={<Plus size={17} />} onClick={onAddRow} />

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="min-w-0 rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] px-4 py-3 text-left sm:text-right">
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {en.purchases.total}: {formatCurrency(totalAmount)}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {en.purchases.paid} {formatCurrency(paidAmount)} |{" "}
              {en.purchases.balance} {formatCurrency(dueAmount)}
            </p>
          </div>

          <Button type="submit" variant="primary" title={en.purchases.savePurchase} icon={<Save size={17} />} loading={loading} />
        </div>
      </div>
    </>
  )
}
