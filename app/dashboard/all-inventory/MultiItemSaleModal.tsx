"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { notify as toast } from "@/app/lib/notifications"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import StatusBadge from "@/app/components/ui/StatusBadge"
import TransactionOptions from "@/app/components/ui/TransactionOptions"
import type { Product } from "@/app/lib/db"
import { stockOutMany } from "@/app/dashboard/quick-purchase/product.service"
import { loadInvoicesFromDb } from "@/app/dashboard/gst-invoice/invoice.service"
import { buildBuyerSuggestions, matchBuyerSuggestion } from "@/app/dashboard/gst-invoice/buyerSuggestions"
import { createEmptyInvoiceItem } from "@/app/dashboard/gst-invoice/types/gst.types"
import { saveSaleInvoiceDraft } from "@/app/dashboard/gst-invoice/invoiceDraft.service"
import useProfile from "@/app/dashboard/profile/useProfile"
import { formatQuantity, normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import { calculateGstBreakup, isValidGstin } from "@/app/lib/gst.utils"
import {
  buildBusinessDocumentProfile,
  getProfileDocumentWarnings,
  printTransactionDocument,
  type TransactionDocumentData,
  type TransactionOptionFlags,
} from "@/app/lib/transactionDocument"
import { en } from "@/app/messages/en"
import { shareTransactionDocument } from "@/app/lib/share"

type SaleLine = {
  productId: string
  name: string
  sku?: string
  hsnCode?: string
  category?: string
  availableQty: number
  quantityUnit: string
  quantity: string
  salePrice: string
  gstRate: string
}

type BuyerForm = {
  name: string
  gstin: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  pincode: string
  note: string
}

const emptyBuyer: BuyerForm = {
  name: "",
  gstin: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  note: "",
}

export default function MultiItemSaleModal({
  products,
  onClose,
  onSuccess,
}: {
  products: Product[]
  onClose: () => void
  onSuccess: () => void
}) {
  const router = useRouter()
  const { profile } = useProfile()
  const [lines, setLines] = useState<SaleLine[]>(
    products.map((product) => ({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      hsnCode: product.hsnCode,
      category: product.category,
      availableQty: product.quantity,
      quantityUnit: normalizeQuantityUnit(product.quantityUnit),
      quantity: product.quantity > 0 ? "1" : "0",
      salePrice: String(product.price || 0),
      gstRate: "18",
    }))
  )
  const [buyer, setBuyer] = useState<BuyerForm>(emptyBuyer)
  const [loading, setLoading] = useState(false)
  const [transactionOptions, setTransactionOptions] = useState<TransactionOptionFlags>({
    saveOnly: false,
    generateGstInvoice: true,
    printReceipt: true,
    downloadShare: false,
  })
  const [showMore, setShowMore] = useState(false)
  const [buyerSuggestions, setBuyerSuggestions] = useState<ReturnType<typeof buildBuyerSuggestions>>([])

  useEffect(() => {
    let mounted = true

    async function loadBuyerHistory() {
      try {
        const invoices = await loadInvoicesFromDb()
        if (!mounted) return
        setBuyerSuggestions(buildBuyerSuggestions(invoices))
      } catch {
        if (mounted) toast.warning(en.gstInvoice.buyerHistoryLoadFailed, { id: "buyer-history-load-failed" })
      }
    }

    loadBuyerHistory()
    return () => {
      mounted = false
    }
  }, [])

  const validLines = useMemo(
    () =>
      lines.filter(
        (line) =>
          Number(line.quantity) > 0 &&
          Number(line.quantity) <= line.availableQty &&
          Number(line.salePrice) > 0
      ),
    [lines]
  )

  const grandTotal = useMemo(
    () => validLines.reduce((sum, line) => sum + Number(line.quantity) * Number(line.salePrice), 0),
    [validLines]
  )

  const sellerProfile = buildBusinessDocumentProfile(profile)
  const sellerWarnings = getProfileDocumentWarnings(sellerProfile, { requireGstin: transactionOptions.generateGstInvoice })

  const applyBuyerSuggestion = (
    field: "name" | "gstin" | "phone" | "email",
    value: string
  ) => {
    const matched = matchBuyerSuggestion(buyerSuggestions, field, value)
    setBuyer((current) =>
      matched
        ? {
            ...current,
            ...matched.buyer,
            name: matched.buyer.name || current.name,
            gstin: matched.buyer.gstin || "",
            phone: matched.buyer.phone || "",
            email: matched.buyer.email || "",
            address: matched.buyer.address || "",
            city: matched.buyer.city || "",
            state: matched.buyer.state || "",
            pincode: matched.buyer.pincode || "",
            [field]: value,
          }
        : {
            ...current,
            [field]: value,
          }
    )
  }

  const updateLine = (productId: string, key: keyof SaleLine, value: string) => {
    setLines((current) =>
      current.map((line) => (line.productId === productId ? { ...line, [key]: value } : line))
    )
  }

  const handleConfirm = async () => {
    if (!buyer.name.trim()) {
      toast.error(en.inventory.enterBuyerNameForSale)
      return
    }

    if (buyer.gstin.trim() && !isValidGstin(buyer.gstin)) {
      toast.error(en.profile.invalidGstin)
      return
    }

    if (sellerWarnings.length) {
      toast.warning(`${en.transaction.profileWarningTitle}: ${sellerWarnings.join(" ")}`)
      if (transactionOptions.generateGstInvoice) return
    }

    if (!validLines.length) {
      toast.error(en.inventory.selectValidSaleItem)
      return
    }

    try {
      setLoading(true)
      const receiptNo = `SALE-${Date.now()}`

      await stockOutMany(
        validLines.map((line) => {
          const quantity = Number(line.quantity)
          const salePrice = Number(line.salePrice)
          const gstRate = transactionOptions.generateGstInvoice ? Number(line.gstRate || 18) : 0
          const gstBreakup = calculateGstBreakup({
            quantity,
            rate: salePrice,
            gstRate,
            sellerGstin: sellerProfile.gstin,
            buyerGstin: buyer.gstin.trim(),
            sellerState: sellerProfile.state,
            buyerState: buyer.state.trim(),
          })

          return {
            productId: line.productId,
            quantity,
            quantityUnit: line.quantityUnit,
            salePrice,
            reason: "Sold",
            buyerName: buyer.name.trim(),
            buyerPhone: buyer.phone.trim(),
            buyerGstin: buyer.gstin.trim(),
            note: buyer.note.trim() || undefined,
            gstRate,
            taxableAmount: gstBreakup.taxableAmount,
            cgstAmount: gstBreakup.cgstAmount,
            sgstAmount: gstBreakup.sgstAmount,
            igstAmount: gstBreakup.igstAmount,
            gstAmount: gstBreakup.totalGst,
            paymentStatus: "paid",
            invoiceReceiptNo: receiptNo,
            transactionId: receiptNo,
            transactionType: "multi-item-sale",
          }
        })
      )

      if (transactionOptions.generateGstInvoice) {
        saveSaleInvoiceDraft({
          buyer: {
            name: buyer.name.trim(),
            gstin: buyer.gstin.trim(),
            phone: buyer.phone.trim(),
            email: buyer.email.trim(),
            address: buyer.address.trim(),
            city: buyer.city.trim(),
            state: buyer.state.trim(),
            pincode: buyer.pincode.trim(),
          },
          items: validLines.map((line) => {
            const item = createEmptyInvoiceItem()
            item.name = toTitleCase(line.name)
            item.description = toTitleCase(line.name)
            item.hsnCode = line.hsnCode || ""
            item.quantity = Number(line.quantity)
            item.rate = Number(line.salePrice)
            item.gstRate = Number(line.gstRate || 18)
            item.unit = line.quantityUnit
            return item
          }),
          notes: buyer.note.trim() || undefined,
          createdAt: new Date().toISOString(),
        })
      }

      const saleDocument = buildSaleDocument({
        buyer,
        lines: validLines,
        seller: sellerProfile,
        reference: receiptNo,
      })

      if (transactionOptions.printReceipt) {
        const printed = printTransactionDocument(saleDocument)
        if (printed) toast.success(en.common.printStarted)
        else toast.error(en.common.popupBlocked)
      }

      if (transactionOptions.downloadShare) {
        await shareTransactionDocument(saleDocument)
      }

      toast.success(`${en.inventory.saleSavedItemsPrefix} ${validLines.length} ${validLines.length > 1 ? en.inventory.saleSavedItemsPlural : en.inventory.saleSavedItemsSingular}`)
      onSuccess()
      onClose()

      if (transactionOptions.generateGstInvoice) {
        router.push("/dashboard/gst-invoice")
      }
    } catch (error: unknown) {
      console.error("Multi item sale failed", error)
      toast.error(en.inventory.saleSaveFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={en.inventory.multiSaleTitle}
      description={en.inventory.multiSaleDescription}
      onClose={onClose}
      size="xl"
      loading={loading}
      primaryLabel={en.inventory.saveSaleButton}
      primaryVariant="primary"
      onPrimary={handleConfirm}
      primaryDisabled={loading}
      cancelLabel={en.common.cancel}
    >

      <datalist id="sale-buyer-name-suggestions">
        {buyerSuggestions.map((suggestion) => (
          <option key={suggestion.key} value={suggestion.buyer.name} />
        ))}
      </datalist>
      <datalist id="sale-buyer-gstin-suggestions">
        {buyerSuggestions.filter((s) => s.buyer.gstin).map((suggestion) => (
          <option key={`${suggestion.key}-gstin`} value={suggestion.buyer.gstin} />
        ))}
      </datalist>
      <datalist id="sale-buyer-phone-suggestions">
        {buyerSuggestions.filter((s) => s.buyer.phone).map((suggestion) => (
          <option key={`${suggestion.key}-phone`} value={suggestion.buyer.phone} />
        ))}
      </datalist>
      <datalist id="sale-buyer-email-suggestions">
        {buyerSuggestions.filter((s) => s.buyer.email).map((suggestion) => (
          <option key={`${suggestion.key}-email`} value={suggestion.buyer.email} />
        ))}
      </datalist>

      <div className="grid gap-4 md:grid-cols-2">
        <Input label={<>{en.inventory.buyerName} <span className="text-red-400">*</span></>} value={buyer.name} onChange={(e) => applyBuyerSuggestion("name", e.target.value)} datalist="sale-buyer-name-suggestions" />
        <Input label={en.inventory.phone} value={buyer.phone} onChange={(e) => applyBuyerSuggestion("phone", e.target.value)} datalist="sale-buyer-phone-suggestions" />
        {showMore && (
          <>
            <Input label={en.inventory.buyerGstin} value={buyer.gstin} onChange={(e) => applyBuyerSuggestion("gstin", e.target.value.toUpperCase())} datalist="sale-buyer-gstin-suggestions" />
            <Input label={en.inventory.email} value={buyer.email} onChange={(e) => applyBuyerSuggestion("email", e.target.value)} datalist="sale-buyer-email-suggestions" />
            <Input label={en.inventory.address} value={buyer.address} onChange={(e) => setBuyer((current) => ({ ...current, address: e.target.value }))} containerClassName="md:col-span-2" />
            <Input label={en.inventory.city} value={buyer.city} onChange={(e) => setBuyer((current) => ({ ...current, city: e.target.value }))} />
            <Input label={en.inventory.state} value={buyer.state} onChange={(e) => setBuyer((current) => ({ ...current, state: e.target.value }))} />
            <Input label={en.inventory.pincode} value={buyer.pincode} onChange={(e) => setBuyer((current) => ({ ...current, pincode: e.target.value }))} />
            <Input label={en.inventory.saleNote} value={buyer.note} onChange={(e) => setBuyer((current) => ({ ...current, note: e.target.value }))} containerClassName="md:col-span-2" />
          </>
        )}
      </div>

      <Button
        variant="outline"
        title={showMore ? en.inventory.hideDetails : en.inventory.moreDetails}
        onClick={() => setShowMore((value) => !value)}
        className="mt-4 w-full sm:w-auto"
      />

      <div className="mt-5 space-y-3 md:hidden">
        {lines.map((line) => (
          <div key={line.productId} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium capitalize text-[var(--text-primary)]">{line.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{line.category || en.inventory.noCategory}{line.sku ? ` - ${line.sku}` : ""}</p>
              </div>
              <p className="text-sm font-semibold text-[var(--text-secondary)]">{en.inventory.available}: {formatQuantity(line.availableQty, line.quantityUnit)}</p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <QuantityWithUnitInput
                label={en.inventory.quantityToSell}
                value={line.quantity}
                unit={line.quantityUnit}
                max={line.availableQty}
                onChange={(value) => updateLine(line.productId, "quantity", value)}
              />
              <Input type="number" min={0} label={en.inventory.saleRate} value={line.salePrice} onChange={(e) => updateLine(line.productId, "salePrice", e.target.value)} />
              <Input type="number" min={0} label={en.inventory.gstPercent} value={line.gstRate} onChange={(e) => updateLine(line.productId, "gstRate", e.target.value)} />
              <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{en.gstInvoice.total}</p>
                <p className="mt-1 font-semibold text-emerald-600">{en.common.rupeeSymbol} {(Number(line.quantity) * Number(line.salePrice)).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mobile-safe-table mt-5 hidden rounded-2xl border border-[var(--border-card)] md:block">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr className="border-b border-[var(--border-card)]">
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">{en.inventory.item}</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">{en.inventory.available}</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">{en.inventory.quantityToSell}</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">{en.inventory.saleRate}</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">{en.inventory.gstPercent}</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">{en.gstInvoice.total}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-card)]">
            {lines.map((line) => (
              <tr key={line.productId}>
                <td className="px-4 py-3">
                  <p className="font-medium capitalize text-[var(--text-primary)]">{line.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{line.category || en.inventory.noCategory}{line.sku ? ` - ${line.sku}` : ""}</p>
                </td>
                <td className="px-4 py-3">{formatQuantity(line.availableQty, line.quantityUnit)}</td>
                <td className="px-4 py-3">
                  <QuantityWithUnitInput
                    value={line.quantity}
                    unit={line.quantityUnit}
                    max={line.availableQty}
                    onChange={(value) => updateLine(line.productId, "quantity", value)}
                  />
                </td>
                <td className="px-4 py-3">
                  <Input type="number" min={0} value={line.salePrice} onChange={(e) => updateLine(line.productId, "salePrice", e.target.value)} />
                </td>
                <td className="px-4 py-3">
                  <Input type="number" min={0} value={line.gstRate} onChange={(e) => updateLine(line.productId, "gstRate", e.target.value)} />
                </td>
                <td className="px-4 py-3 font-semibold text-emerald-600">
                  {en.common.rupeeSymbol} {(Number(line.quantity) * Number(line.salePrice)).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TransactionOptions
        value={transactionOptions}
        onChange={setTransactionOptions}
        allowGstInvoice
        allowPrint
        allowDownloadShare
        disabled={loading}
        className="mt-4"
      />

      {sellerWarnings.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="font-bold">{en.transaction.profileWarningTitle}</p>
          <p>{en.transaction.profileGuide}</p>
          <ul className="mt-2 list-inside list-disc">
            {sellerWarnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/30 dark:bg-emerald-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{validLines.length} {validLines.length > 1 ? en.inventory.readySuffixPlural : en.inventory.readySuffixSingular}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">{en.inventory.multiSaleHint}</p>
        </div>
        <StatusBadge tone="success" className="rounded-2xl px-4 py-2 text-sm">
          {en.common.rupeeSymbol} {grandTotal.toLocaleString("en-IN")}
        </StatusBadge>
      </div>
    </Modal>
  )
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1))
}

function QuantityWithUnitInput({
  label,
  value,
  unit,
  max,
  onChange,
}: {
  label?: string
  value: string
  unit: string
  max: number
  onChange: (value: string) => void
}) {
  return (
    <Input
      label={label}
      type="number"
      min={0}
      max={max}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rightAddon={unit}
    />
  )
}

function buildSaleDocument({
  buyer,
  lines,
  seller,
  reference,
}: {
  buyer: BuyerForm
  lines: SaleLine[]
  seller: ReturnType<typeof buildBusinessDocumentProfile>
  reference: string
}): TransactionDocumentData {
  const activeLines = lines.filter((line) => Number(line.quantity) > 0 && Number(line.salePrice) > 0)
  const grandTotal = activeLines.reduce(
    (sum, line) => sum + Number(line.quantity) * Number(line.salePrice),
    0
  )

  return {
    type: "sale",
    title: en.transaction.saleReceipt,
    reference,
    date: new Date().toLocaleString("en-IN"),
    seller,
    partyLabel: en.receipt.buyer,
    party: {
      name: buyer.name,
      gstin: buyer.gstin,
      phone: buyer.phone,
      email: buyer.email,
      address: buyer.address,
      city: buyer.city,
      state: buyer.state,
      pincode: buyer.pincode,
    },
    items: activeLines.map((line) => ({
      name: toTitleCase(line.name),
      description: [line.category, line.sku ? `${en.inventory.sku}: ${line.sku}` : ""].filter(Boolean).join(" | "),
      hsnCode: line.hsnCode,
      quantity: Number(line.quantity),
      unit: line.quantityUnit,
      rate: Number(line.salePrice),
      gstRate: Number(line.gstRate || 0),
      total: Number(line.quantity) * Number(line.salePrice),
    })),
    totals: { grandTotal },
    notes: buyer.note,
  }
}
