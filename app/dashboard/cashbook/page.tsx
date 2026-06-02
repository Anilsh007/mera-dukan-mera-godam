"use client"

import { useMemo, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, BookOpen, Download, FileSpreadsheet, Printer } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import SelectField from "@/app/components/ui/SelectField"
import PageHeader from "@/app/components/ui/PageHeader"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import SummaryCard from "@/app/components/ui/SummaryCard"
import useCashbookEntries from "@/app/hooks/useCashbookEntries"
import useExpenses from "@/app/hooks/useExpenses"
import useFeatureGate from "@/app/hooks/useFeatureGate"
import usePurchases from "@/app/hooks/usePurchases"
import useSales from "@/app/hooks/useSales"
import { deleteCashbookEntry, saveCashbookEntry, updateCashbookEntry } from "@/app/lib/accounting/accounting.service"
import {
  buildCashbookNumber,
  buildCashbookReportRows,
  buildCashbookViewEntries,
  calculateCashbookSummary,
  CASHBOOK_ACCOUNTS,
  formatAccountingMoney,
  getCashbookAccountLabel,
  getCashbookTypeLabel,
  type CashbookViewEntry,
} from "@/app/lib/accounting/accounting.utils"
import { buildRowsShareMessage } from "@/app/lib/accounting/accounting.export"
import { runAccountingExport, type AccountingExportKind } from "@/app/lib/accounting/accounting.exportActions"
import { auth } from "@/app/lib/firebase"
import { notify as toast } from "@/app/lib/notifications"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { en } from "@/app/messages/en"
import type { CashbookAccount, CashbookEntryType } from "@/app/lib/db"

const PAYMENT_MODES = Object.values(en.accounting.paymentModeOptions)

