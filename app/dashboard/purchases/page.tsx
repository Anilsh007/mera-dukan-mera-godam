"use client"

import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { notify as toast } from "@/app/lib/notifications"
import Suggestions from "@/app/components/inventory/ProductDatalists"
import useProducts from "@/app/hooks/useProducts"
import { auth } from "@/app/lib/firebase"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import type { PurchasePaymentStatus, PurchaseRecord } from "@/app/lib/db"
import { completeQuickPurchaseDetails, loadPurchases, savePurchase } from "./purchase.service"
import { DEFAULT_PAYMENT_MODE } from "./purchase.constants"
import { calculatePaymentAmounts } from "./purchase.utils"
import PurchaseFields from "./PurchaseFields"
import PurchaseHistory from "./PurchaseHistory"
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
import useProfile from "@/app/dashboard/profile/useProfile"
import {
  buildBusinessDocumentProfile,
  getProfileDocumentWarnings,
  printTransactionDocument,
  type TransactionDocumentData,
  type TransactionOptionFlags,
} from "@/app/lib/transactionDocument"
import Button from "@/app/components/ui/Button"
import TransactionOptions from "@/app/components/ui/TransactionOptions"
import { shareTransactionDocument } from "@/app/lib/share"

export default function PurchasesPage() {
  const { products } = useProducts()
  const { profile } = useProfile()
  const [rows, setRows] = useState<PurchaseRow[]>([createPurchaseRow()])
  const [billNo, setBillNo] = useState("")
  const [supplierName, setSupplierName] = useState("")
  const [purchaseDate, setPurchaseDate] = useState(todayDateInput())
  const [paymentStatus, setPaymentStatus] = useState<PurchasePaymentStatus>("paid")
  const [paymentMode, setPaymentMode] = useState(DEFAULT_PAYMENT_MODE)
  const [amountPaid, setAmountPaid] = useState("")
  const [purchaseNote, setPurchaseNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [selectedPendingPurchase, setSelectedPendingPurchase] = useState<PurchaseRecord | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [transactionOptions, setTransactionOptions] = useState<TransactionOptionFlags>({
    saveOnly: true,
    generateGstInvoice: false,
    printReceipt: false,
    downloadShare: false,
  })

  const totalAmount = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.price || 0) * Number(row.quantity || 0), 0),
    [rows]
  )
  const { paidAmount, dueAmount } = calculatePaymentAmounts(totalAmount, paymentStatus, amountPaid)
  const sellerProfile = buildBusinessDocumentProfile(profile)
  const profileWarnings = getProfileDocumentWarnings(sellerProfile)

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setPurchases([])
        return
      }
      loadPurchases(requireUserIdentityFromAuthUser(user))
        .then(setPurchases)
        .catch(() => toast.error(en.purchases.loadFailed))
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !purchases.length || selectedPendingPurchase) return
    const id = new URLSearchParams(window.location.search).get("complete")
    if (!id) return
    const pending = purchases.find((purchase) => purchase.id === id && purchase.entryMode === "quick" && purchase.detailsStatus !== "completed")
    if (pending) setSelectedPendingPurchase(pending)
  }, [purchases, selectedPendingPurchase])

  useEffect(() => {
    if (paymentStatus === "paid") setAmountPaid(String(totalAmount || ""))
    if (paymentStatus === "unpaid") setAmountPaid("0")
  }, [paymentStatus, totalAmount])

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
    setPaymentStatus("paid")
    setPaymentMode(DEFAULT_PAYMENT_MODE)
    setAmountPaid("")
    setPurchaseNote("")
    setValidationErrors([])
  }

  const refreshPurchases = async () => {
    const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
    try {
      setPurchases(await loadPurchases(userId))
      return true
    } catch (error) {
      console.error("Purchase list refresh failed", error)
      toast.warning(en.purchases.loadFailed)
      return false
    }
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
    if (!selectedPendingPurchase) return
    try {
      setDetailsLoading(true)
      const receiptDocument = buildPurchaseDocumentFromRecord(selectedPendingPurchase, {
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
        purchaseId: selectedPendingPurchase.id,
        ...values,
      })
      if (transactionOptions.printReceipt) {
        const printed = printTransactionDocument(receiptDocument)
        if (printed) toast.success(en.common.printStarted)
        else toast.error(en.common.popupBlocked)
      }
      if (transactionOptions.downloadShare) {
        await shareTransactionDocument(receiptDocument)
      }
      toast.success(en.purchases.quickDetailsCompleted)
      setSelectedPendingPurchase(null)
      if (typeof window !== "undefined") window.history.replaceState(null, "", "/dashboard/purchases")
      await refreshPurchases()
    } catch (error) {
      console.error("Purchase details save failed", error)
      toast.error(en.purchases.detailsSaveFailed)
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
          note: row.note,
        })),
      })

      if (transactionOptions.printReceipt) {
        const printed = printTransactionDocument(receiptDocument)
        if (printed) toast.success(en.common.printStarted)
        else toast.error(en.common.popupBlocked)
      }
      if (transactionOptions.downloadShare) {
        await shareTransactionDocument(receiptDocument)
      }
      toast.success(en.purchases.savedAndUpdated)
      resetForm()
      await refreshPurchases()
    } catch (error) {
      console.error("Purchase save failed", error)
      toast.error(en.purchases.saveFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{en.pages.purchasesTitle}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {en.pages.purchasesDescription}
        </p>
      </div>

      {pendingPurchases.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold">{pendingPurchases.length} {en.dashboard.qcnw} {pendingPurchases.length > 1 ? "s" : ""} {en.dashboard.ndqp}</p>
              <p className="text-sm text-amber-700 dark:text-amber-200">{en.dashboard.QPwarningPara}</p>
            </div>
            <Button type="button" onClick={() => setSelectedPendingPurchase(pendingPurchases[0])} variant="warning" className="w-full sm:ml-auto sm:w-auto" title={en.purchases.reviewNow}/>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="premium-surface min-w-0 rounded-2xl p-4 sm:p-5" >
        <Suggestions products={products} type="product" />
        <Suggestions products={products} type="category" />
        <Suggestions products={products} type="supplier" />
        <PurchaseFields
          rows={rows}
          billNo={billNo}
          supplierName={supplierName}
          purchaseDate={purchaseDate}
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
          onPaymentStatusChange={(value) => {
            clearValidation()
            setPaymentStatus(value)
          }}
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

        <TransactionOptions
          value={transactionOptions}
          onChange={setTransactionOptions}
          allowPrint
          allowDownloadShare
          disabled={loading || detailsLoading}
          className="mt-5"
        />

        {profileWarnings.length > 0 && (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
            <p className="font-bold">{en.transaction.profileWarningTitle}</p>
            <p>{en.transaction.profileGuide}</p>
            <ul className="mt-2 list-inside list-disc">
              {profileWarnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          </div>
        )}
      </form>

      <PurchaseHistory purchases={purchases} onCompleteDetails={setSelectedPendingPurchase} />

      <CompletePurchaseDetailsModal
        purchase={selectedPendingPurchase}
        loading={detailsLoading}
        onClose={() => setSelectedPendingPurchase(null)}
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
      description: [row.category, row.sku ? `${en.purchases.sku}: ${row.sku}` : "", row.hsnCode ? `${en.purchases.hsnCode}: ${row.hsnCode}` : ""].filter(Boolean).join(" | "),
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
