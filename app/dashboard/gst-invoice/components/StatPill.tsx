export default function StatPill({ label, value }:{ label: string, value: string }) {
  return (
    <div className="border rounded-xl px-3 py-2">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}
