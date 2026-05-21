import { formatCurrency } from "@/app/lib/formatters"
import { en } from "@/app/messages/en"

export type OverviewSourceRecord = Record<string, unknown>

export type OverviewMetricPoint = {
  label: string
  value: number
  tooltipRows?: { label: string; value: string }[]
}

export type OverviewMetricBar = {
  label: string
  value: number
  secondaryValue?: string
  tooltipRows?: { label: string; value: string }[]
}

export type OverviewStockHealth = {
  healthy: number
  low: number
  critical: number
  out: number
}

export type BuildOverviewChartDataInput = {
  sales?: OverviewSourceRecord[]
  purchases?: OverviewSourceRecord[]
  products?: OverviewSourceRecord[]
  gstInvoices?: OverviewSourceRecord[]
  parties?: OverviewSourceRecord[]
  expenses?: OverviewSourceRecord[]
  today?: Date
  days?: number
}

export type OverviewChartData = {
  salesTrend: OverviewMetricPoint[]
  purchaseTrend: OverviewMetricPoint[]
  stockValueTrend: OverviewMetricPoint[]
  gstTrend: OverviewMetricPoint[]
  profitLossTrend: OverviewMetricPoint[]
  stockRiskTrend: OverviewMetricPoint[]
  dueTrend: OverviewMetricPoint[]
  topProducts: OverviewMetricBar[]
  slowProducts: OverviewMetricBar[]
  stockHealth: OverviewStockHealth
}

const DATE_FIELDS = ["date", "createdAt", "created_at", "updatedAt", "updated_at", "soldAt", "sold_at", "saleDate", "sale_date", "saleDateTime", "sale_date_time", "purchaseDate", "purchase_date", "purchaseDateTime", "purchase_date_time", "invoiceDate", "invoice_date", "billDate", "bill_date", "entryDate", "entry_date", "expenseDate", "expense_date"]
const SALE_AMOUNT_FIELDS = ["grandTotal", "grand_total", "total", "totalAmount", "total_amount", "amount", "paidAmount", "paid_amount", "amountPaid", "amount_paid", "saleAmount", "sale_amount", "subtotal", "sub_total"]
const PURCHASE_AMOUNT_FIELDS = ["grandTotal", "grand_total", "total", "totalAmount", "total_amount", "amount", "purchaseAmount", "purchase_amount", "subtotal", "sub_total", "billAmount", "bill_amount"]
const GST_COLLECTED_FIELDS = ["gstCollected", "gst_collected", "totalGst", "total_gst", "gstTotal", "gst_total", "taxAmount", "tax_amount", "gst", "gstAmount", "gst_amount", "cgstTotal", "cgst_total", "sgstTotal", "sgst_total", "igstTotal", "igst_total"]
const DUE_FIELDS = ["dueAmount", "due_amount", "balanceDue", "balance_due", "balance", "pendingAmount", "pending_amount", "remainingAmount", "remaining_amount"]
const EXPENSE_FIELDS = ["amount", "total", "totalAmount", "total_amount", "expenseAmount", "expense_amount"]

