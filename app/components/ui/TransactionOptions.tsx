"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { ChevronUp, ClipboardList, Copy, Download, FileText, Mail, MessageCircle, Printer, Share2 } from "lucide-react"
import type { TransactionOptionFlags } from "@/app/lib/transactionDocument"
import { en } from "@/app/messages/en"

type TransactionOptionsProps = {
  value: TransactionOptionFlags
  onChange: (next: TransactionOptionFlags) => void
  allowGstInvoice?: boolean
  allowPrint?: boolean
  allowDownloadPdf?: boolean
  allowShareWhatsApp?: boolean
  allowShareEmail?: boolean
  allowCopyDetails?: boolean
  allowSaveAsDraft?: boolean
  disabled?: boolean
  className?: string
}

type OptionKey = keyof TransactionOptionFlags

type OptionItem = {
  key: OptionKey
  label: string
  description: string
  icon: ReactNode
  tone: "primary" | "amber" | "fuchsia" | "cyan" | "success" | "green" | "rose" | "violet"
  required?: boolean
  visible: boolean
}

const activeToneClassName: Record<OptionItem["tone"], string> = {
  primary: "border-sky-400 bg-[linear-gradient(135deg,#38bdf8,#0284c7)] text-white shadow-[0_18px_34px_-18px_rgba(14,165,233,0.85)]",
  amber: "border-amber-400 bg-[linear-gradient(135deg,#f59e0b,#ea580c)] text-white shadow-[0_18px_34px_-18px_rgba(245,158,11,0.8)]",
  fuchsia: "border-fuchsia-400 bg-[linear-gradient(135deg,#d946ef,#7c3aed)] text-white shadow-[0_18px_34px_-18px_rgba(217,70,239,0.8)]",
  cyan: "border-cyan-400 bg-[linear-gradient(135deg,#06b6d4,#0284c7)] text-white shadow-[0_18px_34px_-18px_rgba(6,182,212,0.8)]",
  success: "border-emerald-400 bg-[linear-gradient(135deg,#10b981,#059669)] text-white shadow-[0_18px_34px_-18px_rgba(16,185,129,0.8)]",
  green: "border-green-400 bg-[linear-gradient(135deg,#22c55e,#16a34a)] text-white shadow-[0_18px_34px_-18px_rgba(34,197,94,0.8)]",
  rose: "border-rose-400 bg-[linear-gradient(135deg,#fb7185,#e11d48)] text-white shadow-[0_18px_34px_-18px_rgba(251,113,133,0.8)]",
  violet: "border-violet-400 bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-white shadow-[0_18px_34px_-18px_rgba(139,92,246,0.8)]",
}

