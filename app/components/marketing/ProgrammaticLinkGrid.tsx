import Link from "next/link"
import type { ProgrammaticLink } from "@/src/config/seoConfig"

type ProgrammaticLinkGridProps = {
  title: string
  description?: string
  links: ProgrammaticLink[]
}

export default function ProgrammaticLinkGrid({ title, description, links }: ProgrammaticLinkGridProps) {
  return (
    <section className="rounded-[2rem] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <h2 className="text-2xl font-black tracking-[-0.03em] text-[var(--text-primary)]">{title}</h2>
      {description ? <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">{description}</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex min-h-11 items-center rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  )
}
