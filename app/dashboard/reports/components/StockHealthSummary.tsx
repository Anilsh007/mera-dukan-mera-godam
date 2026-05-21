import StockHealthBreakdown, { getStockHealthTotal } from "@/app/components/inventory/StockHealthBreakdown"
import type { StockHealth } from "../types"
import EmptyState from "./EmptyState"
import { en } from "@/app/messages/en"

export default function StockHealthSummary({ health }: { health: StockHealth }) {
  const total = getStockHealthTotal(health)


  if (total === 0) return <EmptyState text={en.reports.noProductsAvailable} />

  return (
    <StockHealthBreakdown
      health={health}
      chartSizeClassName="h-48 w-48"
      gridClassName="grid grid-cols-1 gap-5 min-[520px]:grid-cols-[0.75fr_1fr] min-[520px]:items-center"
      itemClassName="rounded-2xl bg-black/5 px-4 py-3 dark:bg-white/5"
      barTrackClassName="bg-black/10 dark:bg-white/10"
    />
  )
}
