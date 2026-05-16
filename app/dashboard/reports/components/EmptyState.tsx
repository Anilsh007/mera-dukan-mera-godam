export default function EmptyState({ text }: { text: string }) {
  return <p className="rounded-2xl bg-black/5 px-4 py-6 text-center text-sm text-[var(--text-muted)] dark:bg-white/5">{text}</p>
}
