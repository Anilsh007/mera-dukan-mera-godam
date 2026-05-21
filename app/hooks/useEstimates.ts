import type { EstimateRecord } from "@/app/lib/db"
import { notify } from "@/app/lib/notifications"
import { en } from "@/app/messages/en"
import useAuthLiveQuery from "./useAuthLiveQuery"
import { loadEstimates } from "@/app/lib/estimates/estimate.service"

const EMPTY_ESTIMATES: EstimateRecord[] = []

export default function useEstimates() {
  const { data: estimates, loading } = useAuthLiveQuery(
    EMPTY_ESTIMATES,
    (userId) => loadEstimates(userId),
    (error) => {
      console.error("Estimates fetch error:", error)
      notify.error(en.estimates.loadFailed, { id: "estimates-load-failed" })
    },
  )

  return { estimates, loading }
}
