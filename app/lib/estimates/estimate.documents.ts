import type { EstimateRecord, SaleCustomer } from "@/app/lib/db"
import type { BusinessDocumentProfile, TransactionDocumentData } from "@/app/lib/transactionDocument"
import { buildInvoiceDraftItemsFromEstimate } from "@/app/lib/estimates/estimate.utils"
import { buildTransactionDocumentItem, calculateDocumentTaxTotals } from "@/app/lib/transactionDocumentItems"
import { en } from "@/app/messages/en"

export function buildEstimateTransactionDocument(
  estimate: Pick<
    EstimateRecord,
    | "estimateNo"
    | "estimateDateTime"
    | "expiryDate"
    | "status"
    | "note"
    | "terms"
    | "items"
    | "totalAmount"
    | "taxableAmount"
    | "gstAmount"
  > & { customer?: SaleCustomer },
  seller: BusinessDocumentProfile,
): TransactionDocumentData {
  const { cgstTotal, sgstTotal, igstTotal } = calculateDocumentTaxTotals(estimate.items)

  return {
    type: "estimate",
    title: en.estimates.documentTitle,
    reference: estimate.estimateNo,
    date: estimate.estimateDateTime,
    dueDate: estimate.expiryDate,
    seller,
    partyLabel: en.receipt.buyer,
    party: estimate.customer,
    paymentMode: `${en.estimates.statusLabel}: ${en.estimates.statuses[estimate.status]}`,
    items: estimate.items.map((item) => buildTransactionDocumentItem(item)),
    totals: {
      taxableAmount: estimate.taxableAmount,
      cgstTotal,
      sgstTotal,
      igstTotal,
      totalGst: estimate.gstAmount,
      grandTotal: estimate.totalAmount,
    },
    notes: estimate.note,
    terms: estimate.terms,
    footerNote: en.estimates.footerNote,
  }
}

export function buildEstimateInvoiceDraft(estimate: EstimateRecord) {
  return {
    buyer: {
      name: estimate.customer?.name || "",
      gstin: estimate.customer?.gstin || "",
      phone: estimate.customer?.phone || "",
      email: estimate.customer?.email || "",
      address: estimate.customer?.address || "",
      city: estimate.customer?.city || "",
      state: estimate.customer?.state || "",
      pincode: estimate.customer?.pincode || "",
    },
    items: buildInvoiceDraftItemsFromEstimate(estimate),
    notes: [estimate.note, estimate.terms].filter(Boolean).join("\n\n"),
    createdAt: new Date().toISOString(),
  }
}
