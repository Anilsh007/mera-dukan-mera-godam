// src/lib/buyerHelpers.ts
import type { GSTInvoiceParty } from "../types/gst.types";

/**
 * Generates a deterministic key for a buyer.
 * Order of priority: gstin → phone → email → name.
 * Returns `null` when none of those fields are present.
 */
export function buildBuyerKey(buyer: GSTInvoiceParty): string | null {
  if (buyer.gstin?.trim())
    return `gstin:${buyer.gstin.trim().toLowerCase()}`;

  if (buyer.phone?.trim())
    return `phone:${buyer.phone.trim().toLowerCase()}`;

  if (buyer.email?.trim())
    return `email:${buyer.email.trim().toLowerCase()}`;

  if (buyer.name?.trim())
    return `name:${buyer.name.trim().toLowerCase()}`;

  return null;
}
