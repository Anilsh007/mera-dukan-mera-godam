"use client"

import { useMemo, useState } from "react"
import DashboardOverviewCharts from "@/app/dashboard/components/DashboardOverviewCharts"
import useAuthLiveQuery from "@/app/hooks/useAuthLiveQuery"
import { buildOverviewChartData, type OverviewChartData, type OverviewSourceRecord } from "@/app/lib/dashboard/overviewChartData"
import { db } from "@/app/lib/db"
import { en } from "@/app/messages/en"

type DashboardChartRecords = {
  sales: OverviewSourceRecord[]
  purchases: OverviewSourceRecord[]
  products: OverviewSourceRecord[]
  gstInvoices: OverviewSourceRecord[]
  parties: OverviewSourceRecord[]
  expenses: OverviewSourceRecord[]
}

const EMPTY_RECORDS: DashboardChartRecords = {
  sales: [],
  purchases: [],
  products: [],
  gstInvoices: [],
  parties: [],
  expenses: [],
}

export default function DashboardOverviewAutoCharts() {
  const [error, setError] = useState<string | null>(null)
  const { data: records, loading } = useAuthLiveQuery<DashboardChartRecords>(
    EMPTY_RECORDS,
    async (userId) => {
      setError(null)
      const [sales, purchases, products, gstInvoices, parties, expenses] = await Promise.all([
        readTable(db, "sales", userId),
        readTable(db, "purchases", userId),
        readTable(db, "products", userId),
        readTable(db, "invoices", userId),
        readTable(db, "parties", userId),
        readTable(db, "expenses", userId),
      ])

      return { sales, purchases, products, gstInvoices, parties, expenses }
    },
    (loadError) => {
      console.error("Dashboard overview chart data load failed", loadError)
      setError(en.notifications.reportsLoadFailed)
    },
  )

  const data: OverviewChartData = useMemo(
    () =>
      buildOverviewChartData({
        sales: records.sales,
        purchases: records.purchases,
        products: records.products,
        gstInvoices: records.gstInvoices,
        parties: records.parties,
        expenses: records.expenses,
      }),
    [records],
  )

  return <DashboardOverviewCharts data={data} loading={loading} error={error} />
}

type DashboardTableName = "sales" | "purchases" | "products" | "invoices" | "parties" | "expenses"

async function readTable(database: typeof db, tableName: DashboardTableName, userId: string): Promise<OverviewSourceRecord[]> {
  try {
    const table = database.table(tableName)
    const rows = await table.where("userId").equals(userId).toArray()
    return rows.filter((item): item is OverviewSourceRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item))
  } catch {
    return []
  }
}
