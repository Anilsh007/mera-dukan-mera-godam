"use client"

import type { ReactNode } from "react"

type SimpleEmptyStateProps = {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

export default function SimpleEmptyState({ title, description, action, icon, className = "" }: SimpleEmptyStateProps) {
  return (
    <div className={`rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--surface-primary)] p-5 text-center ${className}`}>
      {icon ? <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">{icon}</div> : null}
      <p className="font-semibold text-[var(--text-primary)]">{title}</p>
      {description ? <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
