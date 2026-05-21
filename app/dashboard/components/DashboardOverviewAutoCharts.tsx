"use client"

import { useEffect, useMemo, useState } from "react"
import DashboardOverviewCharts from "@/app/dashboard/components/DashboardOverviewCharts"
import { buildOverviewChartData, type OverviewChartData, type OverviewSourceRecord } from "@/app/lib/dashboard/overviewChartData"
import { en } from "@/app/messages/en"

type TableLike = {
  toArray?: () => Promise<unknown[]>
}

type DbLike = Record<string, unknown> & {
  table?: (name: string) => TableLike
}

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
  const [records, setRecords] = useState<DashboardChartRecords>(EMPTY_RECORDS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadOverviewCharts() {
      try {
        setLoading(true)
        setError(null)

        const dbModule = await import("@/app/lib/db")
        const database = getDatabase(dbModule)

        if (!database) {
          if (active) setRecords(EMPTY_RECORDS)
          return
        }

        const [sales, purchases, products, gstInvoices, parties, expenses] = await Promise.all([
          readFirstAvailableTable(database, ["sales", "saleRecords", "transactions"]),
          readFirstAvailableTable(database, ["purchases", "purchaseRecords"]),
          readFirstAvailableTable(database, ["products", "inventory", "items"]),
          readFirstAvailableTable(database, ["gstInvoices", "invoices", "gst_invoices"]),
          readFirstAvailableTable(database, ["parties", "customers", "suppliers"]),
          readFirstAvailableTable(database, ["expenses", "expenseRecords"]),
        ])

        if (!active) return

        setRecords({ sales, purchases, products, gstInvoices, parties, expenses })
      } catch (loadError) {
        console.error("Dashboard overview chart data load failed", loadError)
        if (active) setError(en.notifications.reportsLoadFailed)
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadOverviewCharts()

    return () => {
      active = false
    }
  }, [])

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

function getDatabase(moduleValue: unknown): DbLike | null {
  if (!moduleValue || typeof moduleValue !== "object") return null
  const moduleRecord = moduleValue as Record<string, unknown>
  const candidates = [moduleRecord.db, moduleRecord.default, moduleRecord.database]
  const match = candidates.find((candidate): candidate is DbLike => Boolean(candidate) && typeof candidate === "object")
  return match || null
}

async function readFirstAvailableTable(database: DbLike, names: string[]) {
  for (const name of names) {
    const rows = await readTable(database, name)
    if (rows.length) return rows
  }
  return []
}

async function readTable(database: DbLike, name: string): Promise<OverviewSourceRecord[]> {
  try {
    const directTable = database[name]
    const table = isTableLike(directTable) ? directTable : database.table?.(name)
    const rows = await table?.toArray?.()
    return toRecordList(rows)
  } catch {
    return []
  }
}

function isTableLike(value: unknown): value is TableLike {
  return Boolean(value) && typeof value === "object" && typeof (value as TableLike).toArray === "function"
}

function toRecordList(value: unknown): OverviewSourceRecord[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is OverviewSourceRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item))
}
