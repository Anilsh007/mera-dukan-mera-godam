import ResponsiveDataTable from "@/app/components/ui/ResponsiveDataTable"
import EmptyState from "./EmptyState"
import { formatDate, formatMoney, formatNumber } from "../lib/format"
import { en } from "@/app/messages/en"

type SlowMovingProduct = {
  name: string
  quantity: number
  stockValue: number
  lastSoldAt: number | null
  soldQuantity: number
}

export default function SlowMovingProductsTable({ items }: { items: SlowMovingProduct[] }) {
  if (!items.length) return <EmptyState text={en.reports.noSlowMovingProducts} />

  return (
    <ResponsiveDataTable
      rows={items}
      getRowKey={(item) => item.name}
      minWidth={560}
      columns={[
        { key: "product", header: en.reports.product, render: (item) => item.name, className: "font-medium capitalize text-[var(--text-primary)]" },
        { key: "units", header: en.reports.units, align: "right", render: (item) => formatNumber(item.quantity), className: "text-[var(--text-secondary)]" },
        { key: "stockValue", header: en.reports.stockValue, align: "right", render: (item) => formatMoney(item.stockValue), className: "font-semibold text-[var(--text-primary)]" },
        {
          key: "lastSold",
          header: en.reports.lastSold,
          align: "right",
          render: (item) => item.lastSoldAt ? formatDate(new Date(item.lastSoldAt).toISOString()) : en.reports.neverSold,
          className: "text-[var(--text-secondary)]",
        },
      ]}
    />
  )
}
