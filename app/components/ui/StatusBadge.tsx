import type { ReactNode } from "react"

export type StatusBadgeTone = "neutral" | "success" | "warning" | "danger" | "info"

type StatusBadgeProps = {
  children: ReactNode
  tone?: StatusBadgeTone
  className?: string
  title?: string
}

const toneClassName: Record<StatusBadgeTone, string> = {
  neutral: "border-slate-300/60 bg-slate-500/10 text-slate-700 dark:border-slate-500/40 dark:text-slate-200",
  success: "border-emerald-300/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-600",
  warning: "border-amber-300/80 bg-amber-500/10 text-amber-800 dark:border-amber-500/40 dark:text-amber-600",
  danger: "border-rose-300/80 bg-rose-500/10 text-rose-700 dark:border-rose-500/40 dark:text-rose-600",
  info: "border-sky-300/70 bg-sky-500/10 text-sky-700 dark:border-sky-500/40 dark:text-sky-200",
}

export default function StatusBadge({ children, tone = "neutral", className = "", title }: StatusBadgeProps) {
  return (
    <span
      title={title}
      className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${toneClassName[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
