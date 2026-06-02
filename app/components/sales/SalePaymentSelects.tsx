"use client"

import SelectField from "@/app/components/ui/SelectField"
import { SALE_PAYMENT_MODES, SALE_PAYMENT_STATUSES } from "@/app/lib/sales/saleForm.utils"
import { en } from "@/app/messages/en"
import type { SalePaymentMode, SalePaymentStatus } from "@/app/lib/db"

type SalePaymentModeSelectProps = {
  value: SalePaymentMode | ""
  onChange: (value: SalePaymentMode | "") => void
  className?: string
  disabled?: boolean
}

type SalePaymentStatusSelectProps = {
  value: SalePaymentStatus | ""
  onChange: (value: SalePaymentStatus | "") => void
  className?: string
  disabled?: boolean
}

export function SalePaymentModeSelect({ value, onChange, className, disabled }: SalePaymentModeSelectProps) {
  return (
    <SelectField label={en.sales.paymentMode} value={value} onChange={(event) => onChange(event.target.value as SalePaymentMode | "")} options={SALE_PAYMENT_MODES} disabled={disabled} containerClassName={className} />
  )
}

export function SalePaymentStatusSelect({ value, onChange, className, disabled }: SalePaymentStatusSelectProps) {
  return (
    <SelectField label={en.sales.paymentStatus} value={value} onChange={(event) => onChange(event.target.value as SalePaymentStatus | "")} options={SALE_PAYMENT_STATUSES} disabled={disabled} containerClassName={className} />
  )
}
