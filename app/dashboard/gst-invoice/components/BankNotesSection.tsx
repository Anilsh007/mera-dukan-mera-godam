import { Landmark, Gavel, StickyNote } from "lucide-react"
import type { BankNotesProps } from "../types/ui.types"
import { en } from "@/app/messages/en"

export default function BankNotesSection({ invoice, onChange }: BankNotesProps) {
  const bank = invoice.bankDetails

  return (
    <section className="premium-surface min-w-0 rounded-2xl p-4 sm:p-6">
      <h3 className="mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
        <Landmark size={14} /> {en.gstInvoice.bankAndPaymentDetails}
      </h3>

      <div className="mb-10 grid grid-cols-1 gap-4 px-2 min-[420px]:grid-cols-2 sm:gap-x-6 sm:gap-y-8">
        <div>
          <p className="mb-1 text-[9px] font-extrabold uppercase tracking-tighter text-[var(--text-muted)]">{en.profile.bankName}</p>
          <p className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">{bank?.bankName || "---"}</p>
        </div>
        <div>
          <p className="mb-1 text-[9px] font-extrabold uppercase tracking-tighter text-[var(--text-muted)]">{en.profile.accountHolder}</p>
          <p className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">{bank?.accountName || "---"}</p>
        </div>
        <div>
          <p className="mb-1 text-[9px] font-extrabold uppercase tracking-tighter text-[var(--text-muted)]">{en.gstInvoice.accountNo}</p>
          <p className="text-sm font-mono tracking-[0.1em] text-[var(--text-primary)]">{bank?.accountNo || "---"}</p>
        </div>
        <div>
          <p className="mb-1 text-[9px] font-extrabold uppercase tracking-tighter text-[var(--text-muted)]">{en.profile.ifscCode}</p>
          <p className="text-sm font-mono uppercase tracking-widest text-[var(--text-primary)]">{bank?.ifsc || "---"}</p>
        </div>
      </div>

      <div className="space-y-5 border-t border-white/5 pt-6">
        <div className="space-y-2">
          <label className="ml-2 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
            <Gavel size={12} /> {en.profile.invoiceTerms}
          </label>
          <div className="relative group">
            <textarea
              value={invoice.terms || ""}
              onChange={(e) => onChange("terms", e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all focus:ring-2 focus:ring-emerald-400"
              placeholder={en.gstInvoice.noTermsSpecified}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="ml-2 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
            <StickyNote size={12} /> {en.gstInvoice.additionalNotes}
          </label>
          <div className="relative group">
            <textarea
              value={invoice.notes || ""}
              onChange={(e) => onChange("notes", e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all focus:ring-2 focus:ring-emerald-400"
              placeholder={en.gstInvoice.addInternalNotes}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
