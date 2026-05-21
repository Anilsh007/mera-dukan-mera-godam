"use client"

import { en } from "@/app/messages/en"
import { notify } from "@/app/lib/notifications"
import {
  copyTransactionDocument,
  downloadTransactionDocument,
  shareTransactionDocumentByEmail,
  shareTransactionDocumentOnWhatsApp,
} from "@/app/lib/share"
import {
  printTransactionDocument,
  type TransactionDocumentData,
  type TransactionOptionFlags,
} from "@/app/lib/transactionDocument"

export function createTransactionOptions(
  overrides: Partial<TransactionOptionFlags> = {}
): TransactionOptionFlags {
  return {
    saveTransaction: true,
    saveAsDraft: false,
    generateGstInvoice: false,
    printReceipt: false,
    downloadPdf: false,
    shareWhatsApp: false,
    shareEmail: false,
    copyDetails: false,
    ...overrides,
  }
}

export function hasPostSaveActions(options: TransactionOptionFlags) {
  return Boolean(
    options.generateGstInvoice ||
      options.printReceipt ||
      options.downloadPdf ||
      options.shareWhatsApp ||
      options.shareEmail ||
      options.copyDetails
  )
}

export function validateTransactionOptions(
  options: TransactionOptionFlags,
  {
    requireSaveTransaction = true,
    allowDraft = false,
  }: {
    requireSaveTransaction?: boolean
    allowDraft?: boolean
  } = {}
) {
  if (requireSaveTransaction && !options.saveTransaction) {
    return { valid: false, message: en.transaction.saveRequired }
  }

  if (!allowDraft && options.saveAsDraft) {
    return { valid: false, message: en.transaction.draftNotAvailable }
  }

  if (!options.saveTransaction && !hasPostSaveActions(options) && !options.saveAsDraft) {
    return { valid: false, message: en.transaction.selectAtLeastOneOption }
  }

  return { valid: true as const }
}


export function ensureValidTransactionOptions(
  options: TransactionOptionFlags,
  config?: Parameters<typeof validateTransactionOptions>[1]
) {
  const optionValidation = validateTransactionOptions(options, config)
  if (!optionValidation.valid) {
    notify.warning(optionValidation.message)
    return false
  }

  return true
}

export async function runTransactionDocumentActions(
  document: TransactionDocumentData,
  options: TransactionOptionFlags
) {
  if (options.printReceipt) {
    const printed = printTransactionDocument(document)
    if (printed) notify.success(en.common.printStarted)
    else notify.error(en.common.popupBlocked)
  }

  if (options.downloadPdf) {
    const downloaded = downloadTransactionDocument(document)
    if (downloaded) notify.success(en.share.downloadStarted)
    else notify.error(en.share.downloadFailed)
  }

  if (options.shareWhatsApp) {
    const result = await shareTransactionDocumentOnWhatsApp(document, document.title)
    if (result === "shared") notify.info(en.share.shareOpened)
    else if (result === "downloaded") notify.success(en.share.downloadStarted)
    else notify.error(en.share.shareFailed)
  }

  if (options.shareEmail) {
    const result = await shareTransactionDocumentByEmail(document, document.title)
    if (result === "shared") notify.info(en.share.shareOpened)
    else if (result === "downloaded") notify.success(en.share.downloadStarted)
    else notify.error(en.share.shareFailed)
  }

  if (options.copyDetails) {
    const result = await copyTransactionDocument(document)
    if (result === "copied") notify.success(en.share.copiedSuccessfully)
    else if (result === "downloaded") notify.success(en.share.downloadStarted)
    else notify.error(en.share.copyFailed)
  }
}
