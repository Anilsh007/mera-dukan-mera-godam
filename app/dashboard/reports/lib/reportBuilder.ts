import type { Product, ProductLog, PurchaseRecord } from "@/app/lib/db"
import type { BusinessTrendPoint, ReportsData, DateRangeKey } from "../types"
import { getDaysUntilExpiry, getProductStockLevel } from "@/app/lib/inventory.utils"
import { getRangeStart, getStartOfDay, toDateKey, toMonthKey } from "./dateRange"
import { formatMonthLabel, formatShortDate, safeNumber } from "./format"
import { buildSalesTrend } from "./salesTrend"
import { en } from "@/app/messages/en"

const TOP_LIST_LIMIT = 8
const RECENT_TRANSACTION_LIMIT = 12

export function buildReport(data: ReportsData, rangeKey: DateRangeKey) {
  const rangeStart = getRangeStart(rangeKey)
  const todayStart = getStartOfDay(new Date())
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1)
  const productById = new Map(data.products.map((product) => [product.id, product]))

  const stockHealth = { healthy: 0, low: 0, critical: 0, out: 0 }
  const topCategoriesMap = new Map<string, number>()
  const lowStockProducts: Product[] = []
  const expiryRiskProducts: Product[] = []
  const salesByProduct = new Map<string, { name: string; quantity: number; value: number }>()
  const periodSalesByProduct = new Map<string, { name: string; quantity: number; value: number }>()
  const lastSaleByProduct = new Map<string, number>()
  const periodOutLogs: ProductLog[] = []
  const recentTransactions: Array<{ id: string; kind: string; label: string; date: string; amount: number; status?: string }> = []

  let inventoryValue = 0
  let expiryRiskCount = 0
  let expiredCount = 0
  let periodSales = 0
  let periodUnitsSold = 0
  let periodGstCollected = 0
  let periodGstPaid = 0
  let todaySales = 0
  let todayUnitsSold = 0
  let todayPurchase = 0
  let monthlySales = 0
  let monthlyPurchase = 0

  for (const product of data.products) {
    const stockValue = safeNumber(product.quantity) * safeNumber(product.price)
    inventoryValue += stockValue

    const level = getProductStockLevel(product)
    stockHealth[level] += 1
    if (level === "low" || level === "critical" || level === "out") lowStockProducts.push(product)

    const category = product.category || en.reports.uncategorized
    topCategoriesMap.set(category, (topCategoriesMap.get(category) || 0) + stockValue)

    if (product.expiry) {
      const daysUntilExpiry = getDaysUntilExpiry(product.expiry)
      if (daysUntilExpiry <= 30) {
        expiryRiskCount += 1
        expiryRiskProducts.push(product)
      }
      if (daysUntilExpiry < 0) expiredCount += 1
    }
  }

  for (const log of data.logs) {
    const logDate = parseDate(log.date)
    const quantity = Math.abs(safeNumber(log.quantityAdded || log.quantity))
    const amount = safeNumber(log.amount || quantity * safeNumber(log.price))
    const gstAmount = safeNumber(log.gstAmount) || (safeNumber(log.cgstAmount) + safeNumber(log.sgstAmount) + safeNumber(log.igstAmount))
    const product = productById.get(log.productId)
    const productName = log.productName || product?.name || en.reports.product

    if (log.type === "out") {
      const existing = salesByProduct.get(log.productId || productName) || { name: productName, quantity: 0, value: 0 }
      existing.quantity += quantity
      existing.value += amount
      salesByProduct.set(log.productId || productName, existing)
      if (logDate) {
        const previous = lastSaleByProduct.get(log.productId || productName) || 0
        lastSaleByProduct.set(log.productId || productName, Math.max(previous, logDate.getTime()))
      }
    }

    if (logDate && isOnOrAfter(logDate, rangeStart)) {
      if (log.type === "out") {
        periodOutLogs.push(log)
        periodSales += amount
        periodUnitsSold += quantity
        periodGstCollected += gstAmount
        const existing = periodSalesByProduct.get(log.productId || productName) || { name: productName, quantity: 0, value: 0 }
        existing.quantity += quantity
        existing.value += amount
        periodSalesByProduct.set(log.productId || productName, existing)
      } else {
        periodGstPaid += gstAmount
      }
    }

    if (logDate && isOnOrAfter(logDate, todayStart)) {
      if (log.type === "out") {
        todaySales += amount
        todayUnitsSold += quantity
      }
    }

    if (logDate && isOnOrAfter(logDate, monthStart)) {
      if (log.type === "out") monthlySales += amount
    }

    recentTransactions.push({
      id: log.id,
      kind: log.type === "out" ? en.reports.transactionTypeSale : en.reports.transactionTypeStockIn,
      label: log.invoiceReceiptNo || productName,
      date: log.date,
      amount,
      status: log.paymentStatus,
    })
  }

  let purchaseTotal = 0
  let purchaseCount = 0
  let supplierDue = 0
  let unpaidPurchaseCount = 0
  const topSupplierDueMap = new Map<string, { supplierName: string; dueAmount: number; billCount: number }>()

  for (const purchase of data.purchases) {
    const purchaseDateValue = getPurchaseDate(purchase)
    const purchaseDate = parseDate(purchaseDateValue)
    const dueAmount = safeNumber(purchase.dueAmount)
    const purchaseAmount = safeNumber(purchase.totalAmount)

    if (purchaseDate && isOnOrAfter(purchaseDate, rangeStart)) {
      purchaseTotal += purchaseAmount
      purchaseCount += 1
    }

    if (purchaseDate && isOnOrAfter(purchaseDate, todayStart)) todayPurchase += purchaseAmount
    if (purchaseDate && isOnOrAfter(purchaseDate, monthStart)) monthlyPurchase += purchaseAmount

    supplierDue += dueAmount
    if (dueAmount > 0) {
      unpaidPurchaseCount += 1
      const supplierName = purchase.supplierName || en.reports.supplierDue
      const existing = topSupplierDueMap.get(supplierName) || { supplierName, dueAmount: 0, billCount: 0 }
      existing.dueAmount += dueAmount
      existing.billCount += 1
      topSupplierDueMap.set(supplierName, existing)
    }

    recentTransactions.push({
      id: purchase.id,
      kind: en.reports.transactionTypePurchase,
      label: purchase.billNo || purchase.supplierName || en.reports.transactionTypePurchase,
      date: purchaseDateValue,
      amount: purchaseAmount,
      status: purchase.paymentStatus,
    })
  }

  let invoiceTotal = 0
  let invoiceCount = 0
  let invoiceGstTotal = 0
  const periodInvoices: ReportsData["invoices"] = []

  for (const invoice of data.invoices) {
    const invoiceDateValue = invoice.invoiceDate || invoice.createdAt
    const invoiceDate = parseDate(invoiceDateValue)
    if (invoiceDate && isOnOrAfter(invoiceDate, rangeStart)) {
      periodInvoices.push(invoice)
      invoiceTotal += safeNumber(invoice.totals?.grandTotal)
      invoiceGstTotal += getInvoiceGstTotal(invoice)
      invoiceCount += 1
    }

    recentTransactions.push({
      id: invoice.id,
      kind: en.reports.transactionTypeInvoice,
      label: invoice.invoiceNo || invoice.buyerName || en.reports.transactionTypeInvoice,
      date: invoiceDateValue,
      amount: safeNumber(invoice.totals?.grandTotal),
      status: invoice.syncStatus,
    })
  }

  const estimatedCostOfSold = periodOutLogs.reduce((sum, log) => {
    const product = productById.get(log.productId)
    return sum + Math.abs(safeNumber(log.quantityAdded || log.quantity)) * safeNumber(product?.price)
  }, 0)
  const estimatedMargin = periodSales - estimatedCostOfSold
  const marginPercent = periodSales > 0 ? (estimatedMargin / periodSales) * 100 : 0

  const topCategories = Array.from(topCategoriesMap.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 7)
    .map(([label, value]) => ({ label, value }))

  const topSellingProducts = Array.from(periodSalesByProduct.values())
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, TOP_LIST_LIMIT)

  const slowMovingProducts = data.products
    .filter((product) => safeNumber(product.quantity) > 0)
    .map((product) => {
      const key = product.id || product.name
      const lastSoldAt = lastSaleByProduct.get(key) || null
      const soldQuantity = salesByProduct.get(key)?.quantity || 0
      return {
        name: product.name,
        quantity: safeNumber(product.quantity),
        stockValue: safeNumber(product.quantity) * safeNumber(product.price),
        lastSoldAt,
        soldQuantity,
      }
    })
    .sort((left, right) => {
      if (!left.lastSoldAt && right.lastSoldAt) return -1
      if (left.lastSoldAt && !right.lastSoldAt) return 1
      if (left.lastSoldAt && right.lastSoldAt && left.lastSoldAt !== right.lastSoldAt) return left.lastSoldAt - right.lastSoldAt
      if (left.soldQuantity !== right.soldQuantity) return left.soldQuantity - right.soldQuantity
      return right.stockValue - left.stockValue
    })
    .slice(0, TOP_LIST_LIMIT)

  return {
    rangeKey,
    productCount: data.products.length,
    inventoryValue,
    periodSales,
    periodUnitsSold,
    purchaseTotal,
    purchaseCount,
    invoiceTotal,
    invoiceCount,
    invoiceGstTotal,
    supplierDue,
    unpaidPurchaseCount,
    lowStockCount: stockHealth.low + stockHealth.critical + stockHealth.out,
    lowOnlyStockCount: stockHealth.low,
    criticalStockCount: stockHealth.critical,
    outOfStockCount: stockHealth.out,
    expiryRiskCount,
    expiredCount,
    estimatedMargin,
    marginPercent,
    stockHealth,
    topCategories,
    topSellingProducts,
    slowMovingProducts,
    lowStockProducts: lowStockProducts
      .sort((left, right) => safeNumber(left.quantity) - safeNumber(right.quantity))
      .slice(0, TOP_LIST_LIMIT),
    expiryRiskProducts: expiryRiskProducts
      .sort((left, right) => getDaysUntilExpiry(left.expiry || "") - getDaysUntilExpiry(right.expiry || ""))
      .slice(0, TOP_LIST_LIMIT),
    topSupplierDues: Array.from(topSupplierDueMap.values())
      .sort((left, right) => right.dueAmount - left.dueAmount)
      .slice(0, TOP_LIST_LIMIT),
    recentInvoices: periodInvoices
      .slice()
      .sort((left, right) => (right.invoiceDate || right.createdAt).localeCompare(left.invoiceDate || left.createdAt))
      .slice(0, 10),
    recentTransactions: recentTransactions
      .filter((transaction) => Boolean(transaction.date))
      .sort((left, right) => getTime(right.date) - getTime(left.date))
      .slice(0, RECENT_TRANSACTION_LIMIT),
    salesTrend: buildSalesTrend(periodOutLogs, rangeKey),
    businessTrend: buildBusinessTrend(data.logs, data.purchases, rangeKey),
    todaySales,
    todayUnitsSold,
    todayPurchase,
    monthlySales,
    monthlyPurchase,
    gstCollected: periodGstCollected || invoiceGstTotal,
    gstPaid: periodGstPaid,
  }
}


