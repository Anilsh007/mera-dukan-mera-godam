import Button from "@/app/components/ui/Button"
import { HISTORY_PAGE_SIZES } from "./stock-history.utils"
import { en } from "@/app/messages/en"

type Props = {
  pageSize: number
  currentPage: number
  totalPages: number
  onPageSizeChange: (size: number) => void
  onPageChange: (page: number | ((current: number) => number)) => void
}

export default function StockHistoryPagination({
  pageSize,
  currentPage,
  totalPages,
  onPageSizeChange,
  onPageChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 shadow-[var(--shadow-card)] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-[var(--text-secondary)]">{en.stockHistory.itemsPerPage}</span>
        {HISTORY_PAGE_SIZES.map((size) => (
          <Button
            key={size}
            title={String(size)}
            variant={pageSize === size ? "success" : "outline"}
            onClick={() => onPageSizeChange(size)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button title={en.stockHistory.previous} variant="outline" onClick={() => onPageChange((current) => Math.max(1, current - 1))} disabled={currentPage <= 1} />
        <span className="text-sm text-[var(--text-secondary)]">{en.stockHistory.page} {currentPage} / {totalPages}</span>
        <Button title={en.stockHistory.next} variant="outline" onClick={() => onPageChange((current) => Math.min(totalPages, current + 1))} disabled={currentPage >= totalPages} />
      </div>
    </div>
  )
}
