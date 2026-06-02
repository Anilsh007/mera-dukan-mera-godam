import Button from "@/app/components/ui/Button"
import TableComponent, { type TableItem } from "@/app/components/ui/Table"
import type { PurchaseRecord } from "@/app/lib/db"
import { en } from "@/app/messages/en"
import {
  formatCurrency,
  formatPurchaseDate,
  getPaymentStatusClass,
} from "../purchases/purchase.utils"

type Props = {
  purchases: PurchaseRecord[]
  onCompleteDetails?: (purchase: PurchaseRecord) => void
}

export default function PurchaseHistory({
  purchases,
  onCompleteDetails,
}: Props) {
  const recentDue = purchases.reduce(
    (sum, purchase) => sum + purchase.dueAmount,
    0
  )
  const recentValue = purchases.reduce(
    (sum, purchase) => sum + purchase.totalAmount,
    0
  )
  const pendingCount = purchases.filter(isDetailsPending).length
  const recentPurchases = purchases.slice(0, 12)

  return (
    <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] shadow-[var(--shadow-card)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 border-b border-[var(--border-card)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {en.purchases.recentPurchaseBills}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {en.purchases.total} {formatCurrency(recentValue)} {en.purchases.purchaseSuffix},{" "}
            {formatCurrency(recentDue)} {en.purchases.supplierDueSuffix}.
          </p>
        </div>

        {pendingCount > 0 && (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-600">
            {pendingCount} {en.purchases.detailsPendingLower}
          </span>
        )}
      </div>

      <PurchaseCards purchases={recentPurchases} onCompleteDetails={onCompleteDetails} />

      <PurchaseTable purchases={recentPurchases} onCompleteDetails={onCompleteDetails} />
    </section>
  )
}

function PurchaseCards({ purchases, onCompleteDetails }: Props) {
  return (
    <div className="space-y-3 p-4 md:hidden">
      {purchases.length === 0 ? (
        <EmptyHistory />
      ) : (
        purchases.map((purchase) => (
          <div
            key={purchase.id}
            className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    {purchase.supplierName}
                  </p>
                  {isDetailsPending(purchase) && <DetailsPendingBadge />}
                </div>

                <p className="text-xs text-[var(--text-muted)]">
                  {purchase.billNo} - {formatPurchaseDate(purchase)}
                </p>
              </div>

              <span className={getPaymentStatusClass(purchase.paymentStatus)}>
                {purchase.paymentStatus}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 text-sm">
              <HistoryAmount label={en.purchases.total} value={formatCurrency(purchase.totalAmount)} />
              <HistoryAmount label={en.purchases.paid} value={formatCurrency(purchase.amountPaid)} className="text-emerald-700 dark:text-emerald-300" />
              <HistoryAmount label={en.purchases.due} value={formatCurrency(purchase.dueAmount)} className="text-amber-700 dark:text-amber-300" />
            </div>

            <p className="mt-3 text-xs text-[var(--text-secondary)]">
              {formatItemsSummary(purchase)}
            </p>

            {isDetailsPending(purchase) && onCompleteDetails && (
              <div className="mt-3">
                <Button type="button" variant="warning" title={en.gstInvoice.pending} onClick={() => onCompleteDetails(purchase)} />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

type PurchaseTableItem = TableItem & {
  purchase: PurchaseRecord
}

function PurchaseTable({ purchases, onCompleteDetails }: Props) {
  const tableData: PurchaseTableItem[] = purchases.map((purchase) => ({
    id: purchase.id,
    name: purchase.billNo,
    supplier: purchase.supplierName,
    expiry: "-",
    price: purchase.totalAmount,
    quantity: 1,
    quantityUnit: " ",
    createdAt: purchase.purchaseDate,
    note: `${formatItemsSummary(purchase)} | ${en.purchases.paid}: ${formatCurrency(
      purchase.amountPaid
    )} | ${en.purchases.due}: ${formatCurrency(purchase.dueAmount)} | ${en.purchases.status}: ${
      purchase.paymentStatus
    }`,
    purchase,
  }))

  return (
    <div className="hidden p-4 pt-0 md:block">
      <TableComponent
        data={tableData}
        minWidth={950}
        showActions
        actionLabel={en.gstInvoice.pending}
        showActionForRow={(item) => {
          const purchaseItem = item as PurchaseTableItem
          return isDetailsPending(purchaseItem.purchase)
        }}
        onEdit={(item) => {
          const purchaseItem = item as PurchaseTableItem

          if (
            isDetailsPending(purchaseItem.purchase) &&
            onCompleteDetails
          ) {
            onCompleteDetails(purchaseItem.purchase)
          }
        }}
      />
    </div>
  )
}

function EmptyHistory() {
  return (
    <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] p-4 text-center text-sm text-[var(--text-muted)]">
      {en.emptyStates.noPurchaseBills}
    </div>
  )
}

function HistoryAmount({
  label,
  value,
  className = "text-[var(--text-primary)]",
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className={`font-bold ${className}`}>{value}</p>
    </div>
  )
}

function DetailsPendingBadge() {
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-500/15 dark:text-amber-600">
      {en.purchases.detailsPending}
    </span>
  )
}

function isDetailsPending(purchase: PurchaseRecord) {
  return purchase.entryMode === "quick" && purchase.detailsStatus !== "completed"
}

function formatItemsSummary(purchase: PurchaseRecord) {
  const firstItem = purchase.items[0]
  if (!firstItem) return `0 ${en.purchases.itemSuffix}`

  const details = [
    firstItem.category,
    firstItem.sku ? `${en.purchases.sku}: ${firstItem.sku}` : "",
    firstItem.hsnCode ? `${en.purchases.hsnCode}: ${firstItem.hsnCode}` : "",
  ]
    .filter(Boolean)
    .join(" - ")

  const suffix = purchase.items.length > 1 ? ` +${purchase.items.length - 1} ${en.purchases.moreSuffix}` : ""

  return `${firstItem.name}${details ? ` (${details})` : ""}${suffix}`
}
