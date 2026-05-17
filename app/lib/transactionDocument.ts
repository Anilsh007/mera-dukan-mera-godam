import { en } from "@/app/messages/en"
import type { ProfileState } from "@/app/dashboard/profile/useProfile"
import { escapePrintHtml, openPrintWindow } from "@/app/lib/print"

export type TransactionDocumentType =
  | "receipt"
  | "purchase"
  | "sale"
  | "gst-invoice"
  | "stock-adjustment"
  | "supplier-payment"

export type TransactionParty = {
  name?: string
  gstin?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
}

export type TransactionDocumentItem = {
  name: string
  description?: string
  hsnCode?: string
  quantity?: number | string
  unit?: string
  rate?: number
  discount?: number
  gstRate?: number
  taxableAmount?: number
  cgstAmount?: number
  sgstAmount?: number
  igstAmount?: number
  total: number
  note?: string
}

export type BusinessDocumentProfile = {
  businessName?: string
  logoUrl?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  mobile?: string
  email?: string
  gstin?: string
  terms?: string
  paymentDetails?: {
    upiId?: string
    accountName?: string
    accountNumber?: string
    ifsc?: string
    bankName?: string
  }
}

export type TransactionDocumentData = {
  type: TransactionDocumentType
  title: string
  reference?: string
  date?: string
  dueDate?: string
  seller?: BusinessDocumentProfile
  partyLabel?: string
  party?: TransactionParty
  secondaryPartyLabel?: string
  secondaryParty?: TransactionParty
  items: TransactionDocumentItem[]
  totals?: {
    taxableAmount?: number
    cgstTotal?: number
    sgstTotal?: number
    igstTotal?: number
    totalGst?: number
    grandTotal: number
    paidAmount?: number
    dueAmount?: number
    amountInWords?: string
  }
  notes?: string
  terms?: string
  paymentMode?: string
  footerNote?: string
}

export type TransactionOptionFlags = {
  saveOnly: boolean
  generateGstInvoice: boolean
  printReceipt: boolean
  downloadShare: boolean
}

export function buildBusinessDocumentProfile(profile?: ProfileState): BusinessDocumentProfile {
  if (!profile) return {}

  return {
    businessName: profile.business.shopName || profile.personal.displayName || "",
    logoUrl: profile.business.logoUrl || profile.personal.photoURL || "",
    address: profile.address.address || "",
    city: profile.address.district || "",
    state: profile.address.state || "",
    pincode: profile.address.pincode || "",
    mobile: profile.personal.phone || "",
    email: profile.personal.alternateEmail || profile.personal.email || "",
    gstin: profile.business.gstNumber || "",
    terms: profile.settings.termsAndConditions || "",
    paymentDetails: {
      upiId: profile.business.upiId || "",
      accountName: profile.banking.accountHolderName || "",
      accountNumber: profile.banking.accountNumber || "",
      ifsc: profile.banking.ifscCode || "",
      bankName: profile.banking.bankName || "",
    },
  }
}

export function getProfileDocumentWarnings(
  profile?: BusinessDocumentProfile,
  options: { requireGstin?: boolean; requireBusinessName?: boolean } = {}
) {
  const warnings: string[] = []
  const requireBusinessName = options.requireBusinessName ?? true

  if (requireBusinessName && !profile?.businessName?.trim()) warnings.push(en.transaction.missingBusinessName)
  if (!profile?.mobile?.trim()) warnings.push(en.transaction.missingMobile)
  if (!getAddressLine(profile)) warnings.push(en.transaction.missingAddress)
  if (options.requireGstin && !profile?.gstin?.trim()) warnings.push(en.transaction.missingGstin)

  return warnings
}

export function printTransactionDocument(data: TransactionDocumentData) {
  return openPrintWindow(buildTransactionPrintHtml(data))
}

