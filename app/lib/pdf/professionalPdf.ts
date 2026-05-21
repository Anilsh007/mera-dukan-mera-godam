import { en } from "@/app/messages/en"
import { formatCurrency, formatIndianDate, formatIndianDateTime } from "@/app/lib/formatters"
import { escapePrintHtml } from "@/app/lib/print"

export type PdfParty = {
  label?: string
  name?: string
  gstin?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
}

export type PdfPaymentDetails = {
  upiId?: string
  bankName?: string
  accountHolderName?: string
  accountNumber?: string
  ifsc?: string
}

export type PdfBusinessProfile = PdfParty & {
  businessName?: string
  ownerName?: string
  logoUrl?: string
  terms?: string
  paymentDetails?: PdfPaymentDetails
}

export type PdfDocumentItem = {
  name: string
  description?: string
  hsnCode?: string
  quantity?: string | number
  unit?: string
  rate?: number
  discount?: number
  gstRate?: number
  taxableAmount?: number
  cgstAmount?: number
  sgstAmount?: number
  igstAmount?: number
  total?: number
  note?: string
}

export type PdfDocumentTotals = {
  taxableAmount?: number
  cgstTotal?: number
  sgstTotal?: number
  igstTotal?: number
  totalGst?: number
  grandTotal?: number
  paidAmount?: number
  dueAmount?: number
  amountInWords?: string
}

export type ProfessionalPdfDocument = {
  title: string
  copyLabel?: string
  reference?: string
  date?: string
  dueDate?: string
  seller: PdfBusinessProfile
  partyLabel?: string
  party?: PdfParty
  secondaryPartyLabel?: string
  secondaryParty?: PdfParty
  paymentMode?: string
  items: PdfDocumentItem[]
  totals?: PdfDocumentTotals
  notes?: string
  terms?: string
  footerNote?: string
}

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 40
const FOOTER_Y = 34
const LINE_HEIGHT = 14

type PdfPage = {
  commands: string[]
}

class SimplePdfWriter {
  private pages: PdfPage[] = []
  private y = PAGE_HEIGHT - MARGIN

  constructor(private readonly title: string) {
    this.addPage()
  }

  addHeading(text: string, size = 18) {
    this.ensureSpace(size + 10)
    this.text(text, MARGIN, this.y, size, true)
    this.y -= size + 10
  }

  addSubheading(text: string) {
    this.ensureSpace(24)
    this.text(text, MARGIN, this.y, 11, true)
    this.y -= 18
  }

  addLine() {
    this.ensureSpace(12)
    this.current.commands.push(`${MARGIN} ${this.y} m ${PAGE_WIDTH - MARGIN} ${this.y} l S`)
    this.y -= 10
  }

  addParagraph(text: string, width = PAGE_WIDTH - MARGIN * 2, size = 10) {
    const lines = wrapText(normalizePdfText(text), width, size)
    lines.forEach((line) => {
      this.ensureSpace(LINE_HEIGHT)
      this.text(line, MARGIN, this.y, size)
      this.y -= LINE_HEIGHT
    })
  }

  addKeyValue(label: string, value?: string | number, x = MARGIN, width = PAGE_WIDTH - MARGIN * 2) {
    if (value === undefined || value === null || String(value).trim() === "") return
    const safeLabel = normalizePdfText(label)
    const safeValue = normalizePdfText(String(value))
    const labelWidth = Math.min(135, width * 0.42)
    this.ensureSpace(LINE_HEIGHT)
    this.text(safeLabel, x, this.y, 9, true)
    this.text(safeValue, x + labelWidth, this.y, 9)
    this.y -= LINE_HEIGHT
  }

