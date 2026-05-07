import Image from "next/image";
import type { GSTInvoiceParty } from "../types/gst.types";

type Props = {
  seller: GSTInvoiceParty;
};

export default function SellerHeader({ seller }: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">

      {/* LEFT: Logo + Info */}
      <div className="flex gap-4 items-start">

        {/* ✅ LOGO (conditional) */}
        {seller.logoUrl && (
          <Image
            src={seller.logoUrl}
            alt="Logo"
            width={64}
            height={64}
            className="h-16 w-16 rounded-lg border object-contain"
          />
        )}

        {/* Seller Info */}
        <div>
          {/* <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tax Invoice</p> */}

          <h2 className="mt-2 text-xl font-bold sm:text-2xl">
            {seller.name || "Business Name"}
          </h2>

          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
            <span><b>Phone:</b> {seller.phone || "Not Available"}</span>
            <span><b>Email:</b> {seller.email || "Not Available"}</span>
          </div>

          <p className="text-sm text-slate-600">
            <b>Address:</b> {seller.address || "Seller address"}
            {seller.city ? `, ${seller.city}` : ""}
            {seller.state ? `, ${seller.state}` : ""}
            {seller.pincode ? ` - ${seller.pincode}` : ""}
          </p>

          <p className="mt-1 text-sm text-slate-600"><b>GSTIN:</b> {seller.gstin || "Not Available"}
          </p>
        </div>
      </div>
    </div>
  );
}
