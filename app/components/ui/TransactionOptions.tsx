"use client"

import type { ReactNode } from "react"
import { CheckCircle2, ClipboardList, Copy, Download, FileText, Mail, MessageCircle, Printer, Save } from "lucide-react"
import ActionChip from "@/app/components/ui/ActionChip"
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
  const options: OptionItem[] = [
    {
      key: "saveTransaction",
      label: en.transaction.saveTransaction,
      description: en.transaction.saveTransactionHelp,
      icon: <Save size={16} aria-hidden="true" />,
      tone: "primary",
      required: true,
      visible: true,
    },
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

  const toggle = (key: OptionKey, checked: boolean) => {
    if (key === "saveTransaction") return
    onChange({ ...value, [key]: checked })
  }

  return (
    <fieldset className={`rounded-[26px] border border-[var(--border-card)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-primary)_94%,#071827_6%),color-mix(in_srgb,var(--bg-card-strong)_92%,#020611_8%))] p-3 sm:p-4 ${className}`} disabled={disabled}>
      <legend className="px-1 text-sm font-bold text-[var(--text-primary)]">{en.transaction.optionsTitle}</legend>
      <p className="mb-3 px-1 text-xs leading-5 text-[var(--text-secondary)]">{en.transaction.optionsDescription}</p>
      <div className="flex flex-wrap gap-3">
        {options.filter((option) => option.visible).map((option) => {
          const checked = Boolean(value[option.key]) || Boolean(option.required)
          const isPrimaryAction = option.key === "generateGstInvoice"
          return (
            <label
              key={option.key}
              className={isPrimaryAction ? "sm:ml-auto" : ""}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => toggle(option.key, event.target.checked)}
                disabled={disabled || option.required}
                className="sr-only"
              />
              <ActionChip
                label={option.key === "shareEmail" ? "Email" : option.key === "shareWhatsApp" ? "WhatsApp" : option.key === "downloadPdf" ? "Download PDF" : option.label}
                icon={option.required ? <CheckCircle2 size={16} aria-hidden="true" /> : option.icon}
                hint={option.required ? "Required" : undefined}
                active={checked}
                disabled={disabled}
                tone={option.tone}
                title={option.description}
              />
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
