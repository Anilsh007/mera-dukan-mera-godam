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
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import { saveSaleInvoiceDraft } from "@/app/dashboard/gst-invoice/invoiceDraft.service"
import { formatCurrency, formatIndianDateTime } from "@/app/lib/formatters"
import { formatQuantity, normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import { isValidGstin } from "@/app/lib/gst.utils"
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
  ensureValidTransactionOptions,
} from "@/app/lib/transactionActions"
import { buildSaleInvoiceDraftFromRecord, buildSaleTransactionDocument } from "@/app/lib/sales/sale.documents"
import { saveSale } from "@/app/lib/sales/sale.service"
import { auth } from "@/app/lib/firebase"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import useParties from "@/app/hooks/useParties"
import { useInventoryLocations } from "@/app/hooks/useAdvancedInventory"
import { DASHBOARD_ROUTES } from "@/app/lib/navigation/dashboardRoutes"

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
  const { parties: customerParties } = useParties("customer")
  const [quantity, setQuantity] = useState(String(defaultQuantity || ""))
  const [salePrice, setSalePrice] = useState(String(defaultSalePrice ?? product.price))
  const [reason, setReason] = useState(defaultReason)
  const [note, setNote] = useState("")
  const [buyerName, setBuyerName] = useState("")
  const [buyerPhone, setBuyerPhone] = useState("")
  const [buyerGstin, setBuyerGstin] = useState("")
  const [selectedExpiry, setSelectedExpiry] = useState(defaultExpiry)
  const [locationId, setLocationId] = useState("")
  const [expiryOptions, setExpiryOptions] = useState<Array<{ expiry: string; quantity: number }>>([])
  const [loading, setLoading] = useState(false)
  const [logsLoading, setLogsLoading] = useState(true)
  const [transactionOptions, setTransactionOptions] = useState<TransactionOptionFlags>(createTransactionOptions())
  const [showMore, setShowMore] = useState(false)
  const { locations } = useInventoryLocations()
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

    if (!qty || qty <= 0) {
      toast.error(en.inventory.enterValidQuantity)
      return
    }
    if (qty > product.quantity) {
      toast.error(`${en.inventory.onlyRemainingPrefix} ${formatQuantity(product.quantity, quantityUnit)} ${en.inventory.onlyRemainingSuffix}`)
      return
    }
    if (isSoldFlow && (!price || price <= 0)) {
      toast.error(en.inventory.enterSaleRate)
      return
    }
    if (isSoldFlow && !buyerName.trim()) {
      toast.error(en.inventory.enterBuyerName)
      return
    }
    if (isSoldFlow && buyerGstin.trim() && !isValidGstin(buyerGstin)) {
      toast.error(en.profile.invalidGstin)
      return
    }
    if (!isSoldFlow && price < 0) {
      toast.error(en.inventory.negativeRate)
      return
    }
    if (expiryOptions.length > 0 && !selectedExpiry) {
      toast.error(en.inventory.selectExpiry)
      return
    }
    const selectedBatch = expiryOptions.find((batch) => batch.expiry === selectedExpiry)
    if (selectedBatch && qty > selectedBatch.quantity) {
      toast.error(`${en.inventory.onlyRemainingPrefix} ${formatQuantity(selectedBatch.quantity, quantityUnit)} ${en.inventory.batchRemainingSuffix}`)
      return
    }
    if (!ensureValidTransactionOptions(transactionOptions)) return
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
      let documentData: TransactionDocumentData

      if (isSoldFlow) {
        const saleRecord = await saveSale({
          userId: requireUserIdentityFromAuthUser(auth?.currentUser),
          items: [
            {
              productId: product.id,
              name: product.name,
              category: product.category,
              sku: product.sku,
              hsnCode: product.hsnCode,
              quantity: qty,
              quantityUnit,
              salePrice: effectivePrice,
              discount: 0,
              gstRate: transactionOptions.generateGstInvoice ? 18 : 0,
              note,
              batchNo: product.batchNo,
              locationId: locationId || undefined,
              locationName: locations.find((location) => location.id === locationId)?.name,
            },
          ],
              customer: {
                name: buyerName.trim(),
                phone: buyerPhone.trim(),
                gstin: buyerGstin.trim(),
              },
              sellerGstin: sellerProfile.gstin,
              sellerState: sellerProfile.state,
              paymentMode: "Cash",
          paymentStatus: "paid",
          amountPaid: effectivePrice * qty,
          note,
          reference: receiptNo,
          gstEnabled: transactionOptions.generateGstInvoice,
          entryMode: "inventory-sale",
        })
        documentData = buildSaleTransactionDocument(saleRecord, sellerProfile)

        if (transactionOptions.generateGstInvoice) {
          saveSaleInvoiceDraft(buildSaleInvoiceDraftFromRecord(saleRecord))
        }
      } else {
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
          batchNo: product.batchNo,
          locationId: locationId || undefined,
          paymentStatus: undefined,
          invoiceReceiptNo: receiptNo,
          transactionId: receiptNo,
          transactionType: "stock-adjustment",
        })

        documentData = buildStockOutDocument({
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
      }

      await runTransactionDocumentActions(documentData, transactionOptions)

      toast.success(isSoldFlow && transactionOptions.generateGstInvoice ? en.inventory.saleInvoiceDraftSaved : `-${formatQuantity(qty, quantityUnit)} ${en.inventory.stockRemoved}`)
      onClose()

      if (isSoldFlow && transactionOptions.generateGstInvoice) {
        router.push(DASHBOARD_ROUTES.gstInvoice)
      }
    } catch (err: unknown) {
      console.error("Stock out failed", err)
      toast.error(err instanceof Error ? err.message : en.inventory.somethingWentWrong)
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
        <datalist id="stock-out-customer-parties">
          {customerParties.map((party) => (
            <option key={party.id} value={party.name} />
          ))}
        </datalist>
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

        {showMore && (
          <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
            <span>{en.advancedInventory.location}</span>
            <select
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
              className={selectClass}
            >
              <option value="">{en.advancedInventory.defaultGodownName}</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </label>
        )}


        {Number(quantity) > 0 && Number(salePrice) > 0 && (
          <div className="flex justify-start sm:justify-end">
            <StatusBadge tone="success" className="rounded-2xl px-4 py-2 text-sm">
              {isSoldFlow ? en.inventory.totalSale : en.inventory.totalRecovery}: {formatCurrency(Number(quantity) * Number(salePrice))}
            </StatusBadge>
          </div>
        )}

        {isSoldFlow && (
          <>
            <Input
              label={<>{en.parties.customerPartyLabel} <span className="text-red-400">*</span></>}
              type="text"
              placeholder={en.inventory.buyerName}
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              datalist="stock-out-customer-parties"
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
        <TransactionActionPanel
          value={transactionOptions}
          onChange={setTransactionOptions}
          profileWarnings={profileWarnings}
          allowGstInvoice={isSoldFlow}
                    disabled={loading}
        />


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
    type: isSale ? "sale" : "receipt",
    title: isSale ? en.transaction.saleReceipt : en.transaction.stockAdjustmentReceipt,
    reference,
    date: formatIndianDateTime(new Date()),
    seller,
    partyLabel: isSale ? en.receipt.buyer : en.inventory.reason,
    party: isSale ? { name: buyerName, phone: buyerPhone, gstin: buyerGstin } : { name: reason },
    items: [{
      name: toTitleCase(product.name),
      description: [
        product.category,
        product.sku ? `${en.inventory.sku}: ${product.sku}` : "",
        product.batchNo ? `${en.advancedInventory.batchNo}: ${product.batchNo}` : "",
        note,
      ].filter(Boolean).join(" | "),
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
