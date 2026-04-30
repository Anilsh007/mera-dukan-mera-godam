import { Landmark, User, CreditCard, Fingerprint, Gavel, StickyNote } from "lucide-react";
import type { BankNotesProps } from "../types/ui.types";

export default function BankNotesSection({ invoice, onChange }: BankNotesProps) {
  const bank = invoice.bankDetails;

  return (
    <section className="p-4 sm:p-6 bg-[var(--bg-card-strong)] backdrop-blur-xl border border-[var(--border-card)] rounded-2xl shadow-[var(--shadow-card)]">
      <h3 className="text-[10px] font-bold mb-8 text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
        <Landmark size={14} /> Bank & Payment Details
      </h3>

      {/* Bank Details 2x2 Grid */}
      <div className="grid grid-cols-2 gap-y-8 gap-x-6 px-2 mb-10">
        <div>
          <p className="text-[9px] text-slate-600 uppercase font-extrabold mb-1 tracking-tighter">Bank Name</p>
          <p className="text-sm text-slate-100 font-semibold tracking-tight">{bank?.bankName || "---"}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-600 uppercase font-extrabold mb-1 tracking-tighter">Account Holder</p>
          <p className="text-sm text-slate-100 font-semibold tracking-tight">{bank?.accountName || "---"}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-600 uppercase font-extrabold mb-1 tracking-tighter">Account No</p>
          <p className="text-sm font-mono text-slate-100 tracking-[0.1em]">{bank?.accountNo || "---"}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-600 uppercase font-extrabold mb-1 tracking-tighter">IFSC Code</p>
          <p className="text-sm font-mono text-slate-100 uppercase tracking-widest">{bank?.ifsc || "---"}</p>
        </div>
      </div>

      {/* Interactive Notes Section */}
      <div className="space-y-5 pt-6 border-t border-white/5">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500 ml-2">
            <Gavel size={12} /> Terms & Conditions
          </label>
          <div className="relative group">
            <textarea value={invoice.terms || ""} onChange={(e) => onChange("terms", e.target.value)} rows={1} className="w-full p-2 rounded-xl border bg-[var(--bg-input)] border-[var(--border-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-emerald-400 outline-none transition-all" placeholder="No terms specified..." />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500 ml-2">
            <StickyNote size={12} /> Additional Notes
          </label>
          <div className="relative group">
            <textarea value={invoice.notes || ""} onChange={(e) => onChange("notes", e.target.value)} rows={1} className="w-full p-2 rounded-xl border bg-[var(--bg-input)] border-[var(--border-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-emerald-400 outline-none transition-all" placeholder="Add internal notes..." />
          </div>
        </div>
      </div>
    </section>
  );
}
