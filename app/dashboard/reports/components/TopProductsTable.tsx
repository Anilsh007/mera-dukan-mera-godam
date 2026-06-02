import ResponsiveDataTable from "@/app/components/ui/ResponsiveDataTable"
import { formatMoney, formatNumber } from "../lib/format"
import EmptyState from "./EmptyState"
import { en } from "@/app/messages/en"

type TopProduct = { name: string; quantity: number; value: number }

export default function TopProductsTable({ items }: { items: TopProduct[] }) {
  if (!items.length) return <EmptyState text={en.reports.noSalesData} />

  return (
    <>
      <div className="space-y-3 sm:hidden">
        {items.map((item) => (
          <article key={item.name} className="premium-surface rounded-2xl p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-semibold capitalize text-[var(--text-primary)]">{item.name}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{formatNumber(item.quantity)} {en.reports.units}</p>
              </div>
              <p className="shrink-0 text-right font-bold text-emerald-600 dark:text-emerald-600">{formatMoney(item.value)}</p>
            </div>
          </article>
        ))}
      </div>

      <ResponsiveDataTable
        rows={items}
        getRowKey={(item) => item.name}
        minWidth={520}
        className="hidden sm:block"
        columns={[
          { key: "product", header: en.reports.product, render: (item) => item.name, className: "font-medium capitalize text-[var(--text-primary)]" },
          { key: "units", header: en.reports.units, align: "right", render: (item) => formatNumber(item.quantity), className: "text-[var(--text-secondary)]" },
          { key: "sales", header: en.reports.sales, align: "right", render: (item) => formatMoney(item.value), className: "font-semibold text-emerald-600 dark:text-emerald-600" },
        ]}
      />
    </>
  )
}
