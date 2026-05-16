import Modal from "@/app/components/ui/Modal"
import type { PurchaseRecord } from "@/app/lib/db"
import { formatCurrency, formatPurchaseDate, getPaymentStatusClass } from "@/app/dashboard/purchases/purchase.utils"
import { en } from "@/app/messages/en"
import type { SupplierSummary } from "../types"
import InfoBox from "./InfoBox"

type SupplierDetailModalProps = {
  supplier: SupplierSummary
  purchases: PurchaseRecord[]
  onClose: () => void
}

export default function SupplierDetailModal({ supplier, purchases, onClose }: SupplierDetailModalProps) {
  return (
    <Modal
      title={supplier.name}
      description={en.suppliers.purchaseBillsAndDue}
      onClose={onClose}
      cancelLabel={en.common.close}
      size="xl"
    >
      <div className="space-y-3">
        {purchases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-card)] p-6 text-center text-[var(--text-muted)]">
            {en.suppliers.noPurchaseBills}
          </div>
        ) : (
          purchases.map((purchase) => (
            <article key={purchase.id} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{en.suppliers.bill}: {purchase.billNo}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {formatPurchaseDate(purchase)} - {purchase.items.length} {en.inventory.itemsSuffix}
                  </p>
                </div>
                <span className={getPaymentStatusClass(purchase.paymentStatus)}>{purchase.paymentStatus}</span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 text-xs">
                <InfoBox label={en.purchases.total} value={formatCurrency(purchase.totalAmount)} />
                <InfoBox label={en.purchases.paid} value={formatCurrency(purchase.amountPaid)} />
                <InfoBox label={en.suppliers.due} value={formatCurrency(purchase.dueAmount)} />
              </div>
            </article>
          ))
        )}
      </div>
    </Modal>
  )
}
