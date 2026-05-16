import SurfaceCard from "@/app/components/ui/SurfaceCard"

type MetricCardProps = {
  label: string
  value: string
  helper: string
  positive?: boolean
  warning?: boolean
}

export default function MetricCard({ label, value, helper, positive, warning }: MetricCardProps) {
  const valueClass = positive
    ? "text-emerald-600 dark:text-emerald-400"
    : warning
      ? "text-amber-600 dark:text-amber-400"
      : "text-[var(--text-primary)]"

  return (
    <SurfaceCard className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{helper}</p>
    </SurfaceCard>
  )
}