export function buildOverviewChartData({
  sales = [],
  purchases = [],
  products = [],
  gstInvoices = [],
  parties = [],
  expenses = [],
  today = new Date(),
  days = 7,
}: BuildOverviewChartDataInput): OverviewChartData {
  const salesByDay = buildDailyTotals(sales, SALE_AMOUNT_FIELDS, today, days)
  const purchasesByDay = buildDailyTotals(purchases, PURCHASE_AMOUNT_FIELDS, today, days)
  const gstCollectedByDay = buildDailyTotals([...sales, ...gstInvoices], GST_COLLECTED_FIELDS, today, days)
  const gstPaidByDay = buildDailyTotals(purchases, GST_COLLECTED_FIELDS, today, days)
  const expensesByDay = buildDailyTotals(expenses, EXPENSE_FIELDS, today, days)
  const dueByDay = buildDailyTotals([...sales, ...purchases, ...parties], DUE_FIELDS, today, days)
  const labels = buildDayLabels(today, days)
  const currentStockValue = products.reduce((sum, product) => sum + getProductStockValue(product), 0)
  const stockRisk = getStockHealth(products)
  const topProducts = getProductSalesBars(sales, products, false)
  const slowProducts = getProductSalesBars(sales, products, true)

  return {
    salesTrend: labels.map((day) => ({
      label: day.label,
      value: salesByDay.get(day.key) || 0,
      tooltipRows: [
        { label: en.dashboard.saleAmount, value: formatCurrency(salesByDay.get(day.key) || 0) },
        { label: en.dashboard.purchaseAmount, value: formatCurrency(purchasesByDay.get(day.key) || 0) },
      ],
    })),
    purchaseTrend: labels.map((day) => ({
      label: day.label,
      value: purchasesByDay.get(day.key) || 0,
      tooltipRows: [
        { label: en.dashboard.purchaseAmount, value: formatCurrency(purchasesByDay.get(day.key) || 0) },
        { label: en.dashboard.saleAmount, value: formatCurrency(salesByDay.get(day.key) || 0) },
      ],
    })),
    stockValueTrend: labels.map((day) => ({
      label: day.label,
      value: currentStockValue,
      tooltipRows: [
        { label: en.dashboard.stockValue, value: formatCurrency(currentStockValue) },
        { label: en.dashboard.lowStockCount, value: String(stockRisk.low + stockRisk.critical) },
        { label: en.dashboard.outOfStockCount, value: String(stockRisk.out) },
      ],
    })),
    gstTrend: labels.map((day) => ({
      label: day.label,
      value: (gstCollectedByDay.get(day.key) || 0) - (gstPaidByDay.get(day.key) || 0),
      tooltipRows: [
        { label: en.dashboard.netGst, value: formatCurrency((gstCollectedByDay.get(day.key) || 0) - (gstPaidByDay.get(day.key) || 0)) },
        { label: en.dashboard.gstCollected, value: formatCurrency(gstCollectedByDay.get(day.key) || 0) },
        { label: en.dashboard.gstPaid, value: formatCurrency(gstPaidByDay.get(day.key) || 0) },
      ],
    })),
    profitLossTrend: labels.map((day) => {
      const sale = salesByDay.get(day.key) || 0
      const purchase = purchasesByDay.get(day.key) || 0
      const expense = expensesByDay.get(day.key) || 0
      const profitLoss = sale - purchase - expense
      return {
        label: day.label,
        value: profitLoss,
        tooltipRows: [
          { label: en.dashboard.saleAmount, value: formatCurrency(sale) },
          { label: en.dashboard.purchaseAmount, value: formatCurrency(purchase) },
          { label: en.accounting.expensesTotal, value: formatCurrency(expense) },
          { label: en.dashboard.profitLoss, value: formatCurrency(profitLoss) },
        ],
      }
    }),
    stockRiskTrend: labels.map((day) => ({
      label: day.label,
      value: stockRisk.low + stockRisk.critical + stockRisk.out,
      tooltipRows: [
        { label: en.dashboard.lowStockCount, value: String(stockRisk.low + stockRisk.critical) },
        { label: en.dashboard.outOfStockCount, value: String(stockRisk.out) },
      ],
    })),
    dueTrend: labels.map((day) => ({
      label: day.label,
      value: dueByDay.get(day.key) || 0,
      tooltipRows: [{ label: en.dashboard.dueAmount, value: formatCurrency(dueByDay.get(day.key) || 0) }],
    })),
    topProducts,
    slowProducts,
    stockHealth: stockRisk,
  }
}

function buildDailyTotals(records: OverviewSourceRecord[], amountFields: string[], today: Date, days: number) {
  const totals = new Map<string, number>()
  const allowedKeys = new Set(buildDayLabels(today, days).map((day) => day.key))

  records.forEach((record) => {
    const date = readDate(record, DATE_FIELDS) || today
    const key = toDateKey(date)
    if (!allowedKeys.has(key)) return
    const shouldSumGstParts = amountFields.some((field) => ["cgstTotal", "cgst_total", "sgstTotal", "sgst_total", "igstTotal", "igst_total"].includes(field))
    const gstParts = getNumber(record, ["cgstTotal", "cgst_total"]) + getNumber(record, ["sgstTotal", "sgst_total"]) + getNumber(record, ["igstTotal", "igst_total"])
    const amount = shouldSumGstParts && gstParts > 0 ? gstParts : getNumber(record, amountFields)
    totals.set(key, (totals.get(key) || 0) + Math.max(0, amount))
  })

  return totals
}

function getStockHealth(products: OverviewSourceRecord[]): OverviewStockHealth {
  return products.reduce<OverviewStockHealth>(
    (health, product) => {
      const quantity = getProductQuantity(product)
      const lowLimit = Math.max(0, getNumber(product, ["lowStockLimit", "minStock", "minimumStock", "alertQuantity", "reorderLevel"]))
      if (quantity <= 0) health.out += 1
      else if (lowLimit > 0 && quantity <= Math.max(1, lowLimit / 2)) health.critical += 1
      else if (lowLimit > 0 && quantity <= lowLimit) health.low += 1
      else health.healthy += 1
      return health
    },
    { healthy: 0, low: 0, critical: 0, out: 0 },
  )
}

