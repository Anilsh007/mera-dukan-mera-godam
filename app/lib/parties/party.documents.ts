import { en } from "@/app/messages/en"
import type { BusinessDocumentProfile, TransactionDocumentData } from "@/app/lib/transactionDocument"
import type { PartyDetailData } from "./party.service"

export function buildPartyStatementDocument(
  detail: PartyDetailData,
  seller: BusinessDocumentProfile,
): TransactionDocumentData {
  return {
    type: "sale",
    title: `${en.parties.statement} - ${detail.party.name}`,
    reference: detail.party.name,
    date: new Date().toLocaleString("en-IN"),
    seller,
    partyLabel: en.parties.partyDetails,
    party: {
      name: detail.party.name,
      gstin: detail.party.gstin,
      phone: detail.party.mobile,
      email: detail.party.email,
      address: detail.party.address,
      city: detail.party.city,
      state: detail.party.state,
      pincode: detail.party.pincode,
    },
    items: detail.ledger.slice(0, 24).map((entry) => ({
      name: entry.label,
      description: [
        entry.paymentStatus ? `${en.sales.paymentStatus}: ${entry.paymentStatus}` : "",
        entry.paymentMode ? `${en.purchases.paymentMode}: ${entry.paymentMode}` : "",
        entry.reference ? `${en.parties.reference}: ${entry.reference}` : "",
        entry.note || "",
      ]
        .filter(Boolean)
        .join(" | "),
      quantity: 1,
      rate: entry.amount,
      total: entry.amount,
    })),
    totals: {
      grandTotal: Math.max(detail.party.receivable, detail.party.payable),
      paidAmount: detail.paymentReceivedTotal,
      dueAmount: Math.max(detail.party.receivable - detail.paymentReceivedTotal, 0),
    },
    notes: [
      `${en.parties.receivable}: ${en.common.rupeeSymbol} ${detail.party.receivable.toLocaleString("en-IN")}`,
      `${en.parties.payable}: ${en.common.rupeeSymbol} ${detail.party.payable.toLocaleString("en-IN")}`,
      `${en.parties.balanceDue}: ${en.common.rupeeSymbol} ${detail.balanceDue.toLocaleString("en-IN")}`,
    ].join(" | "),
  }
}
