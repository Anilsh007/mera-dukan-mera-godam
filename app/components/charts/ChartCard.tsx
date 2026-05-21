import Link from "next/link"
import type { ComponentType, ReactNode } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import ChartEmptyState from "./ChartEmptyState"
import { en } from "@/app/messages/en"

type ChartAction = {
  href: string
  label: string
}

type ChartCardProps = {
  title: string
  description?: string
  eyebrow?: string
  action?: ChartAction
  secondaryAction?: ChartAction
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ChartAction
  icon?: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>
  children: ReactNode
}

export default function ChartCard({
  title,
  description,
  eyebrow,
  action,
  secondaryAction,
  loading,
  error,
  empty,
  emptyTitle,
  emptyDescription,
  emptyAction,
  icon,
  children,
}: ChartCardProps) {
  return (
    <section className="dashboard-chart-shell rounded-[28px] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{eyebrow}</p> : null}
          <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}
        </div>
        {(action || secondaryAction) ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {secondaryAction ? <ChartCardAction href={secondaryAction.href} label={secondaryAction.label} variant="secondary" /> : null}
            {action ? <ChartCardAction href={action.href} label={action.label} variant="primary" /> : null}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="flex min-h-44 items-center justify-center rounded-3xl bg-[var(--surface-subtle)] text-sm font-semibold text-[var(--text-secondary)]" aria-live="polite">
          <Loader2 size={18} className="mr-2 animate-spin" aria-hidden />
          {en.dashboard.chartLoading}
        </div>
      ) : error ? (
        <div className="flex min-h-44 flex-col items-center justify-center rounded-3xl border border-amber-500/30 bg-amber-500/10 px-4 py-6 text-center text-sm text-[var(--text-primary)]" role="alert">
          <AlertTriangle size={22} className="mb-2 text-amber-600 dark:text-amber-300" aria-hidden />
          <p className="font-bold">{en.dashboard.chartError}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{error}</p>
        </div>
      ) : empty ? (
        <ChartEmptyState title={emptyTitle || en.reports.noData} description={emptyDescription} actionHref={emptyAction?.href} actionLabel={emptyAction?.label} icon={icon} />
      ) : (
        children
      )}
    </section>
  )
}

function ChartCardAction({ href, label, variant }: { href: string; label: string; variant: "primary" | "secondary" }) {
  const classes =
    variant === "primary"
      ? "bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90"
      : "border border-[var(--surface-outline)] bg-[var(--surface-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-card-strong)]"

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${classes}`}
    >
      {label}
    </Link>
  )
}
