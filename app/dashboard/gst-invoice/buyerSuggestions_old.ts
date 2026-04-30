import type { GSTInvoiceParty, GSTInvoiceRecord } from "./types/gst.types";
import { buildBuyerKey } from "./lib/buyerHelpers";   // ← NEW

export type BuyerSuggestion = {
  key: string;
  buyer: GSTInvoiceParty;
  lastInvoiceNo?: string;
  lastInvoiceDate?: string;
};

export function buildBuyerSuggestions(invoices: GSTInvoiceRecord[]): BuyerSuggestion[] {
  const buyers = new Map<string, BuyerSuggestion>();

  for (const invoice of invoices) {
    const buyer = invoice.buyer;
    const key = buildBuyerKey(buyer);               // ← UPDATED (no local duplicate)

    if (!key) continue;

    const existing = buyers.get(key);
    if (!existing || (invoice.invoiceDate || "") > (existing.lastInvoiceDate || "")) {
      buyers.set(key, {
        key,
        buyer: {
          name: buyer.name || "",
          gstin: buyer.gstin || "",
          address: buyer.address || "",
          city: buyer.city || "",
          state: buyer.state || "",
          pincode: buyer.pincode || "",
          phone: buyer.phone || "",
          email: buyer.email || "",
        },
        lastInvoiceNo: invoice.invoiceNo,
        lastInvoiceDate: invoice.invoiceDate,
      });
    }
  }

  return Array.from(buyers.values()).sort((l, r) =>
    (r.lastInvoiceDate || "").localeCompare(l.lastInvoiceDate || "")
  );
}
