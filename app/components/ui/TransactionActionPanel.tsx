"use client"

import { createPortal } from "react-dom"
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { ChevronUp, Copy, Download, Mail, MessageCircle, Printer, Share2 } from "lucide-react"
import TransactionOptions from "@/app/components/ui/TransactionOptions"
import { en } from "@/app/messages/en"
import { notify } from "@/app/lib/notifications"
import { auth } from "@/app/lib/firebase"
import { getUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { incrementUsage } from "@/app/lib/subscription/subscription.service"
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
  type TransactionOptionFlags,
} from "@/app/lib/transactionDocument"

type TransactionOptionsPanelProps = {
  value: TransactionOptionFlags
  onChange: (next: TransactionOptionFlags) => void
  profileWarnings?: string[]
  allowGstInvoice?: boolean
  allowPrint?: boolean
  allowDownloadPdf?: boolean
  allowShareWhatsApp?: boolean
  allowShareEmail?: boolean
  allowCopyDetails?: boolean
  allowSaveAsDraft?: boolean
  disabled?: boolean
  className?: string
  optionsClassName?: string
}

type TransactionDocumentPanelProps = {
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

type TransactionActionPanelProps = TransactionOptionsPanelProps | TransactionDocumentPanelProps

export default function TransactionActionPanel(props: TransactionActionPanelProps) {
  if ("value" in props && typeof props.onChange === "function") {
    const {
      value,
      onChange,
      profileWarnings = [],
      allowGstInvoice = false,
      allowPrint = true,
      allowDownloadPdf = true,
      allowShareWhatsApp = true,
      allowShareEmail = true,
      allowCopyDetails = true,
      allowSaveAsDraft = false,
      disabled = false,
      className = "",
      optionsClassName = "",
    } = props

    return (
      <div className={className}>

        {profileWarnings.length > 0 ? <TransactionProfileWarning warnings={profileWarnings} /> : null}
        
        <TransactionOptions
          value={value}
          onChange={onChange}
          allowGstInvoice={allowGstInvoice}
          allowPrint={allowPrint}
          allowDownloadPdf={allowDownloadPdf}
          allowShareWhatsApp={allowShareWhatsApp}
          allowShareEmail={allowShareEmail}
          allowCopyDetails={allowCopyDetails}
          allowSaveAsDraft={allowSaveAsDraft}
          disabled={disabled}
          className={optionsClassName}
        />
      </div>
    )
  }

  return <TransactionDocumentActions {...(props as TransactionDocumentPanelProps)} />
}

function TransactionDocumentActions({
  document: transactionDocument,
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
}: TransactionDocumentPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null)
  const currentDocument = buildShareDocument({ document: transactionDocument, message, subject })
  const disabled = !currentDocument && !message?.trim()
  const visibleActionCount = [showPrint, showDownload, showNative, showWhatsApp, showEmail, showCopy].filter(Boolean).length
  const estimatedMenuHeight = visibleActionCount * 48 + 16

  useEffect(() => {
    if (!expanded) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setExpanded(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false)
    }

    globalThis.document.addEventListener("pointerdown", handlePointerDown)
    globalThis.document.addEventListener("keydown", handleKeyDown)

    return () => {
      globalThis.document.removeEventListener("pointerdown", handlePointerDown)
      globalThis.document.removeEventListener("keydown", handleKeyDown)
    }
  }, [expanded])

  useLayoutEffect(() => {
    if (!expanded) return

    const updateMenuPosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const sidePadding = 12
      const centerX = Math.min(Math.max(rect.left + rect.width / 2, sidePadding), viewportWidth - sidePadding)
      const openUpward = rect.top > estimatedMenuHeight + 16

      setMenuStyle({
        position: "fixed",
        left: centerX,
        top: openUpward ? rect.top - 8 : rect.bottom + 8,
        transform: openUpward ? "translate(-50%, -100%)" : "translateX(-50%)",
      })
    }

    updateMenuPosition()

    window.addEventListener("resize", updateMenuPosition)
    window.addEventListener("scroll", updateMenuPosition, true)

    return () => {
      window.removeEventListener("resize", updateMenuPosition)
      window.removeEventListener("scroll", updateMenuPosition, true)
    }
  }, [expanded, estimatedMenuHeight])

  const getDocument = () => {
    if (currentDocument) return currentDocument
    if (message?.trim()) return buildMessageDocument({ message, subject })
    notify.warning(en.share.noDetailsToShare)
    return undefined
  }

  const recordPrintShareUsage = async () => {
    try {
      const userId = getUserIdentityFromAuthUser(auth?.currentUser)
      if (!userId) return
      await incrementUsage(userId, "printShareDownload")
    } catch (error) {
      console.warn("Print/share usage tracking failed", error)
    }
  }

  const handlePrint = () => {
    const nextDocument = getDocument()
    if (!nextDocument) return
    const printed = printTransactionDocument(nextDocument)
    if (printed) {
      notify.success(en.print.printStarted)
      void recordPrintShareUsage()
    }
    else notify.error(en.print.printFailed)
  }

  const handleDownload = () => {
    const nextDocument = getDocument()
    if (!nextDocument) return
    const downloaded = downloadTransactionDocument(nextDocument, getPdfFilename(filename, nextDocument))
    if (downloaded) {
      notify.success(en.share.downloadStarted)
      void recordPrintShareUsage()
    }
    else notify.error(en.share.downloadFailed)
  }

  const handleNativeShare = async () => {
    const nextDocument = getDocument()
    if (!nextDocument) return
    const result = await shareTransactionDocumentNative(nextDocument, getPdfFilename(filename, nextDocument))
    if (result === "shared") {
      notify.info(en.share.shareOpened)
      await recordPrintShareUsage()
    } else if (result === "downloaded") {
      notify.success(en.share.downloadStarted)
      await recordPrintShareUsage()
    }
    else notify.warning(en.share.nativeShareUnavailable)
  }

  const handleWhatsApp = async () => {
    const nextDocument = getDocument()
    if (!nextDocument) return
    const result = await shareTransactionDocumentOnWhatsApp(nextDocument, subject || nextDocument.title, getPdfFilename(filename, nextDocument))
    if (result === "failed") notify.error(en.share.shareFailed)
    else {
      notify.info(en.share.shareOpened)
      await recordPrintShareUsage()
    }
  }

  const handleEmail = async () => {
    const nextDocument = getDocument()
    if (!nextDocument) return
    const result = await shareTransactionDocumentByEmail(nextDocument, subject || nextDocument.title, getPdfFilename(filename, nextDocument))
    if (result === "failed") notify.error(en.share.shareFailed)
    else {
      notify.info(en.share.shareOpened)
      await recordPrintShareUsage()
    }
  }

  const handleCopy = async () => {
    const nextDocument = getDocument()
    if (!nextDocument) return
    const result = await copyTransactionDocument(nextDocument)
    if (result === "copied") {
      notify.success(en.share.copiedSuccessfully)
      await recordPrintShareUsage()
    } else notify.error(en.share.copyFailed)
  }

  const actions = [
    { key: "print", label: en.share.print, icon: <Printer size={16} />, visible: showPrint, onClick: handlePrint, toneClass: "text-cyan-500" },
    { key: "download", label: en.share.downloadPdf, icon: <Download size={16} />, visible: showDownload, onClick: handleDownload, toneClass: "text-emerald-500" },
    { key: "native", label: en.share.nativeShare, icon: <Share2 size={16} />, visible: showNative, onClick: () => void handleNativeShare(), toneClass: "text-slate-700 dark:text-slate-200" },
    { key: "whatsapp", label: en.share.whatsapp, icon: <MessageCircle size={16} />, visible: showWhatsApp, onClick: () => void handleWhatsApp(), toneClass: "text-green-500" },
    { key: "email", label: en.share.email, icon: <Mail size={16} />, visible: showEmail, onClick: () => void handleEmail(), toneClass: "text-rose-500" },
    { key: "copy", label: en.share.copyDetails, icon: <Copy size={16} />, visible: showCopy, onClick: () => void handleCopy(), toneClass: "text-violet-500" },
  ].filter((action) => action.visible)

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`} aria-label={en.share.title}>
      {expanded && typeof document !== "undefined" && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              className="z-[9999] flex flex-col-reverse items-center gap-2 rounded-[24px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl"
              style={menuStyle}
            >
              {actions.map((action, index) => (
                <button
                  key={action.key}
                  type="button"
                  title={action.label}
                  aria-label={action.label}
                  onClick={() => {
                    action.onClick()
                    setExpanded(false)
                  }}
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-[0_14px_30px_-26px_rgba(15,23,42,0.45)] transition-all duration-200",
                    action.toneClass,
                    disabled ? "cursor-not-allowed opacity-60" : "hover:-translate-y-0.5 hover:scale-[1.02]",
                  ].join(" ")}
                  style={{
                    opacity: expanded ? 1 : 0,
                    transform: expanded ? "translateY(0) scale(1)" : "translateY(14px) scale(0.92)",
                    transition: "opacity 180ms ease, transform 220ms ease",
                    transitionDelay: expanded ? `${index * 28}ms` : "0ms",
                  }}
                  disabled={disabled}
                >
                  <span
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-full border",
                      "border-slate-200 bg-white",
                    ].join(" ")}
                  >
                    {action.icon}
                  </span>
                </button>
              ))}
            </div>,
            globalThis.document.body,
          )
        : null}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setExpanded((current) => !current)}
        disabled={disabled}
        title="Share & download"
        className={[
          "relative z-10 flex items-center justify-center rounded-full border shadow-[0_18px_36px_-20px_rgba(59,130,246,0.8)] transition-all duration-200",
          compact ? "h-9 w-9" : "h-10 w-10",
          expanded
            ? "border-sky-400/70 bg-[linear-gradient(135deg,#38bdf8,#6366f1)] text-white"
            : "border-[var(--border-card)] bg-[color-mix(in_srgb,var(--bg-card-strong)_78%,transparent)] text-[var(--text-primary)] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent-soft)_40%,var(--bg-card-strong)_60%)]",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
        aria-expanded={expanded}
        aria-label="Share and download options"
      >
        <span className="flex items-center gap-1">
          <Share2 size={16} aria-hidden="true" />
          <ChevronUp size={12} aria-hidden="true" className={`transition-transform duration-200 ${expanded ? "rotate-0" : "rotate-180"}`} />
        </span>
      </button>
    </div>
  )
}

export function TransactionProfileWarning({ warnings, className = "" }: { warnings: string[]; className?: string }) {
  if (warnings.length === 0) return null

  return (
    <div className={`mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-500 ${className}`}>
      <p className="font-bold">{en.transaction.profileWarningTitle}</p>
      <p>{en.transaction.profileGuide}</p>
      <ul className="mt-2 list-inside list-disc">
        {warnings.map((warning) => <li key={warning}>{warning}</li>)}
      </ul>
    </div>
  )
}
