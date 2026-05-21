import type { ReactNode } from "react"

type InfoTileVariant = "default" | "subtle" | "flat"

type InfoTileProps = {
  label: ReactNode
  value: ReactNode
  variant?: InfoTileVariant
  className?: string
  labelClassName?: string
  valueClassName?: string
}

const variantClass: Record<InfoTileVariant, string> = {
  default: "rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] px-4 py-3",
  subtle: "rounded-xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-3 py-2",
  flat: "rounded-xl bg-black/5 p-3 dark:bg-white/5",
}

export default function InfoTile({
  label,
  value,
  variant = "default",
  className = "",
  labelClassName = "text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]",
  valueClassName = "mt-1 truncate font-semibold text-[var(--text-primary)]",
}: InfoTileProps) {
  return (
    <div className={`${variantClass[variant]} ${className}`}>
      <p className={labelClassName}>{label}</p>
      <p className={valueClassName}>{value}</p>
    </div>
  )
}
