import { en } from "@/app/messages/en"
import { formatCurrency, formatIndianDateTime } from "@/app/lib/formatters"
import {
  buildProfessionalPdfFilename,
  buildProfessionalPdfHtml,
  buildProfessionalPdfShareText,
  createProfessionalPdfBlob,
  downloadProfessionalPdf,
  printProfessionalPdf,
  type PdfBusinessProfile,
  type PdfDocumentItem,
  type PdfDocumentTotals,
  type PdfParty,
  type ProfessionalPdfDocument,
} from "@/app/lib/pdf/professionalPdf"

export type BusinessDocumentProfile = PdfBusinessProfile
export type TransactionDocumentItem = PdfDocumentItem
export type TransactionDocumentTotals = PdfDocumentTotals
export type TransactionDocumentParty = PdfParty

export type TransactionDocumentType =
  | "gst-invoice"
  | "sale"
  | "purchase"
  | "receipt"
  | "estimate"
  | "return"
  | "statement"
  | "report"
  | "payment"

export type TransactionDocumentData = ProfessionalPdfDocument & {
  type: TransactionDocumentType
  status?: string
}

export type TransactionOptionFlags = {
  saveTransaction: boolean
  saveAsDraft: boolean
  generateGstInvoice: boolean
  printReceipt: boolean
  downloadPdf: boolean
  shareWhatsApp: boolean
  shareEmail: boolean
  copyDetails: boolean
}

type ProfileLike = {
  personal?: {
    displayName?: string
    email?: string
    phone?: string
    photoURL?: string
  }
  business?: {
    shopName?: string
    gstNumber?: string
    upiId?: string
    invoicePrefix?: string
    logoUrl?: string
  }
  address?: {
    address?: string
    district?: string
    city?: string
    state?: string
    pincode?: string
  } | string
  banking?: {
    accountHolderName?: string
    accountNumber?: string
    ifscCode?: string
    bankName?: string
  }
  settings?: {
    termsAndConditions?: string
  }
  businessName?: string
  shopName?: string
  ownerName?: string
  mobile?: string
  phone?: string
  email?: string
  gstin?: string
  gstNumber?: string
  logoUrl?: string
  city?: string
  state?: string
  pincode?: string
  terms?: string
  upiId?: string
  bankName?: string
  accountHolderName?: string
  accountNumber?: string
  ifsc?: string
  ifscCode?: string
} | null | undefined

export function buildBusinessDocumentProfile(profile?: ProfileLike): BusinessDocumentProfile {
  const source = (profile || {}) as Exclude<ProfileLike, null | undefined>
  const nestedAddress = typeof source.address === "object" ? source.address : undefined
  const flatAddress = typeof source.address === "string" ? source.address : ""
  return {
    businessName: source.business?.shopName || source.businessName || source.shopName || "",
    ownerName: source.personal?.displayName || source.ownerName || source.accountHolderName || "",
    name: source.business?.shopName || source.businessName || source.shopName || "",
    phone: source.personal?.phone || source.mobile || source.phone || "",
    email: source.personal?.email || source.email || "",
    gstin: source.business?.gstNumber || source.gstin || source.gstNumber || "",
    logoUrl: source.business?.logoUrl || source.logoUrl || source.personal?.photoURL || "",
    address: nestedAddress?.address || flatAddress || "",
    city: nestedAddress?.district || nestedAddress?.city || source.city || "",
    state: nestedAddress?.state || source.state || "",
    pincode: nestedAddress?.pincode || source.pincode || "",
    terms: source.settings?.termsAndConditions || source.terms || "",
    paymentDetails: {
      upiId: source.business?.upiId || source.upiId || "",
      bankName: source.banking?.bankName || source.bankName || "",
      accountHolderName: source.banking?.accountHolderName || source.accountHolderName || "",
      accountNumber: source.banking?.accountNumber || source.accountNumber || "",
      ifsc: source.banking?.ifscCode || source.ifsc || source.ifscCode || "",
    },
  }
}

export function getAddressLine(party?: Pick<TransactionDocumentParty, "address" | "city" | "state" | "pincode"> | null) {
  if (!party) return ""
  return [party.address, party.city, party.state, party.pincode].filter(Boolean).join(", ")
}

export function formatMoney(value?: number | null) {
  return formatCurrency(value)
}

export function getProfileDocumentWarnings(
  profile: BusinessDocumentProfile,
  options: { requireGstin?: boolean } = {},
) {
  const warnings: string[] = []
  if (!profile.businessName?.trim()) warnings.push(en.transaction.missingBusinessName)
  if (!profile.phone?.trim()) warnings.push(en.transaction.missingMobile)
  if (!getAddressLine(profile)) warnings.push(en.transaction.missingAddress)
  if (options.requireGstin && !profile.gstin?.trim()) warnings.push(en.transaction.missingGstin)
  return warnings
}

export function getPartyDocumentWarnings(
  party?: TransactionDocumentParty,
  options: { requireName?: boolean; requireGstin?: boolean; requireAddress?: boolean } = {},
) {
  const warnings: string[] = []
  if (options.requireName && !party?.name?.trim()) warnings.push(en.transaction.missingPartyName)
  if (options.requireGstin && !party?.gstin?.trim()) warnings.push(en.transaction.missingPartyGstin)
  if (options.requireAddress && !getAddressLine(party)) warnings.push(en.transaction.missingPartyAddress)
  return warnings
}

export function printTransactionDocument(document: TransactionDocumentData) {
  return printProfessionalPdf(document)
}

export function downloadTransactionDocument(document: TransactionDocumentData, filename?: string) {
  return downloadProfessionalPdf(document, filename)
}

export function createTransactionDocumentPdfBlob(document: TransactionDocumentData) {
  return createProfessionalPdfBlob(document)
}

export function buildTransactionDocumentHtml(document: TransactionDocumentData) {
  return buildProfessionalPdfHtml(document)
}

export function buildTransactionDocumentFilename(document: TransactionDocumentData, filename?: string) {
  return filename ? filename.replace(/\.txt$/i, ".pdf") : buildProfessionalPdfFilename(document)
}

export function buildTransactionDocumentShareText(document: TransactionDocumentData) {
  return buildProfessionalPdfShareText(document)
}

export function buildMessageDocument({
  message,
  subject,
  seller,
}: {
  message: string
  subject?: string
  seller?: BusinessDocumentProfile
}): TransactionDocumentData {
  const lines = message.split(/\r?\n/).filter(Boolean)
  return {
    type: "report",
    title: subject || en.share.transactionDetails,
    reference: new Date().toISOString().slice(0, 10),
    date: formatIndianDateTime(new Date()),
    seller: seller || buildBusinessDocumentProfile(),
    partyLabel: en.share.transactionDetails,
    party: { name: subject || en.share.transactionDetails },
    items: lines.map((line, index) => ({
      name: index === 0 ? line : `${en.gstInvoice.details} ${index + 1}`,
      description: index === 0 ? "" : line,
      quantity: 1,
      total: 0,
    })),
    totals: {},
    notes: message,
    footerNote: en.share.footerNote,
  }
}

export async function copyTransactionDocument(document: TransactionDocumentData) {
  if (typeof navigator === "undefined" || !navigator.clipboard) return "failed" as const
  try {
    await navigator.clipboard.writeText(buildTransactionDocumentShareText(document))
    return "copied" as const
  } catch {
    return "failed" as const
  }
}
