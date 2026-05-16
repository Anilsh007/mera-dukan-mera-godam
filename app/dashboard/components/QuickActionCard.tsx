"use client"

import type { ReactNode } from "react"

type QuickActionCardProps = {
  title: string
  description: string
  icon: ReactNode
  accentClass?: string
  onClick: () => void
}

export default function QuickActionCard({
  title,
  description,
  icon,
  accentClass = "bg-emerald-500",
  onClick,
}: QuickActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="dashboard-action-card group rounded-[24px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 text-left shadow-[var(--shadow-card)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[var(--shadow-lifted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-[1.15rem] ${accentClass} text-white shadow-[0_18px_32px_rgba(15,23,42,0.28),0_0_20px_rgba(99,102,241,0.14)]`}>
        {icon}
      </div>
      <p className="font-bold tracking-[-0.02em] text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{description}</p>
    </button>
  )
}
