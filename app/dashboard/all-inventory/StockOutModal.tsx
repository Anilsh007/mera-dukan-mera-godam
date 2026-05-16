"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Product } from "@/app/lib/db"
import { stockOut, getProductExpiryBatches } from "@/app/dashboard/quick-purchase/product.service"
import { notify as toast } from "@/app/lib/notifications"
import Input from "@/app/components/ui/Input"
import Button from "@/app/components/ui/Button"
import Modal from "@/app/components/ui/Modal"
import StatusBadge from "@/app/components/ui/StatusBadge"
import TransactionOptions from "@/app/components/ui/TransactionOptions"
import { createEmptyInvoiceItem } from "@/app/dashboard/gst-invoice/types/gst.types"
import { saveSaleInvoiceDraft } from "@/app/dashboard/gst-invoice/invoiceDraft.service"
import { formatQuantity, normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import { calculateGstBreakup, isValidGstin } from "@/app/lib/gst.utils"
import useProfile from "@/app/dashboard/profile/useProfile"
import {
  buildBusinessDocumentProfile,
  getProfileDocumentWarnings,
  printTransactionDocument,
  type TransactionDocumentData,
  type TransactionOptionFlags,
} from "@/app/lib/transactionDocument"
import { en } from "@/app/messages/en"
import { shareTransactionDocument } from "@/app/lib/share"

const REASONS = [
  { value: "Sold", label: en.inventory.reasons.sold },
  { value: "Expired", label: en.inventory.reasons.expired },
  { value: "Damaged", label: en.inventory.reasons.damaged },
  { value: "Personal use", label: en.inventory.reasons.personalUse },
  { value: "Other", label: en.inventory.reasons.other },
]

const selectClass =
  "w-full min-h-10 p-2 rounded-xl border bg-[var(--bg-input)] border-[var(--border-input)] text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-400 outline-none"

export default function StockOutModal({
  product,
  onClose,
  defaultReason = "Sold",
  defaultSalePrice,
  defaultQuantity = "",
  defaultExpiry = "",
}: {
  product: Product
  onClose: () => void
  defaultReason?: string
  defaultSalePrice?: number | string
  defaultQuantity?: number | string
  defaultExpiry?: string
}) {
  const router = useRouter()
  const { profile } = useProfile()
  const [quantity, setQuantity] = useState(String(defaultQuantity || ""))
  const [salePrice, setSalePrice] = useState(String(defaultSalePrice ?? product.price))
  const [reason, setReason] = useState(defaultReason)
  const [note, setNote] = useState("")
  const [buyerName, setBuyerName] = useState("")
  const [buyerPhone, setBuyerPhone] = useState("")
  const [buyerGstin, setBuyerGstin] = useState("")
  const [selectedExpiry, setSelectedExpiry] = useState(defaultExpiry)
  const [expiryOptions, setExpiryOptions] = useState<Array<{ expiry: string; quantity: number }>>([])
  const [loading, setLoading] = useState(false)
  const [logsLoading, setLogsLoading] = useState(true)
  const [transactionOptions, setTransactionOptions] = useState<TransactionOptionFlags>({
    saveOnly: true,
    generateGstInvoice: false,
    printReceipt: false,
    downloadShare: false,
  })
  const [showMore, setShowMore] = useState(false)
  const isSoldFlow = reason === "Sold"
  const quantityUnit = normalizeQuantityUnit(product.quantityUnit)
  const sellerProfile = buildBusinessDocumentProfile(profile)
  const profileWarnings = getProfileDocumentWarnings(sellerProfile, { requireGstin: isSoldFlow && transactionOptions.generateGstInvoice })

  useEffect(() => {
    if (!product.id) {
      toast.error(en.inventory.somethingWentWrong)
      return
    }
    let cancelled = false
    setLogsLoading(true)

    getProductExpiryBatches(product.id)
      .then((batches) => {
        if (cancelled) return
        setExpiryOptions(batches)
        if (batches.length > 0) {
          const preferred = defaultExpiry && batches.some((batch) => batch.expiry === defaultExpiry)
          setSelectedExpiry(preferred ? defaultExpiry : batches[0].expiry)
        } else {
          setSelectedExpiry("")
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExpiryOptions([])
          toast.error(en.inventory.expiryLoadFailed)
        }
      })
      .finally(() => {
        if (!cancelled) setLogsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [defaultExpiry, product.id])

  const handleSubmit = async () => {
    const qty = Number(quantity)
    const price = Number(salePrice)

    if (!qty || qty <= 0) return toast.error(en.inventory.enterValidQuantity)
    if (qty > product.quantity) return toast.error(`${en.inventory.onlyRemainingPrefix} ${formatQuantity(product.quantity, quantityUnit)} ${en.inventory.onlyRemainingSuffix}`)
    if (isSoldFlow && (!price || price <= 0)) return toast.error(en.inventory.enterSaleRate)
    if (isSoldFlow && !buyerName.trim()) return toast.error(en.inventory.enterBuyerName)
    if (isSoldFlow && buyerGstin.trim() && !isValidGstin(buyerGstin)) return toast.error(en.profile.invalidGstin)
    if (!isSoldFlow && price < 0) return toast.error(en.inventory.negativeRate)
    if (expiryOptions.length > 0 && !selectedExpiry) return toast.error(en.inventory.selectExpiry)
    const selectedBatch = expiryOptions.find((batch) => batch.expiry === selectedExpiry)
    if (selectedBatch && qty > selectedBatch.quantity) {
      return toast.error(`${en.inventory.onlyRemainingPrefix} ${formatQuantity(selectedBatch.quantity, quantityUnit)} ${en.inventory.batchRemainingSuffix}`)
    }
    if (!product.id) {
      toast.error(en.inventory.somethingWentWrong)
      return
    }
    if (profileWarnings.length) {
      toast.warning(`${en.transaction.profileWarningTitle}: ${profileWarnings.join(" ")}`)
      if (isSoldFlow && transactionOptions.generateGstInvoice) return
    }

    try {
      setLoading(true)
      const receiptNo = `${isSoldFlow ? "SALE" : "ADJ"}-${Date.now()}`
      const effectivePrice = isSoldFlow ? price : Math.max(price || 0, 0)
      const gstRate = isSoldFlow && transactionOptions.generateGstInvoice ? 18 : 0
      const gstBreakup = calculateGstBreakup({
        quantity: qty,
        rate: effectivePrice,
        gstRate,
        sellerGstin: sellerProfile.gstin,
        buyerGstin: buyerGstin.trim(),
      })

      await stockOut({
        productId: product.id,
        quantity: qty,
        quantityUnit,
        salePrice: effectivePrice,
        expiry: selectedExpiry || undefined,
        reason,
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerGstin: buyerGstin.trim(),
        note,
        gstRate,
        taxableAmount: gstBreakup.taxableAmount,
        cgstAmount: gstBreakup.cgstAmount,
        sgstAmount: gstBreakup.sgstAmount,
        igstAmount: gstBreakup.igstAmount,
        gstAmount: gstBreakup.totalGst,
        paymentStatus: isSoldFlow ? "paid" : undefined,
        invoiceReceiptNo: receiptNo,
        transactionId: receiptNo,
        transactionType: isSoldFlow ? "sale" : "stock-adjustment",
      })

      if (isSoldFlow && transactionOptions.generateGstInvoice) {
        const invoiceItem = createEmptyInvoiceItem()
        invoiceItem.name = toTitleCase(product.name)
        invoiceItem.description = toTitleCase(product.name)
        invoiceItem.hsnCode = product.hsnCode || ""
        invoiceItem.quantity = qty
        invoiceItem.rate = price
        invoiceItem.unit = quantityUnit

        saveSaleInvoiceDraft({
          buyer: {
            name: buyerName.trim(),
            phone: buyerPhone.trim(),
            gstin: buyerGstin.trim(),
          },
          items: [invoiceItem],
          notes: note || `${en.inventory.saleDraftNotePrefix} ${toTitleCase(product.name)}`,
          sourceProductId: product.id,
          sourceProductName: product.name,
          createdAt: new Date().toISOString(),
        })
      }

      const documentData = buildStockOutDocument({
        product,
        quantity: qty,
        quantityUnit,
        salePrice: effectivePrice,
        reason,
        buyerName,
        buyerPhone,
        buyerGstin,
        note,
        seller: sellerProfile,
        reference: receiptNo,
      })

      if (transactionOptions.printReceipt) {
        const printed = printTransactionDocument(documentData)
        if (printed) toast.success(en.common.printStarted)
        else toast.error(en.common.popupBlocked)
      }

      if (transactionOptions.downloadShare) {
        await shareTransactionDocument(documentData)
      }

      toast.success(isSoldFlow && transactionOptions.generateGstInvoice ? en.inventory.saleInvoiceDraftSaved : `-${formatQuantity(qty, quantityUnit)} ${en.inventory.stockRemoved}`)
      onClose()

      if (isSoldFlow && transactionOptions.generateGstInvoice) {
        router.push("/dashboard/gst-invoice")
      }
    } catch (err: unknown) {
      console.error("Stock out failed", err)
      toast.error(en.inventory.somethingWentWrong)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={en.inventory.stockOutTitle}
      description={`${product.name} - ${formatQuantity(product.quantity, quantityUnit)} ${en.inventory.onlyRemainingSuffix}`}
      onClose={onClose}
      size="lg"
      loading={loading}
      primaryLabel={isSoldFlow ? en.inventory.saveSale : en.inventory.removeStock}
      primaryVariant={isSoldFlow ? "primary" : "danger"}
      onPrimary={handleSubmit}
      cancelLabel={en.common.cancel}
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">{en.inventory.actionPrompt}</label>
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-5">
            {REASONS.map((entry) => (
              <Button
                key={entry.value}
                type="button"
                onClick={() => {
                  setReason(entry.value)
                  if (entry.value !== "Sold") {
                    setTransactionOptions((current) => ({ ...current, generateGstInvoice: false }))
                  }
                }}
                title={entry.label}
                variant={reason === entry.value ? "success" : "outline"}
                className="min-h-11 px-3 text-sm"
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-[var(--text-primary)]">
            {en.inventory.expiryBatch}
          </label>
          {logsLoading ? (
            <div className={`${selectClass} text-gray-400 text-sm`}>{en.inventory.loadingExpiry}</div>
          ) : expiryOptions.length === 0 ? (
            <div className={`${selectClass} text-gray-400 text-sm`}>{en.inventory.noExpiryFound}</div>
          ) : (
            <select value={selectedExpiry} onChange={(e) => setSelectedExpiry(e.target.value)} className={selectClass}>
              {expiryOptions.map((batch) => (
                <option key={batch.expiry} value={batch.expiry}>
                  {batch.expiry} - {formatQuantity(batch.quantity, quantityUnit)} {new Date(batch.expiry) >= new Date() ? en.inventory.batchFirst : en.inventory.batchExpired}
                </option>
              ))}
            </select>
          )}
        </div>

        <Input
          label={<>{en.inventory.quantity} <span className="text-red-400">*</span></>}
          type="number"
          placeholder={`${en.inventory.maxPrefix} ${product.quantity}`}
          min={1}
          max={product.quantity}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          rightAddon={quantityUnit}
        />

        <Input
          label={
            <>
              {isSoldFlow ? en.inventory.saleRate : en.inventory.recoveryRate}
              {isSoldFlow && <span className="text-red-400"> *</span>}
            </>
          }
          type="number"
          placeholder={isSoldFlow ? en.inventory.salePlaceholder : en.inventory.recoveryPlaceholder}
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
        />

        {Number(quantity) > 0 && Number(salePrice) > 0 && (
          <div className="flex justify-start sm:justify-end">
            <StatusBadge tone="success" className="rounded-2xl px-4 py-2 text-sm">
              {isSoldFlow ? en.inventory.totalSale : en.inventory.totalRecovery}: {en.common.rupeeSymbol} {(Number(quantity) * Number(salePrice)).toLocaleString("en-IN")}
            </StatusBadge>
          </div>
        )}

        {isSoldFlow && (
          <>
            <Input
              label={<>{en.inventory.buyerName} <span className="text-red-400">*</span></>}
              type="text"
              placeholder={en.inventory.buyerName}
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
            />

            {showMore && (
              <>
                <Input
                  label={en.inventory.buyerPhone}
                  type="text"
                  placeholder={en.inventory.optionalPhone}
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                />

                <Input
                  label={en.inventory.buyerGstin}
                  type="text"
                  placeholder={en.inventory.optionalGstin}
                  value={buyerGstin}
                  onChange={(e) => setBuyerGstin(e.target.value.toUpperCase())}
                />


              </>
            )}
          </>
        )}

        {showMore && (
          <Input
            label={en.inventory.note}
            type="text"
            placeholder={en.inventory.optionalNote}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
      </div>
        <TransactionOptions
          value={transactionOptions}
          onChange={setTransactionOptions}
          allowGstInvoice={isSoldFlow}
          allowPrint
          allowDownloadShare
          disabled={loading}
        />

        {profileWarnings.length > 0 && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
            <p className="font-bold">{en.transaction.profileWarningTitle}</p>
            <p>{en.transaction.profileGuide}</p>
            <ul className="mt-2 list-inside list-disc">
              {profileWarnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          </div>
        )}


      <Button
        variant="outline"
        title={showMore ? en.inventory.hideDetails : en.inventory.moreDetails}
        onClick={() => setShowMore((value) => !value)}
        className="mt-4 w-full sm:w-auto"
      />
    </Modal>
  )
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1))
}


function buildStockOutDocument({
  product,
  quantity,
  quantityUnit,
  salePrice,
  reason,
  buyerName,
  buyerPhone,
  buyerGstin,
  note,
  seller,
  reference,
}: {
  product: Product
  quantity: number
  quantityUnit: string
  salePrice: number
  reason: string
  buyerName: string
  buyerPhone: string
  buyerGstin: string
  note: string
  seller: ReturnType<typeof buildBusinessDocumentProfile>
  reference: string
}): TransactionDocumentData {
  const isSale = reason === "Sold"
  return {
    type: isSale ? "sale" : "stock-adjustment",
    title: isSale ? en.transaction.saleReceipt : en.transaction.stockAdjustmentReceipt,
    reference,
    date: new Date().toLocaleString("en-IN"),
    seller,
    partyLabel: isSale ? en.receipt.buyer : en.inventory.reason,
    party: isSale ? { name: buyerName, phone: buyerPhone, gstin: buyerGstin } : { name: reason },
    items: [{
      name: toTitleCase(product.name),
      description: [product.category, product.sku ? `${en.inventory.sku}: ${product.sku}` : "", note].filter(Boolean).join(" | "),
      hsnCode: product.hsnCode,
      quantity,
      unit: quantityUnit,
      rate: salePrice,
      total: quantity * salePrice,
    }],
    totals: { grandTotal: quantity * salePrice },
    notes: note,
  }
}
