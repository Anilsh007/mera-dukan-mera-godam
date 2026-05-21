import type { ReactNode } from "react"

export type SummaryCardTone = "default" | "emerald" | "amber" | "rose" | "sky"

type SummaryCardProps = {
  label: ReactNode
  value: ReactNode
  icon?: ReactNode
  tone?: SummaryCardTone
  className?: string
  labelClassName?: string
  valueClassName?: string
  helperText?: ReactNode
}

const toneClassName: Record<SummaryCardTone, string> = {
  default: "border-[var(--border-card)] bg-[var(--bg-card-strong)]",
  emerald: "border-emerald-300/70 bg-emerald-500/10 dark:border-emerald-500/40",
  amber: "border-amber-300/80 bg-amber-500/10 dark:border-amber-500/40",
  rose: "border-rose-300/80 bg-rose-500/10 dark:border-rose-500/40",
  sky: "border-sky-300/70 bg-sky-500/10 dark:border-sky-500/40",
}

export default function SummaryCard({
  label,
  value,
  icon,
  tone = "default",
  className = "",
  labelClassName = "",
  valueClassName = "",
  helperText,
}: SummaryCardProps) {
  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${toneClassName[tone]} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] ${labelClassName}`}>{label}</p>
          <p className={`mt-2 break-words text-xl font-bold text-[var(--text-primary)] ${valueClassName}`}>{value}</p>
        </div>
        {icon ? <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-primary)] text-[var(--accent)]">{icon}</div> : null}
      </div>
      {helperText ? <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{helperText}</p> : null}
    </article>
  )
}
