import type { Product } from "@/app/lib/db"
import StatusBadge from "@/app/components/ui/StatusBadge"
import { getProductStockLevel } from "@/app/lib/inventory.utils"
import { formatQuantity } from "@/app/lib/quantityUnit"
import EmptyState from "./EmptyState"
import { en } from "@/app/messages/en"

export default function LowStockList({ products }: { products: Product[] }) {
  if (!products.length) return <EmptyState text={en.reports.noLowStockProducts} />

  return (
    <div className="space-y-3">
      {products.map((product) => {
        const level = getProductStockLevel(product)
        return (
          <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/5 px-4 py-3 dark:bg-white/5">
            <div className="min-w-0">
              <p className="truncate font-medium capitalize text-[var(--text-primary)]">{product.name}</p>
              <p className="text-xs text-[var(--text-secondary)]">{product.category || en.reports.uncategorized}</p>
            </div>
            <div className="shrink-0 text-right">
              <StatusBadge tone={level === "out" ? "danger" : "warning"} className="capitalize">{level}</StatusBadge>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{formatQuantity(product.quantity, product.quantityUnit)} {en.reports.leftSuffix}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
