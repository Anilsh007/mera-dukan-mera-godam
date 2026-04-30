export default function TextBlock({ label, value, onChange }: { label: string, value: string, onChange: (value: string) => void }) {
  return (
    <div>
      <label className="text-sm">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-xl p-2"
      />
    </div>
  )
}