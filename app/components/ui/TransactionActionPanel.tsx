"use client"

import TransactionOptions from "@/app/components/ui/TransactionOptions"
import type { TransactionOptionFlags } from "@/app/lib/transactionDocument"
import { en } from "@/app/messages/en"

type TransactionActionPanelProps = {
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

export default function TransactionActionPanel({
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
}: TransactionActionPanelProps) {
  return (
    <div className={className}>
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

      {profileWarnings.length > 0 && <TransactionProfileWarning warnings={profileWarnings} />}
    </div>
  )
}

export function TransactionProfileWarning({ warnings, className = "" }: { warnings: string[]; className?: string }) {
  if (warnings.length === 0) return null

  return (
    <div className={`mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100 ${className}`}>
      <p className="font-bold">{en.transaction.profileWarningTitle}</p>
      <p>{en.transaction.profileGuide}</p>
      <ul className="mt-2 list-inside list-disc">
        {warnings.map((warning) => <li key={warning}>{warning}</li>)}
      </ul>
    </div>
  )
}
