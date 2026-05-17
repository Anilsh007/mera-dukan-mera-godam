"use client"

import Link from "next/link"
import SurfaceCard from "@/app/components/ui/SurfaceCard"
import StatusBadge from "@/app/components/ui/StatusBadge"
import ShareActions from "@/app/components/ui/ShareActions"
import useProfile from "@/app/dashboard/profile/useProfile"
import { en } from "@/app/messages/en"
import {
  buildBusinessDocumentProfile,
  formatMoney,
  getAddressLine,
  getProfileDocumentWarnings,
  type BusinessDocumentProfile,
  type TransactionDocumentData,
} from "@/app/lib/transactionDocument"

type TransactionDocumentProps = {
  document: Omit<TransactionDocumentData, "seller"> & { seller?: BusinessDocumentProfile }
  profile?: BusinessDocumentProfile
  requireGstin?: boolean
  showProfileWarning?: boolean
  className?: string
  showShareActions?: boolean
}

export default function TransactionDocument({
  document,
  profile,
  requireGstin = false,
  showProfileWarning = true,
  className = "",
  showShareActions = true,
}: TransactionDocumentProps) {
  const { profile: liveProfile } = useProfile()
  const seller = document.seller || profile || buildBusinessDocumentProfile(liveProfile)
  const documentData: TransactionDocumentData = { ...document, seller }
  const warnings = getProfileDocumentWarnings(seller, { requireGstin })
  const grandTotal = document.totals?.grandTotal ?? document.items.reduce((sum, item) => sum + Number(item.total || 0), 0)
  const date = document.date || new Date().toLocaleString("en-IN")
  const showNotes = Boolean(document.notes?.trim())
  const showTerms = Boolean((document.terms || seller.terms)?.trim())
  const showSecondaryParty = Boolean(document.secondaryParty && Object.values(document.secondaryParty).some(Boolean))
  const showSellerPanel = document.type !== "gst-invoice"

  return (
    <div className={`space-y-4 ${className}`}>
      {showProfileWarning && warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-bold">{en.transaction.profileWarningTitle}</p>
              <p className="mt-1">{en.transaction.profileWarningDescription}</p>
              <ul className="mt-2 list-inside list-disc">
                {warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </div>
            <Link href="/dashboard/profile" className="inline-flex rounded-xl border border-amber-300 px-3 py-2 font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-400/50 dark:text-amber-100 dark:hover:bg-amber-400/10">
              {en.profile.completeAction}
            </Link>
          </div>
        </div>
      )}

      {showShareActions && (
        <ShareActions document={documentData} compact className="print:hidden" />
      )}

      <SurfaceCard className="overflow-hidden p-0 print:border-none print:shadow-none">
        <div className="flex flex-col gap-4 border-b border-[var(--border-card)] p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div className="flex min-w-0 gap-3">
            {seller.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={seller.logoUrl} alt={en.transaction.businessLogo} className="h-14 w-14 shrink-0 rounded-2xl border border-[var(--border-card)] object-cover" />
            )}
            <div className="min-w-0">
              <h2 className="break-words text-xl font-black text-[var(--text-primary)]">{seller.businessName || en.common.appName}</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{getAddressLine(seller) || en.transaction.addressNotAdded}</p>
              <p className="text-sm text-[var(--text-secondary)]">{[seller.mobile, seller.email].filter(Boolean).join(" | ") || en.transaction.contactNotAdded}</p>
              {seller.gstin && <p className="text-sm font-semibold text-[var(--text-primary)]">{en.gstInvoice.gstin}: {seller.gstin}</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-3 text-sm sm:min-w-60">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">{document.title}</p>
            <MetaRow label={en.receipt.ref} value={document.reference || "-"} />
            <MetaRow label={en.receipt.date} value={date} />
            {document.dueDate && <MetaRow label={en.gstInvoice.dueDate} value={document.dueDate} />}
            {document.paymentMode && <MetaRow label={en.transaction.paymentMode} value={document.paymentMode} />}
          </div>
        </div>

        <div className={`grid gap-3 border-b border-[var(--border-card)] p-4 sm:p-5 ${showSecondaryParty ? "sm:grid-cols-2" : showSellerPanel ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
          {showSellerPanel ? (
            <PartyPanel title={en.receipt.seller} lines={[seller.businessName, getAddressLine(seller), seller.mobile, seller.email, seller.gstin ? `${en.gstInvoice.gstin}: ${seller.gstin}` : ""]} />
          ) : null}
          <PartyPanel
            title={document.partyLabel || en.receipt.buyer}
            lines={[
              document.party?.name,
              document.party?.gstin ? `${en.gstInvoice.gstin}: ${document.party.gstin}` : "",
              [document.party?.address, document.party?.city, document.party?.state, document.party?.pincode].filter(Boolean).join(", "),
              [document.party?.phone, document.party?.email].filter(Boolean).join(" | "),
            ]}
            fallback={en.transaction.noPartyDetails}
          />
          {showSecondaryParty ? (
            <PartyPanel
              title={document.secondaryPartyLabel || en.gstInvoice.shipTo}
              lines={[
                document.secondaryParty?.name,
                document.secondaryParty?.gstin ? `${en.gstInvoice.gstin}: ${document.secondaryParty.gstin}` : "",
                [document.secondaryParty?.address, document.secondaryParty?.city, document.secondaryParty?.state, document.secondaryParty?.pincode].filter(Boolean).join(", "),
                [document.secondaryParty?.phone, document.secondaryParty?.email].filter(Boolean).join(" | "),
              ]}
              fallback={en.transaction.noPartyDetails}
            />
          ) : null}
        </div>

        <div className="p-4 sm:p-5">
          <div className="space-y-3 sm:hidden">
            {document.items.map((item, index) => (
              <article key={`${item.name}-${index}-card`} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-muted)]">#{index + 1}</p>
                    <p className="break-words font-semibold text-[var(--text-primary)]">{item.name || "-"}</p>
                    {item.description && <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.description}</p>}
                    {item.hsnCode && <p className="mt-1 text-xs text-[var(--text-muted)]">{en.gstInvoice.hsnSac}: {item.hsnCode}</p>}
                  </div>
                  <p className="shrink-0 text-right font-bold text-emerald-600 dark:text-emerald-300">{formatMoney(item.total)}</p>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-[var(--text-secondary)] min-[420px]:grid-cols-3">
                  <MiniMeta label={en.receipt.qty} value={[item.quantity, item.unit].filter(Boolean).join(" ") || "-"} />
                  <MiniMeta label={en.receipt.rate} value={typeof item.rate === "number" ? formatMoney(item.rate) : "-"} />
                  <MiniMeta label={en.gstInvoice.gst} value={item.gstRate !== undefined ? `${Number(item.gstRate).toFixed(2)}%` : "-"} />
                </div>
              </article>
            ))}
          </div>

          <div className="mobile-safe-table hidden sm:block">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-black/5 text-[var(--text-muted)] dark:bg-white/5">
                <tr>
                  <th className="px-3 py-3 text-xs uppercase tracking-wide">#</th>
                  <th className="px-3 py-3 text-xs uppercase tracking-wide">{en.receipt.product}</th>
                  <th className="px-3 py-3 text-xs uppercase tracking-wide">{en.receipt.qty}</th>
                  <th className="px-3 py-3 text-xs uppercase tracking-wide">{en.receipt.rate}</th>
                  <th className="px-3 py-3 text-xs uppercase tracking-wide">{en.gstInvoice.gst}</th>
                  <th className="px-3 py-3 text-right text-xs uppercase tracking-wide">{en.receipt.total}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-card)]">
                {document.items.map((item, index) => (
                  <tr key={`${item.name}-${index}`}>
                    <td className="px-3 py-3 text-[var(--text-secondary)]">{index + 1}</td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-[var(--text-primary)]">{item.name || "-"}</p>
                      {item.description && <p className="text-xs text-[var(--text-secondary)]">{item.description}</p>}
                      {item.hsnCode && <p className="text-xs text-[var(--text-muted)]">{en.gstInvoice.hsnSac}: {item.hsnCode}</p>}
                    </td>
                    <td className="px-3 py-3 text-[var(--text-secondary)]">{[item.quantity, item.unit].filter(Boolean).join(" ") || "-"}</td>
                    <td className="px-3 py-3 text-[var(--text-secondary)]">{typeof item.rate === "number" ? formatMoney(item.rate) : "-"}</td>
                    <td className="px-3 py-3 text-[var(--text-secondary)]">{item.gstRate !== undefined ? `${Number(item.gstRate).toFixed(2)}%` : "-"}</td>
                    <td className="px-3 py-3 text-right font-bold text-[var(--text-primary)]">{formatMoney(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 border-t border-[var(--border-card)] p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            {seller.paymentDetails && Object.values(seller.paymentDetails).some(Boolean) && (
              <div>
                <p className="font-bold text-[var(--text-primary)]">{en.gstInvoice.bankAndPaymentDetails}</p>
                <p>{[seller.paymentDetails.upiId ? `${en.transaction.upi}: ${seller.paymentDetails.upiId}` : "", seller.paymentDetails.bankName, seller.paymentDetails.accountNumber, seller.paymentDetails.ifsc].filter(Boolean).join(" | ")}</p>
              </div>
            )}
            {showNotes ? <p><strong>{en.gstInvoice.notes}:</strong> {document.notes}</p> : null}
            {showTerms ? <p><strong>{en.gstInvoice.terms}:</strong> {document.terms || seller.terms}</p> : null}
          </div>

          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-4">
            <SummaryLine label={en.gstInvoice.taxableValue} value={document.totals?.taxableAmount} />
            <SummaryLine label={en.gstInvoice.cgst} value={document.totals?.cgstTotal} />
            <SummaryLine label={en.gstInvoice.sgstUtgst} value={document.totals?.sgstTotal} />
            <SummaryLine label={en.gstInvoice.igst} value={document.totals?.igstTotal} />
            <SummaryLine label={en.transaction.totalGst} value={document.totals?.totalGst} />
            <SummaryLine label={en.purchases.paid} value={document.totals?.paidAmount} />
            <SummaryLine label={en.purchases.due} value={document.totals?.dueAmount} />
            <div className="mt-2 flex items-center justify-between border-t border-[var(--border-card)] pt-3 text-lg font-black">
              <span>{en.receipt.grandTotal}</span>
              <span className="text-emerald-600 dark:text-emerald-300">{formatMoney(grandTotal)}</span>
            </div>
            {document.totals?.amountInWords && <p className="mt-2 text-xs italic text-[var(--text-secondary)]">{document.totals.amountInWords}</p>}
          </div>
        </div>

        <div className="border-t border-[var(--border-card)] px-4 py-3 text-xs text-[var(--text-muted)] sm:px-5">
          {document.footerNote || `${en.receipt.printedOn}: ${new Date().toLocaleString("en-IN")}`}
        </div>
      </SurfaceCard>
    </div>
  )
}


function MiniMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-2 py-2">
      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 break-words font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-1 flex justify-between gap-4">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-right font-semibold text-[var(--text-primary)]">{value}</span>
    </div>
  )
}

function PartyPanel({ title, lines, fallback = "-" }: { title: string; lines: Array<string | undefined>; fallback?: string }) {
  const cleanLines = lines.filter((line) => line?.trim()) as string[]
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">{title}</p>
        {cleanLines.length > 0 && <StatusBadge tone="info">{en.transaction.ready}</StatusBadge>}
      </div>
      {cleanLines.length ? cleanLines.map((line) => <p key={line} className="break-words text-sm text-[var(--text-secondary)]">{line}</p>) : <p className="text-sm text-[var(--text-muted)]">{fallback}</p>}
    </div>
  )
}

function SummaryLine({ label, value }: { label: string; value?: number }) {
  if (value === undefined || value === null || Number(value) === 0) return null
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-sm">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="font-semibold text-[var(--text-primary)]">{formatMoney(value)}</span>
    </div>
  )
}
