import { Search } from "lucide-react"
import Button from "@/app/components/ui/Button"
import { en } from "@/app/messages/en"
import type { SupplierFilter } from "../types"

type SupplierFiltersProps = {
  filter: SupplierFilter
  search: string
  supplierCount: number
  dueSupplierCount: number
  onFilterChange: (filter: SupplierFilter) => void
  onSearchChange: (value: string) => void
}

export default function SupplierFilters({
  filter,
  search,
  supplierCount,
  dueSupplierCount,
  onFilterChange,
  onSearchChange,
}: SupplierFiltersProps) {
  return (
    <div className="premium-surface min-w-0 rounded-2xl p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative flex-1">
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">{en.suppliers.searchLabel}</label>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 translate-y-1 text-emerald-500" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={en.suppliers.searchPlaceholder}
            className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-9 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button title={`${en.suppliers.all} (${supplierCount})`} variant={filter === "all" ? "success" : "outline"} onClick={() => onFilterChange("all")} />
          <Button title={`${en.suppliers.due} (${dueSupplierCount})`} variant={filter === "due" ? "success" : "outline"} onClick={() => onFilterChange("due")} />
          <Button title={en.suppliers.settled} variant={filter === "settled" ? "success" : "outline"} onClick={() => onFilterChange("settled")} />
        </div>
      </div>
    </div>
  )
}
