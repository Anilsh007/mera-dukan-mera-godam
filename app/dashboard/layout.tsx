import type { ReactNode } from "react"
import type { Metadata } from "next"
import DashboardShell from "./DashboardShell"
import { createPrivatePageMetadata } from "@/app/lib/seo/site"

export const metadata: Metadata = createPrivatePageMetadata("Dashboard")

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
