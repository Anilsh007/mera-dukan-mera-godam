"use client"

import { useMemo, useState } from "react"
import { BarChart3, PackagePlus, ReceiptText, Truck } from "lucide-react"
import { auth } from "@/app/lib/firebase"
import { notify as toast } from "@/app/lib/notifications"
import Suggestions from "@/app/components/inventory/ProductDatalists"
import useProducts from "@/app/hooks/useProducts"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import type { PurchasePaymentStatus, PurchaseRecord } from "@/app/lib/db"
import { completeQuickPurchaseDetails, loadPurchases, savePurchase } from "./purchase.service"
import { DEFAULT_PAYMENT_MODE } from "./purchase.constants"
import { calculatePaymentAmounts } from "./purchase.utils"
import PurchaseFields from "./PurchaseFields"
import CompletePurchaseDetailsModal from "./CompletePurchaseDetailsModal"
import {
  createPurchaseRow,
  focusPurchaseField,
  makePurchaseBillNo,
  todayDateInput,
  validatePurchaseForm,
} from "./purchase.form"
import type { PurchaseRow } from "./purchase.types"
import { en } from "@/app/messages/en"
import { DASHBOARD_ROUTES } from "@/app/lib/navigation/dashboardRoutes"
import useProfile from "@/app/dashboard/profile/useProfile"
import useParties from "@/app/hooks/useParties"
import {
  buildBusinessDocumentProfile,
  getProfileDocumentWarnings,
  type TransactionDocumentData,
  type TransactionOptionFlags,
} from "@/app/lib/transactionDocument"
import Button from "@/app/components/ui/Button"
import PageActionLinks from "@/app/components/ui/PageActionLinks"
import PageHeader from "@/app/components/ui/PageHeader"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import usePurchases from "@/app/hooks/usePurchases"
import {
  createTransactionOptions,
  runTransactionDocumentActions,
  ensureValidTransactionOptions,
} from "@/app/lib/transactionActions"

