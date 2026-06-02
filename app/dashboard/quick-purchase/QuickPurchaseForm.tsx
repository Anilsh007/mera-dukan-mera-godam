"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import useProducts from "@/app/hooks/useProducts"
import { useInventoryLocations } from "@/app/hooks/useAdvancedInventory"
import Button from "@/app/components/ui/Button"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import { MdOutlineAddchart, MdAdd, MdDeleteOutline } from "react-icons/md"
import Input from "@/app/components/ui/Input"
import { findProductByScannedCode } from "@/app/lib/barcode/barcode.utils"
import { notify as toast } from "@/app/lib/notifications"
import Suggestions from "@/app/components/inventory/ProductDatalists"
import { normalizeQuantityUnit, QUANTITY_UNITS } from "@/app/lib/quantityUnit"
import { auth } from "@/app/lib/firebase"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { saveQuickPurchase } from "@/app/dashboard/purchases/purchase.service"
import { formatCurrency, formatIndianDateTime } from "@/app/lib/formatters"
import { en } from "@/app/messages/en"
import useProfile from "@/app/dashboard/profile/useProfile"
import {
  buildBusinessDocumentProfile,
  getProfileDocumentWarnings,
  type TransactionDocumentData,
  type TransactionOptionFlags,
} from "@/app/lib/transactionDocument"
import {
  createTransactionOptions,
  runTransactionDocumentActions,
  ensureValidTransactionOptions,
} from "@/app/lib/transactionActions"

import { QuickPurchaseRow, createEmptyRow, formatCurrentDateTime, getCurrentDateTime } from "@/app/dashboard/quick-purchase/supportFunction"

const BarcodeScannerButton = dynamic(() => import("@/app/components/scanner/BarcodeScannerButton"), { ssr: false })

function RequiredMark() {
    return <span className="text-red-500" >* </span>
}

