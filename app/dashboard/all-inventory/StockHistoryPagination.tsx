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
    <div className="premium-surface flex min-w-0 flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="filter-scroll items-center">
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

      <div className="responsive-actions items-center lg:justify-end">
        <Button title={en.stockHistory.previous} variant="outline" onClick={() => onPageChange((current) => Math.max(1, current - 1))} disabled={currentPage <= 1} />
        <span className="text-sm text-[var(--text-secondary)]">{en.stockHistory.page} {currentPage} / {totalPages}</span>
        <Button title={en.stockHistory.next} variant="outline" onClick={() => onPageChange((current) => Math.min(totalPages, current + 1))} disabled={currentPage >= totalPages} />
      </div>
    </div>
  )
}
