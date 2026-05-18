import { MdPrint } from "react-icons/md"
import Button from "@/app/components/ui/Button"
import ShareActions from "@/app/components/ui/ShareActions"
import type { TransactionDocumentData } from "@/app/lib/transactionDocument"
import { en } from "@/app/messages/en"
import { X } from "lucide-react"

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
  onPrint,
  onCreateGstBill,
  onClearSelection,
  shareDocument,
}: Props) {
  if (selectedCount === 0) return null

  return (
    <div className="premium-surface  min-w-0  gap-3 rounded-2xl p-4 ">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{selectedCount} {en.stockHistory.selectedEntries}</p>
        <p className="text-xs text-[var(--text-secondary)]">{en.stockHistory.labels.buyerSummary}: {buyerStatus}</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {en.stockHistory.printHint} {selectedActionHint || en.stockHistory.actionMessages.singleBuyerForBill}
        </p>
      </div>

      <div className="responsive-actions mt-5 gap-5">
        {shareDocument && <ShareActions document={shareDocument} compact showPrint={false} />}
        {/* <Button variant="secondary" icon={<MdPrint />} title={en.stockHistory.print} onClick={onPrint} /> */}
        <Button variant="primary" title={en.stockHistory.createGstBill} onClick={onCreateGstBill} disabled={!canCreateGstBill} />
        <Button variant="danger" icon={<X size={16} />} onClick={onClearSelection} />
      </div>
      {actionMessage && (
        <div className="basis-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          {actionMessage}
        </div>
      )}
    </div>
  )
}
