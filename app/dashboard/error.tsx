"use client"

import { en } from "@/app/messages/en"

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 text-center shadow-[var(--shadow-card)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{en.dashboard.errorTitle}</p>
        <h1 className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{en.errors.dashboardCouldNotLoad}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          {en.errors.dashboardRetrySafeData}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-[var(--btn-primary)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--btn-primary)]"
        >{en.errors.retry}</button>
      </section>
    </div>
  )
}
