import { MdPrint } from "react-icons/md"
import Button from "@/app/components/ui/Button"
import ShareActions from "@/app/components/ui/ShareActions"
import type { TransactionDocumentData } from "@/app/lib/transactionDocument"
import { en } from "@/app/messages/en"

type Props = {
  selectedCount: number
  selectedActionHint: string
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
  actionMessage,
  canCreateGstBill,
  onPrint,
  onCreateGstBill,
  onClearSelection,
  shareDocument,
}: Props) {
  if (selectedCount === 0) return null

  return (
    <div className="premium-surface flex min-w-0 flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{selectedCount} {en.stockHistory.selectedEntries}</p>
        <p className="text-xs text-[var(--text-secondary)]">
          {en.stockHistory.printHint} {selectedActionHint || en.stockHistory.actionMessages.singleBuyerForBill}
        </p>
      </div>

      <div className="responsive-actions lg:justify-end">
        {shareDocument && <ShareActions document={shareDocument} compact showPrint={false} className="justify-end" />}
        <Button variant="secondary" icon={<MdPrint />} title={en.stockHistory.print} onClick={onPrint} />
        <Button variant="primary" title={en.stockHistory.createGstBill} onClick={onCreateGstBill} disabled={!canCreateGstBill} />
        <Button variant="outline" title={en.stockHistory.clearSelection} onClick={onClearSelection} />
      </div>
      {actionMessage && (
        <div className="basis-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          {actionMessage}
        </div>
      )}
    </div>
  )
}
