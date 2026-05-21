import { createEmptyInvoiceItem } from "@/app/dashboard/gst-invoice/types/gst.types"
import type { SaleCustomer, SaleRecord } from "@/app/lib/db"
import type { BusinessDocumentProfile, TransactionDocumentData } from "@/app/lib/transactionDocument"
import { buildTransactionDocumentItem, toTitleCase } from "@/app/lib/transactionDocumentItems"
import { en } from "@/app/messages/en"

export function buildSaleTransactionDocument(
  sale: Pick<
    SaleRecord,
    | "receiptNo"
    | "saleDateTime"
    | "paymentMode"
    | "paymentStatus"
    | "note"
    | "items"
    | "totalAmount"
    | "taxableAmount"
    | "gstAmount"
    | "amountPaid"
    | "dueAmount"
  > & { customer?: SaleCustomer },
  seller: BusinessDocumentProfile,
): TransactionDocumentData {
  return {
    type: "sale",
    title: en.transaction.saleReceipt,
    reference: sale.receiptNo,
    date: sale.saleDateTime,
    seller,
    partyLabel: en.receipt.buyer,
    party: sale.customer,
    paymentMode: `${sale.paymentStatus}${sale.paymentMode ? ` / ${sale.paymentMode}` : ""}`,
    items: sale.items.map((item) => buildTransactionDocumentItem(item, { titleCaseName: true })),
    totals: {
      taxableAmount: sale.taxableAmount,
      totalGst: sale.gstAmount,
      grandTotal: sale.totalAmount,
      paidAmount: sale.amountPaid,
      dueAmount: sale.dueAmount,
    },
    notes: sale.note,
  }
}

export function buildSaleInvoiceDraftFromRecord(sale: Pick<SaleRecord, "customer" | "items" | "note" | "createdAt">) {
  return {
    buyer: {
      name: sale.customer?.name || "",
      gstin: sale.customer?.gstin || "",
      phone: sale.customer?.phone || "",
      email: sale.customer?.email || "",
      address: sale.customer?.address || "",
      city: sale.customer?.city || "",
      state: sale.customer?.state || "",
      pincode: sale.customer?.pincode || "",
    },
    items: sale.items.map((line) => {
      const item = createEmptyInvoiceItem()
      item.name = toTitleCase(line.name)
      item.description = toTitleCase(line.name)
      item.hsnCode = line.hsnCode || ""
      item.quantity = line.quantity
      item.rate = line.salePrice
      item.discount = line.discount
      item.gstRate = line.gstRate
      item.unit = line.quantityUnit
      return item
    }),
    notes: sale.note,
    createdAt: sale.createdAt,
  }
}