export default function PurchasesPage() {
  const { products } = useProducts()
  const { profile } = useProfile()
  const { parties: supplierParties } = useParties("supplier")
  const { purchases } = usePurchases()
  const [rows, setRows] = useState<PurchaseRow[]>([createPurchaseRow()])
  const [billNo, setBillNo] = useState("")
  const [supplierName, setSupplierName] = useState("")
  const [purchaseDate, setPurchaseDate] = useState(todayDateInput())
  const [paymentStatus, setPaymentStatus] = useState<PurchasePaymentStatus | "">("")
  const [paymentMode, setPaymentMode] = useState<string>(DEFAULT_PAYMENT_MODE)
  const [amountPaid, setAmountPaid] = useState("")
  const [purchaseNote, setPurchaseNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [selectedPendingPurchase, setSelectedPendingPurchase] = useState<PurchaseRecord | null>(null)
  const [pendingCompleteId, setPendingCompleteId] = useState(() =>
    typeof window === "undefined" ? "" : (new URLSearchParams(window.location.search).get("complete") || ""),
  )
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [transactionOptions, setTransactionOptions] = useState<TransactionOptionFlags>(createTransactionOptions())

  const totalAmount = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.price || 0) * Number(row.quantity || 0), 0),
    [rows]
  )
  const { paidAmount, dueAmount } = calculatePaymentAmounts(totalAmount, paymentStatus, amountPaid)
  const sellerProfile = buildBusinessDocumentProfile(profile)
  const profileWarnings = getProfileDocumentWarnings(sellerProfile)
  const activePendingPurchase = useMemo(() => {
    if (selectedPendingPurchase) return selectedPendingPurchase
    if (!pendingCompleteId) return null
    return purchases.find((purchase) => purchase.id === pendingCompleteId && purchase.entryMode === "quick" && purchase.detailsStatus !== "completed") || null
  }, [pendingCompleteId, purchases, selectedPendingPurchase])

  const handlePaymentStatusChange = (value: PurchasePaymentStatus | "") => {
    clearValidation()
    setPaymentStatus(value)
    if (value === "paid") setAmountPaid(String(totalAmount || ""))
    else if (value === "unpaid") setAmountPaid("0")
  }

  const clearValidation = () => {
    if (validationErrors.length) setValidationErrors([])
  }

  const updateRow = (id: string, key: keyof PurchaseRow, value: string) => {
    clearValidation()
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)))
  }

  const addRow = () => {
    clearValidation()
    setRows((current) => [...current, createPurchaseRow()])
  }

  const removeRow = (id: string) => {
    clearValidation()
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== id)))
  }

  const resetForm = () => {
    setRows([createPurchaseRow()])
    setBillNo("")
    setSupplierName("")
    setPurchaseDate(todayDateInput())
      setPaymentStatus("")
    setPaymentMode(DEFAULT_PAYMENT_MODE)
    setAmountPaid("")
    setPurchaseNote("")
    setValidationErrors([])
  }

  const pendingPurchases = purchases.filter((purchase) => purchase.entryMode === "quick" && purchase.detailsStatus !== "completed")

  const handleCompleteDetails = async (values: {
    billNo: string
    supplierName: string
    purchaseDate: string
    paymentStatus: PurchasePaymentStatus
    paymentMode: string
    amountPaid: number
    note: string
  }) => {
    if (!activePendingPurchase) return
    if (!ensureValidTransactionOptions(transactionOptions)) return
    try {
      setDetailsLoading(true)
      const receiptDocument = buildPurchaseDocumentFromRecord(activePendingPurchase, {
        seller: sellerProfile,
        billNo: values.billNo,
        supplierName: values.supplierName,
        purchaseDate: values.purchaseDate,
        paymentStatus: values.paymentStatus,
        paymentMode: values.paymentMode,
        amountPaid: values.amountPaid,
        note: values.note,
      })
      await completeQuickPurchaseDetails({
        userId: requireUserIdentityFromAuthUser(auth?.currentUser),
        purchaseId: activePendingPurchase.id,
        ...values,
      })
      await runTransactionDocumentActions(receiptDocument, transactionOptions)
      toast.success(en.purchases.quickDetailsCompleted)
      setSelectedPendingPurchase(null)
      setPendingCompleteId("")
      if (typeof window !== "undefined") window.history.replaceState(null, "", "/dashboard/purchases")
    } catch (error) {
      console.error("Purchase details save failed", error)
      toast.error(error instanceof Error ? error.message : en.purchases.detailsSaveFailed)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const { errors, focusId } = validatePurchaseForm({
      supplierName,
      purchaseDate,
      rows,
          paymentStatus,
      amountPaid,
      totalAmount,
    })

    if (errors.length) {
      setValidationErrors(errors)
      toast.error(errors[0])
      focusPurchaseField(focusId)
      return
    }
    if (!paymentStatus) return

    if (!ensureValidTransactionOptions(transactionOptions)) return

    try {
      setLoading(true)
      const effectiveBillNo = billNo.trim() || makePurchaseBillNo()
      const receiptDocument = buildDetailedPurchaseDocument({
        rows,
        seller: sellerProfile,
        billNo: effectiveBillNo,
        supplierName,
        purchaseDate,
        paymentStatus,
        paymentMode,
        paidAmount,
        dueAmount,
        totalAmount,
        note: purchaseNote,
      })
      await savePurchase({
        userId: requireUserIdentityFromAuthUser(auth?.currentUser),
        billNo: effectiveBillNo,
        supplierName,
        purchaseDate,
        paymentStatus,
        paymentMode,
        amountPaid: paidAmount,
        note: purchaseNote,
        items: rows.map((row) => ({
          name: row.name,
          category: row.category,
          sku: row.sku,
          hsnCode: row.hsnCode,
          price: Number(row.price),
          quantity: Number(row.quantity),
          quantityUnit: row.quantityUnit,
          expiry: row.expiry,
          batchNo: row.batchNo,
          locationId: row.locationId,
          locationName: row.locationName,
          note: row.note,
        })),
      })

      await runTransactionDocumentActions(receiptDocument, transactionOptions)
      toast.success(en.purchases.savedAndUpdated)
      resetForm()
    } catch (error) {
      console.error("Purchase save failed", error)
      toast.error(error instanceof Error ? error.message : en.purchases.saveFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={en.pages.purchasesTitle} description={en.pages.purchasesDescription} />

      <PageActionLinks
        title={en.purchases.nextActionsTitle}
        description={en.purchases.nextActionsDescription}
        actions={[
          { href: DASHBOARD_ROUTES.quickPurchase, label: en.navigation.quickPurchase, description: en.quickPurchase.formGuideDescription, icon: <PackagePlus size={18} /> },
          { href: DASHBOARD_ROUTES.recentPurchases, label: en.purchases.goToRecentPurchases, description: en.purchases.goToRecentPurchasesHelp, icon: <ReceiptText size={18} /> },
          { href: DASHBOARD_ROUTES.suppliers, label: en.purchases.goToSuppliers, description: en.purchases.goToSuppliersHelp, icon: <Truck size={18} /> },
          { href: DASHBOARD_ROUTES.reports, label: en.purchases.goToReports, description: en.purchases.goToReportsHelp, icon: <BarChart3 size={18} /> },
        ]}
      />

      {pendingPurchases.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold">{en.purchases.pendingQuickPurchasesTitle.replace("{count}", String(pendingPurchases.length))}</p>
              <p className="text-sm">{en.purchases.pendingQuickPurchasesHelp}</p>
            </div>
            <Button type="button" onClick={() => setSelectedPendingPurchase(pendingPurchases[0])} variant="warning" className="w-full sm:ml-auto sm:w-auto" title={en.purchases.reviewNow}/>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="premium-surface min-w-0 rounded-2xl p-4 sm:p-5" >
        <div className="mb-4 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
          <p className="font-bold text-[var(--text-primary)]">{en.quickPurchase.formGuideTitle}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{en.quickPurchase.formGuideDescription}</p>
        </div>

        <Suggestions products={products} type="product" />
        <Suggestions products={products} type="category" />
        <Suggestions products={products} type="supplier" />
        <datalist id="supplier-party-options">
          {supplierParties.map((party) => (
            <option key={party.id} value={party.name} />
          ))}
        </datalist>
        <PurchaseFields
          rows={rows}
          billNo={billNo}
          supplierName={supplierName}
          purchaseDate={purchaseDate}
          supplierDatalistId="supplier-party-options"
          paymentStatus={paymentStatus}
          paymentMode={paymentMode}
          amountPaid={amountPaid}
          purchaseNote={purchaseNote}
          totalAmount={totalAmount}
          paidAmount={paidAmount}
          dueAmount={dueAmount}
          loading={loading}
          validationErrors={validationErrors}
          onBillNoChange={(value) => {
            clearValidation()
            setBillNo(value)
          }}
          onSupplierChange={(value) => {
            clearValidation()
            setSupplierName(value)
          }}
          onPurchaseDateChange={(value) => {
            clearValidation()
            setPurchaseDate(value)
          }}
          onPaymentStatusChange={handlePaymentStatusChange}
          onPaymentModeChange={(value) => {
            clearValidation()
            setPaymentMode(value)
          }}
          onAmountPaidChange={(value) => {
            clearValidation()
            setAmountPaid(value)
          }}
          onPurchaseNoteChange={(value) => {
            clearValidation()
            setPurchaseNote(value)
          }}
          onUpdateRow={updateRow}
          onAddRow={addRow}
          onRemoveRow={removeRow}
        />

        <TransactionActionPanel
          value={transactionOptions}
          onChange={setTransactionOptions}
          profileWarnings={profileWarnings}
          disabled={loading || detailsLoading}
          className="mt-5"
        />
      </form>

        <CompletePurchaseDetailsModal
          purchase={activePendingPurchase}
          loading={detailsLoading}
          onClose={() => {
            setSelectedPendingPurchase(null)
            setPendingCompleteId("")
          }}
          onSave={handleCompleteDetails}
        />
    </div>
  )
}


function buildDetailedPurchaseDocument({
  rows,
  seller,
  billNo,
  supplierName,
  purchaseDate,
  paymentStatus,
  paymentMode,
  paidAmount,
  dueAmount,
  totalAmount,
  note,
}: {
  rows: PurchaseRow[]
  seller: ReturnType<typeof buildBusinessDocumentProfile>
  billNo: string
  supplierName: string
  purchaseDate: string
  paymentStatus: PurchasePaymentStatus
  paymentMode: string
  paidAmount: number
  dueAmount: number
  totalAmount: number
  note: string
}): TransactionDocumentData {
  return {
    type: "purchase",
    title: en.transaction.detailedPurchaseReceipt,
    reference: billNo,
    date: purchaseDate,
    seller,
    partyLabel: en.transaction.purchasePartyLabel,
    party: { name: supplierName },
    paymentMode: `${paymentStatus}${paymentMode ? ` / ${paymentMode}` : ""}`,
    items: rows.map((row) => ({
      name: row.name,
      description: [
        row.category,
        row.sku ? `${en.purchases.sku}: ${row.sku}` : "",
        row.hsnCode ? `${en.purchases.hsnCode}: ${row.hsnCode}` : "",
        row.batchNo ? `${en.advancedInventory.batchNo}: ${row.batchNo}` : "",
        row.locationName ? `${en.advancedInventory.location}: ${row.locationName}` : "",
      ].filter(Boolean).join(" | "),
      hsnCode: row.hsnCode,
      quantity: Number(row.quantity),
      unit: row.quantityUnit,
      rate: Number(row.price),
      total: Number(row.quantity || 0) * Number(row.price || 0),
      note: row.note,
    })),
    totals: { grandTotal: totalAmount, paidAmount, dueAmount },
    notes: note,
  }
}

function buildPurchaseDocumentFromRecord(
  purchase: PurchaseRecord,
  values: {
    seller: ReturnType<typeof buildBusinessDocumentProfile>
    billNo: string
    supplierName: string
    purchaseDate: string
    paymentStatus: PurchasePaymentStatus
    paymentMode: string
    amountPaid: number
    note: string
  }
): TransactionDocumentData {
  const paidAmount = values.paymentStatus === "paid" ? purchase.totalAmount : values.paymentStatus === "unpaid" ? 0 : values.amountPaid
  const dueAmount = Math.max(purchase.totalAmount - paidAmount, 0)
  return {
    type: "purchase",
    title: en.transaction.quickPurchaseReceipt,
    reference: values.billNo,
    date: values.purchaseDate,
    seller: values.seller,
    partyLabel: en.transaction.purchasePartyLabel,
    party: { name: values.supplierName },
    paymentMode: `${values.paymentStatus}${values.paymentMode ? ` / ${values.paymentMode}` : ""}`,
    items: purchase.items.map((item) => ({
      name: item.name,
      description: [item.category, item.sku ? `${en.purchases.sku}: ${item.sku}` : "", item.hsnCode ? `${en.purchases.hsnCode}: ${item.hsnCode}` : ""].filter(Boolean).join(" | "),
      hsnCode: item.hsnCode,
      quantity: item.quantity,
      unit: item.quantityUnit,
      rate: item.price,
      total: item.lineTotal,
      note: item.note,
    })),
    totals: { grandTotal: purchase.totalAmount, paidAmount, dueAmount },
    notes: values.note,
  }
}
