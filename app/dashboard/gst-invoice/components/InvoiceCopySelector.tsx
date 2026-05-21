"use client"

import type { ReactNode } from "react"
import { Building2, ClipboardList, FileCheck2, Files } from "lucide-react"
import { en } from "@/app/messages/en"
import type { GstInvoiceCopyMode } from "@/app/dashboard/gst-invoice/lib/invoiceCopy"

type InvoiceCopySelectorProps = {
  value: GstInvoiceCopyMode
  onChange: (value: GstInvoiceCopyMode) => void
  disabled?: boolean
  className?: string
}

const COPY_OPTIONS: Array<{
  value: GstInvoiceCopyMode
  label: string
  description: string
  icon: ReactNode
}> = [
  {
    value: "customer",
    label: en.gstInvoice.customerInvoice,
    description: en.gstInvoice.customerInvoiceHelp,
    icon: <FileCheck2 size={16} aria-hidden="true" />,
  },
  {
    value: "business",
    label: en.gstInvoice.businessCopy,
    description: en.gstInvoice.businessCopyHelp,
    icon: <Building2 size={16} aria-hidden="true" />,
  },
  {
    value: "both",
    label: en.gstInvoice.bothCopies,
    description: en.gstInvoice.bothCopiesHelp,
    icon: <Files size={16} aria-hidden="true" />,
  },
  {
    value: "draft",
    label: en.gstInvoice.draftPreview,
    description: en.gstInvoice.draftPreviewHelp,
    icon: <ClipboardList size={16} aria-hidden="true" />,
  },
]

export default function InvoiceCopySelector({ value, onChange, disabled = false, className = "" }: InvoiceCopySelectorProps) {
  return (
    <fieldset className={`rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-3 ${className}`} disabled={disabled}>
      <legend className="px-1 text-sm font-bold text-[var(--text-primary)]">{en.gstInvoice.invoiceCopyType}</legend>
      <p className="mb-3 px-1 text-xs leading-5 text-[var(--text-secondary)]">{en.gstInvoice.invoiceCopyTypeHelp}</p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {COPY_OPTIONS.map((option) => {
          const active = value === option.value
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 rounded-2xl border p-3 transition ${active ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border-card)] bg-[var(--bg-card-strong)]"} ${disabled ? "cursor-not-allowed opacity-70" : "hover:border-[var(--accent)]"}`}
            >
              <input
                type="radio"
                name="gst-invoice-copy-type"
                value={option.value}
                checked={active}
                onChange={() => onChange(option.value)}
                disabled={disabled}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                  <span className="text-[var(--accent)]">{option.icon}</span>
                  {option.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{option.description}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
