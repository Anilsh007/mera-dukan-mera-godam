import type { CashbookEntryRecord, ExpenseCategory, ExpenseRecord, PurchaseRecord, SaleRecord } from "@/app/lib/db"
import { en } from "@/app/messages/en"

export type AccountingDateRange = {
  from?: string
  to?: string
}

export type CashbookViewEntry = {
  id: string
  userId: string
  entryDate: string
  entryDateTime: string
  type: "cash-in" | "cash-out"
  account: "cash" | "bank" | "upi"
  amount: number
  label: string
  paymentMode?: string
  reference?: string
  note?: string
  source: "manual" | "sale" | "purchase" | "expense"
  linkedRecordId?: string
}

export type ProfitLossSummary = {
  salesTotal: number
  purchaseCost: number
  grossProfit: number
  expensesTotal: number
  netProfit: number
  customerDue: number
  supplierDue: number
  monthlyComparison: MonthlyProfitLossPoint[]
}

export type MonthlyProfitLossPoint = {
  key: string
  label: string
  sales: number
  purchases: number
  expenses: number
  netProfit: number
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "rent",
  "salary",
  "transport",
  "electricity",
  "internet",
  "packing",
  "maintenance",
  "other",
]

export const CASHBOOK_ACCOUNTS: CashbookViewEntry["account"][] = ["cash", "bank", "upi"]

export function getExpenseCategoryLabel(category: ExpenseCategory) {
  return en.accounting.expenseCategories[category]
}

export function getCashbookAccountLabel(account: CashbookViewEntry["account"]) {
  return en.accounting.cashbookAccounts[account]
}

export function getCashbookTypeLabel(type: CashbookViewEntry["type"]) {
  return en.accounting.cashbookTypes[type]
}

export function buildExpenseNumber() {
  return `EXP-${dateStamp()}-${shortTimeStamp()}`
}

export function buildCashbookNumber() {
  return `CB-${dateStamp()}-${shortTimeStamp()}`
}

