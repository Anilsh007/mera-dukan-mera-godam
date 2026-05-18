"use client"

import { useMemo, useState } from "react"
import { Product } from "@/app/lib/db"
import { addProduct } from "@/app/dashboard/quick-purchase/product.service"
import { auth } from "@/app/lib/firebase"
import { getUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { notify as toast } from "@/app/lib/notifications"
import Input from "@/app/components/ui/Input"
import Button from "@/app/components/ui/Button"
import Modal from "@/app/components/ui/Modal"
import StatusBadge from "@/app/components/ui/StatusBadge"
import TransactionOptions from "@/app/components/ui/TransactionOptions"
import useProducts from "@/app/hooks/useProducts"
import { formatQuantity, normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import useProfile from "@/app/dashboard/profile/useProfile"
import {
  buildBusinessDocumentProfile,
  getProfileDocumentWarnings,
  type TransactionDocumentData,
  type TransactionOptionFlags,
} from "@/app/lib/transactionDocument"
import { en } from "@/app/messages/en"
import {
  createTransactionOptions,
  runTransactionDocumentActions,
  validateTransactionOptions,
} from "@/app/lib/transactionActions"

type StockInForm = {
  name: string
  price: string
  quantity: string
  quantityUnit: string
  category: string
  supplier: string
  expiry: string
  sku: string
  note: string
}

const initForm = (product: Product): StockInForm => ({
  name: product.name,
  price: String(product.price),
  quantity: "",
  quantityUnit: normalizeQuantityUnit(product.quantityUnit),
  category: product.category || "",
  supplier: product.supplier || "",
  expiry: product.expiry || "",
  sku: product.sku || "",
  note: "",
})

const fields = [
  { key: "quantity", label: en.inventory.quantity, required: true, type: "quantity", placeholder: en.inventory.quantityPlaceholder, width: "basis-full sm:basis-[calc(33.333%-8px)]", optional: false },
  { key: "price", label: en.inventory.rate, required: true, type: "number", placeholder: en.inventory.ratePlaceholder, width: "basis-full sm:basis-[calc(33.333%-8px)]", optional: false },
  { key: "expiry", label: en.inventory.expiry, required: true, type: "date", placeholder: "", width: "basis-full sm:basis-[calc(33.333%-8px)]", optional: false },
  { key: "supplier", label: en.inventory.supplier, required: false, type: "text", placeholder: en.inventory.supplierPlaceholder, width: "basis-full sm:basis-[calc(50%-6px)]", optional: true },
  { key: "note", label: en.inventory.note, required: false, type: "text", placeholder: en.inventory.notePlaceholder, width: "basis-full sm:basis-[calc(50%-6px)]", optional: true },
] as const

export default function StockInModal({
  product,
  onClose,
}: {
  product: Product
  onClose: () => void
}) {
  const { profile } = useProfile()
  const [form, setForm] = useState<StockInForm>(initForm(product))
  const [loading, setLoading] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [transactionOptions, setTransactionOptions] = useState<TransactionOptionFlags>(createTransactionOptions())
  const { products } = useProducts()

  const supplierSuggestions = useMemo(
    () => Array.from(new Set(products.map((item) => item.supplier?.trim()).filter(Boolean))) as string[],
    [products]
  )

  const set = (key: keyof StockInForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const subtotal = (Number(form.price) || 0) * (Number(form.quantity) || 0)
  const sellerProfile = buildBusinessDocumentProfile(profile)
  const profileWarnings = getProfileDocumentWarnings(sellerProfile)

  const handleSubmit = async () => {
    if (!form.quantity || Number(form.quantity) <= 0) return toast.error(en.inventory.enterQuantity)
    if (!form.price || Number(form.price) <= 0) return toast.error(en.inventory.enterRate)
    if (!form.expiry) return toast.error(en.inventory.enterExpiry)
    const optionValidation = validateTransactionOptions(transactionOptions)
    if (!optionValidation.valid) return toast.warning(optionValidation.message)

    const userId = getUserIdentityFromAuthUser(auth?.currentUser)
    if (!userId) return toast.error(en.inventory.loginMissing)

    try {
      setLoading(true)
      const receiptNo = `STKIN-${Date.now()}`
      await addProduct({
        name: form.name.trim(),
        price: Number(form.price),
        quantity: Number(form.quantity),
        quantityUnit: form.quantityUnit,
        category: form.category,
        supplier: form.supplier,
        expiry: form.expiry,
        sku: form.sku,
        note: form.note,
        userId,
      }, {
        transaction: {
          transactionId: receiptNo,
          transactionType: "stock-in",
          invoiceReceiptNo: receiptNo,
          amount: subtotal,
          taxableAmount: subtotal,
          gstAmount: 0,
          notes: form.note,
        },
      })
      const documentData = buildStockInDocument({ form, seller: sellerProfile, total: subtotal, reference: receiptNo })
      await runTransactionDocumentActions(documentData, transactionOptions)
      toast.success(`${formatQuantity(form.quantity, form.quantityUnit)} ${en.inventory.stockAdded}`)
      onClose()
    } catch (error) {
      console.error("Stock add failed", error)
      toast.error(en.inventory.stockAddFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={en.inventory.stockInTitle}
      description={product.name}
      onClose={onClose}
      size="lg"
      loading={loading}
      primaryLabel={en.inventory.saveStock}
      primaryVariant="primary"
      onPrimary={handleSubmit}
      cancelLabel={en.common.cancel}
    >
      <div className="mb-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-3 text-xs text-[var(--text-secondary)] sm:grid-cols-4">
        <span className="truncate">{en.inventory.category}: {form.category || "-"}</span>
        <span className="truncate">{en.inventory.code}: {form.sku || "-"}</span>
        <span className="truncate">{en.inventory.unit}: {form.quantityUnit}</span>
        <span className="truncate">{en.inventory.current}: {formatQuantity(product.quantity, product.quantityUnit)}</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <datalist id="stock-in-supplier-suggestions">
          {supplierSuggestions.map((supplier) => (
            <option key={supplier} value={supplier} />
          ))}
        </datalist>

        {fields.map((field) => (
          field.optional && !showMore ? null : (
          <div key={field.key} className={field.width}>
            {field.type === "quantity" ? (
              <Input
                label={<>{field.label} <span className="text-red-400">*</span></>}
                type="number"
                placeholder={field.placeholder}
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                rightAddon={form.quantityUnit}
              />
            ) : (
              <Input
                label={field.required ? <>{field.label} <span className="text-red-400">*</span></> : field.label}
                type={field.type}
                placeholder={field.placeholder}
                value={form[field.key as keyof StockInForm]}
                onChange={(e) => set(field.key as keyof StockInForm, e.target.value)}
                datalist={field.key === "supplier" ? "stock-in-supplier-suggestions" : undefined}
              />
            )}
          </div>
          )
        ))}
      </div>

      <Button
        variant="outline"
        title={showMore ? en.inventory.hideDetails : en.inventory.moreDetails}
        onClick={() => setShowMore((value) => !value)}
        className="mt-4 w-full sm:w-auto"
      />

      <TransactionOptions
        value={transactionOptions}
        onChange={setTransactionOptions}
        allowPrint
        allowDownloadPdf
        allowShareWhatsApp
        allowShareEmail
        allowCopyDetails
        disabled={loading}
        className="mt-4"
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

      {subtotal > 0 && (
        <div className="mt-4 flex justify-end">
          <StatusBadge tone="success" className="rounded-2xl px-4 py-2 text-sm">
            {en.inventory.totalValue}: {formatCurrencyLabel(subtotal)}
          </StatusBadge>
        </div>
      )}
    </Modal>
  )
}

function formatCurrencyLabel(value: number) {
  return `${en.common.rupeeSymbol} ${value.toLocaleString("en-IN")}`
}


function buildStockInDocument({
  form,
  seller,
  total,
  reference,
}: {
  form: StockInForm
  seller: ReturnType<typeof buildBusinessDocumentProfile>
  total: number
  reference: string
}): TransactionDocumentData {
  return {
    type: "receipt",
    title: en.receipt.stockEntryReceipt,
    reference,
    date: new Date().toLocaleString("en-IN"),
    seller,
    partyLabel: en.inventory.supplier,
    party: { name: form.supplier },
    items: [{
      name: form.name,
      description: [form.category, form.sku ? `${en.inventory.sku}: ${form.sku}` : "", form.expiry ? `${en.inventory.expiry}: ${form.expiry}` : ""].filter(Boolean).join(" | "),
      quantity: Number(form.quantity),
      unit: form.quantityUnit,
      rate: Number(form.price),
      total,
      note: form.note,
    }],
    totals: { grandTotal: total },
    notes: form.note,
  }
}
