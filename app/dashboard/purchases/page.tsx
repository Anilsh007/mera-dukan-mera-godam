"use client"

import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { toast } from "sonner"
import Suggestions from "@/app/components/inventory/ProductDatalists"
import useProducts from "@/app/hooks/useProducts"
import { auth } from "@/app/lib/firebase"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import type { PurchasePaymentStatus, PurchaseRecord } from "@/app/lib/db"
import { loadPurchases, savePurchase } from "./purchase.service"
import { DEFAULT_PAYMENT_MODE } from "./purchase.constants"
import { calculatePaymentAmounts } from "./purchase.utils"
import PurchaseFields from "./PurchaseFields"
import PurchaseHistory from "./PurchaseHistory"
import {
  createPurchaseRow,
  focusPurchaseField,
  makePurchaseBillNo,
  todayDateInput,
  validatePurchaseForm,
} from "./purchase.form"
import type { PurchaseRow } from "./purchase.types"
import { en } from "@/app/messages/en"

export default function PurchasesPage() {
  const { products } = useProducts()
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

  const totalAmount = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.price || 0) * Number(row.quantity || 0), 0),
    [rows]
  )
  const { paidAmount, dueAmount } = calculatePaymentAmounts(totalAmount, paymentStatus, amountPaid)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setPurchases([])
        return
      }
      loadPurchases(requireUserIdentityFromAuthUser(user)).then(setPurchases).catch(console.error)
    })
    return () => unsubscribe()
  }, [])

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
    const userId = requireUserIdentityFromAuthUser(auth.currentUser)
    setPurchases(await loadPurchases(userId))
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
      await savePurchase({
        userId: requireUserIdentityFromAuthUser(auth.currentUser),
        billNo: billNo.trim() || makePurchaseBillNo(),
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

      toast.success(en.purchases.savedAndUpdated)
      resetForm()
      await refreshPurchases()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : en.purchases.saveFailed)
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

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5"
      >
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
      </form>

      <PurchaseHistory purchases={purchases} />
    </div>
  )
}
