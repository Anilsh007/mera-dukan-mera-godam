"use client"

import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import BaseSelectField from "@/app/components/ui/SelectField"
import { en } from "@/app/messages/en"

export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <label className="block text-sm font-medium text-[var(--text-primary)]">
      <span>{label}</span>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1" />
    </label>
  )
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="block text-sm font-medium text-[var(--text-primary)]">
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 min-h-24 w-full rounded-2xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
    </label>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <BaseSelectField
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      options={options}
      placeholder={placeholder}
      className="rounded-2xl text-sm"
    />
  )
}

export function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] px-3 py-2">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className={strong ? "font-bold text-[var(--text-primary)]" : "font-semibold text-[var(--text-primary)]"}>{value}</span>
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "accepted" || status === "converted"
      ? "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500"
      : status === "rejected" || status === "expired"
        ? "border-rose-300/60 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-500"
        : "border-amber-300/60 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500"

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>{en.estimates.statuses[status as keyof typeof en.estimates.statuses]}</span>
}

export function PageActionsPlaceholder() {
  return <Button type="button" variant="outline" title={en.estimates.stockSafeHelp} disabled className="w-full sm:w-auto" />
}
