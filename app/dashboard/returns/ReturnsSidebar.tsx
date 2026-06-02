"use client"

import { ArrowDownLeft, ArrowUpRight, FileText, Link2 } from "lucide-react"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"
import { buildReturnTransactionDocument } from "@/app/lib/returns/return.documents"
import type { BusinessDocumentProfile } from "@/app/lib/transactionDocument"
import type { ReturnDocumentRecord } from "@/app/lib/db"

type ReturnsSidebarProps = {
  documentsLoading: boolean
  visibleDocuments: ReturnDocumentRecord[]
  sellerProfile: BusinessDocumentProfile
  canPrintShare: boolean
}

export default function ReturnsSidebar({ documentsLoading, visibleDocuments, sellerProfile, canPrintShare }: ReturnsSidebarProps) {
  return (
    <aside className="premium-surface h-fit rounded-3xl p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Link2 size={18} className="text-[var(--accent)]" />
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.returns.savedDocuments}</h2>
      </div>
      {documentsLoading ? (
        <p className="text-sm text-[var(--text-secondary)]">{en.common.loading}</p>
      ) : visibleDocuments.length ? (
        <div className="space-y-3">
          {visibleDocuments.map((record) => {
            const document = buildReturnTransactionDocument(record, sellerProfile)
            return (
              <div key={record.id} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{record.documentNo}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{en.returns.stockImpacts[record.stockImpact]}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{formatCurrency(record.totalAmount)}</p>
                  </div>
                  {record.stockImpact === "stock-in" ? <ArrowDownLeft size={18} className="text-emerald-500" /> : record.stockImpact === "stock-out" ? <ArrowUpRight size={18} className="text-amber-500" /> : <FileText size={18} className="text-[var(--accent)]" />}
                </div>
                {canPrintShare ? (
                  <TransactionActionPanel document={document} compact className="mt-3" />
                ) : (
                  <p className="mt-3 text-xs text-[var(--text-secondary)]">{en.returns.printShareLocked}</p>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border-input)] p-5 text-center">
          <p className="font-semibold text-[var(--text-primary)]">{en.returns.noDocumentsTitle}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.returns.noDocumentsDescription}</p>
        </div>
      )}
    </aside>
  )
}
