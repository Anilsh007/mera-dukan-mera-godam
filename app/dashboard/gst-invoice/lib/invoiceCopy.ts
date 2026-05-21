import { en } from "@/app/messages/en"
import type { TransactionDocumentData } from "@/app/lib/transactionDocument"

export type GstInvoiceCopyMode = "customer" | "business" | "both" | "draft"

export function getGstInvoiceCopyLabel(mode: Exclude<GstInvoiceCopyMode, "both">) {
  if (mode === "customer") return en.gstInvoice.customerInvoice
  if (mode === "business") return en.gstInvoice.businessCopy
  return en.gstInvoice.draftPreview
}

export function buildGstInvoiceCopyDocuments(
  document: TransactionDocumentData,
  mode: GstInvoiceCopyMode,
): TransactionDocumentData[] {
  if (mode === "both") {
    return [
      withCopyLabel(document, "customer"),
      withCopyLabel(document, "business"),
    ]
  }
  return [withCopyLabel(document, mode)]
}

export function withCopyLabel(
  document: TransactionDocumentData,
  mode: Exclude<GstInvoiceCopyMode, "both">,
): TransactionDocumentData {
  const copyLabel = getGstInvoiceCopyLabel(mode)
  return {
    ...document,
    type: "gst-invoice",
    title: document.title || en.gstInvoice.taxInvoice,
    copyLabel,
    footerNote: mode === "business" ? en.gstInvoice.businessCopyFooter : mode === "draft" ? en.gstInvoice.draftPreviewFooter : document.footerNote,
  }
}
