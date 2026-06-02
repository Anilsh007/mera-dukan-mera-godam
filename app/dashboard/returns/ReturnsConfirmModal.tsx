"use client"

import Modal from "@/app/components/ui/Modal"
import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"
import { getReturnKindLabel } from "@/app/lib/returns/return.utils"
import type { ReturnStockImpact, ReturnDocumentKind } from "@/app/lib/db"

type ReturnsConfirmModalProps = {
  open: boolean
  kind: ReturnDocumentKind
  stockImpact: ReturnStockImpact
  totalAmount: number
  onClose: () => void
  onConfirm: () => void
  saving: boolean
}

export default function ReturnsConfirmModal({ open, kind, stockImpact, totalAmount, onClose, onConfirm, saving }: ReturnsConfirmModalProps) {
  return (
    <Modal
      open={open}
      title={en.returns.confirmTitle}
      description={en.returns.confirmDescription}
      onClose={onClose}
      primaryLabel={en.common.confirm}
      primaryVariant={stockImpact === "stock-out" ? "warning" : "primary"}
      cancelLabel={en.common.keepEditing}
      variant={stockImpact === "stock-out" ? "warning" : "confirmation"}
      onPrimary={onConfirm}
      loading={saving}
    >
      <div className="space-y-3 text-sm text-[var(--text-secondary)]">
        <p><strong>{en.returns.documentType}:</strong> {getReturnKindLabel(kind)}</p>
        <p><strong>{en.returns.stockImpact}:</strong> {en.returns.stockImpacts[stockImpact]}</p>
        <p><strong>{en.returns.totalCorrection}:</strong> {formatCurrency(totalAmount)}</p>
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">{en.returns.confirmStockWarning}</p>
      </div>
    </Modal>
  )
}
