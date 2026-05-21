import InfoTile from "@/app/components/ui/InfoTile"

export default function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <InfoTile
      label={label}
      value={value}
      variant="subtle"
      className="border"
      labelClassName="text-xs text-[var(--text-muted)]"
      valueClassName="font-semibold text-[var(--text-primary)]"
    />
  )
}
