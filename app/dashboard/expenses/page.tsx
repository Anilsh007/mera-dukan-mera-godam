"use client"

import { useMemo, useState } from "react"
import { Download, FileSpreadsheet, Paperclip, Printer, ReceiptText, Search } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import SelectField from "@/app/components/ui/SelectField"
import PageHeader from "@/app/components/ui/PageHeader"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import SuspendedAccessBanner from "@/app/components/subscription/SuspendedAccessBanner"
import SummaryCard from "@/app/components/ui/SummaryCard"
import useDebouncedValue from "@/app/hooks/useDebouncedValue"
import useExpenses from "@/app/hooks/useExpenses"
import useFeatureGate from "@/app/hooks/useFeatureGate"
import { auth } from "@/app/lib/firebase"
import { notify as toast } from "@/app/lib/notifications"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { deleteExpense, saveExpense, updateExpense } from "@/app/lib/accounting/accounting.service"
import {
  buildExpenseNumber,
  buildExpenseReportRows,
  EXPENSE_CATEGORIES,
  formatAccountingMoney,
  getExpenseCategoryLabel,
  isInDateRange,
} from "@/app/lib/accounting/accounting.utils"
import { buildRowsShareMessage } from "@/app/lib/accounting/accounting.export"
import { runAccountingExport, type AccountingExportKind } from "@/app/lib/accounting/accounting.exportActions"
import { en } from "@/app/messages/en"
import type { ExpenseCategory, ExpenseRecord } from "@/app/lib/db"

const PAYMENT_MODES = Object.values(en.accounting.paymentModeOptions)
const SORT_OPTIONS = ["newest", "oldest", "amount-high", "amount-low"] as const
type SortOption = (typeof SORT_OPTIONS)[number]

