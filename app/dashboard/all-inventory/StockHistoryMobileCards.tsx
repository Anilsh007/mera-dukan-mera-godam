import { Pencil } from "lucide-react"
import Button from "@/app/components/ui/Button"
import { formatQuantity } from "@/app/lib/quantityUnit"
import type { HistoryRow } from "./stock-history.types"
import { formatDateTime, formatReason } from "./stock-history.utils"
import { en } from "@/app/messages/en"

type Props = {
  rows: HistoryRow[]
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  onEdit: (id: string) => void
}

export default function StockHistoryMobileCards({ rows, selectedIds, onToggleSelection, onEdit }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl px-4 py-10 text-center text-[var(--text-muted)] shadow-[var(--shadow-card)]">
        {en.stockHistory.noEntries}
      </div>
    )
  }

  return (
    <>
      {rows.map((row) => (
        <StockHistoryMobileCard
          key={row.id}
          row={row}
          selected={selectedIds.has(row.id)}
          onToggle={() => onToggleSelection(row.id)}
          onEdit={() => onEdit(row.id)}
        />
      ))}
    </>
  )
}

function StockHistoryMobileCard({
  row,
  selected,
  onToggle,
  onEdit,
}: {
  row: HistoryRow
  selected: boolean
  onToggle: () => void
  onEdit: () => void
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-[var(--shadow-card)] ${
        selected
          ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
          : "border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl"
      }`}
    >
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={selected} onChange={onToggle} className="mt-1 h-4 w-4 cursor-pointer" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium capitalize text-[var(--text-primary)]">{row.productName}</p>
              <p className="text-xs text-[var(--text-secondary)]">{formatDateTime(row.date)}</p>
            </div>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.logType === "in" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-600" : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"}`}>
              {row.logType === "in" ? en.stockHistory.typeLabels.stockIn : row.reason.toLowerCase() === "sold" ? en.stockHistory.reasonLabels.sale : en.stockHistory.typeLabels.stockOut}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 text-xs text-[var(--text-secondary)]">
            <span className="rounded-lg border border-[var(--border-card)] px-2 py-1">{en.stockHistory.labels.category}: {row.category}</span>
            <span className="rounded-lg border border-[var(--border-card)] px-2 py-1">{en.stockHistory.labels.qty}: {formatQuantity(row.quantity, row.quantityUnit)}</span>
            <span className="rounded-lg border border-[var(--border-card)] px-2 py-1">{en.inventory.rate}: {en.common.rupeeSymbol} {row.price.toLocaleString("en-IN")}</span>
            <span className="rounded-lg border border-[var(--border-card)] px-2 py-1">{en.stockHistory.labels.code}: {row.sku || "-"}</span>
            <span className="rounded-lg border border-[var(--border-card)] px-2 py-1">{en.stockHistory.labels.hsn}: {row.hsnCode || "-"}</span>
            <span className="rounded-lg border border-[var(--border-card)] px-2 py-1">{en.receipt.ref}: {row.invoiceReceiptNo || row.transactionId || "-"}</span>
            <span className="rounded-lg border border-[var(--border-card)] px-2 py-1">{en.stockHistory.labels.stock}: {row.oldStock ?? "-"} → {row.newStock ?? "-"}</span>
            <span className="rounded-lg border border-[var(--border-card)] px-2 py-1">{en.transaction.totalGst}: {en.common.rupeeSymbol} {Number(row.gstAmount || 0).toLocaleString("en-IN")}</span>
          </div>

          <div className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
            <p>
              <span className="font-medium text-[var(--text-primary)]">
                {row.logType === "in" ? `${en.stockHistory.labels.supplierReason}:` : `${en.stockHistory.labels.buyerReason}:`}
              </span>{" "}
              {row.logType === "in"
                ? row.supplier || formatReason(row.reason)
                : row.buyerName
                  ? `${row.buyerName}${row.buyerPhone ? ` - ${row.buyerPhone}` : ""}`
                  : formatReason(row.reason)}
            </p>
            {row.note ? <p><span className="font-medium text-[var(--text-primary)]">{en.stockHistory.labels.note}:</span> {row.note}</p> : null}
          </div>

          {row.correctedAt && (
            <div className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
              {en.stockHistory.labels.correction}: {formatDateTime(row.correctedAt)}
            </div>
          )}

          <div className="responsive-actions mt-4">
            <Button title={en.stockHistory.edit} variant="outline" icon={<Pencil size={15} />} onClick={onEdit} />
          </div>
        </div>
      </div>
    </div>
  )
}