export default function CashbookPage() {
  const { entries: manualEntries, loading: manualLoading } = useCashbookEntries()
  const { sales } = useSales()
  const { purchases } = usePurchases()
  const { expenses } = useExpenses()
  const accountingGate = useFeatureGate("accounting")
  const [entryNo, setEntryNo] = useState(() => buildCashbookNumber())
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [type, setType] = useState<CashbookEntryType | "">("")
  const [account, setAccount] = useState<CashbookAccount | "">("")
  const [amount, setAmount] = useState("")
  const [paymentMode, setPaymentMode] = useState<string>(() => en.accounting.paymentModeOptions.cash)
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)

  const canCreate = accountingGate.allowed && !accountingGate.loading
  const entries = useMemo(
    () => buildCashbookViewEntries({ manualEntries, sales, purchases, expenses }),
    [expenses, manualEntries, purchases, sales],
  )
  const dayEntries = useMemo(
    () => entries.filter((entry) => entry.entryDate === selectedDate),
    [entries, selectedDate],
  )
  const summary = useMemo(() => calculateCashbookSummary(entries, selectedDate), [entries, selectedDate])
  const rows = buildCashbookReportRows(dayEntries)
  const shareMessage = buildRowsShareMessage(rows, en.accounting.cashbookTitle)

  const resetForm = () => {
    setEditingEntryId(null)
    setEntryNo(buildCashbookNumber())
    setEntryDate(new Date().toISOString().slice(0, 10))
    setType("")
    setAccount("")
    setAmount("")
    setPaymentMode(en.accounting.paymentModeOptions.cash)
    setReference("")
    setNote("")
  }

  const handleEditEntry = (entryId: string) => {
    const entry = manualEntries.find((candidate) => candidate.id === entryId)
    if (!entry) return

    setEditingEntryId(entry.id)
    setEntryNo(entry.entryNo)
    setEntryDate(entry.entryDate)
    setType(entry.type)
    setAccount(entry.account)
    setAmount(String(entry.amount))
    setPaymentMode(entry.paymentMode || en.accounting.paymentModeOptions.cash)
    setReference(entry.reference || "")
    setNote(entry.note)
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm("Delete this manual cashbook entry?")) return

    try {
      setSaving(true)
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      await deleteCashbookEntry(userId, entryId)
      if (editingEntryId === entryId) {
        resetForm()
      }
      toast.success("Cashbook entry deleted.")
    } catch (error) {
      console.error("Cashbook entry delete failed", error)
      toast.error(error instanceof Error ? error.message : en.accounting.cashbookEntrySaveFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!canCreate) {
      toast.error(en.subscription.subscriptionRequired)
      return
    }
    if (!type) {
      toast.error(en.accounting.typeRequired)
      return
    }
    if (!account) {
      toast.error(en.accounting.accountRequired)
      return
    }
    try {
      setSaving(true)
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      if (editingEntryId) {
        await updateCashbookEntry(editingEntryId, {
          userId,
          entryNo,
          entryDate,
          type,
          account,
          amount: Number(amount || 0),
          paymentMode,
          reference,
          note,
        })
        toast.success("Cashbook entry updated.")
      } else {
        await saveCashbookEntry({
          userId,
          entryNo,
          entryDate,
          type,
          account,
          amount: Number(amount || 0),
          paymentMode,
          reference,
          note,
        })
        toast.success(en.accounting.cashbookEntrySaved)
      }
      resetForm()
    } catch (error) {
      console.error("Cashbook entry save failed", error)
      toast.error(error instanceof Error ? error.message : en.accounting.cashbookEntrySaveFailed)
    } finally {
      setSaving(false)
    }
  }

  const runExport = async (kind: AccountingExportKind) => {
    if (!dayEntries.length) {
      toast.warning(en.accounting.noCashbookEntries)
      return
    }

    await runAccountingExport({
      kind,
      rows,
      filenamePrefix: "cashbook",
      title: en.accounting.cashbookTitle,
      errorLabel: en.accounting.cashbookExportFailed,
    })
  }

  return (
    <main className="space-y-5 p-3 sm:p-4 lg:p-6">
      <PageHeader
        title={en.accounting.cashbookTitle}
        description={en.accounting.cashbookDescription}
        actions={<TransactionActionPanel message={shareMessage} subject={en.accounting.cashbookTitle} filename="cashbook-summary.pdf" showPrint={false} />}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard label={en.accounting.openingBalance} value={formatAccountingMoney(summary.openingBalance)} icon={<BookOpen size={18} />} />
        <SummaryCard label={en.accounting.cashIn} value={formatAccountingMoney(summary.cashIn)} icon={<ArrowDownLeft size={18} />} />
        <SummaryCard label={en.accounting.cashOut} value={formatAccountingMoney(summary.cashOut)} icon={<ArrowUpRight size={18} />} />
        <SummaryCard label={en.accounting.closingBalance} value={formatAccountingMoney(summary.closingBalance)} icon={<BookOpen size={18} />} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(320px,0.7fr)_minmax(0,1.3fr)]">
        <form className="premium-surface space-y-4 rounded-3xl p-4 sm:p-5" onSubmit={(event) => { event.preventDefault(); void handleSave() }}>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{editingEntryId ? `${en.common.edit} ${en.accounting.manualCashbookEntry}` : en.accounting.manualCashbookEntry}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{en.accounting.manualCashbookHelp}</p>
          </div>
          <Input label={en.accounting.entryNo} value={entryNo} onChange={(event) => setEntryNo(event.target.value)} />
          <Input label={en.accounting.date} type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label={en.accounting.type}
              value={type}
              onChange={(event) => setType(event.target.value as CashbookEntryType | "")}
              options={["cash-in", "cash-out"].map((option) => ({ value: option, label: en.accounting.cashbookTypes[option as CashbookEntryType] }))}
            />
            <SelectField
              label={en.accounting.account}
              value={account}
              onChange={(event) => setAccount(event.target.value as CashbookAccount | "")}
              options={CASHBOOK_ACCOUNTS.map((option) => ({ value: option, label: getCashbookAccountLabel(option) }))}
            />
          </div>
          <Input label={en.accounting.amount} type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
            <SelectField
              label={en.accounting.paymentMode}
              value={paymentMode}
              onChange={(event) => setPaymentMode(event.target.value)}
              options={PAYMENT_MODES.map((option) => ({ value: option, label: option }))}
            />
          <Input label={en.accounting.reference} value={reference} onChange={(event) => setReference(event.target.value)} placeholder={en.accounting.referencePlaceholder} />
          <Input label={en.accounting.note} value={note} onChange={(event) => setNote(event.target.value)} placeholder={en.accounting.cashbookNotePlaceholder} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" title={editingEntryId ? en.profile.saveChanges : en.accounting.saveCashbookEntry} loading={saving} disabled={!canCreate} className="w-full" />
            {editingEntryId ? (
              <Button type="button" variant="outline" title={en.common.cancel} onClick={resetForm} className="w-full sm:w-auto" />
            ) : null}
          </div>
        </form>

        <section className="premium-surface space-y-4 rounded-3xl p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <Input label={en.accounting.dailySummaryDate} type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} containerClassName="md:max-w-xs" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="black" icon={<Download size={16} />} title={en.reports.exportCsv} onClick={() => void runExport("csv")} />
              <Button type="button" variant="outline" icon={<FileSpreadsheet size={16} />} title={en.reports.exportExcel} onClick={() => void runExport("excel")} />
              <Button type="button" variant="outline" icon={<Printer size={16} />} title={en.reports.printOrPdf} onClick={() => void runExport("print")} />
            </div>
          </div>
          <p className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-3 text-sm text-[var(--text-secondary)]">{en.accounting.cashbookDerivedHelp}</p>

          {manualLoading ? (
            <p className="text-sm text-[var(--text-secondary)]">{en.common.loading}</p>
          ) : dayEntries.length ? (
            <div className="space-y-3">
                {dayEntries.map((entry) => (
                  <CashbookEntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={entry.source === "manual" ? () => handleEditEntry(entry.id) : undefined}
                    onDelete={entry.source === "manual" ? () => void handleDeleteEntry(entry.id) : undefined}
                    loading={saving}
                  />
                ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border-input)] p-6 text-center">
              <p className="font-semibold text-[var(--text-primary)]">{en.accounting.noCashbookEntries}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.accounting.noCashbookEntriesHelp}</p>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

function CashbookEntryCard({
  entry,
  onEdit,
  onDelete,
  loading,
}: {
  entry: CashbookViewEntry
  onEdit?: () => void
  onDelete?: () => void
  loading?: boolean
}) {
  const isIn = entry.type === "cash-in"
  return (
    <article className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isIn ? <ArrowDownLeft size={17} className="text-emerald-500" /> : <ArrowUpRight size={17} className="text-amber-500" />}
            <p className="font-semibold text-[var(--text-primary)]">{entry.label}</p>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {getCashbookTypeLabel(entry.type)} - {getCashbookAccountLabel(entry.account)} - {en.accounting.cashbookSources[entry.source]}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{entry.reference || en.common.notAvailable}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className={`text-lg font-bold ${isIn ? "text-emerald-600 dark:text-emerald-600" : "text-amber-600 dark:text-amber-600"}`}>{isIn ? "+" : "-"}{formatAccountingMoney(entry.amount)}</p>
          {onEdit && onDelete ? (
              <div className="flex gap-2">
                <Button type="button" variant="outline" title={en.common.edit} onClick={onEdit} className="min-h-9 px-3 py-1 text-xs" />
               <Button type="button" variant="danger" title={en.common.delete} onClick={onDelete} loading={loading} className="min-h-9 px-3 py-1 text-xs" />
              </div>
            ) : null}
        </div>
      </div>
    </article>
  )
}
