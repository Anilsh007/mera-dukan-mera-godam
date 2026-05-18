"use client"

import {
  Copy,
  Download,
  FileClock,
  FileText,
  Mail,
  MessageCircle,
  Printer,
  Save,
  type LucideIcon,
} from "lucide-react"
import { en } from "@/app/messages/en"
import type { TransactionOptionFlags } from "@/app/lib/transactionDocument"

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

type OptionConfig = {
  key: keyof TransactionOptionFlags
  label: string
  description: string
  icon: LucideIcon
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
  const options: OptionConfig[] = [
    {
      key: "saveTransaction",
      label: en.transaction.saveTransaction,
      description: en.transaction.saveTransactionHelp,
      icon: Save,
    },
    ...(allowSaveAsDraft
      ? [
          {
            key: "saveAsDraft" as const,
            label: en.transaction.saveAsDraft,
            description: en.transaction.saveAsDraftHelp,
            icon: FileClock,
          },
        ]
      : []),
    ...(allowGstInvoice
      ? [
          {
            key: "generateGstInvoice" as const,
            label: en.transaction.generateGstInvoice,
            description: en.transaction.generateGstInvoiceHelp,
            icon: FileText,
          },
        ]
      : []),
    ...(allowPrint
      ? [
          {
            key: "printReceipt" as const,
            label: en.transaction.printReceipt,
            description: en.transaction.printReceiptHelp,
            icon: Printer,
          },
        ]
      : []),
    ...(allowDownloadPdf
      ? [
          {
            key: "downloadPdf" as const,
            label: en.transaction.downloadPdf,
            description: en.transaction.downloadPdfHelp,
            icon: Download,
          },
        ]
      : []),
    ...(allowShareWhatsApp
      ? [
          {
            key: "shareWhatsApp" as const,
            label: en.transaction.shareWhatsApp,
            description: en.transaction.shareWhatsAppHelp,
            icon: MessageCircle,
          },
        ]
      : []),
    ...(allowShareEmail
      ? [
          {
            key: "shareEmail" as const,
            label: en.transaction.shareEmail,
            description: en.transaction.shareEmailHelp,
            icon: Mail,
          },
        ]
      : []),
    ...(allowCopyDetails
      ? [
          {
            key: "copyDetails" as const,
            label: en.transaction.copyDetails,
            description: en.transaction.copyDetailsHelp,
            icon: Copy,
          },
        ]
      : []),
  ]

  const setFlag = (key: keyof TransactionOptionFlags, checked: boolean) => {
    onChange({ ...value, [key]: checked })
  }

  return (
    <section className={`premium-surface rounded-[26px] p-4 sm:p-5 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
            Transaction Setup
          </p>
          <p className="mt-2 text-lg font-black tracking-[-0.03em] text-[var(--text-primary)]">
            {en.transaction.optionsTitle}
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            {en.transaction.optionsDescription}
          </p>
        </div>
        <div className="inline-flex w-fit items-center rounded-full border border-[var(--border-card)] bg-[color-mix(in_srgb,var(--bg-card-strong)_76%,transparent)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] shadow-[var(--button-shadow)]">
          Select Actions
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => (
          <OptionRow key={option.key} label={option.label} description={option.description} icon={option.icon} checked={Boolean(value[option.key])} disabled={disabled} onChange={(checked) => setFlag(option.key, checked)} />
        ))}
      </div>
    </section>
  )
}

function OptionRow({
  label,
  description,
  icon: Icon,
  checked,
  disabled,
  onChange,
}: {
  label: string
  description: string
  icon: LucideIcon
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label
      className={`group relative flex min-h-[112px] cursor-pointer items-start gap-3 overflow-hidden rounded-[22px] border px-4 py-4 text-sm transition duration-200 motion-reduce:hover:translate-y-0 ${
        checked
          ? "border-[color-mix(in_srgb,var(--accent)_52%,white_10%)] bg-[linear-gradient(155deg,color-mix(in_srgb,var(--surface-primary)_30%,var(--accent)_70%),color-mix(in_srgb,var(--accent-secondary,#8b5cf6)_32%,var(--surface-primary)_68%))] text-white shadow-[var(--shadow-lifted)]"
          : "border-[var(--border-card)] bg-[linear-gradient(145deg,var(--bg-card-strong),color-mix(in_srgb,var(--surface-primary)_82%,#020611_18%))] text-[var(--text-primary)] shadow-[var(--shadow-card)] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--button-shadow-hover)]"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-px ${
          checked
            ? "bg-white/45"
            : "bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent)_36%,white_12%),transparent)]"
        }`}
      />
      <span
        className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border ${
          checked
            ? "border-white/20 bg-white/12 text-white shadow-[0_18px_32px_rgba(15,23,42,0.26)]"
            : "border-[var(--border-card)] bg-[linear-gradient(145deg,var(--accent-soft),transparent)] text-[var(--accent)]"
        }`}
        aria-hidden="true"
      >
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1 leading-5">
        <span className={`block text-sm font-bold tracking-[-0.01em] ${checked ? "text-white" : "text-[var(--text-primary)]"}`}>
          {label}
        </span>
        <span className={`mt-1 block text-xs leading-5 ${checked ? "text-white/80" : "text-[var(--text-secondary)]"}`}>
          {description}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-2">
        <span
          className={`flex h-6 w-11 items-center rounded-full border px-0.5 transition ${
            checked
              ? "border-white/20 bg-white/15"
              : "border-[var(--border-card)] bg-[var(--bg-input)]"
          }`}
          aria-hidden="true"
        >
          <span
            className={`h-[18px] w-[18px] rounded-full transition ${
              checked
                ? "translate-x-5 bg-white shadow-[0_8px_18px_rgba(255,255,255,0.28)]"
                : "translate-x-0 bg-[var(--text-muted)]"
            }`}
          />
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${
            checked
              ? "bg-white/14 text-white"
              : "bg-[var(--surface-subtle)] text-[var(--text-muted)]"
          }`}
        >
          {checked ? "On" : "Off"}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
    </label>
  )
}