  addTwoColumnBlocks(leftTitle: string, leftLines: string[], rightTitle: string, rightLines: string[]) {
    const left = cleanLines(leftLines)
    const right = cleanLines(rightLines)
    const height = Math.max(left.length, right.length, 1) * LINE_HEIGHT + 26
    this.ensureSpace(height)
    const columnWidth = (PAGE_WIDTH - MARGIN * 2 - 18) / 2
    const startY = this.y
    this.box(MARGIN, startY - height + 8, columnWidth, height)
    this.box(MARGIN + columnWidth + 18, startY - height + 8, columnWidth, height)
    this.text(leftTitle, MARGIN + 10, startY - 16, 10, true)
    this.text(rightTitle, MARGIN + columnWidth + 28, startY - 16, 10, true)
    left.forEach((line, index) => this.text(line, MARGIN + 10, startY - 34 - index * LINE_HEIGHT, 9))
    right.forEach((line, index) => this.text(line, MARGIN + columnWidth + 28, startY - 34 - index * LINE_HEIGHT, 9))
    this.y -= height + 10
  }

  addItemsTable(items: PdfDocumentItem[]) {
    const columns = [22, 178, 48, 58, 42, 44, 68]
    const xStart = MARGIN
    const header = ["#", en.receipt.product, en.receipt.qty, en.receipt.rate, en.gstInvoice.gst, en.gstInvoice.taxableValue, en.receipt.total]
    this.addTableHeader(header, columns, xStart)
    items.forEach((item, index) => {
      const nameLines = wrapText(normalizePdfText([item.name, item.description].filter(Boolean).join(" - ")), columns[1] - 8, 8)
      const rowHeight = Math.max(24, nameLines.length * 10 + 12)
      this.ensureSpace(rowHeight + 6, () => this.addTableHeader(header, columns, xStart))
      let x = xStart
      const bottomY = this.y - rowHeight
      this.box(xStart, bottomY, columns.reduce((sum, width) => sum + width, 0), rowHeight)
      const values = [
        String(index + 1),
        "",
        [item.quantity, item.unit].filter(Boolean).join(" "),
        formatPdfMoney(item.rate),
        item.gstRate === undefined ? "-" : `${Number(item.gstRate).toFixed(2)}%`,
        formatPdfMoney(item.taxableAmount),
        formatPdfMoney(item.total),
      ]
      values.forEach((value, columnIndex) => {
        if (columnIndex === 1) {
          nameLines.forEach((line, lineIndex) => this.text(line, x + 4, this.y - 14 - lineIndex * 10, 8))
        } else {
          this.text(value || "-", x + 4, this.y - 16, 8)
        }
        x += columns[columnIndex]
        if (columnIndex < columns.length - 1) this.current.commands.push(`${x} ${this.y} m ${x} ${bottomY} l S`)
      })
      this.y = bottomY
    })
    this.y -= 10
  }

  addTotals(totals?: PdfDocumentTotals) {
    if (!totals) return
    const rows = ([
      [en.gstInvoice.taxableValue, totals.taxableAmount],
      [en.gstInvoice.cgst, totals.cgstTotal],
      [en.gstInvoice.sgstUtgst, totals.sgstTotal],
      [en.gstInvoice.igst, totals.igstTotal],
      [en.transaction.totalGst, totals.totalGst],
      [en.purchases.paid, totals.paidAmount],
      [en.purchases.due, totals.dueAmount],
      [en.receipt.grandTotal, totals.grandTotal],
    ] as Array<[string, number | undefined]>).filter(([, value]) => value !== undefined && value !== null && Number(value) !== 0)

    if (!rows.length) return
    const boxWidth = 230
    const rowHeight = 16
    const boxHeight = rows.length * rowHeight + 12
    const x = PAGE_WIDTH - MARGIN - boxWidth
    this.ensureSpace(boxHeight + 20)
    const top = this.y
    this.box(x, top - boxHeight, boxWidth, boxHeight)
    rows.forEach(([label, value], index) => {
      const rowY = top - 18 - index * rowHeight
      this.text(label, x + 10, rowY, 9, index === rows.length - 1)
      this.text(formatPdfMoney(value), x + 135, rowY, 9, index === rows.length - 1)
    })
    this.y -= boxHeight + 10
    if (totals.amountInWords) this.addParagraph(`${en.transaction.amountInWords}: ${totals.amountInWords}`, boxWidth, 9)
  }

  toBlob() {
    const pdf = this.serialize()
    return new Blob([pdf], { type: "application/pdf" })
  }

