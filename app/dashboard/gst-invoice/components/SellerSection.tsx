import { Mail, Phone, MapPin, Building2 } from "lucide-react"
import { SellerSectionProps } from "../types/ui.types"
import { en } from "@/app/messages/en"

export default function SellerSection({ seller }: SellerSectionProps) {
  return (
    <section className="premium-surface min-w-0 rounded-2xl p-4 sm:p-6">
      <h3 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">
        <Building2 size={14} /> {en.gstInvoice.sellerInformation}
      </h3>

      <h2 className="mb-5 flex items-center gap-2 text-xl font-bold uppercase tracking-wide text-[var(--text-primary)]">
        {seller.name}
      </h2>

      <div className="space-y-4">
        <div>
          <p className="mb-1 text-[9px] font-bold uppercase text-[var(--text-muted)]">{en.profile.phone}</p>
          <p className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <Phone size={14} className="text-teal-600 dark:text-teal-300" /> {seller.phone || "---"}
          </p>
        </div>
        <div>
          <p className="mb-1 text-[9px] font-bold uppercase text-[var(--text-muted)]">{en.profile.email}</p>
          <p className="flex items-center gap-2 truncate text-sm font-medium text-[var(--text-primary)]">
            <Mail size={14} className="text-teal-600 dark:text-teal-300" /> {seller.email || "---"}
          </p>
        </div>

        <div className="space-y-4 lg:mt-6">
          <div>
            <p className="mb-1 text-[9px] font-bold uppercase text-[var(--text-muted)]">{en.gstInvoice.gstin}</p>
            <p className="font-mono text-sm text-amber-700 dark:text-amber-300">{seller.gstin || "---"}</p>
          </div>
          <div className="border-t border-[var(--border-card)] pt-3">
            <p className="mb-2 flex items-center gap-1 text-[9px] font-bold uppercase text-[var(--text-muted)]">
              <MapPin size={10} /> {en.gstInvoice.registeredAddress}
            </p>
            <p className="text-[11px] italic leading-relaxed text-[var(--text-secondary)]">
              {seller.address}, {seller.city}, {seller.state} {seller.pincode && `(${seller.pincode})`}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
