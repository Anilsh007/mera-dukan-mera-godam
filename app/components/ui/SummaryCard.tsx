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
    <div className="premium-surface min-w-0 rounded-[22px] p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
        {icon && (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-card)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bg-elevated)_85%,white_15%),var(--bg-elevated))] shadow-[var(--button-shadow)] ${toneClass}`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-2 break-words text-xl font-bold sm:text-2xl ${toneClass}`}>{value}</p>
    </div>
  )
}
