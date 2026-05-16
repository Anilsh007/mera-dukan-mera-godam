import type { ReactNode } from "react"
import SurfaceCard from "@/app/components/ui/SurfaceCard"

type PanelProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function Panel({ title, subtitle, children }: PanelProps) {
  return (
    <SurfaceCard as="section" className="p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p> : null}
      </div>
      {children}
    </SurfaceCard>
  )
}
