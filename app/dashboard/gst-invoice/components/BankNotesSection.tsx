import { Landmark } from "lucide-react"
import type { BankNotesProps } from "../types/ui.types"
import { en } from "@/app/messages/en"

export default function BankNotesSection({ invoice }: BankNotesProps) {
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
    </section>
  )
}
