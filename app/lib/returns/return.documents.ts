import type { ReturnDocumentRecord } from "@/app/lib/db"
import type { BusinessDocumentProfile, TransactionDocumentData, TransactionDocumentType } from "@/app/lib/transactionDocument"
import { buildTransactionDocumentItem, calculateDocumentTaxTotals } from "@/app/lib/transactionDocumentItems"
import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"
import { getReturnKindLabel } from "./return.utils"

export function buildReturnTransactionDocument(
  record: ReturnDocumentRecord,
  seller: BusinessDocumentProfile,
): TransactionDocumentData {
  const { cgstTotal, sgstTotal, igstTotal } = calculateDocumentTaxTotals(record.items)
  const linkedReference = record.linkedSaleReceiptNo || record.linkedPurchaseBillNo || record.linkedInvoiceNo

  return {
    type: record.kind as TransactionDocumentType,
    title: getReturnKindLabel(record.kind),
    reference: record.documentNo,
    date: record.documentDateTime,
    seller,
    partyLabel: record.kind === "purchase-return" || record.kind === "debit-note" ? en.transaction.purchasePartyLabel : en.receipt.buyer,
    party: record.party,
    paymentMode: `${en.returns.paymentAdjustment}: ${formatCurrency(record.paymentAdjustment)}`,
    items: record.items.map((item) => buildTransactionDocumentItem(item)),
    totals: {
      taxableAmount: record.taxableAmount,
      cgstTotal,
      sgstTotal,
      igstTotal,
      totalGst: record.gstAmount,
      grandTotal: record.totalAmount,
      dueAmount: record.dueAdjustment,
    },
    notes: [
      linkedReference ? `${en.returns.linkedReference}: ${linkedReference}` : "",
      `${en.returns.stockImpact}: ${en.returns.stockImpacts[record.stockImpact]}`,
      record.note,
      record.auditNote,
    ]
      .filter(Boolean)
      .join("\n"),
    footerNote: en.returns.footerNote,
  }
}
