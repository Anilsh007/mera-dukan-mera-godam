"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Product } from "@/app/lib/db"
import { stockOut, getProductExpiryBatches } from "@/app/dashboard/add-product/product.service"
import { toast } from "sonner"
import Input from "@/app/components/utility/CommonInput"
import Button from "@/app/components/utility/Button"
import { createEmptyInvoiceItem } from "@/app/dashboard/gst-invoice/types/gst.types"
import { saveSaleInvoiceDraft } from "@/app/dashboard/gst-invoice/invoiceDraft.service"
import { formatQuantity, normalizeQuantityUnit } from "@/app/lib/quantityUnit"

const REASONS = ["Sold", "Expired", "Damaged", "Personal use", "Other"]

const selectClass =
  "w-full p-2 rounded-xl border bg-[var(--bg-input)] border-[var(--border-input)] text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-400 outline-none"

export default function StockOutModal({
  product,
  onClose,
}: {
  product: Product
  onClose: () => void
}) {
  const router = useRouter()
  const [quantity, setQuantity] = useState("")
  const [salePrice, setSalePrice] = useState(String(product.price))
  const [reason, setReason] = useState("Sold")
  const [note, setNote] = useState("")
  const [buyerName, setBuyerName] = useState("")
  const [buyerPhone, setBuyerPhone] = useState("")
  const [buyerGstin, setBuyerGstin] = useState("")
  const [selectedExpiry, setSelectedExpiry] = useState("")
  const [expiryOptions, setExpiryOptions] = useState<Array<{ expiry: string; quantity: number }>>([])
  const [loading, setLoading] = useState(false)
  const [logsLoading, setLogsLoading] = useState(true)
  const [createInvoice, setCreateInvoice] = useState(true)
  const isSoldFlow = reason === "Sold"
  const quantityUnit = normalizeQuantityUnit(product.quantityUnit)

  useEffect(() => {
    if (!product.id) return

    getProductExpiryBatches(product.id).then((batches) => {
      setExpiryOptions(batches)
      if (batches.length > 0) setSelectedExpiry(batches[0].expiry)
      setLogsLoading(false)
    })
  }, [product.id])

  const handleSubmit = async () => {
    const qty = Number(quantity)
    const price = Number(salePrice)

    if (!qty || qty <= 0) return toast.error("Quantity sahi daalo")
    if (qty > product.quantity) return toast.error(`Sirf ${formatQuantity(product.quantity, quantityUnit)} available hai`)
    if (isSoldFlow && (!price || price <= 0)) return toast.error("Sale price daalo")
    if (isSoldFlow && !buyerName.trim()) return toast.error("Buyer name required hai")
    if (!isSoldFlow && price < 0) return toast.error("Price negative nahi ho sakta")
    if (expiryOptions.length > 0 && !selectedExpiry) return toast.error("Expiry date select karo")
    const selectedBatch = expiryOptions.find((batch) => batch.expiry === selectedExpiry)
    if (selectedBatch && qty > selectedBatch.quantity) {
      return toast.error(`Selected batch me sirf ${formatQuantity(selectedBatch.quantity, quantityUnit)} available hai`)
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

      toast.success(`-${formatQuantity(qty, quantityUnit)} stock nikala gaya`)
      onClose()

      if (isSoldFlow && createInvoice) {
        router.push("/dashboard/gst-invoice")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Kuch gadbad hui")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 rounded-xl bg-[var(--bg-card-strong)] backdrop-blur-xl border-[var(--border-card)] shadow-[var(--shadow-card)]">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-base font-semibold">Stock Out</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">x</button>
      </div>
      <p className="text-sm text-gray-400 capitalize mb-4">
        {product.name} · {formatQuantity(product.quantity, quantityUnit)} available
      </p>
      <div className="border-t border-[var(--border-input)] mb-4" />

      <div className="flex flex-col gap-3">
        <div>
          <label className="block mb-1 text-sm font-medium text-[var(--text-primary)]">
            Expiry Date <span className="text-red-400">*</span>
          </label>
          {logsLoading ? (
            <div className={`${selectClass} text-gray-400 text-sm`}>Loading batches...</div>
          ) : expiryOptions.length === 0 ? (
            <div className={`${selectClass} text-gray-400 text-sm`}>No expiry dates available</div>
          ) : (
            <select value={selectedExpiry} onChange={(e) => setSelectedExpiry(e.target.value)} className={selectClass}>
              {expiryOptions.map((batch) => (
                <option key={batch.expiry} value={batch.expiry}>
                  {batch.expiry} - {formatQuantity(batch.quantity, quantityUnit)} {new Date(batch.expiry) >= new Date() ? "(nearest first)" : "(expired)"}
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
              {isSoldFlow ? "Sale Price (per unit)" : "Recovery Value (per unit)"}
              {isSoldFlow && <span className="text-red-400"> *</span>}
            </>
          }
          type="number"
          placeholder={isSoldFlow ? "How much did you sell it?" : "Optional, if any amount recovered"}
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
        />

        {Number(quantity) > 0 && Number(salePrice) > 0 && (
          <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <span className="text-sm text-emerald-700 dark:text-emerald-400">
              {isSoldFlow ? "Total Sale Value" : "Total Recovery Value"}
            </span>
            <span className="font-bold text-emerald-600">
              Rs {(Number(quantity) * Number(salePrice)).toLocaleString("en-IN")}
            </span>
          </div>
        )}

        <div>
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
              <option key={entry}>{entry}</option>
            ))}
          </select>
        </div>

        {isSoldFlow && (
          <>
            <Input
              label={<>Buyer Name <span className="text-red-400">*</span></>}
              type="text"
              placeholder="Buyer ka naam"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
            />

            <Input
              label="Buyer Phone"
              type="text"
              placeholder="Optional phone"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
            />

            <Input
              label="Buyer GSTIN"
              type="text"
              placeholder="Optional GSTIN"
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
              Sale confirm karte hi GST invoice draft kholo. Product, quantity aur rate auto-fill ho jayenge.
            </span>
          </label>
          </>
        )}

        <Input
          label="Note (optional)"
          type="text"
          placeholder="Add a note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="flex gap-2 mt-6">
        <Button variant="ghost" title="Cancel" onClick={onClose} className="flex-1" />
        <Button
          variant="danger"
          title={isSoldFlow ? "Confirm Sale Stock" : "Confirm Stock Out"}
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
