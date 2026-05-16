import type { ReactNode } from "react"

type StatusBadgeTone = "success" | "warning" | "danger" | "neutral" | "info"

type StatusBadgeProps = {
  children: ReactNode
  tone?: StatusBadgeTone
  className?: string
}

const toneClass: Record<StatusBadgeTone, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/14 dark:text-emerald-100 dark:ring-1 dark:ring-emerald-300/20",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-300/14 dark:text-amber-100 dark:ring-1 dark:ring-amber-300/18",
  danger: "bg-red-100 text-red-700 dark:bg-rose-400/14 dark:text-rose-100 dark:ring-1 dark:ring-rose-300/18",
  neutral: "bg-slate-100 text-slate-700 dark:bg-white/8 dark:text-slate-100 dark:ring-1 dark:ring-white/10",
  info: "bg-sky-100 text-sky-700 dark:bg-sky-400/14 dark:text-sky-100 dark:ring-1 dark:ring-sky-300/20",
}

export default function StatusBadge({ children, tone = "neutral", className = "" }: StatusBadgeProps) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass[tone]} ${className}`}>{children}</span>
}
