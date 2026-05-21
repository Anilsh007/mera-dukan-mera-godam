import type { PurchaseRecord } from "@/app/lib/db"
import { notify } from "@/app/lib/notifications"
import { loadPurchases } from "@/app/dashboard/purchases/purchase.service"
import { en } from "@/app/messages/en"
import useAuthLiveQuery from "./useAuthLiveQuery"

const EMPTY_PURCHASES: PurchaseRecord[] = []

export default function usePurchases() {
  const { data: purchases, loading } = useAuthLiveQuery(
    EMPTY_PURCHASES,
    (userId) => loadPurchases(userId),
    (error) => {
      console.error("Purchases fetch error:", error)
      notify.error(en.purchases.loadFailed, { id: "purchases-load-failed" })
    },
  )

  return { purchases, loading }
}
