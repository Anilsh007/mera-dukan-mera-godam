"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Product } from "@/app/lib/db"
import { stockOut, getProductExpiryBatches } from "@/app/dashboard/add-product/product.service"
import { toast } from "sonner"
import Input from "@/app/components/ui/Input"
import Button from "@/app/components/ui/Button"
import { createEmptyInvoiceItem } from "@/app/dashboard/gst-invoice/types/gst.types"
import { saveSaleInvoiceDraft } from "@/app/dashboard/gst-invoice/invoiceDraft.service"
import { formatQuantity, normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import { en } from "@/app/messages/en"

const REASONS = [
  { value: "Sold", label: en.inventory.reasons.sold },
  { value: "Expired", label: en.inventory.reasons.expired },
  { value: "Damaged", label: en.inventory.reasons.damaged },
  { value: "Personal use", label: en.inventory.reasons.personalUse },
  { value: "Other", label: en.inventory.reasons.other },
]

const selectClass =
  "w-full p-2 rounded-xl border bg-[var(--bg-input)] border-[var(--border-input)] text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-400 outline-none"

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
  const [createInvoice, setCreateInvoice] = useState(defaultReason === "Sold")
  const [showMore, setShowMore] = useState(false)
  const isSoldFlow = reason === "Sold"
  const quantityUnit = normalizeQuantityUnit(product.quantityUnit)

  useEffect(() => {
    if (!product.id) return

    getProductExpiryBatches(product.id).then((batches) => {
      setExpiryOptions(batches)
      if (batches.length > 0) {
        const preferred = defaultExpiry && batches.some((batch) => batch.expiry === defaultExpiry)
        setSelectedExpiry(preferred ? defaultExpiry : batches[0].expiry)
      }
      setLogsLoading(false)
    })
  }, [defaultExpiry, product.id])

  const handleSubmit = async () => {
    const qty = Number(quantity)
    const price = Number(salePrice)

    if (!qty || qty <= 0) return toast.error(en.inventory.enterValidQuantity)
    if (qty > product.quantity) return toast.error(`${en.inventory.onlyRemainingPrefix} ${formatQuantity(product.quantity, quantityUnit)} ${en.inventory.onlyRemainingSuffix}`)
    if (isSoldFlow && (!price || price <= 0)) return toast.error(en.inventory.enterSaleRate)
    if (isSoldFlow && !buyerName.trim()) return toast.error(en.inventory.enterBuyerName)
    if (!isSoldFlow && price < 0) return toast.error(en.inventory.negativeRate)
    if (expiryOptions.length > 0 && !selectedExpiry) return toast.error(en.inventory.selectExpiry)
    const selectedBatch = expiryOptions.find((batch) => batch.expiry === selectedExpiry)
    if (selectedBatch && qty > selectedBatch.quantity) {
      return toast.error(`${en.inventory.onlyRemainingPrefix} ${formatQuantity(selectedBatch.quantity, quantityUnit)} ${en.inventory.batchRemainingSuffix}`)
    }
    if (!product.id) return

    try {
      setLoading(true)

      await stockOut({
        productId: product.id,
        quantity: qty,
        quantityUnit,
        salePrice: isSoldFlow ? price : Math.max(price || 0, 0),
        expiry: selectedExpiry || undefined,
        reason,
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerGstin: buyerGstin.trim(),
        note,
      })

      if (isSoldFlow && createInvoice) {
        const invoiceItem = createEmptyInvoiceItem()
        invoiceItem.description = toTitleCase(product.name)
        invoiceItem.hsnCode = product.sku || ""
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
          notes: note || `Sale generated from stock out for ${toTitleCase(product.name)}`,
          sourceProductId: product.id,
          sourceProductName: product.name,
          createdAt: new Date().toISOString(),
        })
      }

      toast.success(`-${formatQuantity(qty, quantityUnit)} ${en.inventory.stockRemoved}`)
      onClose()

      if (isSoldFlow && createInvoice) {
        router.push("/dashboard/gst-invoice")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : en.inventory.somethingWentWrong)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 rounded-xl bg-[var(--bg-card-strong)] backdrop-blur-xl border-[var(--border-card)] shadow-[var(--shadow-card)]">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-base font-semibold">{en.inventory.stockOutTitle}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">x</button>
      </div>
      <p className="text-sm text-gray-400 capitalize mb-4">
        {product.name} - {formatQuantity(product.quantity, quantityUnit)} {en.inventory.onlyRemainingSuffix}
      </p>
      <div className="border-t border-[var(--border-input)] mb-4" />

      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">{en.inventory.actionPrompt}</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {REASONS.map((entry) => (
              <button
                key={entry.value}
                type="button"
                onClick={() => {
                  setReason(entry.value)
                  setCreateInvoice(entry.value === "Sold")
                }}
                className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  reason === entry.value
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "border-[var(--border-input)] bg-[var(--bg-input)] text-[var(--text-secondary)]"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-[var(--text-primary)]">
            Expiry <span className="text-red-400">*</span>
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

        <div>
          <label className="block mb-1 text-sm font-medium text-[var(--text-primary)]">
            Quantity <span className="text-red-400">*</span>
          </label>
          <div className="flex overflow-hidden rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] focus-within:ring-2 focus-within:ring-emerald-400">
            <input
              type="number"
              placeholder={`Max ${product.quantity}`}
              min={1}
              max={product.quantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="min-w-0 flex-1 bg-transparent p-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
            />
            <span className="border-l border-[var(--border-input)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)]">
              {quantityUnit}
            </span>
          </div>
        </div>

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
          <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <span className="text-sm text-emerald-700 dark:text-emerald-400">
              {isSoldFlow ? en.inventory.totalSale : en.inventory.totalRecovery}
            </span>
            <span className="font-bold text-emerald-600">
              Rs {(Number(quantity) * Number(salePrice)).toLocaleString("en-IN")}
            </span>
          </div>
        )}

        <div className="hidden">
          <label className="block mb-1 text-sm font-medium text-[var(--text-primary)]">Reason</label>
          <select
            value={reason}
            onChange={(e) => {
              const nextReason = e.target.value
              setReason(nextReason)
              setCreateInvoice(nextReason === "Sold")
            }}
            className={selectClass}
          >
            {REASONS.map((entry) => (
              <option key={entry.value} value={entry.value}>{entry.label}</option>
            ))}
          </select>
        </div>

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

                <label className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <input
                    type="checkbox"
                    checked={createInvoice}
                    onChange={(e) => setCreateInvoice(e.target.checked)}
                    className="mt-1 h-4 w-4 cursor-pointer"
                  />
                  <span>
                    {en.inventory.openInvoiceAfterSale}
                  </span>
                </label>
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

      <Button
        variant="outline"
        title={showMore ? en.inventory.showLess : en.inventory.showMore}
        onClick={() => setShowMore((value) => !value)}
        className="mt-4 w-full sm:w-auto"
      />

      <div className="flex gap-2 mt-6">
        <Button variant="ghost" title="Cancel" onClick={onClose} className="flex-1" />
        <Button
          variant="danger"
          title={isSoldFlow ? en.inventory.saveSale : en.inventory.removeStock}
          loading={loading}
          onClick={handleSubmit}
          className="flex-1"
        />
      </div>
    </div>
  )
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1))
}
