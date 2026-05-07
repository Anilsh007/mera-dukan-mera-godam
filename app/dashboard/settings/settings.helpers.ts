// all-stock/settings/settings.helpers.ts
import { db } from "@/app/lib/db"
import { toast } from "sonner"

function toCSV(rows: Record<string, any>[], headers: string[]) {
  const escape = (val: any) => {
    const str = val === null || val === undefined ? "" : String(val)
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str
  }

  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
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

export async function downloadAllData() {
  const [products, logs] = await Promise.all([
    db.products.toArray(),
    db.productLogs.toArray(),
  ])

  const nameMap: Record<string, string> = {}
  products.forEach((p) => {
    if (p.id) nameMap[String(p.id)] = p.name
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

  const productRows = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category || "",
    price: p.price,
    quantity: p.quantity,
    quantityUnit: p.quantityUnit || "pcs",
    supplier: p.supplier || "",
    expiry: p.expiry || "",
    sku: p.sku || "",
    note: p.note || "",
    createdAt: formatDate(p.createdAt),
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

  const logRows = logs.map((l) => ({
    id: l.id,
    productName: nameMap[l.productId] || "-",
    type: l.quantityAdded > 0 ? "Stock In" : "Stock Out",
    quantity: Math.abs(l.quantityAdded),
    quantityUnit: l.quantityUnit || "pcs",
    price: l.price,
    expiry: l.expiry || "",
    reason: l.reason || "",
    note: l.note || "",
    date: formatDate(l.date),
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

  const [products, logs] = await Promise.all([
    db.products.toArray(),
    db.productLogs.toArray(),
  ])

  const nameMap: Record<string, string> = {}
  products.forEach((p) => {
    if (p.id) nameMap[String(p.id)] = p.name
  })

  const filteredLogs = logs.filter((l) => {
    const d = new Date(l.date)
    return d >= fromDate && d <= toDate
  })

  if (!filteredLogs.length) {
    toast.error("no logs found in this date range ❌")
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

  const logRows = filteredLogs.map((l) => ({
    id: l.id,
    productName: nameMap[l.productId] || "-",
    type: l.quantityAdded > 0 ? "Stock In" : "Stock Out",
    quantity: Math.abs(l.quantityAdded),
    quantityUnit: l.quantityUnit || "pcs",
    price: l.price,
    expiry: l.expiry || "",
    reason: l.reason || "",
    note: l.note || "",
    date: formatDate(l.date),
  }))

  const label = `${from}_to_${to}`
  downloadFile(toCSV(logRows, logHeaders), `logs_${label}.csv`)
  toast.success(`✅ ${filteredLogs.length} records downloaded`)
}
