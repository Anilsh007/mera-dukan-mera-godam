import type { ReactNode } from "react"

type SurfaceCardProps = {
  children: ReactNode
  className?: string
  as?: "div" | "section" | "article"
}

export default function SurfaceCard({ children, className = "", as = "div" }: SurfaceCardProps) {
  const Component = as
  return <Component className={`app-card min-w-0 ${className}`}>{children}</Component>
}
