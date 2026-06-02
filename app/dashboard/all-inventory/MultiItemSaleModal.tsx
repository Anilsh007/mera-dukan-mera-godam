"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { notify as toast } from "@/app/lib/notifications"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import StatusBadge from "@/app/components/ui/StatusBadge"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import type { Product } from "@/app/lib/db"
import { buildBuyerSuggestions, matchBuyerSuggestion } from "@/app/dashboard/gst-invoice/buyerSuggestions"
import { saveSaleInvoiceDraft } from "@/app/dashboard/gst-invoice/invoiceDraft.service"
import useProfile from "@/app/dashboard/profile/useProfile"
import { formatCurrency } from "@/app/lib/formatters"
import { formatQuantity, normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import { isValidGstin } from "@/app/lib/gst.utils"
import {
  buildBusinessDocumentProfile,
  getProfileDocumentWarnings,
  type TransactionOptionFlags,
} from "@/app/lib/transactionDocument"
import { en } from "@/app/messages/en"
import {
  createTransactionOptions,
  runTransactionDocumentActions,
  ensureValidTransactionOptions,
} from "@/app/lib/transactionActions"
import { saveSale } from "@/app/lib/sales/sale.service"
import { buildSaleInvoiceDraftFromRecord, buildSaleTransactionDocument } from "@/app/lib/sales/sale.documents"
import { auth } from "@/app/lib/firebase"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import useParties from "@/app/hooks/useParties"
import useAuthLiveQuery from "@/app/hooks/useAuthLiveQuery"
import { DASHBOARD_ROUTES } from "@/app/lib/navigation/dashboardRoutes"
import { db } from "@/app/lib/db"

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
  const { parties: customerParties } = useParties("customer")
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
  const [transactionOptions, setTransactionOptions] = useState<TransactionOptionFlags>(
    createTransactionOptions({
      generateGstInvoice: true,
      printReceipt: true,
    })
  )
  const [showMore, setShowMore] = useState(false)
  const { data: buyerInvoices } = useAuthLiveQuery(
    [],
    async (userId) => db.invoices.where("userId").equals(userId).toArray(),
    (error) => {
      console.error("Buyer history load failed", error)
      toast.warning(en.gstInvoice.buyerHistoryLoadFailed, { id: "buyer-history-load-failed" })
    },
  )
  const buyerSuggestions = useMemo(() => buildBuyerSuggestions(buyerInvoices), [buyerInvoices])

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

  const applyPartySelection = (value: string) => {
    const selected = customerParties.find((party) => party.name === value)
    if (!selected) {
      applyBuyerSuggestion("name", value)
      return
    }
    setBuyer({
      name: selected.name,
      gstin: selected.gstin || "",
      phone: selected.mobile || "",
      email: selected.email || "",
      address: selected.address || "",
      city: selected.city || "",
      state: selected.state || "",
      pincode: selected.pincode || "",
      note: buyer.note,
    })
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

    if (!ensureValidTransactionOptions(transactionOptions)) return

    try {
      setLoading(true)
      const saleRecord = await saveSale({
        userId: requireUserIdentityFromAuthUser(auth?.currentUser),
        items: validLines.map((line) => ({
          productId: line.productId,
          name: line.name,
          category: line.category,
          sku: line.sku,
          hsnCode: line.hsnCode,
          quantity: Number(line.quantity),
          quantityUnit: line.quantityUnit,
          salePrice: Number(line.salePrice),
          discount: 0,
          gstRate: Number(line.gstRate || 18),
          note: buyer.note.trim() || undefined,
        })),
        customer: {
          name: buyer.name.trim(),
          gstin: buyer.gstin.trim(),
          phone: buyer.phone.trim(),
          email: buyer.email.trim(),
          address: buyer.address.trim(),
          city: buyer.city.trim(),
          state: buyer.state.trim(),
          pincode: buyer.pincode.trim(),
        },
        sellerGstin: sellerProfile.gstin,
        sellerState: sellerProfile.state,
        paymentMode: "Cash",
        paymentStatus: "paid",
        amountPaid: grandTotal,
        note: buyer.note.trim() || undefined,
        gstEnabled: transactionOptions.generateGstInvoice,
        entryMode: "inventory-sale",
      })

      if (transactionOptions.generateGstInvoice) {
        saveSaleInvoiceDraft(buildSaleInvoiceDraftFromRecord(saleRecord))
      }

      await runTransactionDocumentActions(buildSaleTransactionDocument(saleRecord, sellerProfile), transactionOptions)

      toast.success(`${en.inventory.saleSavedItemsPrefix} ${validLines.length} ${validLines.length > 1 ? en.inventory.saleSavedItemsPlural : en.inventory.saleSavedItemsSingular}`)
      onSuccess()
      onClose()

      if (transactionOptions.generateGstInvoice) {
        router.push(DASHBOARD_ROUTES.gstInvoice)
      }
    } catch (error: unknown) {
      console.error("Multi item sale failed", error)
      toast.error(error instanceof Error ? error.message : en.inventory.saleSaveFailed)
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
        {customerParties.map((party) => (
          <option key={party.id} value={party.name} />
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
        <Input label={<>{en.parties.customerPartyLabel} <span className="text-red-400">*</span></>} value={buyer.name} onChange={(e) => applyPartySelection(e.target.value)} datalist="sale-buyer-name-suggestions" />
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
                <p className="mt-1 font-semibold text-emerald-600">{formatCurrency(Number(line.quantity) * Number(line.salePrice))}</p>
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
                  {formatCurrency(Number(line.quantity) * Number(line.salePrice))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TransactionActionPanel
        value={transactionOptions}
        onChange={setTransactionOptions}
        profileWarnings={sellerWarnings}
        allowGstInvoice
        disabled={loading}
        className="mt-4"
      />

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/30 dark:bg-emerald-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{validLines.length} {validLines.length > 1 ? en.inventory.readySuffixPlural : en.inventory.readySuffixSingular}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-600">{en.inventory.multiSaleHint}</p>
        </div>
        <StatusBadge tone="success" className="rounded-2xl px-4 py-2 text-sm">
          {formatCurrency(grandTotal)}
        </StatusBadge>
      </div>
    </Modal>
  )
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
