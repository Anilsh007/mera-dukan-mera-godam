import useAuthLiveQuery from "@/app/hooks/useAuthLiveQuery"
import { db } from "@/app/lib/db"
import { notify } from "@/app/lib/notifications"
import { en } from "@/app/messages/en"
import type { ReportsData } from "../types"

export const EMPTY_REPORTS_DATA: ReportsData = {
  products: [],
  logs: [],
  purchases: [],
  invoices: [],
}

export function useReportsData() {
  return useAuthLiveQuery(
    EMPTY_REPORTS_DATA,
    async (userId) => {
      const products = await db.products.where("userId").equals(userId).toArray()
      const productIds = products.map((product) => product.id)
      const [logs, purchases, invoices] = await Promise.all([
        productIds.length ? db.productLogs.where("productId").anyOf(productIds).toArray() : Promise.resolve([]),
        db.purchases.where("userId").equals(userId).toArray(),
        db.invoices.where("userId").equals(userId).toArray(),
      ])

      return {
        products,
        logs: logs.sort((left, right) => right.date.localeCompare(left.date)),
        purchases: purchases.sort((left, right) => right.purchaseDate.localeCompare(left.purchaseDate)),
        invoices: invoices.sort((left, right) => right.invoiceDate.localeCompare(left.invoiceDate)),
      }
    },
    (error) => {
      console.error("Reports data fetch error:", error)
      notify.error(en.notifications.reportsLoadFailed, { id: "reports-load-failed" })
    }
  )
}