function getProductSalesBars(sales: OverviewSourceRecord[], products: OverviewSourceRecord[], slow: boolean): OverviewMetricBar[] {
  const sold = new Map<string, { quantity: number; value: number }>()
  sales.forEach((sale) => {
    const amount = getNumber(sale, SALE_AMOUNT_FIELDS)
    const items = readArray(sale, ["items", "products", "saleItems", "lineItems"])
    if (!items.length) {
      const name = getProductName(sale)
      if (name) addSold(sold, name, getNumber(sale, ["quantity", "qty", "units", "soldQuantity"]) || 1, amount)
      return
    }
    items.forEach((item) => {
      const name = getProductName(item)
      if (!name) return
      const quantity = getNumber(item, ["quantity", "qty", "units", "soldQuantity"]) || 1
      const value = getNumber(item, SALE_AMOUNT_FIELDS) || getNumber(item, ["lineTotal", "itemTotal", "totalPrice"]) || amount
      addSold(sold, name, quantity, value)
    })
  })

  const productBars = products.map((product) => {
    const name = getProductName(product) || en.common.notAvailable
    const current = sold.get(name) || { quantity: 0, value: 0 }
    const stockValue = getProductStockValue(product)
    return {
      label: name,
      value: slow ? stockValue : current.value,
      secondaryValue: String(slow ? getProductQuantity(product) : current.quantity),
      sortValue: slow ? current.quantity : current.value,
      tooltipRows: [
        { label: en.reports.sales, value: formatCurrency(current.value) },
        { label: en.reports.units, value: String(current.quantity) },
        { label: en.reports.stockValue, value: formatCurrency(stockValue) },
      ],
    }
  })

  const bars = productBars
    .filter((bar) => (slow ? bar.value > 0 : bar.sortValue > 0))
    .sort((a, b) => (slow ? a.sortValue - b.sortValue || b.value - a.value : b.sortValue - a.sortValue))
    .slice(0, 8)

  return bars.map((bar) => ({
    label: bar.label,
    value: bar.value,
    secondaryValue: bar.secondaryValue,
    tooltipRows: bar.tooltipRows,
  }))
}

function addSold(map: Map<string, { quantity: number; value: number }>, name: string, quantity: number, value: number) {
  const current = map.get(name) || { quantity: 0, value: 0 }
  map.set(name, { quantity: current.quantity + Math.max(0, quantity), value: current.value + Math.max(0, value) })
}

function buildDayLabels(today: Date, days: number) {
  return Array.from({ length: Math.max(days, 1) }, (_, index) => {
    const date = new Date(today)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (days - index - 1))
    return {
      key: toDateKey(date),
      label: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    }
  })
}

function toDateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
}

function getProductQuantity(record: OverviewSourceRecord) {
  return getNumber(record, ["quantity", "qty", "stock", "currentStock", "current_stock", "availableQuantity", "available_quantity", "availableQty", "available_qty", "closingStock", "closing_stock"])
}

function getProductStockValue(record: OverviewSourceRecord) {
  const directValue = getNumber(record, ["stockValue", "stock_value", "inventoryValue", "inventory_value", "currentValue", "current_value"])
  if (directValue > 0) return directValue
  const quantity = getProductQuantity(record)
  const rate = getNumber(record, ["purchaseRate", "purchase_rate", "purchasePrice", "purchase_price", "costPrice", "cost_price", "buyingPrice", "buying_price", "rate", "price", "salePrice", "sale_price"])
  return Math.max(0, quantity * rate)
}

function getProductName(record: OverviewSourceRecord) {
  const value = readValue(record, ["productName", "product_name", "name", "itemName", "item_name", "title", "product"])
  return typeof value === "string" && value.trim() ? value.trim() : ""
}

function getNumber(record: OverviewSourceRecord, fields: string[]) {
  for (const field of fields) {
    const value = readValue(record, [field])
    const number = coerceNumber(value)
    if (number > 0) return number
  }
  return 0
}

function readDate(record: OverviewSourceRecord, fields: string[]) {
  for (const field of fields) {
    const value = readValue(record, [field])
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value
    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) return date
    }
  }
  return null
}

function readArray(record: OverviewSourceRecord, fields: string[]) {
  for (const field of fields) {
    const value = readValue(record, [field])
    if (Array.isArray(value)) return value.filter((item): item is OverviewSourceRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item))
  }
  return []
}

function readValue(record: OverviewSourceRecord, fields: string[]) {
  for (const field of fields) {
    if (field in record) return record[field]
    const totals = record.totals
    if (totals && typeof totals === "object" && !Array.isArray(totals) && field in totals) return (totals as Record<string, unknown>)[field]
    const payment = record.payment
    if (payment && typeof payment === "object" && !Array.isArray(payment) && field in payment) return (payment as Record<string, unknown>)[field]
  }
  return undefined
}

function coerceNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.-]/g, "")
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}
