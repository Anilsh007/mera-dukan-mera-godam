import StatusBadge, { type StatusBadgeTone } from "@/app/components/ui/StatusBadge"
import { en } from "@/app/messages/en"

type PaymentStatus = "paid" | "partial" | "unpaid" | "cancelled" | "draft" | "completed" | string | null | undefined

type PaymentStatusBadgeProps = {
  status?: PaymentStatus
  cancelled?: boolean
  className?: string
}

function getStatusMeta(status?: PaymentStatus, cancelled?: boolean): { label: string; tone: StatusBadgeTone } {
  if (cancelled || status === "cancelled") return { label: en.sales.cancelled, tone: "danger" }
  if (status === "paid" || status === "completed") return { label: en.sales.paid, tone: "success" }
  if (status === "partial") return { label: en.sales.partial, tone: "warning" }
  if (status === "unpaid") return { label: en.sales.unpaid, tone: "neutral" }
  if (status === "draft") return { label: en.gstInvoice.draftPreview, tone: "info" }
  return { label: status ? String(status) : en.common.notAvailable, tone: "neutral" }
}

export default function PaymentStatusBadge({ status, cancelled, className }: PaymentStatusBadgeProps) {
  const meta = getStatusMeta(status, cancelled)
  return <StatusBadge tone={meta.tone} className={className}>{meta.label}</StatusBadge>
}
