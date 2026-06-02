"use client"

import Modal from "@/app/components/ui/Modal"
import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"
import { SALE_PAYMENT_MODES, SALE_PAYMENT_STATUSES } from "@/app/lib/sales/saleForm.utils"
import { Field, SelectField, SummaryRow } from "./EstimateFields"
import type { ConvertState } from "./estimates.types"

type EstimateConvertModalProps = {
  convertState: ConvertState | null
  converting: boolean
  onClose: () => void
  onPrimary: () => void
  onChange: (next: ConvertState | null) => void
}

export default function EstimateConvertModal({
  convertState,
  converting,
  onClose,
  onPrimary,
  onChange,
}: EstimateConvertModalProps) {
  if (!convertState) return null

  return (
    <Modal
      open
      title={en.estimates.convertToSaleTitle}
      description={en.estimates.convertToSaleDescription}
      onClose={onClose}
      primaryLabel={en.estimates.convertToSale}
      primaryVariant="success"
      cancelLabel={en.common.keepEditing}
      loading={converting}
      onPrimary={onPrimary}
      size="md"
    >
      <div className="space-y-4">
        <p className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-3 text-sm text-[var(--text-secondary)]">{en.estimates.conversionPaymentHelp}</p>
        <SummaryRow label={en.estimates.estimateNo} value={convertState.estimate.estimateNo} />
        <SummaryRow label={en.estimates.grandTotal} value={formatCurrency(convertState.estimate.totalAmount)} strong />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            label={en.sales.paymentMode}
            value={convertState.paymentMode}
            onChange={(value) => onChange({ ...convertState, paymentMode: value as ConvertState["paymentMode"] })}
            options={SALE_PAYMENT_MODES}
          />
          <SelectField
            label={en.sales.paymentStatus}
            value={convertState.paymentStatus}
            onChange={(value) =>
              onChange({
                ...convertState,
                paymentStatus: value as ConvertState["paymentStatus"],
                amountPaid:
                  value === "paid"
                    ? String(convertState.estimate.totalAmount)
                    : value === "unpaid"
                      ? "0"
                      : convertState.amountPaid,
              })
            }
            options={SALE_PAYMENT_STATUSES}
          />
          <Field label={en.sales.amountPaid} type="number" value={convertState.amountPaid} onChange={(value) => onChange({ ...convertState, amountPaid: value })} />
          <Field label={en.estimates.notes} value={convertState.note} onChange={(value) => onChange({ ...convertState, note: value })} />
        </div>
      </div>
    </Modal>
  )
}