export function buildTransactionPrintHtml(data: TransactionDocumentData) {
  const seller = data.seller || {}
  const date = data.date || new Date().toLocaleString("en-IN")
  const grandTotal = data.totals?.grandTotal ?? data.items.reduce((sum, item) => sum + Number(item.total || 0), 0)
  const showNotes = Boolean(data.notes?.trim())
  const showTerms = Boolean((data.terms || seller.terms)?.trim())
  const showSecondaryParty = Boolean(data.secondaryParty && Object.values(data.secondaryParty).some(Boolean))
  const showSellerPanel = data.type !== "gst-invoice"

  return `
    <html>
      <head>
        <title>${escapePrintHtml(data.title)}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 24px; font-family: Arial, sans-serif; color: #111827; background: #fff; }
          .doc { max-width: 980px; margin: 0 auto; border: 1px solid #d1d5db; border-radius: 16px; overflow: hidden; }
          .header { display: flex; justify-content: space-between; gap: 18px; padding: 20px; border-bottom: 1px solid #e5e7eb; }
          .brand { display: flex; gap: 12px; align-items: flex-start; min-width: 0; }
          .logo { width: 56px; height: 56px; border-radius: 12px; object-fit: cover; border: 1px solid #e5e7eb; }
          h1, h2, h3, p { margin: 0; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          h2 { font-size: 18px; text-transform: uppercase; letter-spacing: 0.08em; }
          .muted { color: #4b5563; font-size: 13px; line-height: 1.45; }
          .meta { min-width: 240px; font-size: 13px; }
          .row { display: flex; justify-content: space-between; gap: 16px; padding: 3px 0; }
          .section { padding: 18px 20px; border-bottom: 1px solid #e5e7eb; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 16px; }
          .box { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
          .box h3 { font-size: 13px; text-transform: uppercase; color: #374151; margin-bottom: 8px; letter-spacing: 0.05em; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; vertical-align: top; }
          th { background: #f9fafb; color: #374151; text-transform: uppercase; font-size: 11px; letter-spacing: 0.04em; }
          .right { text-align: right; }
          .summary { margin-left: auto; width: min(100%, 360px); }
          .summary .row { border-bottom: 1px dashed #d1d5db; padding: 7px 0; }
          .summary .total { font-weight: 700; font-size: 17px; border-bottom: 0; }
          .footer { padding: 16px 20px; font-size: 12px; color: #4b5563; }
          @media print { body { padding: 0; } .doc { border-radius: 0; border: 0; } }
          @media (max-width: 680px) { body { padding: 12px; } .header, .grid { display: block; } .meta, .box { margin-top: 12px; } table { font-size: 12px; } }
        </style>
      </head>
      <body>
        <div class="doc">
          <div class="header">
            <div class="brand">
              ${seller.logoUrl ? `<img class="logo" src="${escapePrintHtml(seller.logoUrl)}" alt="${escapePrintHtml(en.transaction.businessLogo)}" />` : ""}
              <div>
                <h1>${escapePrintHtml(seller.businessName || en.common.appName)}</h1>
                <p class="muted">${escapePrintHtml(getAddressLine(seller) || en.transaction.addressNotAdded)}</p>
                <p class="muted">${escapePrintHtml([seller.mobile, seller.email].filter(Boolean).join(" | ") || en.transaction.contactNotAdded)}</p>
                ${seller.gstin ? `<p class="muted"><strong>${escapePrintHtml(en.gstInvoice.gstin)}:</strong> ${escapePrintHtml(seller.gstin)}</p>` : ""}
              </div>
            </div>
            <div class="meta">
              <h2>${escapePrintHtml(data.title)}</h2>
              ${metaRow(en.receipt.ref, data.reference || "-")}
              ${metaRow(en.receipt.date, date)}
              ${data.dueDate ? metaRow(en.gstInvoice.dueDate, data.dueDate) : ""}
              ${data.paymentMode ? metaRow(en.transaction.paymentMode, data.paymentMode) : ""}
            </div>
          </div>
          <div class="section grid">
            ${showSellerPanel ? `<div class="box">
              <h3>${escapePrintHtml(en.receipt.seller)}</h3>
              <p>${escapePrintHtml(seller.businessName || "-")}</p>
              <p class="muted">${escapePrintHtml(getAddressLine(seller) || "-")}</p>
              <p class="muted">${escapePrintHtml(seller.mobile || "-")}</p>
            </div>` : ""}
            <div class="box">
              <h3>${escapePrintHtml(data.partyLabel || en.receipt.buyer)}</h3>
              ${partyHtml(data.party)}
            </div>
            ${showSecondaryParty ? `<div class="box">
              <h3>${escapePrintHtml(data.secondaryPartyLabel || en.gstInvoice.shipTo)}</h3>
              ${partyHtml(data.secondaryParty)}
            </div>` : ""}
          </div>
          <div class="section">
            ${itemsTable(data)}
          </div>
          <div class="section">
            <div class="summary">
              ${summaryRow(en.gstInvoice.taxableValue, data.totals?.taxableAmount)}
              ${summaryRow(en.gstInvoice.cgst, data.totals?.cgstTotal)}
              ${summaryRow(en.gstInvoice.sgstUtgst, data.totals?.sgstTotal)}
              ${summaryRow(en.gstInvoice.igst, data.totals?.igstTotal)}
              ${summaryRow(en.transaction.totalGst, data.totals?.totalGst)}
              ${summaryRow(en.purchases.paid, data.totals?.paidAmount)}
              ${summaryRow(en.purchases.due, data.totals?.dueAmount)}
              <div class="row total"><span>${escapePrintHtml(en.receipt.grandTotal)}</span><span>${formatMoney(grandTotal)}</span></div>
            </div>
            ${data.totals?.amountInWords ? `<p class="muted" style="margin-top:12px;"><strong>${escapePrintHtml(en.transaction.amountInWords)}:</strong> ${escapePrintHtml(data.totals.amountInWords)}</p>` : ""}
          </div>
          <div class="footer">
            ${paymentHtml(seller)}
            ${showNotes ? `<p><strong>${escapePrintHtml(en.gstInvoice.notes)}:</strong> ${escapePrintHtml(data.notes || "")}</p>` : ""}
            ${showTerms ? `<p><strong>${escapePrintHtml(en.gstInvoice.terms)}:</strong> ${escapePrintHtml(data.terms || seller.terms || "")}</p>` : ""}
            <p>${escapePrintHtml(data.footerNote || `${en.receipt.printedOn}: ${new Date().toLocaleString("en-IN")}`)}</p>
          </div>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `
}

