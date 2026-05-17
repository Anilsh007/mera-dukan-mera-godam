import type { ReactNode } from "react"

type StatusBadgeTone = "success" | "warning" | "danger" | "neutral" | "info"

type StatusBadgeProps = {
  children: ReactNode
  tone?: StatusBadgeTone
  className?: string
}

const toneClass: Record<StatusBadgeTone, string> = {
  success: "border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-300/22 dark:bg-emerald-400/14 dark:text-emerald-100 dark:ring-1 dark:ring-emerald-300/18",
  warning: "border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/14 dark:text-amber-100 dark:ring-1 dark:ring-amber-300/16",
  danger: "border border-red-300 bg-red-50 text-red-800 dark:border-rose-300/20 dark:bg-rose-400/14 dark:text-rose-100 dark:ring-1 dark:ring-rose-300/16",
  neutral: "border border-[var(--border-card)] bg-[var(--surface-primary)] text-[var(--text-primary)] dark:bg-white/8 dark:text-slate-100 dark:ring-1 dark:ring-white/10",
  info: "border border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-300/20 dark:bg-sky-400/14 dark:text-sky-100 dark:ring-1 dark:ring-sky-300/18",
}

export default function StatusBadge({ children, tone = "neutral", className = "" }: StatusBadgeProps) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass[tone]} ${className}`}>{children}</span>
}
