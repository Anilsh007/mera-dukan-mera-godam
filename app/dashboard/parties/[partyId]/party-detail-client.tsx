"use client"

import InfoTile from "@/app/components/ui/InfoTile"
import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import Button from "@/app/components/ui/Button"
import PageHeader from "@/app/components/ui/PageHeader"
import SummaryCard from "@/app/components/ui/SummaryCard"
import SimpleEmptyState from "@/app/components/ui/SimpleEmptyState"
import PaymentStatusBadge from "@/app/components/ui/PaymentStatusBadge"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import PartyPaymentModal from "@/app/components/parties/PartyPaymentModal"
import { DASHBOARD_ROUTES } from "@/app/lib/navigation/dashboardRoutes"
import usePartyDetail from "@/app/hooks/usePartyDetail"
import useProfile from "@/app/dashboard/profile/useProfile"
import { buildBusinessDocumentProfile } from "@/app/lib/transactionDocument"
import { buildPartyStatementDocument } from "@/app/lib/parties/party.documents"
import { buildPartyDueReminder } from "@/app/lib/parties/party.service"
import { en } from "@/app/messages/en"
import { formatCurrency, formatIndianDateTime } from "@/app/lib/formatters"

export default function PartyDetailClientPage({ partyId }: { partyId: string }) {
  const { detail, loading } = usePartyDetail(partyId)
  const { profile } = useProfile()
  const sellerProfile = buildBusinessDocumentProfile(profile)
  const [paymentMode, setPaymentMode] = useState<"received" | "paid" | null>(null)

  const statementDocument = useMemo(
    () => (detail ? buildPartyStatementDocument(detail, sellerProfile) : undefined),
    [detail, sellerProfile],
  )

  if (!detail && !loading) {
    return (
      <SimpleEmptyState
        title={en.parties.partyNotFound}
        action={(
          <Link href={DASHBOARD_ROUTES.parties}>
            <Button type="button" variant="outline" title={en.navigation.backToParties} icon={<ArrowLeft size={16} />} />
          </Link>
        )}
      />
    )
  }

  const reminderMessage = detail ? buildPartyDueReminder(detail) : ""

  return (
    <div className="dashboard-page space-y-6 pb-8">
      <PageHeader
        eyebrow={en.navigation.parties}
        title={detail?.party.name || en.parties.title}
        description={en.parties.detailSummary}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button type="button" variant="outline" title={en.parties.paymentDirectionReceived} onClick={() => setPaymentMode("received")} className="w-full sm:w-auto" />
            <Button type="button" variant="outline" title={en.parties.paymentDirectionPaid} onClick={() => setPaymentMode("paid")} className="w-full sm:w-auto" />
          </div>
        }
      />

      {detail ? (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label={en.parties.receivable} value={formatCurrency(detail.party.receivable)} />
            <SummaryCard label={en.parties.payable} value={formatCurrency(detail.party.payable)} />
            <SummaryCard label={en.parties.paymentReceived} value={formatCurrency(detail.paymentReceivedTotal)} />
            <SummaryCard label={en.parties.paymentPaid} value={formatCurrency(detail.paymentPaidTotal)} />
          </section>

          <section className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_auto]">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoTile valueClassName="mt-1 text-sm font-semibold text-[var(--text-primary)]" label={en.parties.type} value={detail.party.type === "customer" ? en.parties.customer : detail.party.type === "supplier" ? en.parties.supplier : en.parties.both} />
                <InfoTile valueClassName="mt-1 text-sm font-semibold text-[var(--text-primary)]" label={en.parties.mobile} value={detail.party.mobile || en.common.notAvailable} />
                <InfoTile valueClassName="mt-1 text-sm font-semibold text-[var(--text-primary)]" label={en.parties.email} value={detail.party.email || en.common.notAvailable} />
                <InfoTile valueClassName="mt-1 text-sm font-semibold text-[var(--text-primary)]" label={en.parties.gstin} value={detail.party.gstin || en.common.notAvailable} />
                <InfoTile valueClassName="mt-1 text-sm font-semibold text-[var(--text-primary)]" label={en.parties.address} value={[detail.party.address, detail.party.city, detail.party.state, detail.party.pincode].filter(Boolean).join(", ") || en.common.notAvailable} />
                <InfoTile valueClassName="mt-1 text-sm font-semibold text-[var(--text-primary)]" label={en.parties.balanceDue} value={formatCurrency(detail.balanceDue)} />
              </div>
              <div className="space-y-3">
                <TransactionActionPanel document={statementDocument} message={reminderMessage} />
                <Link href={detail.party.type === "supplier" ? "/dashboard/purchases" : "/dashboard/quick-sale"}>
                  <Button type="button" variant="primary" title={detail.party.type === "supplier" ? en.suppliers.newPurchase : en.sales.createNewSale} className="w-full" />
                </Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <LedgerPanel title={en.parties.salesSection} items={detail.sales.map((sale) => `${sale.receiptNo} • ${formatCurrency(sale.totalAmount)} • ${sale.paymentStatus}`)} emptyText={en.sales.noSalesTitle} />
            <LedgerPanel title={en.parties.purchasesSection} items={detail.purchases.map((purchase) => `${purchase.billNo} • ${formatCurrency(purchase.totalAmount)} • ${purchase.paymentStatus}`)} emptyText={en.suppliers.noPurchaseBills} />
          </section>

          <section className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)]">{en.parties.ledgerHistory}</p>
                <p className="text-sm text-[var(--text-secondary)]">{en.parties.printShareDownload}</p>
              </div>
              <TransactionActionPanel document={statementDocument} message={reminderMessage} />
            </div>
            <div className="mt-4 space-y-3">
              {detail.ledger.length ? detail.ledger.map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{entry.label}</p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">{formatIndianDateTime(entry.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[var(--text-primary)]">{formatCurrency(entry.amount)}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{entry.paymentStatus ? <PaymentStatusBadge status={entry.paymentStatus} /> : entry.paymentMode || en.common.notAvailable}</p>
                    </div>
                  </div>
                  {(entry.note || entry.reference || entry.dueAmount !== undefined) ? (
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {[entry.reference ? `${en.parties.reference}: ${entry.reference}` : "", entry.dueAmount !== undefined ? `${en.sales.dueAmount}: ${formatCurrency(entry.dueAmount)}` : "", entry.note || ""].filter(Boolean).join(" | ")}
                    </p>
                  ) : null}
                </article>
              )) : (
                <SimpleEmptyState title={en.parties.noLedgerEntries} className="p-5" />
              )}
            </div>
          </section>

          <PartyPaymentModal
            open={Boolean(paymentMode)}
            detail={detail}
            direction={paymentMode || "received"}
            onClose={() => setPaymentMode(null)}
          />
        </>
      ) : null}
    </div>
  )
}


function LedgerPanel({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <section className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
      <p className="text-lg font-bold text-[var(--text-primary)]">{title}</p>
      <div className="mt-4 space-y-2">
        {items.length ? items.map((item) => (
          <div key={item} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            {item}
          </div>
        )) : (
          <div className="rounded-2xl border border-dashed border-[var(--border-card)] p-5 text-center text-[var(--text-secondary)]">
            {emptyText}
          </div>
        )}
      </div>
    </section>
  )
}