  private addPage() {
    this.pages.push({ commands: [] })
    this.y = PAGE_HEIGHT - MARGIN
    this.text(this.title, MARGIN, FOOTER_Y, 8)
    this.text(formatIndianDate(new Date()), PAGE_WIDTH - 120, FOOTER_Y, 8)
  }

  private ensureSpace(height: number, afterPage?: () => void) {
    if (this.y - height < MARGIN + 30) {
      this.addPage()
      afterPage?.()
    }
  }

  private addTableHeader(header: string[], columns: number[], xStart: number) {
    this.ensureSpace(30)
    const height = 22
    let x = xStart
    this.box(xStart, this.y - height, columns.reduce((sum, width) => sum + width, 0), height)
    header.forEach((label, index) => {
      this.text(label, x + 4, this.y - 14, 8, true)
      x += columns[index]
      if (index < columns.length - 1) this.current.commands.push(`${x} ${this.y} m ${x} ${this.y - height} l S`)
    })
    this.y -= height
  }

  private text(value: string, x: number, y: number, size = 10, bold = false) {
    this.current.commands.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${escapePdfString(normalizePdfText(value))}) Tj ET`)
  }

  private box(x: number, y: number, width: number, height: number) {
    this.current.commands.push(`${x} ${y} ${width} ${height} re S`)
  }

  private get current() {
    return this.pages[this.pages.length - 1]
  }

  private serialize() {
    const objects: string[] = []
    const addObject = (body: string) => {
      objects.push(body)
      return objects.length
    }

    const catalogIndex = addObject("<< /Type /Catalog /Pages 2 0 R >>")
    void catalogIndex
    const pagesIndex = addObject("__PAGES__")
    const fontRegularIndex = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    const fontBoldIndex = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

    const pageIndexes: number[] = []
    this.pages.forEach((page) => {
      const content = page.commands.join("\n")
      const contentIndex = addObject(`<< /Length ${byteLength(content)} >>\nstream\n${content}\nendstream`)
      const pageIndex = addObject(`<< /Type /Page /Parent ${pagesIndex} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularIndex} 0 R /F2 ${fontBoldIndex} 0 R >> >> /Contents ${contentIndex} 0 R >>`)
      pageIndexes.push(pageIndex)
    })

    objects[pagesIndex - 1] = `<< /Type /Pages /Kids [${pageIndexes.map((index) => `${index} 0 R`).join(" ")}] /Count ${pageIndexes.length} >>`

    let pdf = "%PDF-1.4\n"
    const offsets = [0]
    objects.forEach((body, index) => {
      offsets.push(byteLength(pdf))
      pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
    })
    const xrefOffset = byteLength(pdf)
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
    })
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    return pdf
  }
}

export function createProfessionalPdfBlob(document: ProfessionalPdfDocument) {
  const title = [document.title, document.copyLabel].filter(Boolean).join(" - ")
  const writer = new SimplePdfWriter(title)
  writer.addHeading(title)
  writer.addKeyValue(en.receipt.ref, document.reference || "-")
  writer.addKeyValue(en.receipt.date, document.date || formatIndianDateTime(new Date()))
  writer.addKeyValue(en.gstInvoice.dueDate, document.dueDate)
  writer.addKeyValue(en.transaction.paymentMode, document.paymentMode)
  writer.addLine()
  writer.addSubheading(en.gstInvoice.sellerInformation)
  writer.addParagraph(buildBusinessLines(document.seller).join(" | "))
  writer.addTwoColumnBlocks(
    document.partyLabel || en.receipt.buyer,
    buildPartyLines(document.party),
    document.secondaryPartyLabel || en.gstInvoice.shipTo,
    buildPartyLines(document.secondaryParty),
  )
  writer.addSubheading(en.gstInvoice.items)
  writer.addItemsTable(document.items)
  writer.addTotals(document.totals)
  const paymentLines = buildPaymentLines(document.seller.paymentDetails)
  if (paymentLines.length) {
    writer.addSubheading(en.gstInvoice.bankAndPaymentDetails)
    writer.addParagraph(paymentLines.join(" | "))
  }
  if (document.notes) {
    writer.addSubheading(en.gstInvoice.notes)
    writer.addParagraph(document.notes)
  }
  if (document.terms || document.seller.terms) {
    writer.addSubheading(en.gstInvoice.terms)
    writer.addParagraph(document.terms || document.seller.terms || "")
  }
  writer.addLine()
  writer.addParagraph(document.footerNote || en.share.footerNote, PAGE_WIDTH - MARGIN * 2, 9)
  return writer.toBlob()
}

export function downloadProfessionalPdf(document: ProfessionalPdfDocument, filename?: string) {
  if (typeof document === "undefined" || typeof window === "undefined") return false
  const blob = createProfessionalPdfBlob(document)
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement("a")
  anchor.href = url
  anchor.download = ensurePdfFilename(filename || buildProfessionalPdfFilename(document))
  anchor.click()
  URL.revokeObjectURL(url)
  return true
}

export function printProfessionalPdf(document: ProfessionalPdfDocument) {
  if (typeof window === "undefined") return false
  const printWindow = openPrintWindow(buildProfessionalPdfHtml(document))
  if (!printWindow || typeof printWindow === "boolean") return false
  printWindow.print()
  return true
}

function openPrintWindow(html: string) {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return false
  printWindow.document.write(html)
  printWindow.document.close()
  return printWindow
}

export function buildProfessionalPdfHtml(document: ProfessionalPdfDocument) {
  const title = [document.title, document.copyLabel].filter(Boolean).join(" - ")
  const items = document.items.length ? document.items : [{ name: en.common.notAvailable, total: 0 }]
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapePrintHtml(title)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.45; }
    .doc { width: 100%; }
    .header { display: flex; justify-content: space-between; gap: 20px; border-bottom: 2px solid #111827; padding-bottom: 12px; }
    .brand { display: flex; gap: 12px; min-width: 0; }
    .logo { width: 56px; height: 56px; border: 1px solid #d1d5db; border-radius: 10px; object-fit: contain; }
    h1 { margin: 0; font-size: 22px; }
    h2 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: #374151; }
    .muted { color: #4b5563; }
    .meta { min-width: 210px; border: 1px solid #d1d5db; border-radius: 12px; padding: 10px; }
    .row { display: flex; justify-content: space-between; gap: 12px; margin-top: 4px; }
    .copy { display: inline-block; margin-bottom: 6px; border-radius: 999px; background: #ecfdf5; color: #047857; padding: 4px 8px; font-weight: 700; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
    .box { border: 1px solid #d1d5db; border-radius: 12px; padding: 10px; min-height: 88px; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    th, td { border: 1px solid #d1d5db; padding: 7px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-size: 11px; text-transform: uppercase; }
    .right { text-align: right; }
    .summary { margin-left: auto; margin-top: 14px; width: 300px; border: 1px solid #d1d5db; border-radius: 12px; padding: 10px; }
    .total { border-top: 1px solid #d1d5db; margin-top: 6px; padding-top: 8px; font-size: 15px; font-weight: 800; }
    .notes { margin-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .footer { margin-top: 18px; border-top: 1px solid #d1d5db; padding-top: 8px; color: #4b5563; font-size: 11px; }
    @media print { .no-print { display: none; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <main class="doc">
    <section class="header">
      <div class="brand">
        ${document.seller.logoUrl ? `<img class="logo" src="${escapePrintHtml(document.seller.logoUrl)}" alt="${escapePrintHtml(en.transaction.businessLogo)}" />` : ""}
        <div>
          <h1>${escapePrintHtml(document.seller.businessName || en.common.appName)}</h1>
          <p class="muted">${escapePrintHtml(buildBusinessLines(document.seller).join(" | "))}</p>
        </div>
      </div>
      <div class="meta">
        ${document.copyLabel ? `<span class="copy">${escapePrintHtml(document.copyLabel)}</span>` : ""}
        <h2>${escapePrintHtml(document.title)}</h2>
        ${htmlMeta(en.receipt.ref, document.reference || "-")}
        ${htmlMeta(en.receipt.date, document.date || formatIndianDateTime(new Date()))}
        ${document.dueDate ? htmlMeta(en.gstInvoice.dueDate, document.dueDate) : ""}
        ${document.paymentMode ? htmlMeta(en.transaction.paymentMode, document.paymentMode) : ""}
      </div>
    </section>

    <section class="grid">
      ${htmlPartyBox(document.partyLabel || en.receipt.buyer, buildPartyLines(document.party))}
      ${htmlPartyBox(document.secondaryPartyLabel || en.gstInvoice.shipTo, buildPartyLines(document.secondaryParty))}
    </section>

    <table>
      <thead>
        <tr>
          <th>#</th><th>${escapePrintHtml(en.receipt.product)}</th><th>${escapePrintHtml(en.receipt.qty)}</th><th>${escapePrintHtml(en.receipt.rate)}</th><th>${escapePrintHtml(en.gstInvoice.gst)}</th><th>${escapePrintHtml(en.gstInvoice.taxableValue)}</th><th class="right">${escapePrintHtml(en.receipt.total)}</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, index) => `<tr><td>${index + 1}</td><td><strong>${escapePrintHtml(item.name || "-")}</strong>${item.description ? `<br /><span class="muted">${escapePrintHtml(item.description)}</span>` : ""}${item.hsnCode ? `<br /><span class="muted">${escapePrintHtml(en.gstInvoice.hsnSac)}: ${escapePrintHtml(item.hsnCode)}</span>` : ""}</td><td>${escapePrintHtml([item.quantity, item.unit].filter(Boolean).join(" ") || "-")}</td><td>${escapePrintHtml(formatPdfMoney(item.rate))}</td><td>${item.gstRate === undefined ? "-" : `${Number(item.gstRate).toFixed(2)}%`}</td><td>${escapePrintHtml(formatPdfMoney(item.taxableAmount))}</td><td class="right"><strong>${escapePrintHtml(formatPdfMoney(item.total))}</strong></td></tr>`).join("")}
      </tbody>
    </table>

    ${htmlSummary(document.totals)}

    <section class="notes">
      ${htmlInfoBox(en.gstInvoice.bankAndPaymentDetails, buildPaymentLines(document.seller.paymentDetails))}
      ${htmlInfoBox(en.gstInvoice.notes, cleanLines([document.notes || en.gstInvoice.noAdditionalNotes]))}
      ${htmlInfoBox(en.gstInvoice.terms, cleanLines([document.terms || document.seller.terms || en.gstInvoice.noTermsAdded]))}
    </section>

    <footer class="footer">${escapePrintHtml(document.footerNote || en.share.footerNote)}</footer>
  </main>
</body>
</html>`
}

