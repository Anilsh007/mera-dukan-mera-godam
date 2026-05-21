import InfoTile from "@/app/components/ui/InfoTile"

export default function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <InfoTile
      label={label}
      value={value}
      variant="subtle"
      labelClassName="text-[11px] uppercase tracking-wide text-[var(--text-muted)]"
    />
  )
}
