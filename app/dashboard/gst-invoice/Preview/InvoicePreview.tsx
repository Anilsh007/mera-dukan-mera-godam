"use client"

import TransactionDocument from "@/app/components/ui/TransactionDocument"
import type { GSTInvoice } from "../types/gst.types"
import { en } from "@/app/messages/en"
import type { BusinessDocumentProfile, TransactionDocumentData } from "@/app/lib/transactionDocument"

export default function InvoicePreview({ invoice }: { invoice: GSTInvoice }) {
  const documentData = buildGstInvoiceDocument(invoice)

  return (
    <TransactionDocument
      document={documentData}
      profile={documentData.seller}
      requireGstin
      className="min-w-0"
    />
  )
}

export function buildGstInvoiceDocument(invoice: GSTInvoice): TransactionDocumentData & { seller: BusinessDocumentProfile } {
  const seller: BusinessDocumentProfile = {
    businessName: invoice.seller.name,
    logoUrl: invoice.seller.logoUrl,
    address: invoice.seller.address,
    city: invoice.seller.city,
    state: invoice.seller.state,
    pincode: invoice.seller.pincode,
    mobile: invoice.seller.phone,
    email: invoice.seller.email,
    gstin: invoice.seller.gstin,
    terms: invoice.terms,
    paymentDetails: {
      accountName: invoice.bankDetails?.accountName,
      accountNumber: invoice.bankDetails?.accountNo,
      ifsc: invoice.bankDetails?.ifsc,
      bankName: invoice.bankDetails?.bankName,
    },
  }

  const totalGst = Number(invoice.totals.cgstTotal || 0) + Number(invoice.totals.sgstTotal || 0) + Number(invoice.totals.igstTotal || 0)

  return {
    type: "gst-invoice",
    title: en.gstInvoice.taxInvoice,
    reference: invoice.invoiceNo,
    date: invoice.invoiceDate,
    seller,
    partyLabel: en.gstInvoice.billTo,
    party: {
      name: invoice.buyer.name,
      gstin: invoice.buyer.gstin,
      phone: invoice.buyer.phone,
      email: invoice.buyer.email,
      address: invoice.buyer.address,
      city: invoice.buyer.city,
      state: invoice.buyer.state,
      pincode: invoice.buyer.pincode,
    },
    items: invoice.items.map((item) => ({
      name: item.name || item.description || "-",
      description: item.hsnSacDescription || item.gstCondition || "",
      hsnCode: item.hsnCode,
      quantity: item.quantity,
      unit: item.unit,
      rate: item.rate,
      discount: item.discount,
      gstRate: item.gstRate,
      taxableAmount: item.taxableValue,
      cgstAmount: item.cgstAmount,
      sgstAmount: item.sgstAmount,
      igstAmount: item.igstAmount,
      total: item.total,
    })),
    totals: {
      taxableAmount: invoice.totals.taxableValue,
      cgstTotal: invoice.totals.cgstTotal,
      sgstTotal: invoice.totals.sgstTotal,
      igstTotal: invoice.totals.igstTotal,
      totalGst,
      grandTotal: invoice.totals.grandTotal,
      amountInWords: invoice.totals.amountInWords,
    },
    notes: invoice.notes,
    terms: invoice.terms,
  }
}
