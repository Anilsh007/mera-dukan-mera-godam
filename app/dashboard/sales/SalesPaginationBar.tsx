"use client"

import Button from "@/app/components/ui/Button"
import SelectField from "@/app/components/ui/SelectField"
import { en } from "@/app/messages/en"

type SalesPaginationBarProps = {
  filteredCount: number
  pageSize: number
  setPageSize: (size: number) => void
  currentPage: number
  totalPages: number
  canGoPrevious: boolean
  canGoNext: boolean
  goPrevious: () => void
  goNext: () => void
  onResetPage: () => void
}

const PAGE_SIZES = [5, 10, 20, 50]

export default function SalesPaginationBar({
  filteredCount,
  pageSize,
  setPageSize,
  currentPage,
  totalPages,
  canGoPrevious,
  canGoNext,
  goPrevious,
  goNext,
  onResetPage,
}: SalesPaginationBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--text-secondary)]">{filteredCount} {en.sales.pageSummary}</p>
      <div className="flex flex-wrap gap-2">
        <SelectField
          label=""
          value={String(pageSize)}
          onChange={(event) => { setPageSize(Number(event.target.value)); onResetPage() }}
          options={PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }))}
        />
        <Button type="button" variant="outline" title={en.sales.previousPage} onClick={goPrevious} disabled={!canGoPrevious} />
        <div className="flex items-center rounded-2xl border border-[var(--border-card)] px-4 text-sm text-[var(--text-secondary)]">
          {currentPage} / {totalPages}
        </div>
        <Button type="button" variant="outline" title={en.sales.nextPage} onClick={goNext} disabled={!canGoNext} />
      </div>
    </div>
  )
}
