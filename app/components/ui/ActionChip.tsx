"use client"

import type { ReactNode } from "react"

type ActionChipTone =
  | "neutral"
  | "primary"
  | "success"
  | "teal"
  | "green"
  | "rose"
  | "violet"
  | "amber"
  | "fuchsia"
  | "cyan"
  | "danger"

type ActionChipProps = {
  label: ReactNode
  icon?: ReactNode
  hint?: ReactNode
  active?: boolean
  disabled?: boolean
  tone?: ActionChipTone
  onClick?: () => void
  className?: string
  title?: string
  type?: "button" | "submit" | "reset"
}

const toneClassName: Record<ActionChipTone, { idle: string; active: string; icon: string }> = {
  neutral: {
    idle: "border-[var(--border-card)] bg-[color-mix(in_srgb,var(--bg-card-strong)_78%,transparent)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent-soft)_40%,var(--bg-card-strong)_60%)]",
    active: "border-slate-300/80 bg-slate-50 text-slate-900 dark:border-slate-400/40 dark:bg-slate-500/12 dark:text-slate-100",
    icon: "text-[var(--text-primary)]",
  },
  primary: {
    idle: "border-[var(--border-card)] bg-[color-mix(in_srgb,var(--bg-card-strong)_78%,transparent)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent-soft)_40%,var(--bg-card-strong)_60%)]",
    active: "border-sky-400/70 bg-[linear-gradient(135deg,#38bdf8,#6366f1)] text-white shadow-[0_18px_36px_-20px_rgba(59,130,246,0.8)]",
    icon: "text-sky-100",
  },
  success: {
    idle: "border-[var(--border-card)] bg-[color-mix(in_srgb,var(--bg-card-strong)_78%,transparent)] text-[var(--text-primary)] hover:border-emerald-400 hover:bg-emerald-500/10",
    active: "border-emerald-300/80 bg-emerald-50 text-emerald-950 dark:border-emerald-400/40 dark:bg-emerald-500/12 dark:text-emerald-100",
    icon: "text-emerald-500",
  },
  teal: {
    idle: "border-[var(--border-card)] bg-[color-mix(in_srgb,var(--bg-card-strong)_78%,transparent)] text-[var(--text-primary)] hover:border-cyan-400 hover:bg-cyan-500/10",
    active: "border-cyan-300/80 bg-cyan-50 text-cyan-950 dark:border-cyan-400/40 dark:bg-cyan-500/12 dark:text-cyan-100",
    icon: "text-cyan-500",
  },
  green: {
    idle: "border-[var(--border-card)] bg-[color-mix(in_srgb,var(--bg-card-strong)_78%,transparent)] text-[var(--text-primary)] hover:border-green-400 hover:bg-green-500/10",
    active: "border-green-300/80 bg-green-50 text-green-950 dark:border-green-400/40 dark:bg-green-500/12 dark:text-green-100",
    icon: "text-green-500",
  },
  rose: {
    idle: "border-[var(--border-card)] bg-[color-mix(in_srgb,var(--bg-card-strong)_78%,transparent)] text-[var(--text-primary)] hover:border-rose-400 hover:bg-rose-500/10",
    active: "border-rose-300/80 bg-rose-50 text-rose-950 dark:border-rose-400/40 dark:bg-rose-500/12 dark:text-rose-100",
    icon: "text-rose-500",
  },
  violet: {
    idle: "border-[var(--border-card)] bg-[color-mix(in_srgb,var(--bg-card-strong)_78%,transparent)] text-[var(--text-primary)] hover:border-violet-400 hover:bg-violet-500/10",
    active: "border-violet-300/80 bg-violet-50 text-violet-950 dark:border-violet-400/40 dark:bg-violet-500/12 dark:text-violet-100",
    icon: "text-violet-500",
  },
  amber: {
    idle: "border-[var(--border-card)] bg-[color-mix(in_srgb,var(--bg-card-strong)_78%,transparent)] text-[var(--text-primary)] hover:border-amber-400 hover:bg-amber-500/10",
    active: "border-amber-300/80 bg-amber-50 text-amber-950 dark:border-amber-400/40 dark:bg-amber-500/12 dark:text-amber-100",
    icon: "text-amber-500",
  },
  fuchsia: {
    idle: "border-[var(--border-card)] bg-[color-mix(in_srgb,var(--bg-card-strong)_78%,transparent)] text-[var(--text-primary)] hover:border-fuchsia-400 hover:bg-fuchsia-500/10",
    active: "border-fuchsia-300/80 bg-[linear-gradient(135deg,#60a5fa,#8b5cf6)] text-white shadow-[0_18px_36px_-20px_rgba(124,58,237,0.85)]",
    icon: "text-fuchsia-500",
  },
  cyan: {
    idle: "border-[var(--border-card)] bg-[color-mix(in_srgb,var(--bg-card-strong)_78%,transparent)] text-[var(--text-primary)] hover:border-cyan-400 hover:bg-cyan-500/10",
    active: "border-cyan-300/80 bg-cyan-50 text-cyan-950 dark:border-cyan-400/40 dark:bg-cyan-500/12 dark:text-cyan-100",
    icon: "text-cyan-500",
  },
  danger: {
    idle: "border-rose-400/60 bg-[linear-gradient(135deg,#ff2a7a,#ff4f6b)] text-white shadow-[0_16px_30px_-18px_rgba(244,63,94,0.8)] hover:border-rose-300 hover:bg-[linear-gradient(135deg,#ff4b91,#ff6a7e)]",
    active: "border-rose-300/80 bg-[linear-gradient(135deg,#ff2a7a,#ff4f6b)] text-white shadow-[0_18px_36px_-20px_rgba(244,63,94,0.8)]",
    icon: "text-white",
  },
}

export default function ActionChip({
  label,
  icon,
  hint,
  active = false,
  disabled = false,
  tone = "neutral",
  onClick,
  className = "",
  title,
  type = "button",
}: ActionChipProps) {
  const toneStyles = toneClassName[tone]

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={[
        "group relative inline-flex min-h-12 min-w-0 items-center gap-2.5 rounded-[18px] border px-4 py-3 text-left backdrop-blur-md",
        "transition-all duration-200",
        active ? toneStyles.active : toneStyles.idle,
        disabled ? "cursor-not-allowed opacity-60" : "hover:-translate-y-0.5",
        className,
      ].join(" ")}
    >
      {icon ? (
        <span
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
            active ? "border-white/20 bg-white/15 text-current" : `border-[var(--border-card)] bg-[var(--surface-secondary)] ${toneStyles.icon}`,
          ].join(" ")}
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0">
        <span className={`block text-sm font-semibold leading-none ${active ? "text-current" : "text-[var(--text-primary)]"}`}>
          {label}
        </span>
        {hint ? (
          <span className={`mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] ${active ? "text-current/75" : "text-[var(--text-muted)]"}`}>
            {hint}
          </span>
        ) : null}
      </span>
    </button>
  )
}
