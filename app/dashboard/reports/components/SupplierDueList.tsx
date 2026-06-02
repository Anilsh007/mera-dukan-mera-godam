import { formatMoney } from "../lib/format"
import EmptyState from "./EmptyState"
import { en } from "@/app/messages/en"

export default function SupplierDueList({ suppliers }: { suppliers: Array<{ supplierName: string; dueAmount: number; billCount: number }> }) {
  if (!suppliers.length) return <EmptyState text={en.reports.noSupplierDuesPending} />

  return (
    <div className="space-y-3">
      {suppliers.map((supplier) => (
        <div key={supplier.supplierName} className="flex items-center justify-between gap-3 rounded-xl bg-black/5 px-4 py-3 dark:bg-white/5">
          <div className="min-w-0">
            <p className="truncate font-medium capitalize text-[var(--text-primary)]">{supplier.supplierName}</p>
            <p className="text-xs text-[var(--text-secondary)]">{supplier.billCount} {supplier.billCount > 1 ? en.reports.pendingBills : en.reports.pendingBill}</p>
          </div>
          <span className="shrink-0 text-sm font-bold text-amber-600 dark:text-amber-600">{formatMoney(supplier.dueAmount)}</span>
        </div>
      ))}
    </div>
  )
}
