// src/components/SellerHeader.tsx
import type { GSTInvoiceParty } from "../types/gst.types";

type Props = {
  seller: GSTInvoiceParty;
};

export default function SellerHeader({ seller }: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Tax Invoice
        </p>
        <h2 className="mt-2 text-xl font-bold sm:text-2xl">
          {seller.name || "Business Name"}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {seller.address || "Seller address"}
          {seller.city ? `, ${seller.city}` : ""}
          {seller.state ? `, ${seller.state}` : ""}
          {seller.pincode ? ` - ${seller.pincode}` : ""}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          GSTIN: {seller.gstin || "Not Available"}
        </p>
      </div>

      {/* The small box with invoice meta (already present in the preview) stays untouched */}
    </div>
  );
}
