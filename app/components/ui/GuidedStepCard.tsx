"use client"

import type { ReactNode } from "react"

type GuidedStepCardProps = {
  step?: number
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export default function GuidedStepCard({
  step,
  title,
  description,
  icon,
  actions,
  children,
  className = "",
  contentClassName = "",
}: GuidedStepCardProps) {
  return (
    <section className={`rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5 ${className}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]" aria-hidden="true">
            {icon || (step ? <span className="text-sm font-black">{step}</span> : null)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {typeof step === "number" ? (
                <span className="rounded-full border border-[var(--border-card)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {step}
                </span>
              ) : null}
              <h2 className="text-base font-bold text-[var(--text-primary)] sm:text-lg">{title}</h2>
            </div>
            {description ? <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  )
}
