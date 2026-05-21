import type { SaleRecord } from "@/app/lib/db"
import { notify } from "@/app/lib/notifications"
import { en } from "@/app/messages/en"
import useAuthLiveQuery from "./useAuthLiveQuery"
import { loadSales } from "@/app/lib/sales/sale.service"

const EMPTY_SALES: SaleRecord[] = []

export default function useSales() {
  const { data: sales, loading } = useAuthLiveQuery(
    EMPTY_SALES,
    (userId) => loadSales(userId),
    (error) => {
      console.error("Sales fetch error:", error)
      notify.error(en.sales.loadFailed, { id: "sales-load-failed" })
    },
  )

  return { sales, loading }
}
