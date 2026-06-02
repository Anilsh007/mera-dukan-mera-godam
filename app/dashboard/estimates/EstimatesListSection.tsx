"use client"

import { FileText, ReceiptText } from "lucide-react"
import Button from "@/app/components/ui/Button"
//import Modal from "@/app/components/ui/Modal"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import { en } from "@/app/messages/en"
import { formatCurrency, formatIndianDate } from "@/app/lib/formatters"
import type { EstimateRecord, EstimateStatus } from "@/app/lib/db"
import type { BusinessDocumentProfile } from "@/app/lib/transactionDocument"
import { buildEstimateTransactionDocument } from "@/app/lib/estimates/estimate.documents"
import { SelectField, StatusPill, SummaryRow} from "./EstimateFields"

type EstimatesListSectionProps = {
  estimates: Array<EstimateRecord & { effectiveStatus: EstimateStatus }>
  sellerProfile: BusinessDocumentProfile
  printShareAllowed: boolean
  statusSavingId: string | null
  onStatusChange: (estimate: EstimateRecord, nextStatus: EstimateStatus) => void
  onCreateGstDraft: (estimate: EstimateRecord) => void
  onOpenConvertModal: (estimate: EstimateRecord) => void
}

export default function EstimatesListSection({
  estimates,
  sellerProfile,
  printShareAllowed,
  statusSavingId,
  onStatusChange,
  onCreateGstDraft,
  onOpenConvertModal,
}: EstimatesListSectionProps) {
  const STATUS_OPTIONS: EstimateStatus[] = ["draft", "sent", "accepted", "rejected", "expired"]

  return (
    <section className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{en.estimates.savedListTitle}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.estimates.stockSafeHelp}</p>
        </div>
      </div>

      {estimates.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--border-card)] p-5 text-center">
          <p className="font-semibold text-[var(--text-primary)]">{en.estimates.noEstimatesTitle}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.estimates.noEstimatesDescription}</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {estimates.map((estimate) => {
            const effectiveStatus = estimate.effectiveStatus
            const canConvert = effectiveStatus !== "converted" && effectiveStatus !== "rejected" && effectiveStatus !== "expired"
            return (
              <article key={estimate.id} className="rounded-[24px] border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{en.estimates.estimateNo}</p>
                    <h3 className="mt-1 text-lg font-bold text-[var(--text-primary)]">{estimate.estimateNo}</h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{estimate.customer?.name || en.common.notAvailable}</p>
                  </div>
                  <StatusPill status={effectiveStatus} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[var(--text-secondary)]">
                  <SummaryRow label={en.estimates.estimateDate} value={formatIndianDate(estimate.estimateDate)} />
                  <SummaryRow label={en.estimates.expiryDate} value={estimate.expiryDate ? formatIndianDate(estimate.expiryDate) : en.common.notAvailable} />
                  <SummaryRow label={en.sales.totalItems} value={String(estimate.items.length)} />
                  <SummaryRow label={en.estimates.grandTotal} value={formatCurrency(estimate.totalAmount)} strong />
                </div>

                <div className="mt-4">
                  <SelectField
                    label={en.estimates.updateStatus}
                    value={estimate.status}
                    onChange={(value) => onStatusChange(estimate, value as EstimateStatus)}
                    disabled={statusSavingId === estimate.id || estimate.status === "converted"}
                    options={STATUS_OPTIONS.map((entry) => ({ value: entry, label: en.estimates.statuses[entry] }))}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="success" title={en.estimates.convertToSale} icon={<ReceiptText size={16} />} onClick={() => onOpenConvertModal(estimate)} disabled={!canConvert} />
                  <Button type="button" variant="secondary" title={en.estimates.createGstDraft} icon={<FileText size={16} />} onClick={() => onCreateGstDraft(estimate)} disabled={effectiveStatus === "rejected"} />
                </div>

                <div className="mt-4">
                  {printShareAllowed ? (
                    <TransactionActionPanel document={buildEstimateTransactionDocument(estimate, sellerProfile as never)} filename={`${estimate.estimateNo}.pdf`} />
                  ) : (
                    <p className="rounded-2xl border border-amber-300/40 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-100">{en.estimates.printShareLocked}</p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
