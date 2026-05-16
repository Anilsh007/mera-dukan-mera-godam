import type { Product } from "@/app/lib/db"
import StatusBadge from "@/app/components/ui/StatusBadge"
import { getDaysUntilExpiry } from "@/app/lib/inventory.utils"
import EmptyState from "./EmptyState"
import { en } from "@/app/messages/en"

export default function ExpiryRiskList({ products }: { products: Product[] }) {
  if (!products.length) return <EmptyState text={en.reports.noProductsExpiring} />

  return (
    <div className="space-y-3">
      {products.map((product) => {
        const days = product.expiry ? getDaysUntilExpiry(product.expiry) : 0
        return (
          <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/5 px-4 py-3 dark:bg-white/5">
            <div className="min-w-0">
              <p className="truncate font-medium capitalize text-[var(--text-primary)]">{product.name}</p>
              <p className="text-xs text-[var(--text-secondary)]">{en.reports.expiryPrefix}: {product.expiry || en.reports.notSet}</p>
            </div>
            <StatusBadge tone={days < 0 ? "danger" : "warning"} className="shrink-0">
              {days < 0 ? `${Math.abs(days)}d ${en.reports.expiredSuffix}` : `${days}d ${en.reports.leftSuffix}`}
            </StatusBadge>
          </div>
        )
      })}
    </div>
  )
}
