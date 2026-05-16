import { ReactNode } from "react"

interface SectionCardProps {
  title: string
  icon: ReactNode
  iconColor?: string
  children: ReactNode
}

export default function SectionCard({ title, icon, iconColor = "text-blue-500", children }: SectionCardProps) {
  return (
    <div className="premium-surface min-w-0 rounded-2xl p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-card)] pb-4">
        <div className={`text-2xl ${iconColor}`}>{icon}</div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
      </div>
      {children}
    </div>
  )
}
