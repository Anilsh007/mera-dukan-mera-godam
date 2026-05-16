import { en } from "@/app/messages/en"

interface Props {
  label: string
  value: string
  highlight?: boolean
  mono?: boolean
}

export default function InfoItem({ label, value, highlight = false, mono = false }: Props) {
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-medium text-[var(--text-primary)] ${highlight ? 'text-lg font-semibold' : ''} ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-[var(--text-muted)] italic">{en.profile.notSet}</span>}
      </p>
    </div>
  )
}
