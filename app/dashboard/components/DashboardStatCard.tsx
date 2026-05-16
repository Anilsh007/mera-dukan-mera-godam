"use client"

import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { en } from "@/app/messages/en"

type DashboardStatCardProps = {
  label: string
  value: string | number
  sub?: string
  icon: ReactNode
  accentClass?: string
  loading?: boolean
  onClick?: () => void
}

function CardContent({ label, value, sub, icon, accentClass, loading, clickable }: DashboardStatCardProps & { clickable: boolean }) {
  return (
    <div className="flex items-start gap-4">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.15rem] border border-white/20 bg-gradient-to-br ${accentClass} text-white shadow-[0_18px_34px_rgba(15,23,42,0.28),0_0_24px_rgba(99,102,241,0.16),inset_0_1px_0_rgba(255,255,255,0.24)]`}>
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
        {loading ? (
          <div className="skeleton mt-2 h-7 w-24" aria-label={en.common.loadingAriaLabel} />
        ) : (
          <p className="mt-1 truncate text-2xl font-black tracking-[-0.04em] text-[var(--text-primary)]">{value}</p>
        )}
        {sub && !loading ? <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{sub}</p> : null}
      </div>

      {clickable ? (
        <ArrowRight size={16} className="text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--text-primary)]" />
      ) : null}
    </div>
  )
}

export default function DashboardStatCard(props: DashboardStatCardProps) {
  const { onClick, accentClass = "from-emerald-500 to-teal-500" } = props
  const className = `premium-surface group w-full rounded-[24px] p-5 text-left transition-all duration-200 ${
    onClick ? "cursor-pointer hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]" : ""
  }`

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <CardContent {...props} accentClass={accentClass} clickable />
      </button>
    )
  }

  return (
    <div className={className}>
      <CardContent {...props} accentClass={accentClass} clickable={false} />
    </div>
  )
}
