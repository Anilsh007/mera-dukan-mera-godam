"use client"

import { en } from "@/app/messages/en"
import {
  buildTransactionPrintHtml,
  formatMoney,
  getAddressLine,
  type TransactionDocumentData,
} from "@/app/lib/transactionDocument"
import { notify } from "@/app/lib/notifications"

export type SharePayload = {
  title: string
  text: string
  url?: string
}

function hasBrowserApis() {
  return typeof window !== "undefined" && typeof document !== "undefined"
}

function cleanLine(value?: string | null) {
  return value?.trim() || ""
}

function addLine(lines: string[], label: string, value?: string | number | null) {
  const text = typeof value === "number" ? String(value) : cleanLine(value)
  if (text) lines.push(`${label}: ${text}`)
}

function getGrandTotal(data: TransactionDocumentData) {
  return data.totals?.grandTotal ?? data.items.reduce((sum, item) => sum + Number(item.total || 0), 0)
}

function paymentStatusFromTotals(data: TransactionDocumentData) {
  const dueAmount = Number(data.totals?.dueAmount || 0)
  const paidAmount = Number(data.totals?.paidAmount || 0)
  const grandTotal = getGrandTotal(data)

  if (dueAmount > 0 && paidAmount > 0) return en.share.paymentPartlyPaid
  if (dueAmount > 0) return en.share.paymentDue
  if (paidAmount > 0 || grandTotal > 0) return en.share.paymentPaid
  return ""
}

export function buildShareMessage(data: TransactionDocumentData) {
  const seller = data.seller || {}
  const party = data.party || {}
  const lines: string[] = []

  lines.push(seller.businessName || en.common.appName)
  lines.push(data.title || en.share.transactionDetails)
  addLine(lines, en.share.transactionType, data.type)
  addLine(lines, en.receipt.ref, data.reference)
  addLine(lines, en.receipt.date, data.date || new Date().toLocaleString("en-IN"))
  addLine(lines, en.share.businessName, seller.businessName)
  addLine(lines, en.gstInvoice.gstin, seller.gstin)
  addLine(lines, en.share.businessAddress, getAddressLine(seller))

  if (Object.values(party).some(Boolean)) {
    lines.push("")
    addLine(lines, data.partyLabel || en.receipt.buyer, party.name)
    addLine(lines, en.gstInvoice.gstin, party.gstin)
    addLine(lines, en.profile.phone, party.phone)
    addLine(lines, en.profile.email, party.email)
    addLine(lines, en.profile.address, getAddressLine(party))
  }

  if (data.items.length) {
    lines.push("")
    lines.push(`${en.share.itemDetails}:`)
    data.items.forEach((item, index) => {
      const quantity = [item.quantity, item.unit].filter(Boolean).join(" ")
      const parts = [
        item.name,
        quantity ? `${en.receipt.qty} ${quantity}` : "",
        typeof item.rate === "number" ? `${en.receipt.rate} ${formatMoney(item.rate)}` : "",
        item.gstRate !== undefined ? `${en.gstInvoice.gst} ${Number(item.gstRate).toFixed(2)}%` : "",
        `${en.receipt.total} ${formatMoney(item.total)}`,
      ].filter(Boolean)
      lines.push(`${index + 1}. ${parts.join(" | ")}`)
      if (item.note) lines.push(`   ${en.gstInvoice.notes}: ${item.note}`)
    })
  }

  lines.push("")
  addLine(lines, en.gstInvoice.taxableValue, data.totals?.taxableAmount !== undefined ? formatMoney(data.totals.taxableAmount) : "")
  addLine(lines, en.gstInvoice.cgst, data.totals?.cgstTotal !== undefined ? formatMoney(data.totals.cgstTotal) : "")
  addLine(lines, en.gstInvoice.sgstUtgst, data.totals?.sgstTotal !== undefined ? formatMoney(data.totals.sgstTotal) : "")
  addLine(lines, en.gstInvoice.igst, data.totals?.igstTotal !== undefined ? formatMoney(data.totals.igstTotal) : "")
  addLine(lines, en.transaction.totalGst, data.totals?.totalGst !== undefined ? formatMoney(data.totals.totalGst) : "")
  addLine(lines, en.receipt.grandTotal, formatMoney(getGrandTotal(data)))
  addLine(lines, en.purchases.paid, data.totals?.paidAmount !== undefined ? formatMoney(data.totals.paidAmount) : "")
  addLine(lines, en.purchases.due, data.totals?.dueAmount !== undefined ? formatMoney(data.totals.dueAmount) : "")
  addLine(lines, en.transaction.paymentMode, data.paymentMode)
  addLine(lines, en.share.paymentStatus, paymentStatusFromTotals(data))

  if (data.notes) {
    lines.push("")
    addLine(lines, en.gstInvoice.notes, data.notes)
  }

  lines.push("")
  lines.push(data.footerNote || en.share.footerNote)

  return lines.filter((line, index, arr) => line !== "" || arr[index - 1] !== "").join("\n")
}

