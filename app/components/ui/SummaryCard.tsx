import type { ReactNode } from "react"

type SummaryCardTone = "default" | "amber" | "orange" | "rose" | "emerald"

export default function SummaryCard({
  label,
  value,
  tone = "default",
  icon,
}: {
  label: string
  value: string
  tone?: SummaryCardTone
  icon?: ReactNode
}) {
  const toneClass =
    tone === "amber"
      ? "text-amber-600 dark:text-amber-300"
      : tone === "orange"
        ? "text-orange-600 dark:text-orange-300"
        : tone === "rose"
          ? "text-rose-600 dark:text-rose-300"
          : tone === "emerald"
            ? "text-emerald-600 dark:text-emerald-300"
            : "text-[var(--text-primary)]"

  return (
    <div className="rounded-[22px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-[var(--border-primary)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
        {icon && (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-elevated)] ${toneClass}`}>
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  )
}
