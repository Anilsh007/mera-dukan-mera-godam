import { CreditCard, Eye, Plus } from "lucide-react"
import Button from "@/app/components/ui/Button"
import { formatCurrency } from "@/app/dashboard/purchases/purchase.utils"
import { en } from "@/app/messages/en"
import type { SupplierSummary } from "../types"
import InfoBox from "./InfoBox"

type SupplierCardProps = {
  supplier: SupplierSummary
  onPay: (supplier: SupplierSummary) => void
  onViewPurchases: (supplier: SupplierSummary) => void
  onNewPurchase: () => void
}

export default function SupplierCard({ supplier, onPay, onViewPurchases, onNewPurchase }: SupplierCardProps) {
  const hasDue = supplier.dueAmount > 0

  return (
    <article
      className={`rounded-2xl border p-4 shadow-[var(--shadow-card)] backdrop-blur-xl ${
        hasDue
          ? "border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20"
          : "border-[var(--border-card)] bg-[var(--bg-card-strong)]"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold capitalize text-[var(--text-primary)]">{supplier.name}</h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {supplier.purchaseBills} {en.suppliers.billsSuffix}, {supplier.totalProducts} {en.suppliers.productsSuffix}
            {supplier.lastPurchaseDate ? `, ${en.suppliers.lastPrefix} ${new Date(supplier.lastPurchaseDate).toLocaleDateString("en-IN")}` : ""}
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            hasDue
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
          }`}
        >
          {hasDue ? `${formatCurrency(supplier.dueAmount)} ${en.suppliers.due}` : en.suppliers.settled}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm min-[420px]:grid-cols-2 sm:grid-cols-4">
        <InfoBox label={en.suppliers.purchase} value={formatCurrency(supplier.purchaseValue)} />
        <InfoBox label={en.purchases.paid} value={formatCurrency(supplier.paidAmount)} />
        <InfoBox label={en.suppliers.dueBills} value={String(supplier.dueBills)} />
        <InfoBox label={en.suppliers.stockValue} value={formatCurrency(supplier.totalValue)} />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          variant={hasDue ? "primary" : "outline"}
          title={hasDue ? en.suppliers.payNow : en.suppliers.paymentCleared}
          icon={<CreditCard size={16} />}
          disabled={!hasDue}
          onClick={() => onPay(supplier)}
          className="flex-1"
        />
        <Button
          variant="outline"
          title={en.suppliers.viewPurchases}
          icon={<Eye size={16} />}
          onClick={() => onViewPurchases(supplier)}
          className="flex-1"
        />
        <Button variant="secondary" title={en.suppliers.newPurchase} icon={<Plus size={16} />} onClick={onNewPurchase} className="flex-1" />
      </div>
    </article>
  )
}
