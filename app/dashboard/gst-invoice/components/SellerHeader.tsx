import Image from "next/image";
import type { GSTInvoiceParty } from "../types/gst.types";
import { en } from "@/app/messages/en";

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
            alt={en.profile.logoAlt}
            width={64}
            height={64}
            className="h-16 w-16 rounded-lg border object-contain"
          />
        )}

        {/* Seller Info */}
        <div>
          <h2 className="mt-2 text-xl font-bold sm:text-2xl">
            {seller.name || en.gstInvoice.businessName}
          </h2>

          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
            <span><b>{en.profile.phone}:</b> {seller.phone || en.common.notAvailable}</span>
            <span><b>{en.profile.email}:</b> {seller.email || en.common.notAvailable}</span>
          </div>

          <p className="text-sm text-slate-600">
            <b>{en.profile.address}:</b> {seller.address || en.gstInvoice.sellerAddress}
            {seller.city ? `, ${seller.city}` : ""}
            {seller.state ? `, ${seller.state}` : ""}
            {seller.pincode ? ` - ${seller.pincode}` : ""}
          </p>

          <p className="mt-1 text-sm text-slate-600"><b>{en.gstInvoice.gstin}:</b> {seller.gstin || en.common.notAvailable}
          </p>
        </div>
      </div>
    </div>
  );
}
