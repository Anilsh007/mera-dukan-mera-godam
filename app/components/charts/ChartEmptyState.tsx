import Link from "next/link"
import type { ComponentType } from "react"
import { BarChart3 } from "lucide-react"

type ChartEmptyStateProps = {
  title: string
  description?: string
  actionHref?: string
  actionLabel?: string
  icon?: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>
}

export default function ChartEmptyState({ title, description, actionHref, actionLabel, icon: Icon = BarChart3 }: ChartEmptyStateProps) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--surface-outline)] bg-[var(--surface-subtle)] px-4 py-6 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--text-primary)]">
        <Icon size={20} aria-hidden />
      </span>
      <p className="text-sm font-bold text-[var(--text-primary)]">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--text-secondary)]">{description}</p> : null}
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--accent-foreground)] shadow-sm transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}