export function buildInvoiceShareMessage(data: TransactionDocumentData) {
  return buildShareMessage({ ...data, type: "gst-invoice" })
}

export function buildReceiptShareMessage(data: TransactionDocumentData) {
  return buildShareMessage({ ...data, type: "receipt" })
}

export function buildPurchaseShareMessage(data: TransactionDocumentData) {
  return buildShareMessage({ ...data, type: "purchase" })
}

export function buildStockShareMessage(data: TransactionDocumentData) {
  return buildShareMessage(data)
}

export function buildReportShareMessage(summaryLines: Array<[string, string | number]>, title = en.share.reportTitle) {
  return [
    en.common.appName,
    title,
    new Date().toLocaleString("en-IN"),
    "",
    ...summaryLines.map(([label, value]) => `${label}: ${value}`),
    "",
    en.share.footerNote,
  ].join("\n")
}

export async function nativeShare(payload: SharePayload) {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false
  await navigator.share({ title: payload.title, text: payload.text, url: payload.url })
  return true
}

export async function copyToClipboard(text: string) {
  if (!hasBrowserApis()) return false

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "true")
  textarea.style.position = "fixed"
  textarea.style.left = "-9999px"
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand("copy")
  document.body.removeChild(textarea)
  return copied
}

export function openWhatsAppShare(text: string) {
  if (!hasBrowserApis()) return false
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  const opened = window.open(url, "_blank", "noopener,noreferrer")
  return Boolean(opened)
}

export function openEmailShare(subject: string, body: string) {
  if (!hasBrowserApis()) return false
  const anchor = document.createElement("a")
  anchor.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  anchor.rel = "noopener noreferrer"
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  return true
}

export function downloadTextFile(filename: string, content: string, mimeType = "text/plain;charset=utf-8") {
  if (!hasBrowserApis()) return false
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
  return true
}

export function getTransactionDownloadName(data: TransactionDocumentData, extension = "html") {
  const reference = data.reference?.replace(/[^a-z0-9-_]/gi, "-") || data.type
  return `${reference}.${extension}`
}

export function downloadTransactionDocument(data: TransactionDocumentData) {
  return downloadTextFile(
    getTransactionDownloadName(data),
    buildTransactionPrintHtml(data),
    "text/html;charset=utf-8"
  )
}

export async function shareTransactionDocument(data: TransactionDocumentData) {
  const text = buildShareMessage(data)
  if (!text.trim()) {
    notify.warning(en.share.noDetailsToShare)
    return false
  }

  const title = data.title || en.share.transactionDetails

  try {
    if (await nativeShare({ title, text })) {
      notify.info(en.share.shareOpened)
      return true
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return false
    console.error("Native share failed", error)
  }

  try {
    const copied = await copyToClipboard(text)
    if (copied) {
      notify.success(en.share.copiedSuccessfully)
      return true
    }
  } catch (error) {
    console.error("Clipboard share fallback failed", error)
  }

  notify.error(en.share.shareFailed)
  return false
}
