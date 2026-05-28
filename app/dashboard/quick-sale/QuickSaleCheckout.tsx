"use client"

import type { Dispatch, SetStateAction } from "react"
import { ReceiptText } from "lucide-react"
import Button from "@/app/components/ui/Button"
import GuidedStepCard from "@/app/components/ui/GuidedStepCard"
import Input from "@/app/components/ui/Input"
import SummaryCard from "@/app/components/ui/SummaryCard"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import { SalePaymentModeSelect, SalePaymentStatusSelect } from "@/app/components/sales/SalePaymentSelects"
import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"
import type { PartyRecord, SaleCustomer, SalePaymentMode, SalePaymentStatus } from "@/app/lib/db"
import type { TransactionOptionFlags } from "@/app/lib/transactionDocument"

type QuickSaleCheckoutProps = {
  customerParties: PartyRecord[]
  customer: SaleCustomer
  onCustomerPartyChange: (value: string) => void
  setCustomer: Dispatch<SetStateAction<SaleCustomer>>
  paymentMode: SalePaymentMode
  setPaymentMode: Dispatch<SetStateAction<SalePaymentMode>>
  paymentStatus: SalePaymentStatus
  setPaymentStatus: Dispatch<SetStateAction<SalePaymentStatus>>
  amountPaid: string
  setAmountPaid: Dispatch<SetStateAction<string>>
  note: string
  setNote: Dispatch<SetStateAction<string>>
  reference: string
  setReference: Dispatch<SetStateAction<string>>
  totalAmount: number
  taxableAmount: number
  gstAmount: number
  dueAmount: number
  cartLength: number
  saving: boolean
  transactionOptions: TransactionOptionFlags
  setTransactionOptions: Dispatch<SetStateAction<TransactionOptionFlags>>
  profileWarnings: string[]
  onSave: () => void
}

export default function QuickSaleCheckout({
  customerParties,
  customer,
  onCustomerPartyChange,
  setCustomer,
  paymentMode,
  setPaymentMode,
  paymentStatus,
  setPaymentStatus,
  amountPaid,
  setAmountPaid,
  note,
  setNote,
  reference,
  setReference,
  totalAmount,
  taxableAmount,
  gstAmount,
  dueAmount,
  cartLength,
  saving,
  transactionOptions,
  setTransactionOptions,
  profileWarnings,
  onSave,
}: QuickSaleCheckoutProps) {
  return (
    <GuidedStepCard
      step={3}
      title={en.sales.stepCustomerPaymentTitle}
      description={en.sales.stepCustomerPaymentDescription}
      icon={<ReceiptText size={18} />}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <datalist id="customer-party-options">
          {customerParties.map((party) => (
            <option key={party.id} value={party.name} />
          ))}
        </datalist>
        <Input
          label={en.parties.customerPartyLabel}
          value={customer.name || ""}
          placeholder={en.sales.customerNamePlaceholder}
          onChange={(event) => onCustomerPartyChange(event.target.value)}
          datalist="customer-party-options"
        />
        <Input
          label={en.inventory.buyerGstin}
          value={customer.gstin || ""}
          onChange={(event) => setCustomer((current) => ({ ...current, gstin: event.target.value.toUpperCase() }))}
        />
        <Input
          label={en.inventory.phone}
          value={customer.phone || ""}
          onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))}
        />
        <Input
          label={en.inventory.email}
          value={customer.email || ""}
          onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))}
        />
        <Input label={en.sales.reference} value={reference} onChange={(event) => setReference(event.target.value)} />
        <Input
          label={en.sales.noteReference}
          value={note}
          placeholder={en.sales.noteReferencePlaceholder}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <SalePaymentModeSelect value={paymentMode} onChange={setPaymentMode} />
        <SalePaymentStatusSelect value={paymentStatus} onChange={setPaymentStatus} />
        <Input
          type="number"
          min={0}
          label={en.sales.amountPaid}
          value={paymentStatus === "paid" ? String(totalAmount) : paymentStatus === "unpaid" ? "0" : amountPaid}
          onChange={(event) => setAmountPaid(event.target.value)}
          disabled={paymentStatus !== "partial"}
        />
      </div>

      <TransactionActionPanel
        value={transactionOptions}
        onChange={setTransactionOptions}
        profileWarnings={profileWarnings}
        allowGstInvoice
        disabled={saving}
        className="mt-5"
      />

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label={en.sales.totalItems} value={String(cartLength)} />
        <SummaryCard label={en.sales.taxableAmount} value={formatCurrency(taxableAmount)} />
        <SummaryCard label={en.sales.totalGst} value={formatCurrency(gstAmount)} />
        <SummaryCard label={en.sales.totalAmount} value={formatCurrency(totalAmount)} />
        <SummaryCard label={en.sales.balanceDue} value={formatCurrency(dueAmount)} />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="text-sm text-[var(--text-secondary)]">{en.sales.reportsIncluded}</div>
        <Button
          type="button"
          variant="primary"
          title={saving ? en.sales.savingSale : en.sales.saveSale}
          onClick={onSave}
          loading={saving}
          disabled={saving || !cartLength}
          className="w-full sm:w-auto"
        />
      </div>
    </GuidedStepCard>
  )
}