export function buildProfessionalPdfFilename(document: Pick<ProfessionalPdfDocument, "title" | "copyLabel" | "reference">) {
  const parts = [document.title, document.copyLabel, document.reference].filter(Boolean).join("-")
  return ensurePdfFilename(slugifyFilename(parts || en.share.transactionDetails))
}

export function ensurePdfFilename(filename: string) {
  const base = filename.trim().replace(/\.txt$/i, ".pdf") || "document.pdf"
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`
}

export function buildProfessionalPdfShareText(document: ProfessionalPdfDocument) {
  const title = [document.title, document.copyLabel].filter(Boolean).join(" - ")
  const totals = document.totals
  return cleanLines([
    title,
    document.reference ? `${en.receipt.ref}: ${document.reference}` : "",
    document.date ? `${en.receipt.date}: ${document.date}` : "",
    document.party?.name ? `${document.partyLabel || en.receipt.buyer}: ${document.party.name}` : "",
    totals?.grandTotal !== undefined ? `${en.receipt.grandTotal}: ${formatPdfMoney(totals.grandTotal)}` : "",
    totals?.paidAmount !== undefined ? `${en.purchases.paid}: ${formatPdfMoney(totals.paidAmount)}` : "",
    totals?.dueAmount !== undefined ? `${en.purchases.due}: ${formatPdfMoney(totals.dueAmount)}` : "",
    en.share.footerNote,
  ]).join("\n")
}

function htmlMeta(label: string, value: string) {
  return `<div class="row"><span class="muted">${escapePrintHtml(label)}</span><strong>${escapePrintHtml(value)}</strong></div>`
}

function htmlPartyBox(title: string, lines: string[]) {
  return `<div class="box"><h2>${escapePrintHtml(title)}</h2>${lines.length ? lines.map((line) => `<p>${escapePrintHtml(line)}</p>`).join("") : `<p class="muted">${escapePrintHtml(en.transaction.noPartyDetails)}</p>`}</div>`
}

function htmlInfoBox(title: string, lines: string[]) {
  return `<div class="box"><h2>${escapePrintHtml(title)}</h2>${lines.length ? lines.map((line) => `<p>${escapePrintHtml(line)}</p>`).join("") : `<p class="muted">${escapePrintHtml(en.common.notAvailable)}</p>`}</div>`
}

function htmlSummary(totals?: PdfDocumentTotals) {
  if (!totals) return ""
  const rows: Array<[string, number | undefined]> = [
    [en.gstInvoice.taxableValue, totals.taxableAmount],
    [en.gstInvoice.cgst, totals.cgstTotal],
    [en.gstInvoice.sgstUtgst, totals.sgstTotal],
    [en.gstInvoice.igst, totals.igstTotal],
    [en.transaction.totalGst, totals.totalGst],
    [en.purchases.paid, totals.paidAmount],
    [en.purchases.due, totals.dueAmount],
    [en.receipt.grandTotal, totals.grandTotal],
  ]
  const filteredRows = rows.filter(([, value]) => value !== undefined && value !== null && Number(value) !== 0)
  if (!filteredRows.length) return ""
  return `<section class="summary">${filteredRows.map(([label, value], index) => `<div class="row ${index === filteredRows.length - 1 ? "total" : ""}"><span>${escapePrintHtml(label)}</span><strong>${escapePrintHtml(formatPdfMoney(value))}</strong></div>`).join("")}${totals.amountInWords ? `<p class="muted">${escapePrintHtml(en.transaction.amountInWords)}: ${escapePrintHtml(totals.amountInWords)}</p>` : ""}</section>`
}

function buildBusinessLines(seller: PdfBusinessProfile) {
  return cleanLines([
    seller.ownerName ? `${en.profile.owner}: ${seller.ownerName}` : "",
    getPartyAddress(seller),
    [seller.phone, seller.email].filter(Boolean).join(" | "),
    seller.gstin ? `${en.gstInvoice.gstin}: ${seller.gstin}` : "",
  ])
}

function buildPartyLines(party?: PdfParty) {
  if (!party) return []
  return cleanLines([
    party.name,
    party.gstin ? `${en.gstInvoice.gstin}: ${party.gstin}` : "",
    getPartyAddress(party),
    [party.phone, party.email].filter(Boolean).join(" | "),
  ])
}

function buildPaymentLines(payment?: PdfPaymentDetails) {
  if (!payment) return []
  return cleanLines([
    payment.upiId ? `${en.transaction.upi}: ${payment.upiId}` : "",
    payment.bankName,
    payment.accountHolderName,
    payment.accountNumber ? `${en.gstInvoice.accountNo}: ${payment.accountNumber}` : "",
    payment.ifsc ? `${en.gstInvoice.ifsc}: ${payment.ifsc}` : "",
  ])
}

function getPartyAddress(party: PdfParty) {
  return [party.address, party.city, party.state, party.pincode].filter(Boolean).join(", ")
}

function cleanLines(lines: Array<string | undefined>) {
  return lines.map((line) => line?.trim()).filter(Boolean) as string[]
}

function formatPdfMoney(value?: number) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "-"
  return formatCurrency(value)
}

function slugifyFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "document"
}

function wrapText(value: string, width: number, size: number) {
  const chars = Math.max(12, Math.floor(width / (size * 0.52)))
  const words = value.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ""
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word
    if (next.length > chars && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  })
  if (line) lines.push(line)
  return lines.length ? lines : ["-"]
}

function normalizePdfText(value: string) {
  return value
    .replaceAll(en.common.rupeeSymbol, "Rs")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
}

function escapePdfString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\r?\n/g, " ")
}

function byteLength(value: string) {
  return new Blob([value]).size
}
