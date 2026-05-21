import type { ReturnDocumentRecord } from "@/app/lib/db"
import { notify } from "@/app/lib/notifications"
import { loadReturnDocuments } from "@/app/lib/returns/return.service"
import { en } from "@/app/messages/en"
import useAuthLiveQuery from "./useAuthLiveQuery"

const EMPTY_RETURN_DOCUMENTS: ReturnDocumentRecord[] = []

export default function useReturnDocuments() {
  const { data: documents, loading } = useAuthLiveQuery(
    EMPTY_RETURN_DOCUMENTS,
    (userId) => loadReturnDocuments(userId),
    (error) => {
      console.error("Return documents fetch error:", error)
      notify.error(en.returns.loadFailed, { id: "returns-load-failed" })
    },
  )

  return { documents, loading }
}
