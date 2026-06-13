import { MdDescription } from "react-icons/md"
import SectionCard from "../components/SectionCard"
import { en } from "@/app/messages/en"
import Button from "@/app/components/ui/Button"

interface Props {
  value: string
  onChange: (value: string) => void
  reminderEnabled: boolean
  onReminderToggle: (nextValue: boolean) => void
}

export default function TermsSection({ value, onChange, reminderEnabled, onReminderToggle }: Props) {
  return (
    <SectionCard title={en.profile.invoiceSettings} icon={<MdDescription />} iconColor="text-gray-500">
      <label className="block mb-2 text-sm font-medium text-[var(--text-primary)]">
        {en.profile.defaultTerms}
      </label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full p-3 rounded-xl border bg-[var(--bg-input)] border-[var(--border-input)] text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-400 outline-none resize-none" />
      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{en.profile.profileCompletionReminder}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{reminderEnabled ? en.profile.profileCompletionReminderOn : en.profile.profileCompletionReminderOff}</p>
        </div>
        <Button
          type="button"
          variant={reminderEnabled ? "outline" : "primary"}
          title={reminderEnabled ? en.profile.turnOffReminder : en.profile.turnOnReminder}
          onClick={() => onReminderToggle(!reminderEnabled)}
          className="shrink-0"
        />
      </div>
    </SectionCard>
  )
}
