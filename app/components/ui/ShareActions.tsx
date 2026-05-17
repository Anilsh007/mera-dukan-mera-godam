"use client"

import { Copy, Download, Mail, MessageCircle, Printer, Share2 } from "lucide-react"
import Button from "@/app/components/ui/Button"
import { en } from "@/app/messages/en"
import { notify } from "@/app/lib/notifications"
import { printTransactionDocument, type TransactionDocumentData } from "@/app/lib/transactionDocument"
import {
  buildTransactionPdfBlob,
  buildShareMessage,
  copyToClipboard,
  downloadTextFile,
  downloadTransactionDocument,
  nativeShare,
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
        try {
          const file = new File([buildTransactionPdfBlob(document)], filename || `${document.reference || "document"}.pdf`, {
            type: "application/pdf",
          })
          if (await nativeShare({ title: shareSubject, text: en.share.footerNote, files: [file] })) {
            notify.info(en.share.shareOpened)
            return
          }
        } catch (error) {
          console.error("WhatsApp PDF share failed", error)
        }

        const downloaded = downloadTransactionDocument(document)
        if (downloaded) {
          openWhatsAppShare(`${shareSubject}\n${en.share.downloadStarted}`)
          notify.success(en.share.downloadStarted)
        } else {
          notify.error(en.share.downloadFailed)
        }
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
        try {
          const file = new File([buildTransactionPdfBlob(document)], filename || `${document.reference || "document"}.pdf`, {
            type: "application/pdf",
          })
          if (await nativeShare({ title: shareSubject, text: en.share.footerNote, files: [file] })) {
            notify.info(en.share.shareOpened)
            return
          }
        } catch (error) {
          console.error("Email PDF share failed", error)
        }

        const downloaded = downloadTransactionDocument(document)
        if (downloaded) {
          openEmailShare(shareSubject, `${en.share.downloadStarted}\n${shareSubject}`)
          notify.success(en.share.downloadStarted)
        } else {
          notify.error(en.share.downloadFailed)
        }
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
        try {
          if (typeof navigator !== "undefined" && "clipboard" in navigator && "ClipboardItem" in window) {
            const pdfBlob = buildTransactionPdfBlob(document)
            const item = new ClipboardItem({ "application/pdf": pdfBlob })
            await navigator.clipboard.write([item])
            notify.success(en.share.copiedSuccessfully)
        } else {
          const downloaded = downloadTransactionDocument(document)
          if (downloaded) notify.success(en.share.downloadStarted)
          else notify.error(en.share.copyFailed)
        }
      } catch (error) {
        console.error("Copy failed", error)
        notify.error(en.share.copyFailed)
      }
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

  return (
    <div className={`grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap ${compact ? "sm:justify-start" : "sm:justify-end"} ${className}`}>
      <Button type="button" variant="outline" title={en.share.nativeShare} icon={<Share2 size={16} />} onClick={handleNativeShare} className="min-h-10 w-full sm:w-auto" />
      <Button type="button" variant="success" title={en.share.whatsapp} icon={<MessageCircle size={16} />} onClick={handleWhatsApp} className="min-h-10 w-full sm:w-auto" />
      <Button type="button" variant="secondary" title={en.share.email} icon={<Mail size={16} />} onClick={handleEmail} className="min-h-10 w-full sm:w-auto" />
      <Button type="button" variant="outline" title={en.share.copyDetails} icon={<Copy size={16} />} onClick={handleCopy} className="min-h-10 w-full sm:w-auto" />
      {showPrint && <Button type="button" variant="secondary" title={en.share.print} icon={<Printer size={16} />} onClick={handlePrint} className="min-h-10 w-full sm:w-auto" />}
      {showDownload && <Button type="button" variant="outline" title={en.share.download} icon={<Download size={16} />} onClick={handleDownload} className="min-h-10 w-full sm:w-auto" />}
    </div>
  )
}