export default function TransactionOptions({
  value,
  onChange,
  allowGstInvoice = false,
  allowPrint = true,
  allowDownloadPdf = true,
  allowShareWhatsApp = true,
  allowShareEmail = true,
  allowCopyDetails = true,
  allowSaveAsDraft = false,
  disabled = false,
  className = "",
}: TransactionOptionsProps) {
  const [expanded, setExpanded] = useState(false)

  const options: OptionItem[] = [
    {
      key: "saveAsDraft",
      label: en.transaction.saveAsDraft,
      description: en.transaction.saveAsDraftHelp,
      icon: <ClipboardList size={16} aria-hidden="true" />,
      tone: "amber",
      visible: allowSaveAsDraft,
    },
    {
      key: "generateGstInvoice",
      label: en.transaction.generateGstInvoice,
      description: en.transaction.generateGstInvoiceHelp,
      icon: <FileText size={16} aria-hidden="true" />,
      tone: "fuchsia",
      visible: allowGstInvoice,
    },
    {
      key: "printReceipt",
      label: en.transaction.printReceipt,
      description: en.transaction.printReceiptHelp,
      icon: <Printer size={16} aria-hidden="true" />,
      tone: "cyan",
      visible: allowPrint,
    },
    {
      key: "downloadPdf",
      label: en.transaction.downloadPdf,
      description: en.transaction.downloadPdfHelp,
      icon: <Download size={16} aria-hidden="true" />,
      tone: "success",
      visible: allowDownloadPdf,
    },
    {
      key: "shareWhatsApp",
      label: en.transaction.shareWhatsApp,
      description: en.transaction.shareWhatsAppHelp,
      icon: <MessageCircle size={16} aria-hidden="true" />,
      tone: "green",
      visible: allowShareWhatsApp,
    },
    {
      key: "shareEmail",
      label: en.transaction.shareEmail,
      description: en.transaction.shareEmailHelp,
      icon: <Mail size={16} aria-hidden="true" />,
      tone: "rose",
      visible: allowShareEmail,
    },
    {
      key: "copyDetails",
      label: en.transaction.copyDetails,
      description: en.transaction.copyDetailsHelp,
      icon: <Copy size={16} aria-hidden="true" />,
      tone: "violet",
      visible: allowCopyDetails,
    },
  ]

  const visibleOptions = options.filter((option) => option.visible)
  const hasSelection = visibleOptions.some((option) => Boolean(value[option.key]))

  const toggle = (key: OptionKey, checked: boolean) => {
    onChange({ ...value, saveTransaction: true, [key]: checked })
  }

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className={[
          "absolute bottom-12 left-1/2 z-0 flex -translate-x-1/2 flex-col-reverse items-center gap-2 rounded-[24px] transition-all duration-200",
          expanded
            ? "border border-[--border-card] bg-[--bg-card] p-2 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)]"
            : "pointer-events-none opacity-0",
        ].join(" ")}
      >
        {visibleOptions.map((option, index) => {
          const checked = Boolean(value[option.key])
          const activeToneClass = activeToneClassName[option.tone]
          return (
            <label
              key={option.key}
              style={{
                opacity: expanded ? 1 : 0,
                transform: expanded ? "translateY(0) scale(1)" : "translateY(14px) scale(0.92)",
                pointerEvents: expanded ? "auto" : "none",
                transition: "opacity 180ms ease, transform 220ms ease",
                transitionDelay: expanded ? `${index * 28}ms` : "0ms",
              }}
            >
              <input type="checkbox" checked={checked} onChange={(event) => toggle(option.key, event.target.checked)} disabled={disabled} className="sr-only" />
              <span
                title={option.description}
                className={[
                  "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border bg-white shadow-[0_14px_30px_-26px_rgba(15,23,42,0.45)] transition-all duration-200",
                  checked ? activeToneClass : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                  disabled ? "cursor-not-allowed opacity-60" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full border",
                    checked ? "border-white/25 bg-white/15 text-white" : "border-slate-200 bg-white",
                  ].join(" ")}
                >
                  {option.icon}
                </span>
              </span>
            </label>
          )
        })}
      </div>

      <button type="button" onClick={() => setExpanded((current) => !current)} disabled={disabled} title="Share & download"
        className={["relative z-10 flex h-10 w-10 items-center justify-center rounded-full border shadow-[0_18px_36px_-20px_rgba(59,130,246,0.8)] transition-all duration-200",
          expanded || hasSelection
            ? "border-sky-400/70 bg-[linear-gradient(135deg,#38bdf8,#6366f1)] text-white"
            : "border-[var(--border-card)] bg-[color-mix(in_srgb,var(--bg-card-strong)_78%,transparent)] text-[var(--text-primary)] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent-soft)_40%,var(--bg-card-strong)_60%)]",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
        aria-expanded={expanded}
        aria-label="Share and download options"
      >
        <span className="flex items-center gap-1">
          <Share2 size={16} aria-hidden="true" />
          <ChevronUp
            size={12}
            aria-hidden="true"
            className={`transition-transform duration-200 ${expanded ? "rotate-0" : "rotate-180"}`}
          />
        </span>
      </button>
    </div>
  )
}
