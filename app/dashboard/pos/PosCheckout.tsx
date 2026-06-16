"use client"

import { QrCode, ReceiptText } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import Button from "@/app/components/ui/Button"
import GuidedStepCard from "@/app/components/ui/GuidedStepCard"
import Input from "@/app/components/ui/Input"
import SummaryCard from "@/app/components/ui/SummaryCard"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import { SalePaymentModeSelect } from "@/app/components/sales/SalePaymentSelects"
import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"
import type { SaleCustomer, SalePaymentMode } from "@/app/lib/db"
import type { Dispatch, SetStateAction } from "react"
import type { TransactionOptionFlags } from "@/app/lib/transactionDocument"

type PosCheckoutProps = {
  customer: SaleCustomer
  customerPartyOptionsId?: string
  customerParties: Array<{ id: string; name: string }>
  onCustomerPartyChange: (value: string) => void
  setCustomer: Dispatch<SetStateAction<SaleCustomer>>
  paymentMode: SalePaymentMode | ""
  setPaymentMode: Dispatch<SetStateAction<SalePaymentMode | "">>
  cashReceived: string
  setCashReceived: Dispatch<SetStateAction<string>>
  note: string
  setNote: Dispatch<SetStateAction<string>>
  reference: string
  setReference: Dispatch<SetStateAction<string>>
  totalAmount: number
  taxableAmount: number
  gstAmount: number
  amountReceived: number
  amountPaid: number
  dueAmount: number
  changeReturn: number
  paymentStatus: "paid" | "partial" | "unpaid" | ""
  gstEnabled: boolean
  setGstEnabled: Dispatch<SetStateAction<boolean>>
  transactionOptions: TransactionOptionFlags
  setTransactionOptions: Dispatch<SetStateAction<TransactionOptionFlags>>
  profileWarnings: string[]
  saving: boolean
  canSaveSale: boolean
  printShareAllowed: boolean
  printShareLoading: boolean
  upiQrValue: string
  onSave: () => void
}

export default function PosCheckout({
  customer,
  customerPartyOptionsId = "pos-customer-party-options",
  customerParties,
  onCustomerPartyChange,
  setCustomer,
  paymentMode,
  setPaymentMode,
  cashReceived,
  setCashReceived,
  note,
  setNote,
  reference,
  setReference,
  totalAmount,
  taxableAmount,
  gstAmount,
  amountReceived,
  amountPaid,
  dueAmount,
  changeReturn,
  paymentStatus,
  gstEnabled,
  setGstEnabled,
  transactionOptions,
  setTransactionOptions,
  profileWarnings,
  saving,
  canSaveSale,
  printShareAllowed,
  printShareLoading,
  upiQrValue,
  onSave,
}: PosCheckoutProps) {
  return (
    <GuidedStepCard
      step={3}
      title={en.pos.paymentStepTitle}
      description={en.pos.paymentStepDescription}
      icon={<ReceiptText size={18} />}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <datalist id={customerPartyOptionsId}>
          {customerParties.map((party) => (
            <option key={party.id} value={party.name} />
          ))}
        </datalist>
        <Input label={en.parties.customerPartyLabel} value={customer.name || ""} placeholder={en.sales.customerNamePlaceholder} onChange={(event) => onCustomerPartyChange(event.target.value)} datalist={customerPartyOptionsId} />
        <Input label={en.inventory.phone} value={customer.phone || ""} onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))} />
        <Input label={en.inventory.buyerGstin} value={customer.gstin || ""} onChange={(event) => setCustomer((current) => ({ ...current, gstin: event.target.value.toUpperCase() }))} />
        <Input label={en.sales.noteReference} value={note} placeholder={en.sales.noteReferencePlaceholder} onChange={(event) => setNote(event.target.value)} containerClassName="md:col-span-2" />

        <SalePaymentModeSelect value={paymentMode} onChange={setPaymentMode} />
        <Input type="number" min={0} label={en.pos.cashReceived} value={paymentMode === "Cash" ? cashReceived : paymentMode ? String(amountReceived) : ""} onChange={(event) => setCashReceived(event.target.value)} disabled={paymentMode !== "Cash"} />
        <Input label={en.pos.changeReturn} value={formatCurrency(changeReturn)} readOnly />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <SummaryCard label={en.sales.taxableAmount} value={formatCurrency(taxableAmount)} />
        <SummaryCard label={en.sales.totalGst} value={formatCurrency(gstAmount)} />
        <SummaryCard label={en.sales.totalAmount} value={formatCurrency(totalAmount)} />
        <SummaryCard label={en.sales.amountPaid} value={formatCurrency(amountPaid)} />
        <SummaryCard label={en.sales.balanceDue} value={formatCurrency(dueAmount)} />
      </div>

      {paymentMode === "UPI" ? (
        <div className="mt-4 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <QrCode size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[var(--text-primary)]">{en.pos.upiQrTitle}</p>
              <p className="text-sm text-[var(--text-secondary)]">{upiQrValue ? en.pos.upiQrHelp : en.pos.upiMissingProfile}</p>
            </div>
            {upiQrValue ? (
              <div className="rounded-2xl bg-white p-3">
                <QRCodeSVG value={upiQrValue} size={112} aria-label={en.pos.upiQrTitle} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-3 text-sm font-semibold text-[var(--text-primary)]">
        <input type="checkbox" checked={gstEnabled} onChange={(event) => setGstEnabled(event.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
        <span>{en.sales.gstToggle}</span>
      </label> */}

      {!printShareAllowed && !printShareLoading ? (
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-600">{en.pos.printShareLocked}</p>
      ) : null}

      <div className="mt-5 flex justify-end align-center items-center gap-3">
        <TransactionActionPanel value={transactionOptions} onChange={setTransactionOptions} profileWarnings={profileWarnings} allowGstInvoice allowPrint={printShareAllowed} allowDownloadPdf={printShareAllowed} allowShareWhatsApp={printShareAllowed} allowShareEmail={printShareAllowed} allowCopyDetails={printShareAllowed} disabled={saving} className="flex items-center gap-3" />
        <Button type="button" variant="primary" title={saving ? en.pos.completingBill : en.pos.completeBill} onClick={onSave} loading={saving} disabled={saving || !canSaveSale} className="w-full sm:w-auto" />
      </div>
    </GuidedStepCard>
  )
}
