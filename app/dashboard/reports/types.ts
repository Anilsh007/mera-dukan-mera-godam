import type { Product, ProductLog, PurchaseRecord } from "@/app/lib/db"
import type { GSTInvoiceRecord } from "@/app/dashboard/gst-invoice/types/gst.types"

export type DateRangeKey = "today" | "7d" | "30d" | "90d" | "all"

export type ReportsData = {
  products: Product[]
  logs: ProductLog[]
  purchases: PurchaseRecord[]
  invoices: GSTInvoiceRecord[]
}

export type ChartPoint = {
  label: string
  value: number
}

export type BusinessTrendPoint = {
  label: string
  sales: number
  purchases: number
  margin: number
}

export type StockHealth = {
  healthy: number
  low: number
  critical: number
  out: number
}

export type ReportSummary = ReturnType<typeof import("./lib/reportBuilder").buildReport>