function buildBusinessTrend(logs: ProductLog[], purchases: PurchaseRecord[], rangeKey: DateRangeKey): BusinessTrendPoint[] {
  const bucketMeta = buildTrendBuckets(rangeKey)
  const buckets = new Map(bucketMeta.map((bucket) => [bucket.key, { label: bucket.label, sales: 0, purchases: 0 }]))

  logs.forEach((log) => {
    if (log.type !== "out") return
    const date = parseDate(log.date)
    if (!date) return
    const key = rangeKey === "all" ? toMonthKey(date) : toDateKey(date)
    const bucket = buckets.get(key)
    if (!bucket) return
    const quantity = Math.abs(safeNumber(log.quantityAdded || log.quantity))
    bucket.sales += safeNumber(log.amount || quantity * safeNumber(log.price))
  })

  purchases.forEach((purchase) => {
    const date = parseDate(getPurchaseDate(purchase))
    if (!date) return
    const key = rangeKey === "all" ? toMonthKey(date) : toDateKey(date)
    const bucket = buckets.get(key)
    if (!bucket) return
    bucket.purchases += safeNumber(purchase.totalAmount)
  })

  return Array.from(buckets.values()).map((bucket) => ({
    label: bucket.label,
    sales: bucket.sales,
    purchases: bucket.purchases,
    margin: bucket.sales - bucket.purchases,
  }))
}

