"use client"

import { en } from "@/app/messages/en"
import Button from "./components/ui/Button"

export default function RootError({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] px-4 py-10">
      <section className="w-full max-w-xl rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 text-center shadow-[var(--shadow-card)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{en.errors.generic}</p>
        <h1 className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{en.errors.appCouldNotLoad}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          {en.errors.retrySafeData}
        </p>
        <Button type="button" onClick={reset} title={en.errors.tryAgain} variant="primary" />
      </section>
    </main>
  )
}