export function formatMoney(value: unknown) {
  return `${en.common.rupeeSymbol} ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function getAddressLine(profile?: Pick<BusinessDocumentProfile, "address" | "city" | "state" | "pincode">) {
  return [profile?.address, profile?.city, profile?.state, profile?.pincode].filter(Boolean).join(", ")
}

function metaRow(label: string, value: string) {
  return `<div class="row"><span>${escapePrintHtml(label)}</span><strong>${escapePrintHtml(value)}</strong></div>`
}

function partyHtml(party?: TransactionParty) {
  if (!party || !Object.values(party).some(Boolean)) return `<p class="muted">${escapePrintHtml(en.transaction.noPartyDetails)}</p>`
  return `
    <p>${escapePrintHtml(party.name || "-")}</p>
    ${party.gstin ? `<p class="muted"><strong>${escapePrintHtml(en.gstInvoice.gstin)}:</strong> ${escapePrintHtml(party.gstin)}</p>` : ""}
    <p class="muted">${escapePrintHtml([party.address, party.city, party.state, party.pincode].filter(Boolean).join(", ") || "-")}</p>
    <p class="muted">${escapePrintHtml([party.phone, party.email].filter(Boolean).join(" | ") || "-")}</p>
  `
}

function itemsTable(data: TransactionDocumentData) {
  const showGst = data.type === "gst-invoice" || data.items.some((item) => item.gstRate || item.cgstAmount || item.sgstAmount || item.igstAmount)
  return `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>${escapePrintHtml(en.receipt.product)}</th>
          <th>${escapePrintHtml(en.receipt.qty)}</th>
          <th>${escapePrintHtml(en.receipt.rate)}</th>
          ${showGst ? `<th>${escapePrintHtml(en.gstInvoice.gst)}</th>` : ""}
          <th class="right">${escapePrintHtml(en.receipt.total)}</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>
              <strong>${escapePrintHtml(item.name || "-")}</strong>
              ${item.description ? `<div class="muted">${escapePrintHtml(item.description)}</div>` : ""}
              ${item.hsnCode ? `<div class="muted">${escapePrintHtml(en.gstInvoice.hsnSac)}: ${escapePrintHtml(item.hsnCode)}</div>` : ""}
              ${item.note ? `<div class="muted">${escapePrintHtml(item.note)}</div>` : ""}
            </td>
            <td>${escapePrintHtml([item.quantity, item.unit].filter(Boolean).join(" ") || "-")}</td>
            <td>${typeof item.rate === "number" ? formatMoney(item.rate) : "-"}</td>
            ${showGst ? `<td>${escapePrintHtml(item.gstRate !== undefined ? `${Number(item.gstRate).toFixed(2)}%` : "-")}</td>` : ""}
            <td class="right"><strong>${formatMoney(item.total)}</strong></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `
}

function summaryRow(label: string, value?: number) {
  if (value === undefined || value === null || Number(value) === 0) return ""
  return `<div class="row"><span>${escapePrintHtml(label)}</span><span>${formatMoney(value)}</span></div>`
}

function paymentHtml(seller: BusinessDocumentProfile) {
  const payment = seller.paymentDetails
  const lines = [
    payment?.upiId ? `${en.transaction.upi}: ${payment.upiId}` : "",
    payment?.bankName ? `${en.gstInvoice.bank}: ${payment.bankName}` : "",
    payment?.accountNumber ? `${en.gstInvoice.accountNo}: ${payment.accountNumber}` : "",
    payment?.ifsc ? `${en.gstInvoice.ifsc}: ${payment.ifsc}` : "",
  ].filter(Boolean)

  if (!lines.length) return ""
  return `<p><strong>${escapePrintHtml(en.gstInvoice.bankAndPaymentDetails)}:</strong> ${escapePrintHtml(lines.join(" | "))}</p>`
}
