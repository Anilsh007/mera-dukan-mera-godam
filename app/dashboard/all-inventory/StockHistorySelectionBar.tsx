import ActionChip from "@/app/components/ui/ActionChip"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import type { TransactionDocumentData } from "@/app/lib/transactionDocument"
import { en } from "@/app/messages/en"
import { FileText, X } from "lucide-react"

type Props = {
  selectedCount: number
  selectedActionHint: string
  buyerStatus: string
  actionMessage: string
  canCreateGstBill: boolean
  onPrint: () => void
  onCreateGstBill: () => void
  onClearSelection: () => void
  shareDocument?: TransactionDocumentData
}

export default function StockHistorySelectionBar({
  selectedCount,
  selectedActionHint,
  buyerStatus,
  actionMessage,
  canCreateGstBill,
  onCreateGstBill,
  onClearSelection,
  shareDocument,
}: Props) {
  if (selectedCount === 0) return null

  return (
    <div className="premium-surface min-w-0 gap-3 rounded-2xl p-4">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{selectedCount} {en.stockHistory.selectedEntries}</p>
        <p className="text-xs text-[var(--text-secondary)]">{en.stockHistory.labels.buyerSummary}: {buyerStatus}</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {en.stockHistory.printHint} {selectedActionHint || en.stockHistory.actionMessages.singleBuyerForBill}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {shareDocument && <TransactionActionPanel document={shareDocument} compact showPrint={false} />}
        <ActionChip
          label={en.stockHistory.createGstBill}
          icon={<FileText size={16} aria-hidden="true" />}
          tone="primary"
          active
          onClick={onCreateGstBill}
          disabled={!canCreateGstBill}
          title={en.stockHistory.createGstBill}
          className="sm:ml-auto"
        />
        <ActionChip
          label=""
          icon={<X size={16} aria-hidden="true" />}
          tone="danger"
          active
          onClick={onClearSelection}
          title={en.common.close}
          className="w-12 justify-center px-0"
        />
      </div>
      {actionMessage && (
        <div className="basis-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-600">
          {actionMessage}
        </div>
      )}
    </div>
  )
}
