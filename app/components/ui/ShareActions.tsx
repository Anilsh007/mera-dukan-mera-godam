"use client"

import { Copy, Download, Mail, MessageCircle, Printer, Share2 } from "lucide-react"
import Button from "@/app/components/ui/Button"
import { en } from "@/app/messages/en"
import { notify } from "@/app/lib/notifications"
import { printTransactionDocument, type TransactionDocumentData } from "@/app/lib/transactionDocument"
import {
  buildTransactionPdfBlob,
  buildShareMessage,
  copyTransactionDocument,
  copyToClipboard,
  downloadTextFile,
  downloadTransactionDocument,
  nativeShare,
  shareTransactionDocumentByEmail,
  shareTransactionDocumentOnWhatsApp,
  openEmailShare,
  openWhatsAppShare,
} from "@/app/lib/share"

type ShareActionsProps = {
  document?: TransactionDocumentData
  message?: string
  subject?: string
  filename?: string
  showPrint?: boolean
  showDownload?: boolean
  compact?: boolean
  className?: string
}

type ActionItem = {
  key: string
  label: string
  icon: React.ReactNode
  onClick: () => void | Promise<void>
  variant: "primary" | "secondary" | "success" | "outline"
}

export default function ShareActions({
  document,
  message,
  subject,
  filename,
  showPrint = Boolean(document),
  showDownload = Boolean(document) || Boolean(message),
  compact = false,
  className = "",
}: ShareActionsProps) {
  const shareText = message || (document ? buildShareMessage(document) : "")
  const shareSubject = subject || document?.title || en.share.transactionDetails

  const ensureShareText = () => {
    if (shareText.trim()) return true
    notify.warning(en.share.noDetailsToShare)
    return false
  }

  const handleNativeShare = async () => {
    if (document) {
      try {
        const file = new File([buildTransactionPdfBlob(document)], filename || `${document.reference || "document"}.pdf`, {
          type: "application/pdf",
        })
        const shared = await nativeShare({ title: shareSubject, text: en.share.footerNote, files: [file] })
        if (shared) notify.info(en.share.shareOpened)
        else notify.warning(en.share.nativeShareUnavailable)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        console.error("Native PDF share failed", error)
        notify.error(en.share.shareFailed)
      }
      return
    }

    if (!ensureShareText()) return
    try {
      const shared = await nativeShare({ title: shareSubject, text: shareText })
      if (shared) notify.info(en.share.shareOpened)
      else notify.warning(en.share.nativeShareUnavailable)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      console.error("Native share failed", error)
      notify.error(en.share.shareFailed)
    }
  }

  const handleWhatsApp = () => {
    if (document) {
      const sharePdf = async () => {
        const result = await shareTransactionDocumentOnWhatsApp(document, shareSubject)
        if (result === "shared") notify.info(en.share.shareOpened)
        else if (result === "downloaded") notify.success(en.share.downloadStarted)
        else notify.error(en.share.downloadFailed)
      }

      void sharePdf()
      return
    }
    if (!ensureShareText()) return
    if (openWhatsAppShare(shareText)) notify.info(en.share.shareOpened)
    else notify.error(en.share.shareFailed)
  }

  const handleEmail = () => {
    if (document) {
      const sharePdf = async () => {
        const result = await shareTransactionDocumentByEmail(document, shareSubject)
        if (result === "shared") notify.info(en.share.shareOpened)
        else if (result === "downloaded") notify.success(en.share.downloadStarted)
        else notify.error(en.share.downloadFailed)
      }

      void sharePdf()
      return
    }
    if (!ensureShareText()) return
    if (openEmailShare(shareSubject, shareText)) notify.info(en.share.shareOpened)
    else notify.error(en.share.shareFailed)
  }

  const handleCopy = async () => {
    if (document) {
      const result = await copyTransactionDocument(document)
      if (result === "copied") notify.success(en.share.copiedSuccessfully)
      else if (result === "downloaded") notify.success(en.share.downloadStarted)
      else notify.error(en.share.copyFailed)
      return
    }
    if (!ensureShareText()) return
    try {
      if (await copyToClipboard(shareText)) notify.success(en.share.copiedSuccessfully)
      else notify.error(en.share.copyFailed)
    } catch (error) {
      console.error("Copy failed", error)
      notify.error(en.share.copyFailed)
    }
  }

  const handlePrint = () => {
    if (!document) {
      notify.warning(en.share.noDetailsToShare)
      return
    }

    if (printTransactionDocument(document)) notify.success(en.share.printStarted)
    else notify.error(en.common.popupBlocked)
  }

  const handleDownload = () => {
    try {
      const downloaded = document
        ? downloadTransactionDocument(document)
        : shareText.trim()
          ? downloadTextFile(filename || `share-${Date.now()}.txt`, shareText)
          : false
      if (downloaded) notify.success(en.share.downloadStarted)
      else notify.error(en.share.downloadFailed)
    } catch (error) {
      console.error("Download failed", error)
      notify.error(en.share.downloadFailed)
    }
  }

  const actions: ActionItem[] = [
    {
      key: "share",
      label: en.share.nativeShare,
      icon: <Share2 size={16} />,
      onClick: handleNativeShare,
      variant: "outline",
    },
    {
      key: "whatsapp",
      label: en.share.whatsapp,
      icon: <MessageCircle size={16} />,
      onClick: handleWhatsApp,
      variant: "success",
    },
    {
      key: "email",
      label: en.share.email,
      icon: <Mail size={16} />,
      onClick: handleEmail,
      variant: "secondary",
    },
    {
      key: "copy",
      label: en.share.copyDetails,
      icon: <Copy size={16} />,
      onClick: handleCopy,
      variant: "outline",
    },
    {
      key: "print",
      label: en.share.print,
      icon: <Printer size={16} />,
      onClick: handlePrint,
      variant: "secondary" as const,
    },
    {
      key: "download",
      label: en.share.download,
      icon: <Download size={16} />,
      onClick: handleDownload,
      variant: "outline" as const,
    },
  ]

  return (
    <section aria-label={en.share.transactionDetails} >
      <div className={`flex flex-wrap gap-2`} >
        {actions.map((action) => (
          <Button key={action.key} type="button" variant={action.variant} icon={action.icon} onClick={action.onClick} className="shadow-none" />
        ))}
      </div>
    </section>
  )
}
