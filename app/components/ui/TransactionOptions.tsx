"use client"

import { FileText, Printer, Save, Share2, type LucideIcon } from "lucide-react"
import { en } from "@/app/messages/en"
import type { TransactionOptionFlags } from "@/app/lib/transactionDocument"

type TransactionOptionsProps = {
  value: TransactionOptionFlags
  onChange: (next: TransactionOptionFlags) => void
  allowGstInvoice?: boolean
  allowPrint?: boolean
  allowDownloadShare?: boolean
  disabled?: boolean
  className?: string
}

export default function TransactionOptions({
  value,
  onChange,
  allowGstInvoice = false,
  allowPrint = true,
  allowDownloadShare = false,
  disabled = false,
  className = "",
}: TransactionOptionsProps) {
  const setFlag = (key: keyof TransactionOptionFlags, checked: boolean) => {
    const next = { ...value, [key]: checked }
    next.saveOnly = !next.generateGstInvoice && !next.printReceipt && !next.downloadShare
    onChange(next)
  }

  return (
    <section className={`premium-surface rounded-2xl p-3 sm:p-4 ${className}`}>
      <p className="text-sm font-bold text-[var(--text-primary)]">{en.transaction.optionsTitle}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{en.transaction.optionsDescription}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 min-[520px]:grid-cols-2">
        <OptionRow
          label={en.transaction.saveOnly}
          icon={Save}
          checked={value.saveOnly}
          disabled={disabled}
          onChange={() => {
            onChange({ saveOnly: true, generateGstInvoice: false, printReceipt: false, downloadShare: false })
          }}
        />
        {allowGstInvoice && (
          <OptionRow label={en.transaction.generateGstInvoice} icon={FileText} checked={value.generateGstInvoice} disabled={disabled} onChange={(checked) => setFlag("generateGstInvoice", checked)} />
        )}
        {allowPrint && (
          <OptionRow label={en.transaction.printReceipt} icon={Printer} checked={value.printReceipt} disabled={disabled} onChange={(checked) => setFlag("printReceipt", checked)} />
        )}
        {allowDownloadShare && (
          <OptionRow label={en.transaction.downloadShare} icon={Share2} checked={value.downloadShare} disabled={disabled} onChange={(checked) => setFlag("downloadShare", checked)} />
        )}
      </div>
    </section>
  )
}

function OptionRow({
  label,
  icon: Icon,
  checked,
  disabled,
  onChange,
}: {
  label: string
  icon: LucideIcon
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-3 py-3 text-sm text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 motion-reduce:hover:translate-y-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]" aria-hidden="true">
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1 leading-5">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 shrink-0 cursor-pointer disabled:cursor-not-allowed"
      />
    </label>
  )
}
