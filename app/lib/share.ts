"use client"

import { en } from "@/app/messages/en"
import {
  formatMoney,
  getAddressLine,
  type TransactionDocumentData,
} from "@/app/lib/transactionDocument"
import { notify } from "@/app/lib/notifications"

export type SharePayload = {
  title: string
  text: string
  url?: string
  files?: File[]
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
  await navigator.share({ title: payload.title, text: payload.text, url: payload.url, files: payload.files })
  return true
}

function escapePdfText(value: string) {
  return value
    .replace(/₹/g, "Rs. ")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
}

function buildTransactionPdfBytes(data: TransactionDocumentData) {
  const pageWidth = 595
  const pageHeight = 842
  const margin = 36
  const contentWidth = pageWidth - margin * 2
  const minBottom = 48
  const seller = data.seller || {}
  const date = data.date || new Date().toLocaleString("en-IN")
  const grandTotal = getGrandTotal(data)
  const showGst = data.type === "gst-invoice" || data.items.some((item) => item.gstRate || item.cgstAmount || item.sgstAmount || item.igstAmount)
  const showSecondaryParty = Boolean(data.secondaryParty && Object.values(data.secondaryParty).some(Boolean))
  const showSellerPanel = data.type !== "gst-invoice"
  const showNotes = Boolean(data.notes?.trim())
  const showTerms = Boolean((data.terms || seller.terms)?.trim())
  const pages: string[][] = [[]]
  let pageIndex = 0
  let currentY = pageHeight - margin

  const pushCommand = (command: string) => {
    pages[pageIndex].push(command)
  }

  const startNewPage = () => {
    pageIndex += 1
    pages[pageIndex] = []
    currentY = pageHeight - margin
  }

  const ensureSpace = (requiredHeight: number) => {
    if (currentY - requiredHeight <= minBottom) startNewPage()
  }

  const fillRect = (x: number, y: number, w: number, h: number, color: [number, number, number]) => {
    pushCommand(`${color[0]} ${color[1]} ${color[2]} rg ${x} ${y} ${w} ${h} re f`)
  }

  const strokeRect = (x: number, y: number, w: number, h: number, color: [number, number, number], lineWidth = 1) => {
    pushCommand(`${lineWidth} w ${color[0]} ${color[1]} ${color[2]} RG ${x} ${y} ${w} ${h} re S`)
  }

  const drawLine = (x1: number, y1: number, x2: number, y2: number, color: [number, number, number], lineWidth = 1) => {
    pushCommand(`${lineWidth} w ${color[0]} ${color[1]} ${color[2]} RG ${x1} ${y1} m ${x2} ${y2} l S`)
  }

  const drawText = (
    text: string,
    x: number,
    y: number,
    options: { size?: number; font?: "F1" | "F2"; color?: [number, number, number] } = {}
  ) => {
    const size = options.size ?? 10
    const font = options.font ?? "F1"
    const color = options.color ?? [0.11, 0.15, 0.23]
    pushCommand(`BT ${color[0]} ${color[1]} ${color[2]} rg /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text || " ")}) Tj ET`)
  }

  const estimateTextWidth = (text: string, fontSize: number) => text.length * fontSize * 0.52

  const wrapText = (text: string, maxWidth: number, fontSize: number) => {
    const cleanText = cleanLine(text)
    if (!cleanText) return []

    const words = cleanText.split(/\s+/)
    const lines: string[] = []
    let currentLine = ""

    const pushCurrentLine = () => {
      if (currentLine) lines.push(currentLine)
      currentLine = ""
    }

    words.forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word
      if (estimateTextWidth(candidate, fontSize) <= maxWidth) {
        currentLine = candidate
        return
      }

      if (!currentLine) {
        let remainder = word
        const maxChars = Math.max(4, Math.floor(maxWidth / (fontSize * 0.52)))
        while (remainder.length > maxChars) {
          lines.push(remainder.slice(0, maxChars - 1) + "-")
          remainder = remainder.slice(maxChars - 1)
        }
        currentLine = remainder
        return
      }

      pushCurrentLine()
      currentLine = word
    })

    pushCurrentLine()
    return lines
  }

  const drawTextBlock = (
    lines: string[],
    x: number,
    yTop: number,
    options: { size?: number; leading?: number; font?: "F1" | "F2"; color?: [number, number, number] } = {}
  ) => {
    const size = options.size ?? 10
    const leading = options.leading ?? size + 3
    lines.forEach((line, index) => drawText(line, x, yTop - index * leading, options))
  }

  const drawLabeledRows = (
    entries: Array<{ label: string; value?: string }>,
    x: number,
    yTop: number,
    width: number
  ) => {
    let rowTop = yTop
    entries.forEach(({ label, value }) => {
      const wrappedValue = wrapText(value || "-", width * 0.52, 10)
      drawText(label, x, rowTop, { size: 9, color: [0.42, 0.47, 0.58] })
      drawTextBlock(wrappedValue, x + width * 0.44, rowTop, { size: 10, font: "F2", color: [0.11, 0.15, 0.23] })
      rowTop -= Math.max(18, wrappedValue.length * 13)
    })
    return rowTop
  }

  const drawPartyBox = (
    title: string,
    partyLines: string[],
    x: number,
    yTop: number,
    width: number
  ) => {
    const contentLines = partyLines.length ? partyLines : [en.transaction.noPartyDetails]
    const wrappedLines = contentLines.flatMap((line) => wrapText(line, width - 24, 10))
    const height = 36 + wrappedLines.length * 14 + 14
    fillRect(x, yTop - height, width, height, [0.98, 0.99, 1])
    strokeRect(x, yTop - height, width, height, [0.86, 0.89, 0.94])
    drawText(title, x + 12, yTop - 18, { size: 9, font: "F2", color: [0.35, 0.4, 0.52] })
    drawTextBlock(wrappedLines, x + 12, yTop - 38, { size: 10, leading: 14, color: [0.11, 0.15, 0.23] })
    return height
  }

  const drawTableHeader = (yTop: number) => {
    const columns = showGst
      ? [
          { label: "#", width: 26, align: "left" as const },
          { label: en.receipt.product, width: 226, align: "left" as const },
          { label: en.receipt.qty, width: 74, align: "left" as const },
          { label: en.receipt.rate, width: 72, align: "left" as const },
          { label: en.gstInvoice.gst, width: 56, align: "left" as const },
          { label: en.receipt.total, width: 69, align: "right" as const },
        ]
      : [
          { label: "#", width: 26, align: "left" as const },
          { label: en.receipt.product, width: 282, align: "left" as const },
          { label: en.receipt.qty, width: 84, align: "left" as const },
          { label: en.receipt.rate, width: 82, align: "left" as const },
          { label: en.receipt.total, width: 85, align: "right" as const },
        ]

    fillRect(margin, yTop - 22, contentWidth, 22, [0.93, 0.95, 0.99])
    drawLine(margin, yTop - 22, margin + contentWidth, yTop - 22, [0.84, 0.87, 0.93])
    drawLine(margin, yTop, margin + contentWidth, yTop, [0.84, 0.87, 0.93])

    let cursor = margin + 8
    columns.forEach((column, index) => {
      const textX = column.align === "right" ? cursor + column.width - estimateTextWidth(column.label, 9) - 8 : cursor
      drawText(column.label, textX, yTop - 14, { size: 9, font: "F2", color: [0.31, 0.36, 0.47] })
      cursor += column.width
      if (index < columns.length - 1) drawLine(cursor, yTop, cursor, yTop - 22, [0.88, 0.9, 0.95])
    })

    return columns
  }

  const formatRate = (rate?: number) => (typeof rate === "number" ? formatMoney(rate) : "-")

  ensureSpace(120)

  fillRect(margin, currentY - 108, contentWidth, 108, [0.98, 0.99, 1])
  strokeRect(margin, currentY - 108, contentWidth, 108, [0.86, 0.89, 0.94], 1.1)
  fillRect(margin, currentY - 108, 6, 108, [0.19, 0.42, 0.89])
  drawText(seller.businessName || en.common.appName, margin + 18, currentY - 22, { size: 18, font: "F2" })
  const sellerLines = [
    getAddressLine(seller) || en.transaction.addressNotAdded,
    [seller.mobile, seller.email].filter(Boolean).join(" | ") || en.transaction.contactNotAdded,
    seller.gstin ? `${en.gstInvoice.gstin}: ${seller.gstin}` : "",
  ].filter(Boolean)
  drawTextBlock(sellerLines, margin + 18, currentY - 42, { size: 10, leading: 14, color: [0.38, 0.43, 0.53] })

  const titleBadgeWidth = 178
  fillRect(pageWidth - margin - titleBadgeWidth, currentY - 42, titleBadgeWidth, 26, [0.18, 0.33, 0.75])
  drawText(data.title, pageWidth - margin - titleBadgeWidth + 12, currentY - 26, { size: 11, font: "F2", color: [1, 1, 1] })

  drawLabeledRows(
    [
      { label: en.receipt.ref, value: data.reference || "-" },
      { label: en.receipt.date, value: date },
      { label: en.gstInvoice.dueDate, value: data.dueDate || "-" },
      { label: en.transaction.paymentMode, value: data.paymentMode || "-" },
    ],
    pageWidth - margin - 190,
    currentY - 58,
    170
  )

  currentY -= 128

  const partyCols = showSecondaryParty ? 3 : showSellerPanel ? 2 : 1
  const gap = 14
  const partyWidth = (contentWidth - gap * (partyCols - 1)) / partyCols
  const partyHeights: number[] = []

  if (showSellerPanel) {
    partyHeights.push(
      drawPartyBox(
        en.receipt.seller,
        [
          seller.businessName || "-",
          getAddressLine(seller) || "-",
          [seller.mobile, seller.email].filter(Boolean).join(" | ") || "-",
          seller.gstin ? `${en.gstInvoice.gstin}: ${seller.gstin}` : "",
        ].filter(Boolean),
        margin,
        currentY,
        partyWidth
      )
    )
  }

  partyHeights.push(
    drawPartyBox(
      data.partyLabel || en.receipt.buyer,
      [
        data.party?.name || "",
        data.party?.gstin ? `${en.gstInvoice.gstin}: ${data.party.gstin}` : "",
        [data.party?.address, data.party?.city, data.party?.state, data.party?.pincode].filter(Boolean).join(", "),
        [data.party?.phone, data.party?.email].filter(Boolean).join(" | "),
      ].filter(Boolean),
      margin + (showSellerPanel ? partyWidth + gap : 0),
      currentY,
      partyWidth
    )
  )

  if (showSecondaryParty) {
    partyHeights.push(
      drawPartyBox(
        data.secondaryPartyLabel || en.gstInvoice.shipTo,
        [
          data.secondaryParty?.name || "",
          data.secondaryParty?.gstin ? `${en.gstInvoice.gstin}: ${data.secondaryParty.gstin}` : "",
          [data.secondaryParty?.address, data.secondaryParty?.city, data.secondaryParty?.state, data.secondaryParty?.pincode].filter(Boolean).join(", "),
          [data.secondaryParty?.phone, data.secondaryParty?.email].filter(Boolean).join(" | "),
        ].filter(Boolean),
        margin + (showSellerPanel ? (partyWidth + gap) * 2 : partyWidth + gap),
        currentY,
        partyWidth
      )
    )
  }

  currentY -= Math.max(...partyHeights, 88) + 18

  let columns = drawTableHeader(currentY)
  currentY -= 24

  const drawItemRow = (item: TransactionDocumentData["items"][number], index: number) => {
    const descriptionParts = [
      item.name || "-",
      item.description || "",
      item.hsnCode ? `${en.gstInvoice.hsnSac}: ${item.hsnCode}` : "",
      item.note || "",
    ].filter(Boolean)
    const productLines = descriptionParts.flatMap((line, lineIndex) =>
      wrapText(line, columns[1].width - 14, lineIndex === 0 ? 10.5 : 9)
    )
    const quantityLines = wrapText([item.quantity, item.unit].filter(Boolean).join(" ") || "-", columns[2].width - 12, 9.5)
    const rateLines = wrapText(formatRate(item.rate), columns[3].width - 12, 9.5)
    const gstLines = showGst ? wrapText(item.gstRate !== undefined ? `${Number(item.gstRate).toFixed(2)}%` : "-", 42, 9.5) : []
    const totalLines = wrapText(formatMoney(item.total), 58, 9.5)
    const lineCount = Math.max(productLines.length, quantityLines.length, rateLines.length, totalLines.length, gstLines.length || 1)
    const rowHeight = Math.max(28, lineCount * 13 + 10)

    ensureSpace(rowHeight + 12)
    if (currentY === pageHeight - margin) {
      columns = drawTableHeader(currentY)
      currentY -= 24
    }

    const rowBottom = currentY - rowHeight
    drawLine(margin, rowBottom, margin + contentWidth, rowBottom, [0.89, 0.91, 0.95])
    let cursor = margin

    drawText(String(index + 1), cursor + 8, currentY - 14, { size: 9.5, color: [0.3, 0.35, 0.46] })
    cursor += columns[0].width

    drawTextBlock(productLines, cursor + 8, currentY - 14, { size: 10, leading: 12.5, font: "F2" })
    cursor += columns[1].width

    drawTextBlock(quantityLines, cursor + 8, currentY - 14, { size: 9.5, leading: 12.5, color: [0.3, 0.35, 0.46] })
    cursor += columns[2].width

    drawTextBlock(rateLines, cursor + 8, currentY - 14, { size: 9.5, leading: 12.5, color: [0.3, 0.35, 0.46] })
    cursor += columns[3].width

    if (showGst) {
      drawTextBlock(gstLines, cursor + 8, currentY - 14, { size: 9.5, leading: 12.5, color: [0.3, 0.35, 0.46] })
      cursor += columns[4].width
    }

    const totalX = cursor + (showGst ? columns[5].width : columns[4].width) - estimateTextWidth(totalLines[0] || "-", 9.5) - 8
    drawTextBlock(totalLines, totalX, currentY - 14, { size: 9.5, leading: 12.5, font: "F2" })

    currentY = rowBottom
  }

  data.items.forEach(drawItemRow)
  currentY -= 18

  const summaryEntries = [
    { label: en.gstInvoice.taxableValue, value: data.totals?.taxableAmount },
    { label: en.gstInvoice.cgst, value: data.totals?.cgstTotal },
    { label: en.gstInvoice.sgstUtgst, value: data.totals?.sgstTotal },
    { label: en.gstInvoice.igst, value: data.totals?.igstTotal },
    { label: en.transaction.totalGst, value: data.totals?.totalGst },
    { label: en.purchases.paid, value: data.totals?.paidAmount },
    { label: en.purchases.due, value: data.totals?.dueAmount },
  ].filter((entry) => entry.value !== undefined && entry.value !== null && Number(entry.value) !== 0)

  const summaryHeight = 54 + summaryEntries.length * 18 + (data.totals?.amountInWords ? 34 : 0)
  ensureSpace(summaryHeight + 20)

  const summaryWidth = 220
  const summaryX = pageWidth - margin - summaryWidth
  fillRect(summaryX, currentY - summaryHeight, summaryWidth, summaryHeight, [0.98, 0.99, 1])
  strokeRect(summaryX, currentY - summaryHeight, summaryWidth, summaryHeight, [0.86, 0.89, 0.94])
  drawText(en.receipt.grandTotal, summaryX + 14, currentY - 18, { size: 10, font: "F2", color: [0.38, 0.43, 0.53] })
  drawText(formatMoney(grandTotal), summaryX + summaryWidth - estimateTextWidth(formatMoney(grandTotal), 14) - 14, currentY - 20, { size: 14, font: "F2", color: [0.12, 0.44, 0.32] })

  let summaryY = currentY - 42
  summaryEntries.forEach((entry) => {
    drawText(entry.label, summaryX + 14, summaryY, { size: 9.5, color: [0.38, 0.43, 0.53] })
    const value = formatMoney(entry.value)
    drawText(value, summaryX + summaryWidth - estimateTextWidth(value, 9.5) - 14, summaryY, { size: 9.5, font: "F2" })
    summaryY -= 18
  })

  if (data.totals?.amountInWords) {
    const amountLines = wrapText(`${en.transaction.amountInWords}: ${data.totals.amountInWords}`, contentWidth - summaryWidth - 24, 9.5)
    drawTextBlock(amountLines, margin, currentY - 18, { size: 9.5, leading: 13, color: [0.38, 0.43, 0.53] })
  }

  currentY -= summaryHeight + 18

  const footerSections = [
    paymentStatusFromTotals(data)
      ? `${en.share.paymentStatus}: ${paymentStatusFromTotals(data)}`
      : "",
    seller.paymentDetails
      ? [
          seller.paymentDetails.upiId ? `${en.transaction.upi}: ${seller.paymentDetails.upiId}` : "",
          seller.paymentDetails.bankName ? `${en.gstInvoice.bank}: ${seller.paymentDetails.bankName}` : "",
          seller.paymentDetails.accountNumber ? `${en.gstInvoice.accountNo}: ${seller.paymentDetails.accountNumber}` : "",
          seller.paymentDetails.ifsc ? `${en.gstInvoice.ifsc}: ${seller.paymentDetails.ifsc}` : "",
        ]
          .filter(Boolean)
          .join(" | ")
      : "",
    showNotes ? `${en.gstInvoice.notes}: ${data.notes}` : "",
    showTerms ? `${en.gstInvoice.terms}: ${data.terms || seller.terms}` : "",
    data.footerNote || `${en.receipt.printedOn}: ${new Date().toLocaleString("en-IN")}`,
  ].filter(Boolean)

  const footerLines = footerSections.flatMap((line) => wrapText(line, contentWidth, 9))
  ensureSpace(footerLines.length * 12 + 16)
  drawLine(margin, currentY, pageWidth - margin, currentY, [0.88, 0.9, 0.95])
  drawTextBlock(footerLines, margin, currentY - 14, { size: 9, leading: 12, color: [0.4, 0.45, 0.55] })

  const objects: string[] = []
  objects.push("<< /Type /Catalog /Pages 2 0 R >>")

  const pageObjectNumbers: number[] = []
  const contentObjectNumbers: number[] = []
  let nextObject = 3

  pages.forEach(() => {
    pageObjectNumbers.push(nextObject++)
    contentObjectNumbers.push(nextObject++)
  })

  const fontObjectNumber = nextObject++
  const boldFontObjectNumber = nextObject
  const kids = pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")
  objects.push(`<< /Type /Pages /Kids [ ${kids} ] /Count ${pageObjectNumbers.length} >>`)

  pageObjectNumbers.forEach((pageNumber, index) => {
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R /F2 ${boldFontObjectNumber} 0 R >> >> /Contents ${contentObjectNumbers[index]} 0 R >>`)
    const stream = pages[index].join("\n")
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
  })

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += "0000000000 65535 f \n"
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new TextEncoder().encode(pdf)
}

export function buildTransactionPdfBlob(data: TransactionDocumentData) {
  return new Blob([buildTransactionPdfBytes(data)], { type: "application/pdf" })
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
  return downloadBlob(filename, blob)
}

function downloadBlob(filename: string, blob: Blob) {
  if (!hasBrowserApis()) return false
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
  return downloadBlob(getTransactionDownloadName(data, "pdf"), buildTransactionPdfBlob(data))
}

export async function shareTransactionDocumentOnWhatsApp(data: TransactionDocumentData, subject?: string) {
  const title = subject || data.title || en.share.transactionDetails

  try {
    const pdfFile = new File([buildTransactionPdfBlob(data)], getTransactionDownloadName(data, "pdf"), {
      type: "application/pdf",
    })

    if (await nativeShare({ title, text: en.share.footerNote, files: [pdfFile] })) {
      return "shared" as const
    }
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      console.error("WhatsApp PDF share failed", error)
    }
  }

  const downloaded = downloadTransactionDocument(data)
  if (!downloaded) return false

  return openWhatsAppShare(`${title}\n${en.share.downloadStarted}`) ? ("downloaded" as const) : false
}

export async function shareTransactionDocumentByEmail(data: TransactionDocumentData, subject?: string) {
  const title = subject || data.title || en.share.transactionDetails

  try {
    const pdfFile = new File([buildTransactionPdfBlob(data)], getTransactionDownloadName(data, "pdf"), {
      type: "application/pdf",
    })

    if (await nativeShare({ title, text: en.share.footerNote, files: [pdfFile] })) {
      return "shared" as const
    }
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      console.error("Email PDF share failed", error)
    }
  }

  const downloaded = downloadTransactionDocument(data)
  if (!downloaded) return false

  return openEmailShare(title, `${en.share.downloadStarted}\n${title}`) ? ("downloaded" as const) : false
}

export async function copyTransactionDocument(data: TransactionDocumentData) {
  try {
    if (typeof navigator !== "undefined" && "clipboard" in navigator && typeof window !== "undefined" && "ClipboardItem" in window) {
      const pdfBlob = buildTransactionPdfBlob(data)
      const item = new ClipboardItem({ "application/pdf": pdfBlob })
      await navigator.clipboard.write([item])
      return "copied" as const
    }
  } catch (error) {
    console.error("Copy PDF failed", error)
  }

  return downloadTransactionDocument(data) ? ("downloaded" as const) : false
}

export async function shareTransactionDocument(data: TransactionDocumentData) {
  const text = buildShareMessage(data)
  if (!text.trim()) {
    notify.warning(en.share.noDetailsToShare)
    return false
  }

  const title = data.title || en.share.transactionDetails
  const pdfFile = new File([buildTransactionPdfBlob(data)], getTransactionDownloadName(data, "pdf"), {
    type: "application/pdf",
  })

  try {
    if (await nativeShare({ title, text, files: [pdfFile] })) {
      notify.info(en.share.shareOpened)
      return true
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return false
    console.error("Native share failed", error)
  }

  try {
    const downloaded = downloadBlob(pdfFile.name, pdfFile)
    if (downloaded) {
      notify.success(en.share.downloadStarted)
      return true
    }
  } catch (error) {
    console.error("PDF share fallback failed", error)
  }

  notify.error(en.share.shareFailed)
  return false
}
