import type { ExpenseRecord } from "@/app/lib/db"
import { loadExpenses } from "@/app/lib/accounting/accounting.service"
import { notify } from "@/app/lib/notifications"
import { en } from "@/app/messages/en"
import useAuthLiveQuery from "./useAuthLiveQuery"

const EMPTY_EXPENSES: ExpenseRecord[] = []

export default function useExpenses() {
  const { data: expenses, loading } = useAuthLiveQuery(
    EMPTY_EXPENSES,
    (userId) => loadExpenses(userId),
    (error) => {
      console.error("Expenses fetch error:", error)
      notify.error(en.accounting.expensesLoadFailed, { id: "expenses-load-failed" })
    },
  )

  return { expenses, loading }
}
