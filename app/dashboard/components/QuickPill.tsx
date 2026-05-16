"use client"

import type { ReactNode } from "react"

type QuickPillProps = {
  icon: ReactNode
  label: string
  value: string
}

export default function QuickPill({ icon, label, value }: QuickPillProps) {
  return (
    <div className="dashboard-metric-pill rounded-2xl px-4 py-3">
      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--text-primary)] shadow-[var(--button-shadow)]">
          {icon}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 text-base font-black tracking-[-0.02em] text-[var(--text-primary)] sm:text-lg">{value}</p>
    </div>
  )
}