export function formatAccountingMoney(value: number) {
  return `${en.common.rupeeSymbol} ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function roundAccounting(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

export function isInDateRange(dateValue: string, range: AccountingDateRange) {
  const date = parseDate(dateValue)
  if (!date) return false
  if (range.from) {
    const from = parseDate(range.from)
    if (from && date.getTime() < startOfDay(from).getTime()) return false
  }
  if (range.to) {
    const to = parseDate(range.to)
    if (to && date.getTime() > endOfDay(to).getTime()) return false
  }
  return true
}

export function buildCashbookViewEntries({
  manualEntries,
  sales,
  purchases,
  expenses,
}: {
  manualEntries: CashbookEntryRecord[]
  sales: SaleRecord[]
  purchases: PurchaseRecord[]
  expenses: ExpenseRecord[]
}): CashbookViewEntry[] {
  const manual: CashbookViewEntry[] = manualEntries.map((entry) => ({
    id: entry.id,
    userId: entry.userId,
    entryDate: entry.entryDate,
    entryDateTime: entry.entryDateTime,
    type: entry.type,
    account: entry.account,
    amount: Number(entry.amount || 0),
    label: entry.note || entry.reference || en.accounting.manualAdjustment,
    paymentMode: entry.paymentMode,
    reference: entry.reference,
    note: entry.note,
    source: "manual",
    linkedRecordId: entry.linkedRecordId,
  }))

  const saleEntries: CashbookViewEntry[] = sales
    .filter((sale) => sale.status !== "cancelled" && Number(sale.amountPaid || 0) > 0)
    .map((sale) => ({
      id: `sale-${sale.id}`,
      userId: sale.userId,
      entryDate: sale.saleDate,
      entryDateTime: sale.saleDateTime || sale.createdAt,
      type: "cash-in",
      account: accountFromPaymentMode(sale.paymentMode),
      amount: Number(sale.amountPaid || 0),
      label: sale.customer?.name || en.accounting.saleReceiptEntry,
      paymentMode: sale.paymentMode,
      reference: sale.receiptNo,
      note: sale.note,
      source: "sale",
      linkedRecordId: sale.id,
    }))

  const purchaseEntries: CashbookViewEntry[] = purchases
    .filter((purchase) => Number(purchase.amountPaid || 0) > 0)
    .map((purchase) => ({
      id: `purchase-${purchase.id}`,
      userId: purchase.userId,
      entryDate: purchase.purchaseDate,
      entryDateTime: purchase.purchaseDateTime || purchase.createdAt,
      type: "cash-out",
      account: accountFromPaymentMode(purchase.paymentMode),
      amount: Number(purchase.amountPaid || 0),
      label: purchase.supplierName || en.accounting.purchasePaymentEntry,
      paymentMode: purchase.paymentMode,
      reference: purchase.billNo,
      note: purchase.note,
      source: "purchase",
      linkedRecordId: purchase.id,
    }))

  const expenseEntries: CashbookViewEntry[] = expenses.map((expense) => ({
    id: `expense-${expense.id}`,
    userId: expense.userId,
    entryDate: expense.expenseDate,
    entryDateTime: expense.expenseDateTime || expense.createdAt,
    type: "cash-out",
    account: accountFromPaymentMode(expense.paymentMode),
    amount: Number(expense.amount || 0),
    label: `${getExpenseCategoryLabel(expense.category)}${expense.note ? ` - ${expense.note}` : ""}`,
    paymentMode: expense.paymentMode,
    reference: expense.reference || expense.expenseNo,
    note: expense.note,
    source: "expense",
    linkedRecordId: expense.id,
  }))

  return [...manual, ...saleEntries, ...purchaseEntries, ...expenseEntries]
    .filter((entry) => Number(entry.amount || 0) > 0)
    .sort((left, right) => right.entryDateTime.localeCompare(left.entryDateTime))
}

export function calculateCashbookSummary(entries: CashbookViewEntry[], selectedDate: string) {
  const start = startOfDay(new Date(`${selectedDate}T00:00:00`)).getTime()
  const end = endOfDay(new Date(`${selectedDate}T00:00:00`)).getTime()
  let openingBalance = 0
  let cashIn = 0
  let cashOut = 0

  entries.forEach((entry) => {
    const time = parseDate(entry.entryDateTime || entry.entryDate)?.getTime() || 0
    const signed = entry.type === "cash-in" ? entry.amount : -entry.amount
    if (time < start) openingBalance += signed
    if (time >= start && time <= end) {
      if (entry.type === "cash-in") cashIn += entry.amount
      else cashOut += entry.amount
    }
  })

  return {
    openingBalance: roundAccounting(openingBalance),
    cashIn: roundAccounting(cashIn),
    cashOut: roundAccounting(cashOut),
    closingBalance: roundAccounting(openingBalance + cashIn - cashOut),
  }
}

export function calculateProfitLoss({
  sales,
  purchases,
  expenses,
  range,
}: {
  sales: SaleRecord[]
  purchases: PurchaseRecord[]
  expenses: ExpenseRecord[]
  range: AccountingDateRange
}): ProfitLossSummary {
  const filteredSales = sales.filter((sale) => sale.status !== "cancelled" && isInDateRange(sale.saleDateTime || sale.saleDate, range))
  const filteredPurchases = purchases.filter((purchase) => isInDateRange(purchase.purchaseDateTime || purchase.purchaseDate, range))
  const filteredExpenses = expenses.filter((expense) => isInDateRange(expense.expenseDateTime || expense.expenseDate, range))

  const salesTotal = sumBy(filteredSales, (sale) => sale.totalAmount)
  const purchaseCost = sumBy(filteredPurchases, (purchase) => purchase.totalAmount)
  const expensesTotal = sumBy(filteredExpenses, (expense) => expense.amount)
  const grossProfit = roundAccounting(salesTotal - purchaseCost)
  const netProfit = roundAccounting(grossProfit - expensesTotal)
  const customerDue = sumBy(filteredSales, (sale) => sale.dueAmount)
  const supplierDue = sumBy(filteredPurchases, (purchase) => purchase.dueAmount)

  return {
    salesTotal,
    purchaseCost,
    grossProfit,
    expensesTotal,
    netProfit,
    customerDue,
    supplierDue,
    monthlyComparison: buildMonthlyComparison(filteredSales, filteredPurchases, filteredExpenses),
  }
}

export function buildExpenseReportRows(expenses: ExpenseRecord[]) {
  return [
    [en.accounting.expenseNo, en.accounting.date, en.accounting.category, en.accounting.amount, en.accounting.paymentMode, en.accounting.reference, en.accounting.note],
    ...expenses.map((expense) => [
      expense.expenseNo,
      expense.expenseDate,
      getExpenseCategoryLabel(expense.category),
      expense.amount,
      expense.paymentMode,
      expense.reference || "",
      expense.note || "",
    ]),
  ]
}

export function buildCashbookReportRows(entries: CashbookViewEntry[]) {
  return [
    [en.accounting.date, en.accounting.type, en.accounting.account, en.accounting.amount, en.accounting.source, en.accounting.reference, en.accounting.note],
    ...entries.map((entry) => [
      entry.entryDate,
      getCashbookTypeLabel(entry.type),
      getCashbookAccountLabel(entry.account),
      entry.amount,
      en.accounting.cashbookSources[entry.source],
      entry.reference || "",
      entry.note || entry.label,
    ]),
  ]
}

export function buildProfitLossReportRows(summary: ProfitLossSummary) {
  return [
    [en.accounting.metric, en.gstInvoice.total],
    [en.accounting.salesTotal, summary.salesTotal],
    [en.accounting.purchaseCost, summary.purchaseCost],
    [en.accounting.grossProfit, summary.grossProfit],
    [en.accounting.expensesTotal, summary.expensesTotal],
    [en.accounting.netProfit, summary.netProfit],
    [en.accounting.customerDue, summary.customerDue],
    [en.accounting.supplierDue, summary.supplierDue],
  ]
}

function buildMonthlyComparison(sales: SaleRecord[], purchases: PurchaseRecord[], expenses: ExpenseRecord[]) {
  const months = new Map<string, MonthlyProfitLossPoint>()
  const ensureMonth = (dateValue: string) => {
    const date = parseDate(dateValue) || new Date()
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const existing = months.get(key)
    if (existing) return existing
    const created = { key, label: formatMonthLabel(key), sales: 0, purchases: 0, expenses: 0, netProfit: 0 }
    months.set(key, created)
    return created
  }

  sales.forEach((sale) => {
    ensureMonth(sale.saleDateTime || sale.saleDate).sales += Number(sale.totalAmount || 0)
  })
  purchases.forEach((purchase) => {
    ensureMonth(purchase.purchaseDateTime || purchase.purchaseDate).purchases += Number(purchase.totalAmount || 0)
  })
  expenses.forEach((expense) => {
    ensureMonth(expense.expenseDateTime || expense.expenseDate).expenses += Number(expense.amount || 0)
  })

  return Array.from(months.values())
    .map((point) => ({
      ...point,
      sales: roundAccounting(point.sales),
      purchases: roundAccounting(point.purchases),
      expenses: roundAccounting(point.expenses),
      netProfit: roundAccounting(point.sales - point.purchases - point.expenses),
    }))
    .sort((left, right) => right.key.localeCompare(left.key))
    .slice(0, 12)
}

function accountFromPaymentMode(paymentMode?: string): CashbookViewEntry["account"] {
  const mode = (paymentMode || "").toLowerCase()
  if (mode.includes("upi")) return "upi"
  if (mode.includes("bank") || mode.includes("card")) return "bank"
  return "cash"
}

function sumBy<T>(records: T[], getter: (record: T) => number) {
  return roundAccounting(records.reduce((sum, record) => sum + Number(getter(record) || 0), 0))
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10).replaceAll("-", "")
}

function shortTimeStamp() {
  return String(Date.now()).slice(-6)
}

function parseDate(value?: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-").map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
}
