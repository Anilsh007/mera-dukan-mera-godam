"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"

type PageActionLink = {
  href: string
  label: ReactNode
  description?: ReactNode
  icon?: ReactNode
}

type PageActionLinksProps = {
  title?: ReactNode
  description?: ReactNode
  actions: PageActionLink[]
  className?: string
}

export default function PageActionLinks({ title, description, actions, className = "" }: PageActionLinksProps) {
  if (!actions.length) return null

  return (
    <nav className={`rounded-[24px] border border-[var(--border-card)] bg-[var(--surface-primary)] p-3 shadow-[var(--button-shadow)] ${className}`} aria-label={typeof title === "string" ? title : undefined}>
      {title || description ? (
        <div className="mb-3 px-1">
          {title ? <p className="text-sm font-bold text-[var(--text-primary)]">{title}</p> : null}
          {description ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{description}</p> : null}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex min-h-16 items-center gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            {action.icon ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]" aria-hidden="true">
                {action.icon}
              </span>
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[var(--text-primary)]">{action.label}</span>
              {action.description ? <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">{action.description}</span> : null}
            </span>
            <ArrowRight size={16} className="shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </nav>
  )
}