export default function ExpensesPage() {
  const { expenses, loading } = useExpenses()
  const accountingGate = useFeatureGate("accounting")
  const [expenseNo, setExpenseNo] = useState(() => buildExpenseNumber())
  const [category, setCategory] = useState<ExpenseCategory | "">("")
  const [amount, setAmount] = useState("")
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [paymentMode, setPaymentMode] = useState("")
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sort, setSort] = useState<SortOption>("newest")
  const [saving, setSaving] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const debouncedSearch = useDebouncedValue(search, 180)

  const canCreate = accountingGate.allowed && !accountingGate.loading

  const filteredExpenses = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    const filtered = expenses.filter((expense) => {
      const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter
      const matchesDate = isInDateRange(expense.expenseDateTime || expense.expenseDate, { from: fromDate, to: toDate })
      const haystack = [expense.expenseNo, getExpenseCategoryLabel(expense.category), expense.paymentMode, expense.reference, expense.note]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return matchesCategory && matchesDate && (!query || haystack.includes(query))
    })

    return filtered.sort((left, right) => {
      if (sort === "oldest") return left.expenseDateTime.localeCompare(right.expenseDateTime)
      if (sort === "amount-high") return Number(right.amount) - Number(left.amount)
      if (sort === "amount-low") return Number(left.amount) - Number(right.amount)
      return right.expenseDateTime.localeCompare(left.expenseDateTime)
    })
  }, [categoryFilter, debouncedSearch, expenses, fromDate, sort, toDate])

  const monthlyTotal = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7)
    return expenses
      .filter((expense) => expense.expenseDate.slice(0, 7) === monthKey)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  }, [expenses])
  const filteredTotal = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const rows = buildExpenseReportRows(filteredExpenses)
  const shareMessage = buildRowsShareMessage(rows, en.accounting.expensesTitle)

  const resetForm = () => {
    setEditingExpenseId(null)
    setExpenseNo(buildExpenseNumber())
    setCategory("")
    setAmount("")
    setExpenseDate(new Date().toISOString().slice(0, 10))
    setPaymentMode("")
    setReference("")
    setNote("")
  }

  const handleEditExpense = (expense: ExpenseRecord) => {
    setEditingExpenseId(expense.id)
    setExpenseNo(expense.expenseNo)
    setCategory(expense.category)
    setAmount(String(expense.amount))
    setExpenseDate(expense.expenseDate)
    setPaymentMode(expense.paymentMode)
    setReference(expense.reference || "")
    setNote(expense.note || "")
  }

  const handleDeleteExpense = async (expense: ExpenseRecord) => {
    if (!window.confirm(`Delete expense ${expense.expenseNo}?`)) return

    try {
      setSaving(true)
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      await deleteExpense(userId, expense.id)
      if (editingExpenseId === expense.id) {
        resetForm()
      }
      toast.success("Expense deleted.")
    } catch (error) {
      console.error("Expense delete failed", error)
      toast.error(error instanceof Error ? error.message : en.accounting.expenseSaveFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!canCreate) {
      toast.error(en.subscription.subscriptionRequired)
      return
    }
    if (!category) {
      toast.error(en.accounting.categoryRequired)
      return
    }
    if (!paymentMode) {
      toast.error(en.accounting.paymentModeRequired)
      return
    }
    try {
      setSaving(true)
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      if (editingExpenseId) {
        await updateExpense(editingExpenseId, {
          userId,
          expenseNo,
          category,
          amount: Number(amount || 0),
          expenseDate,
          paymentMode,
          reference,
          note,
        })
        toast.success("Expense updated.")
      } else {
        await saveExpense({
          userId,
          expenseNo,
          category,
          amount: Number(amount || 0),
          expenseDate,
          paymentMode,
          reference,
          note,
        })
        toast.success(en.accounting.expenseSaved)
      }
      resetForm()
    } catch (error) {
      console.error("Expense save failed", error)
      toast.error(error instanceof Error ? error.message : en.accounting.expenseSaveFailed)
    } finally {
      setSaving(false)
    }
  }

  const runExport = async (kind: AccountingExportKind) => {
    if (!filteredExpenses.length) {
      toast.warning(en.accounting.noExpenseResults)
      return
    }

    await runAccountingExport({
      kind,
      rows,
      filenamePrefix: "expenses",
      title: en.accounting.expensesTitle,
      errorLabel: en.accounting.expenseExportFailed,
    })
  }

  return (
    <main className="space-y-5 p-3 sm:p-4 lg:p-6">
      <PageHeader
        title={en.accounting.expensesTitle}
        description={en.accounting.expensesDescription}
        actions={<TransactionActionPanel message={shareMessage} subject={en.accounting.expensesTitle} filename="expenses-summary.pdf" showPrint={false} />}
      />
      {accountingGate.subscriptionExpired ? (
        <SuspendedAccessBanner
          description={en.subscription.readOnlyExpiredMessage}
          featureLabel={en.subscription.features.accounting}
          usage={accountingGate.usage}
          limit={typeof accountingGate.limit === "number" ? accountingGate.limit : undefined}
          onOpenUpgrade={() => window.location.assign("/pricing")}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label={en.accounting.totalExpenses} value={formatAccountingMoney(filteredTotal)} icon={<ReceiptText size={18} />} />
        <SummaryCard label={en.accounting.monthlyExpenses} value={formatAccountingMoney(monthlyTotal)} icon={<ReceiptText size={18} />} />
        <SummaryCard label={en.accounting.records} value={String(filteredExpenses.length)} icon={<ReceiptText size={18} />} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(320px,0.7fr)_minmax(0,1.3fr)]">
        <form className="premium-surface space-y-4 rounded-3xl p-4 sm:p-5" onSubmit={(event) => { event.preventDefault(); void handleSave() }}>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{editingExpenseId ? `${en.common.edit} ${en.accounting.addExpense}` : en.accounting.addExpense}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{en.accounting.expenseFormHelp}</p>
          </div>
          <Input label={en.accounting.expenseNo} value={expenseNo} onChange={(event) => setExpenseNo(event.target.value)} />
            <SelectField
              label={en.accounting.category}
              value={category}
              onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
              options={EXPENSE_CATEGORIES.map((option) => ({ value: option, label: getExpenseCategoryLabel(option) }))}
            />
          <Input label={en.accounting.amount} value={amount} type="number" min="0" step="0.01" onChange={(event) => setAmount(event.target.value)} />
          <Input label={en.accounting.date} value={expenseDate} type="date" onChange={(event) => setExpenseDate(event.target.value)} />
            <SelectField
              label={en.accounting.paymentMode}
              value={paymentMode}
              onChange={(event) => setPaymentMode(event.target.value)}
              options={PAYMENT_MODES.map((option) => ({ value: option, label: option }))}
            />
          <Input label={en.accounting.reference} value={reference} onChange={(event) => setReference(event.target.value)} placeholder={en.accounting.referencePlaceholder} />
          <Input label={en.accounting.note} value={note} onChange={(event) => setNote(event.target.value)} placeholder={en.accounting.expenseNotePlaceholder} />
          <div className="rounded-2xl border border-dashed border-[var(--border-input)] p-3 text-sm text-[var(--text-secondary)]">
            <div className="flex items-start gap-2"><Paperclip size={16} /> <span>{en.accounting.receiptAttachmentPlaceholder}</span></div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" title={editingExpenseId ? en.profile.saveChanges : en.accounting.saveExpense} loading={saving} disabled={!canCreate} className="w-full" />
            {editingExpenseId ? (
              <Button type="button" variant="outline" title={en.common.cancel} onClick={resetForm} className="w-full sm:w-auto" />
            ) : null}
          </div>
        </form>

        <section className="premium-surface space-y-4 rounded-3xl p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input label={en.accounting.searchExpenses} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={en.accounting.searchExpensePlaceholder} leftAddon={<Search size={16} />} />
            <SelectField
              label={en.accounting.category}
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as ExpenseCategory | "all")}
              options={[{ value: "all", label: en.accounting.allCategories }, ...EXPENSE_CATEGORIES.map((option) => ({ value: option, label: getExpenseCategoryLabel(option) }))]}
            />
            <Input label={en.download.fromDate} type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            <Input label={en.download.toDate} type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SelectField
              label={en.accounting.sortBy}
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              options={SORT_OPTIONS.map((option) => ({ value: option, label: en.accounting.sortOptions[option] }))}
              containerClassName="min-w-[180px]"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="black" icon={<Download size={16} />} title={en.reports.exportCsv} onClick={() => void runExport("csv")} />
              <Button type="button" variant="outline" icon={<FileSpreadsheet size={16} />} title={en.reports.exportExcel} onClick={() => void runExport("excel")} />
              <Button type="button" variant="outline" icon={<Printer size={16} />} title={en.reports.printOrPdf} onClick={() => void runExport("print")} />
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--text-secondary)]">{en.common.loading}</p>
          ) : filteredExpenses.length ? (
            <div className="overflow-x-auto rounded-2xl border border-[var(--border-card)]">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-[var(--surface-subtle)] text-xs uppercase text-[var(--text-secondary)]">
                  <tr>
                    <th className="p-3">{en.accounting.date}</th>
                    <th className="p-3">{en.accounting.category}</th>
                    <th className="p-3">{en.accounting.amount}</th>
                    <th className="p-3">{en.accounting.paymentMode}</th>
                    <th className="p-3">{en.accounting.reference}</th>
                    <th className="p-3">{en.accounting.note}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <ExpenseRow
                        key={expense.id}
                        expense={expense}
                        onEdit={handleEditExpense}
                        onDelete={() => void handleDeleteExpense(expense)}
                        loading={saving}
                      />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border-input)] p-6 text-center">
              <p className="font-semibold text-[var(--text-primary)]">{en.accounting.noExpenseResults}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.accounting.noExpenseResultsHelp}</p>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

