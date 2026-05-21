import { en } from "@/app/messages/en"
import {
  buildMessageDocument,
  buildTransactionDocumentFilename,
  buildTransactionDocumentShareText,
  createTransactionDocumentPdfBlob,
  downloadTransactionDocument,
  type BusinessDocumentProfile,
  type TransactionDocumentData,
} from "@/app/lib/transactionDocument"

export { downloadTransactionDocument } from "@/app/lib/transactionDocument"

export type ShareResult = "shared" | "downloaded" | "copied" | "failed"

export function getPdfFilename(filename: string | undefined, document?: TransactionDocumentData) {
  if (document) return buildTransactionDocumentFilename(document, filename)
  const base = (filename || "document.pdf").replace(/\.txt$/i, ".pdf")
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`
}


function readReportNumber(source: unknown, keys: string[]) {
  if (!source || typeof source !== "object") return 0
  const record = source as Record<string, unknown>
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^0-9.-]/g, ""))
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return 0
}

function readReportText(source: unknown, keys: string[]) {
  if (!source || typeof source !== "object") return ""
  const record = source as Record<string, unknown>
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return ""
}

export function buildReportShareMessage(...args: unknown[]) {
  const report = args.find((arg) => arg && typeof arg === "object")
  const rangeLabel = args.map((arg) => (typeof arg === "string" ? arg.trim() : "")).find(Boolean) || readReportText(report, ["rangeLabel", "periodLabel", "dateRange", "range"])

  const rows = [
    [en.reports.inventoryValue, readReportNumber(report, ["inventoryValue", "stockValue", "totalStockValue"])],
    [en.reports.salesInPeriod, readReportNumber(report, ["periodSales", "salesInPeriod", "totalSales", "salesTotal"])],
    [en.reports.purchaseValue, readReportNumber(report, ["purchaseTotal", "purchaseValue", "totalPurchase", "totalPurchases"])],
    [en.reports.gstCollected, readReportNumber(report, ["gstCollected", "totalGstCollected", "gstOutput"])],
    [en.reports.gstPaid, readReportNumber(report, ["gstPaid", "totalGstPaid", "gstInput"])],
    [en.reports.supplierDue, readReportNumber(report, ["supplierDue", "totalSupplierDue", "dueAmount"])],
    [en.reports.lowCriticalStock, readReportNumber(report, ["lowStockCount", "criticalStockCount", "lowCriticalStock"])],
    [en.reports.outOfStock, readReportNumber(report, ["outOfStockCount", "outOfStock"])],
  ]

  return [
    en.share.reportTitle,
    rangeLabel ? `${en.reports.rangeLabel}: ${rangeLabel}` : "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ]
    .filter(Boolean)
    .join("\n")
}

export function downloadTextFile(content: string, filename: string, type = "text/plain;charset=utf-8") {
  if (typeof document === "undefined" || typeof URL === "undefined") return false
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
  return true
}

export function buildShareDocument({
  document,
  message,
  subject,
  seller,
}: {
  document?: TransactionDocumentData
  message?: string
  subject?: string
  seller?: BusinessDocumentProfile
}) {
  if (document) return document
  if (!message?.trim()) return undefined
  return buildMessageDocument({ message, subject, seller })
}

export async function shareTransactionDocumentNative(
  document: TransactionDocumentData,
  filename?: string,
): Promise<ShareResult> {
  if (typeof navigator === "undefined") return "failed"
  const pdfName = getPdfFilename(filename, document)
  const text = buildTransactionDocumentShareText(document)
  try {
    const blob = createTransactionDocumentPdfBlob(document)
    const file = new File([blob], pdfName, { type: "application/pdf" })
    const canShareFiles = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })
    if (canShareFiles && typeof navigator.share === "function") {
      await navigator.share({ title: document.title, text, files: [file] })
      return "shared"
    }
    if (typeof navigator.share === "function") {
      await navigator.share({ title: document.title, text })
      downloadTransactionDocument(document, pdfName)
      return "downloaded"
    }
  } catch {
    return "failed"
  }
  return "failed"
}

export async function shareTransactionDocumentOnWhatsApp(
  document: TransactionDocumentData,
  title?: string,
  filename?: string,
): Promise<ShareResult> {
  if (typeof window === "undefined") return "failed"
  const text = [title || document.title, buildTransactionDocumentShareText(document), en.share.pdfDownloadedForManualAttach].filter(Boolean).join("\n\n")
  const downloaded = downloadTransactionDocument(document, getPdfFilename(filename, document))
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, "_blank", "noopener,noreferrer")
  return downloaded ? "downloaded" : "shared"
}

export async function shareTransactionDocumentByEmail(
  document: TransactionDocumentData,
  title?: string,
  filename?: string,
): Promise<ShareResult> {
  if (typeof window === "undefined") return "failed"
  const subject = encodeURIComponent(title || document.title)
  const body = encodeURIComponent([
    buildTransactionDocumentShareText(document),
    "",
    en.share.pdfDownloadedForManualAttach,
  ].join("\n"))
  const downloaded = downloadTransactionDocument(document, getPdfFilename(filename, document))
  window.location.href = `mailto:?subject=${subject}&body=${body}`
  return downloaded ? "downloaded" : "shared"
}

export async function copyTransactionDocument(document: TransactionDocumentData): Promise<ShareResult> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return "failed"
  try {
    await navigator.clipboard.writeText(buildTransactionDocumentShareText(document))
    return "copied"
  } catch {
    return "failed"
  }
}

export function downloadMessageAsPdf({
  message,
  subject,
  filename,
  seller,
}: {
  message: string
  subject?: string
  filename?: string
  seller?: BusinessDocumentProfile
}) {
  const document = buildMessageDocument({ message, subject, seller })
  return downloadTransactionDocument(document, getPdfFilename(filename, document))
}
