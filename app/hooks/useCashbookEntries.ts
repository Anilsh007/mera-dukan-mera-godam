import type { CashbookEntryRecord } from "@/app/lib/db"
import { loadCashbookEntries } from "@/app/lib/accounting/accounting.service"
import { notify } from "@/app/lib/notifications"
import { en } from "@/app/messages/en"
import useAuthLiveQuery from "./useAuthLiveQuery"

const EMPTY_CASHBOOK_ENTRIES: CashbookEntryRecord[] = []

export default function useCashbookEntries() {
  const { data: entries, loading } = useAuthLiveQuery(
    EMPTY_CASHBOOK_ENTRIES,
    (userId) => loadCashbookEntries(userId),
    (error) => {
      console.error("Cashbook fetch error:", error)
      notify.error(en.accounting.cashbookLoadFailed, { id: "cashbook-load-failed" })
    },
  )

  return { entries, loading }
}
