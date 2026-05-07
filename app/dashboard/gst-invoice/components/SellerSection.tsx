import { Mail, Phone, MapPin, Building2 } from "lucide-react";
import { SellerSectionProps } from "../types/ui.types";

export default function SellerSection({ seller }: SellerSectionProps) {
  return (
    <section className="p-4 sm:p-6 bg-[var(--bg-card-strong)] backdrop-blur-xl border border-[var(--border-card)] rounded-2xl shadow-[var(--shadow-card)]">
      <h3 className="flex items-center gap-2 text-[10px] font-bold mb-4 text-slate-500 uppercase tracking-[0.3em]"><Building2 size={14} /> Seller Information </h3>

      <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-5"> {seller.name}</h2>

      <div>
        {/* Contact Details Box */}
        <div>
          <div className="space-y-4">
            <div>
              <p className="text-[9px] text-slate-600 uppercase font-bold mb-1">Phone</p>
              <p className="flex items-center gap-2 text-sm text-slate-200 font-medium"><Phone size={14} className="text-emerald-500" /> {seller.phone || "---"}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-600 uppercase font-bold mb-1">Email</p>
              <p className="flex items-center gap-2 text-sm text-slate-200 truncate font-medium"><Mail size={14} className="text-emerald-500" /> {seller.email || "---"}</p>
            </div>
          </div>


          <div className="space-y-4 lg:mt-6">
            
            <div>
              <p className="text-[9px] text-slate-600 uppercase font-bold mb-1">GSTIN</p>
              <p className="text-sm font-mono text-amber-200/80">{seller.gstin || "---"}</p>
            </div>
            <div className="pt-3 border-t border-white/5">
              <p className="text-[9px] text-slate-600 uppercase font-bold mb-2 flex items-center gap-1">
                <MapPin size={10} /> Registered Address
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                {seller.address}, {seller.city}, {seller.state} {seller.pincode && `(${seller.pincode})`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
