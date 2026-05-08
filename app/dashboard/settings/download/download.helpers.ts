import { db } from "@/app/lib/db"
import { auth } from "@/app/lib/firebase"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { toast } from "sonner"

type CsvValue = string | number | boolean | null | undefined
type CsvRow = Record<string, CsvValue>

function toCSV(rows: CsvRow[], headers: string[]) {
  const escape = (val: CsvValue) => {
    const str = val === null || val === undefined ? "" : String(val)
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str
  }

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ]

  return lines.join("\n")
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatDate(iso: string) {
  if (!iso) return "-"
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

async function loadCurrentUserInventory() {
  const userId = requireUserIdentityFromAuthUser(auth.currentUser)
  const products = await db.products.where("userId").equals(userId).toArray()
  const productIds = products.map((product) => product.id)
  const logs = productIds.length
    ? await db.productLogs.where("productId").anyOf(productIds).toArray()
    : []

  return { products, logs }
}

export async function downloadAllData() {
  const { products, logs } = await loadCurrentUserInventory()

  const nameMap: Record<string, string> = {}
  products.forEach((product) => {
    if (product.id) nameMap[String(product.id)] = product.name
  })

  const productHeaders = [
    "id",
    "name",
    "category",
    "price",
    "quantity",
    "quantityUnit",
    "supplier",
    "expiry",
    "sku",
    "note",
    "createdAt",
  ]

  const productRows = products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category || "",
    price: product.price,
    quantity: product.quantity,
    quantityUnit: product.quantityUnit || "pcs",
    supplier: product.supplier || "",
    expiry: product.expiry || "",
    sku: product.sku || "",
    note: product.note || "",
    createdAt: formatDate(product.createdAt),
  }))

  const logHeaders = [
    "id",
    "productName",
    "type",
    "quantity",
    "quantityUnit",
    "price",
    "expiry",
    "reason",
    "note",
    "date",
  ]

  const logRows = logs.map((log) => ({
    id: log.id,
    productName: nameMap[String(log.productId)] || "-",
    type: log.quantityAdded > 0 ? "Stock In" : "Stock Out",
    quantity: Math.abs(log.quantityAdded),
    quantityUnit: log.quantityUnit || "pcs",
    price: log.price,
    expiry: log.expiry || "",
    reason: log.reason || "",
    note: log.note || "",
    date: formatDate(log.date),
  }))

  downloadFile(toCSV(productRows, productHeaders), "products_all.csv")

  setTimeout(() => {
    downloadFile(toCSV(logRows, logHeaders), "logs_all.csv")
  }, 500)

  toast.success(`✅ Downloaded — ${products.length} products, ${logs.length} logs`)
}

export async function downloadByDateRange(from: string, to: string) {
  if (!from || !to) {
    toast.error("Dono dates select karo")
    return
  }

  const fromDate = new Date(from)
  const toDate = new Date(to)
  toDate.setHours(23, 59, 59, 999)

  if (fromDate > toDate) {
    toast.error("From date, To date se pehle honi chahiye")
    return
  }

  const { products, logs } = await loadCurrentUserInventory()

  const nameMap: Record<string, string> = {}
  products.forEach((product) => {
    if (product.id) nameMap[String(product.id)] = product.name
  })

  const filteredLogs = logs.filter((log) => {
    const d = new Date(log.date)
    return d >= fromDate && d <= toDate
  })

  if (!filteredLogs.length) {
    toast.error("No logs found in this date range ❌")
    return
  }

  const logHeaders = [
    "id",
    "productName",
    "type",
    "quantity",
    "quantityUnit",
    "price",
    "expiry",
    "reason",
    "note",
    "date",
  ]

  const logRows = filteredLogs.map((log) => ({
    id: log.id,
    productName: nameMap[String(log.productId)] || "-",
    type: log.quantityAdded > 0 ? "Stock In" : "Stock Out",
    quantity: Math.abs(log.quantityAdded),
    quantityUnit: log.quantityUnit || "pcs",
    price: log.price,
    expiry: log.expiry || "",
    reason: log.reason || "",
    note: log.note || "",
    date: formatDate(log.date),
  }))

  const label = `${from}_to_${to}`
  downloadFile(toCSV(logRows, logHeaders), `logs_${label}.csv`)
  toast.success(`✅ ${filteredLogs.length} records downloaded`)
}