export default function AddProductForm() {
  const router = useRouter()
  const { products } = useProducts()
  const { locations } = useInventoryLocations()
  const { profile } = useProfile()
  const [rows, setRows] = useState<QuickPurchaseRow[]>([createEmptyRow()])
  const [loading, setLoading] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState(getCurrentDateTime)
  const [transactionOptions, setTransactionOptions] = useState<TransactionOptionFlags>(createTransactionOptions())

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentDateTime(getCurrentDateTime()), 30_000)
    return () => window.clearInterval(interval)
  }, [])

  const addRow = () => setRows((current) => [...current, createEmptyRow()])
  const removeRow = (id: string) => {
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== id)))
  }

  const handleChange = (id: string, key: keyof QuickPurchaseRow, value: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)))
  }
  const handleScannedCode = (code: string) => {
    const product = findProductByScannedCode(products, code)
    setRows((current) => {
      const targetIndex = current.findIndex((row) => !row.name.trim() && !(row.sku || "").trim())
      const next = [...current]
      const index = targetIndex >= 0 ? targetIndex : next.length
      const baseRow = next[index] || createEmptyRow()

      next[index] = product
        ? {
          ...baseRow,
          name: product.name,
          price: String(product.price || ""),
          quantity: baseRow.quantity || "1",
          quantityUnit: normalizeQuantityUnit(product.quantityUnit),
          supplierName: baseRow.supplierName || product.supplier || "",
          category: product.category || "",
          sku: product.sku || code,
          hsnCode: product.hsnCode || "",
          locationId: baseRow.locationId || "",
          locationName: baseRow.locationName || "",
        }
        : {
          ...baseRow,
          sku: code,
        }

      return next
    })

    if (product) {
      toast.success(en.scanner.productPreparedForStock.replace("{name}", product.name))
    } else {
      toast.warning(en.scanner.codeCapturedFillDetails.replace("{code}", code))
    }
  }


  const grandTotal = rows.reduce((sum, row) => sum + Number(row.price || 0) * Number(row.quantity || 0), 0)
  const sellerProfile = buildBusinessDocumentProfile(profile)
  const profileWarnings = getProfileDocumentWarnings(sellerProfile)
  const isFormValid = rows.every((row) => {
    const quantity = Number(row.quantity)
    const price = Number(row.price)
    return (
      row.name.trim() &&
      row.quantityUnit.trim() &&
      Number.isFinite(quantity) &&
      quantity > 0 &&
      Number.isFinite(price) &&
      price >= 0 &&
      row.supplierName?.trim()
    )
  })

  const resetForm = () => {
    setRows([createEmptyRow()])
    setCurrentDateTime(getCurrentDateTime())
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!isFormValid) {
      toast.error(en.quickPurchase.validation.allRequired)
      return
    }

    if (!ensureValidTransactionOptions(transactionOptions)) return

    try {
      setLoading(true)
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      const submittedAt = getCurrentDateTime()
      const receiptDocument = buildQuickPurchaseDocument({ rows, seller: sellerProfile, total: grandTotal, date: submittedAt })
      const savedIds = await saveQuickPurchase({
        userId,
        purchaseDate: submittedAt.toISOString().slice(0, 10),
        purchaseDateTime: submittedAt.toISOString(),
        items: rows.map((row) => ({
          name: row.name.trim(),
          price: Number(row.price),
          quantity: Number(row.quantity),
          quantityUnit: row.quantityUnit,
          category: row.category,
          sku: row.sku,
          hsnCode: row.hsnCode,
          batchNo: row.batchNo,
          locationId: row.locationId,
          locationName: row.locationName,
          note: row.note,
          supplierName: row.supplierName,
        })),
      })

      await runTransactionDocumentActions(receiptDocument, transactionOptions)

      toast.success(en.quickPurchase.savedPending, {
        action: savedIds[0]
          ? {
            label: en.quickPurchase.addDetails,
            onClick: () => router.push(`/dashboard/purchases?complete=${savedIds[0]}`),
          }
          : undefined,
      })
      resetForm()
    } catch (error) {
      console.error("Quick purchase save failed", error)
      toast.error(error instanceof Error ? error.message : en.quickPurchase.saveFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="min-w-0 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-3 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-4">
      <Suggestions products={products} type="product" />
      <Suggestions products={products} type="category" />
      <Suggestions products={products} type="supplier" />

      <div className="mb-4 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
        <p className="font-bold text-[var(--text-primary)]">{en.quickPurchase.formGuideTitle}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{en.quickPurchase.formGuideDescription}</p>
      </div>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BarcodeScannerButton
          onDetected={handleScannedCode}
          buttonTitle={en.scanner.scanForPurchase}
          disabled={loading}
          className="w-full sm:w-auto"
        />
        <div className="rounded-xl border-b px-3 py-2 border-[var(--border-card)]">
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">{en.quickPurchase.entryTime}</p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">{formatCurrentDateTime(currentDateTime)}</p>
        </div>
      </div>

      <p className="flex justify-end text-xs font-medium text-rose-400"><RequiredMark /> {en.quickPurchase.requiredFieldsOnly}</p>

      <div className="space-y-5">
        {rows.map((row, index) => (
          <div key={row.id} className="space-y-3 rounded-xl border border-[var(--border-card)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-input)] bg-[var(--bg-primary)] text-xs font-bold text-[var(--text-muted)]">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  {row.name || en.quickPurchase.quickItem}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {Number(row.price) > 0 && Number(row.quantity) > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-[var(--text-muted)]">{en.quickPurchase.subtotal}</p>
                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(Number(row.price) * Number(row.quantity))}</p>
                  </div>
                )}
                {rows.length > 1 && <Button type="button" onClick={() => removeRow(row.id)} icon={<MdDeleteOutline />} variant="delete" />}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4  lg:grid-cols-4">
              <Input label={<>{en.quickPurchase.productName} <RequiredMark /></>} placeholder={en.quickPurchase.productNamePlaceholder} value={row.name} onChange={(event) => handleChange(row.id, "name", event.target.value)} datalist="productNames" containerClassName="lg:col-span-2" />

              <Input label={en.scanner.barcodeSku} placeholder={en.scanner.manualCodePlaceholder} value={row.sku || ""} onChange={(event) => handleChange(row.id, "sku", event.target.value)} />

              <Input label={en.advancedInventory.batchNo} placeholder={en.advancedInventory.batchFieldHelp} value={row.batchNo || ""} onChange={(event) => handleChange(row.id, "batchNo", event.target.value)} />

              <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
                <span>{en.advancedInventory.location}</span>
                 <select value={row.locationId || ""} onChange={(event) => { const selected = locations.find((location) => location.id === event.target.value); handleChange(row.id, "locationId", event.target.value); handleChange(row.id, "locationName", selected?.name || "") }} className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
                  <option value="" disabled>{en.common.select}</option>
                  {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                </select>
              </label>

              <Input label={en.inventory.category} placeholder={en.inventory.category} value={row.category || ""} onChange={(event) => handleChange(row.id, "category", event.target.value)} datalist="categories" />

              <Input type="number" label={<>{en.quickPurchase.purchasePricePerUnit} <RequiredMark /></>} placeholder={en.quickPurchase.ratePlaceholder} value={row.price} onChange={(event) => handleChange(row.id, "price", event.target.value)} />

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">{en.quickPurchase.purchasedQty} <RequiredMark /></label>
                <div className="flex overflow-hidden rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] focus-within:ring-2 focus-within:ring-emerald-400">
                  <input type="number" placeholder={en.quickPurchase.quantityPlaceholder} value={row.quantity}
                    onChange={(event) => handleChange(row.id, "quantity", event.target.value)} className="min-w-0 flex-1 bg-transparent p-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none" />
                  <select
                    aria-label={en.quickPurchase.quantityUnit}
                    value={row.quantityUnit || ""}
                    onChange={(event) => handleChange(row.id, "quantityUnit", event.target.value)}
                    className="w-28 shrink-0 border-l border-[var(--border-input)] bg-transparent p-2 text-sm font-semibold text-[var(--text-primary)] outline-none"
                  >
                    <option value="" disabled>{en.common.select}</option>
                    {QUANTITY_UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Input label={<>{en.quickPurchase.supplierName} <RequiredMark /></>} placeholder={en.quickPurchase.supplierPlaceholder} value={row.supplierName} onChange={(event) => handleChange(row.id, "supplierName", event.target.value)} datalist="suppliers" containerClassName="lg:col-span-2" />

              <Input label={en.quickPurchase.note} placeholder={en.quickPurchase.notePlaceholder}
                value={row.note} onChange={(event) => handleChange(row.id, "note", event.target.value)} containerClassName="lg:col-span-2" />
              
            </div>
          </div>
        ))}
      </div>

      <TransactionActionPanel
        value={transactionOptions}
        onChange={setTransactionOptions}
        profileWarnings={profileWarnings}
        disabled={loading}
        className="mt-5"
      />

      <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border-card)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" onClick={addRow} title={en.quickPurchase.addProduct} variant="dotBorder" icon={<MdAdd />} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] px-4 py-3 text-left sm:text-right">
            <p className="text-xs font-medium uppercase text-[var(--text-muted)]">{en.quickPurchase.grandTotal}</p>
            <p className="text-lg font-black text-emerald-600">{formatCurrency(grandTotal)}</p>
            <p className="text-xs text-amber-600">{en.quickPurchase.detailPending}</p>
          </div>
          <Button type="submit" title={loading ? en.quickPurchase.savingQuickPurchase : `${en.quickPurchase.saveQuickPurchase} (${rows.length})`} variant="primary" disabled={loading || !isFormValid} loading={loading} icon={<MdOutlineAddchart />} />
        </div>
      </div>
    </form>
  )
}


function buildQuickPurchaseDocument({
  rows,
  seller,
  total,
  date,
}: {
  rows: QuickPurchaseRow[]
  seller: ReturnType<typeof buildBusinessDocumentProfile>
  total: number
  date: Date
}): TransactionDocumentData {
  return {
    type: "purchase",
    title: en.transaction.quickPurchaseReceipt,
    reference: `QP-${date.getTime()}`,
    date: formatIndianDateTime(date),
    seller,
    partyLabel: en.transaction.purchasePartyLabel,
    party: { name: rows.map((row) => row.supplierName).filter(Boolean)[0] || "" },
    items: rows.map((row) => ({
      name: row.name,
      quantity: Number(row.quantity),
      unit: row.quantityUnit,
      rate: Number(row.price),
      total: Number(row.quantity || 0) * Number(row.price || 0),
      note: [row.sku ? `${en.scanner.barcodeSku}: ${row.sku}` : "", row.batchNo ? `${en.advancedInventory.batchNo}: ${row.batchNo}` : "", row.note].filter(Boolean).join(" | ") || undefined,
    })),
    totals: { grandTotal: total, dueAmount: total },
  }
}