function buildTrendBuckets(rangeKey: DateRangeKey) {
  if (rangeKey === "all") {
    const end = new Date()
    const start = new Date(end.getFullYear(), end.getMonth() - 11, 1)
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth() + index, 1)
      const key = toMonthKey(date)
      return { key, label: formatMonthLabel(key) }
    })
  }

  const days = rangeKey === "today" ? 1 : rangeKey === "7d" ? 7 : rangeKey === "30d" ? 30 : 90
  const start = getStartOfDay(new Date())
  start.setDate(start.getDate() - (days - 1))

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = toDateKey(date)
    return { key, label: formatShortDate(key) }
  })
}

function getPurchaseDate(purchase: PurchaseRecord) {
  return purchase.purchaseDateTime || purchase.purchaseDate || purchase.createdAt
}

function isOnOrAfter(date: Date, start: Date | null) {
  return !start || date.getTime() >= start.getTime()
}

function parseDate(value?: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}

function getTime(value?: string) {
  return parseDate(value)?.getTime() || 0
}

function getInvoiceGstTotal(invoice: ReportsData["invoices"][number]) {
  return safeNumber(invoice.totals?.cgstTotal) + safeNumber(invoice.totals?.sgstTotal) + safeNumber(invoice.totals?.igstTotal)
}