function ExpenseRow({
  expense,
  onEdit,
  onDelete,
  loading,
}: {
  expense: ExpenseRecord
  onEdit: (expense: ExpenseRecord) => void
  onDelete: () => void
  loading?: boolean
}) {
  return (
    <tr className="border-t border-[var(--border-card)]">
      <td className="p-3 text-[var(--text-secondary)]">{expense.expenseDate}</td>
      <td className="p-3 font-semibold text-[var(--text-primary)]">{getExpenseCategoryLabel(expense.category)}</td>
      <td className="p-3 font-bold text-[var(--text-primary)]">{formatAccountingMoney(expense.amount)}</td>
      <td className="p-3 text-[var(--text-secondary)]">{expense.paymentMode}</td>
      <td className="p-3 text-[var(--text-secondary)]">{expense.reference || en.common.notAvailable}</td>
      <td className="p-3 text-[var(--text-secondary)]">{expense.note || en.common.notAvailable}</td>
      <td className="p-3">
          <div className="flex gap-2">
            <Button type="button" variant="outline" title={en.common.edit} onClick={() => onEdit(expense)} className="min-h-9 px-3 py-1 text-xs" />
            <Button type="button" variant="danger" title={en.common.delete} onClick={onDelete} loading={loading} className="min-h-9 px-3 py-1 text-xs" />
          </div>
        </td>
      </tr>
  )
}
