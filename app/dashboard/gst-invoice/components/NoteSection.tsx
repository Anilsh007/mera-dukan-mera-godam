import { en } from "@/app/messages/en";
import { Gavel, StickyNote } from "lucide-react";
import { BankNotesProps } from "../types/ui.types";

export default function NoteSection({ invoice, onChange }: BankNotesProps) {
    return (
        <section className="premium-surface min-w-0 rounded-2xl p-4 sm:p-6">
            <h3>Notes</h3>
            <div className="flex gap-4">
                <div className="w-full">
                    <label className="ml-2 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                        <StickyNote size={12} /> {en.gstInvoice.additionalNotes}
                    </label>
                    <div className="relative group">
                        <textarea value={invoice.notes || ""} onChange={(e) => onChange("notes", e.target.value)} rows={3} className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all focus:ring-2 focus:ring-emerald-400" placeholder={en.gstInvoice.addInternalNotes} />
                    </div>
                </div>

                <div className="w-full">
                    <label className="ml-2 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                        <Gavel size={12} /> {en.profile.invoiceTerms}
                    </label>
                    <div className="relative group">
                        <textarea value={invoice.terms || ""} onChange={(e) => onChange("terms", e.target.value)} rows={3}
                            className="w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all focus:ring-2  focus:ring-emerald-400" placeholder={en.gstInvoice.noTermsSpecified}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}