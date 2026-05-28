"use client"

import type { ReactNode } from "react"
import { Copy, Download, Mail, MessageCircle, Printer, Share2 } from "lucide-react"
import ActionChip from "@/app/components/ui/ActionChip"
import { en } from "@/app/messages/en"
import { notify } from "@/app/lib/notifications"
import {
  buildShareDocument,
  getPdfFilename,
  copyTransactionDocument,
  downloadTransactionDocument,
  shareTransactionDocumentByEmail,
  shareTransactionDocumentNative,
  shareTransactionDocumentOnWhatsApp,
} from "@/app/lib/share"
import {
  buildMessageDocument,
  printTransactionDocument,
  type TransactionDocumentData,
} from "@/app/lib/transactionDocument"

type ShareActionsProps = {
  document?: TransactionDocumentData
  message?: string
  subject?: string
  filename?: string
  compact?: boolean
  className?: string
  showPrint?: boolean
  showDownload?: boolean
  showWhatsApp?: boolean
  showEmail?: boolean
  showNative?: boolean
  showCopy?: boolean
}

type ShareActionKey = "print" | "download" | "native" | "whatsapp" | "email" | "copy"

type ShareActionItem = {
  key: ShareActionKey
  label: string
  icon: ReactNode
  tone: "neutral" | "success" | "green" | "rose" | "violet" | "cyan"
  visible: boolean
  onClick: () => void
}

export default function ShareActions({
  document,
  message,
  subject,
  filename,
  compact = false,
  className = "",
  showPrint = true,
  showDownload = true,
  showWhatsApp = true,
  showEmail = true,
  showNative = true,
  showCopy = true,
}: ShareActionsProps) {
  const currentDocument = buildShareDocument({ document, message, subject })
  const disabled = !currentDocument && !message?.trim()

  const getDocument = () => {
    if (currentDocument) return currentDocument
    if (message?.trim()) return buildMessageDocument({ message, subject })
    notify.warning(en.share.noDetailsToShare)
    return undefined
  }

  const handlePrint = () => {
    const nextDocument = getDocument()
    if (!nextDocument) return
    const printed = printTransactionDocument(nextDocument)
    if (printed) notify.success(en.print.printStarted)
    else notify.error(en.print.printFailed)
  }

  const handleDownload = () => {
    const nextDocument = getDocument()
    if (!nextDocument) return
    const downloaded = downloadTransactionDocument(nextDocument, getPdfFilename(filename, nextDocument))
    if (downloaded) notify.success(en.share.downloadStarted)
    else notify.error(en.share.downloadFailed)
  }

  const handleNativeShare = async () => {
    const nextDocument = getDocument()
    if (!nextDocument) return
    const result = await shareTransactionDocumentNative(nextDocument, getPdfFilename(filename, nextDocument))
    if (result === "shared") notify.info(en.share.shareOpened)
    else if (result === "downloaded") notify.success(en.share.downloadStarted)
    else notify.warning(en.share.nativeShareUnavailable)
  }

  const handleWhatsApp = async () => {
    const nextDocument = getDocument()
    if (!nextDocument) return
    const result = await shareTransactionDocumentOnWhatsApp(nextDocument, subject || nextDocument.title, getPdfFilename(filename, nextDocument))
    if (result === "failed") notify.error(en.share.shareFailed)
    else notify.info(en.share.shareOpened)
  }

  const handleEmail = async () => {
    const nextDocument = getDocument()
    if (!nextDocument) return
    const result = await shareTransactionDocumentByEmail(nextDocument, subject || nextDocument.title, getPdfFilename(filename, nextDocument))
    if (result === "failed") notify.error(en.share.shareFailed)
    else notify.info(en.share.shareOpened)
  }

  const handleCopy = async () => {
    const nextDocument = getDocument()
    if (!nextDocument) return
    const result = await copyTransactionDocument(nextDocument)
    if (result === "copied") notify.success(en.share.copiedSuccessfully)
    else notify.error(en.share.copyFailed)
  }

  const actions: ShareActionItem[] = [
    { key: "print", label: en.share.print, icon: <Printer size={16} />, tone: "cyan", visible: showPrint, onClick: handlePrint },
    { key: "download", label: en.share.downloadPdf, icon: <Download size={16} />, tone: "success", visible: showDownload, onClick: handleDownload },
    { key: "native", label: en.share.nativeShare, icon: <Share2 size={16} />, tone: "neutral", visible: showNative, onClick: () => void handleNativeShare() },
    { key: "whatsapp", label: en.share.whatsapp, icon: <MessageCircle size={16} />, tone: "green", visible: showWhatsApp, onClick: () => void handleWhatsApp() },
    { key: "email", label: en.share.email, icon: <Mail size={16} />, tone: "rose", visible: showEmail, onClick: () => void handleEmail() },
    { key: "copy", label: en.share.copyDetails, icon: <Copy size={16} />, tone: "violet", visible: showCopy, onClick: () => void handleCopy() },
  ]

  return (
    <div className={`flex flex-wrap gap-2 ${className}`} aria-label={en.share.title}>
      {actions
        .filter((action) => action.visible)
        .map((action) => (
          <ActionChip key={action.key} disabled={disabled} icon={action.icon} label={action.label} onClick={action.onClick} tone={action.tone} className={compact ? "min-h-10 rounded-[16px] " : ""} title={action.label} />
        ))}
    </div>
  )
}
