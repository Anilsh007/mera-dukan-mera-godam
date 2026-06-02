"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeftRight, BadgeIndianRupee, RotateCcw } from "lucide-react"
import { useSearchParams } from "next/navigation"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import PageHeader from "@/app/components/ui/PageHeader"
import SummaryCard from "@/app/components/ui/SummaryCard"
import useFeatureGate from "@/app/hooks/useFeatureGate"
import useParties from "@/app/hooks/useParties"
import useProducts from "@/app/hooks/useProducts"
import useSales from "@/app/hooks/useSales"
import useProfile from "@/app/dashboard/profile/useProfile"
import { auth } from "@/app/lib/firebase"
import { formatCurrency } from "@/app/lib/formatters"
import { isValidGstin } from "@/app/lib/gst.utils"
import { notify as toast } from "@/app/lib/notifications"
import { buildBusinessDocumentProfile } from "@/app/lib/transactionDocument"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { createDraftItemFromProduct, fromSaleItem } from "@/app/dashboard/returns/returns.utils"
import { EMPTY_SALE_CUSTOMER, mapPartyToSaleCustomer } from "@/app/lib/sales/saleForm.utils"
import { calculateReturnLine, calculateReturnTotals } from "@/app/lib/returns/return.utils"
import { calculateSaleLine, calculateSaleTotals, type SaleDraftLineInput } from "@/app/lib/sales/sale.utils"
import { saveExchange } from "@/app/lib/exchange/exchange.service"
import { en } from "@/app/messages/en"
import type { Product, SaleCustomer, SalePaymentMode } from "@/app/lib/db"
import type { DraftItem } from "@/app/dashboard/returns/returns.types"

const PAYMENT_MODES: SalePaymentMode[] = ["Cash", "UPI", "Card", "Bank Transfer", "Credit", "Other"]

export default function ExchangePage() {
  const searchParams = useSearchParams()
  const { products } = useProducts()
  const { sales } = useSales()
  const { parties } = useParties("customer")
  const { profile } = useProfile()
  const returnsGate = useFeatureGate("returns")
  const salesGate = useFeatureGate("quickSales")

  const [linkedSaleId, setLinkedSaleId] = useState("")
  const [selectedPartyId, setSelectedPartyId] = useState("")
  const [customer, setCustomer] = useState<SaleCustomer>(EMPTY_SALE_CUSTOMER)
  const [returnedItems, setReturnedItems] = useState<DraftItem[]>([])
  const [replacementItems, setReplacementItems] = useState<DraftItem[]>([])
  const [search, setSearch] = useState("")
  const [gstEnabled, setGstEnabled] = useState(true)
  const [externalAmountPaid, setExternalAmountPaid] = useState("0")
  const [paymentMode, setPaymentMode] = useState<SalePaymentMode | "">("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  const sellerProfile = buildBusinessDocumentProfile(profile)
  const canCreate = returnsGate.allowed && salesGate.allowed && !returnsGate.loading && !salesGate.loading

  const saleOptions = useMemo(
    () =>
      sales
        .filter((sale) => sale.status !== "cancelled")
        .slice(0, 120)
        .map((sale) => ({
          value: sale.id,
          label: `${sale.receiptNo} - ${sale.customer?.name || en.sales.customerName}`,
        })),
    [sales],
  )

  const partyOptions = useMemo(() => parties.map((party) => ({ value: party.id, label: party.name })), [parties])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return products.slice(0, 10)
    return products
      .filter((product) =>
        [product.name, product.category, product.sku, product.hsnCode].filter(Boolean).join(" ").toLowerCase().includes(query),
      )
      .slice(0, 10)
  }, [products, search])

  const returnedCalculatedItems = useMemo(
    () =>
      returnedItems.map((item, index) => ({
        ...calculateReturnLine(
          {
            productId: item.productId,
            name: item.name,
            category: item.category,
            sku: item.sku,
            hsnCode: item.hsnCode,
            quantity: Number(item.quantity || 0),
            quantityUnit: item.quantityUnit,
            rate: Number(item.rate || 0),
            discount: Number(item.discount || 0),
            gstRate: Number(item.gstRate || 0),
            note: item.note,
          },
          {
            party: customer,
            sellerGstin: sellerProfile.gstin,
            sellerState: sellerProfile.state,
            gstEnabled,
          },
        ),
        id: `${item.productId || "manual"}-${index + 1}`,
      })),
    [customer, gstEnabled, returnedItems, sellerProfile.gstin, sellerProfile.state],
  )

  const replacementCalculatedItems = useMemo(
    () =>
      replacementItems.map((item) =>
        calculateSaleLine(
          {
            productId: item.productId || "",
            name: item.name,
            category: item.category,
            sku: item.sku,
            hsnCode: item.hsnCode,
            quantity: Number(item.quantity || 0),
            quantityUnit: item.quantityUnit,
            salePrice: Number(item.rate || 0),
            discount: Number(item.discount || 0),
            gstRate: Number(item.gstRate || 0),
            note: item.note,
          },
          {
            customer,
            sellerGstin: sellerProfile.gstin,
            sellerState: sellerProfile.state,
            gstEnabled,
          },
        ),
      ),
    [customer, gstEnabled, replacementItems, sellerProfile.gstin, sellerProfile.state],
  )

  const returnTotals = useMemo(() => calculateReturnTotals(returnedCalculatedItems), [returnedCalculatedItems])
  const replacementTotals = useMemo(() => calculateSaleTotals(replacementCalculatedItems), [replacementCalculatedItems])
  const netSettlement = replacementTotals.totalAmount - returnTotals.totalAmount
  const externalPaidNumber = Math.max(Number(externalAmountPaid || 0), 0)
  const dueAfterExchange = Math.max(replacementTotals.totalAmount - Math.min(returnTotals.totalAmount, replacementTotals.totalAmount) - externalPaidNumber, 0)
  const refundDue = Math.max(returnTotals.totalAmount - replacementTotals.totalAmount, 0)

  const handleLinkedSaleChange = useCallback((saleId: string) => {
    setLinkedSaleId(saleId)
    const sale = sales.find((entry) => entry.id === saleId)
    if (!sale) return
    setCustomer(sale.customer || EMPTY_SALE_CUSTOMER)
    setSelectedPartyId(sale.partyId || "")
    setReturnedItems(sale.items.map(fromSaleItem))
  }, [sales])

  const handlePartyChange = (partyId: string) => {
    setSelectedPartyId(partyId)
    const party = parties.find((entry) => entry.id === partyId)
    if (!party) return
    setCustomer(mapPartyToSaleCustomer(party))
  }

  const updateReturnedItem = (index: number, patch: Partial<DraftItem>) => {
    setReturnedItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  const updateReplacementItem = (index: number, patch: Partial<DraftItem>) => {
    setReplacementItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  const removeReturnedItem = (index: number) => {
    setReturnedItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const removeReplacementItem = (index: number) => {
    setReplacementItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const addReplacementProduct = (product: Product) => {
    setReplacementItems((current) => {
      const existing = current.find((item) => item.productId === product.id)
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: String(Number(item.quantity || 0) + 1) }
            : item,
        )
      }
      return [...current, createDraftItemFromProduct(product)]
    })
    setSearch("")
  }

  useEffect(() => {
    const saleId = searchParams.get("saleId")
    if (!saleId || linkedSaleId === saleId || !sales.length) return
    const sale = sales.find((entry) => entry.id === saleId)
    if (!sale) return
    queueMicrotask(() => {
      handleLinkedSaleChange(saleId)
    })
  }, [handleLinkedSaleChange, linkedSaleId, sales, searchParams])

  const buildReplacementPayload = (): SaleDraftLineInput[] =>
    replacementItems.map((item) => ({
      productId: item.productId || "",
      name: item.name,
      category: item.category,
      sku: item.sku,
      hsnCode: item.hsnCode,
      quantity: Number(item.quantity || 0),
      quantityUnit: item.quantityUnit,
      salePrice: Number(item.rate || 0),
      discount: Number(item.discount || 0),
      gstRate: Number(item.gstRate || 0),
      note: item.note,
    }))

  const resetForm = () => {
    setLinkedSaleId("")
    setSelectedPartyId("")
    setCustomer(EMPTY_SALE_CUSTOMER)
    setReturnedItems([])
    setReplacementItems([])
    setSearch("")
    setGstEnabled(true)
    setExternalAmountPaid("0")
    setPaymentMode("")
    setNote("")
  }

  const handleSave = async () => {
    if (!linkedSaleId) {
      toast.error(en.exchange.linkSaleRequired)
      return
    }
    if (!returnedItems.length) {
      toast.error(en.exchange.returnedItemRequired)
      return
    }
    if (!replacementItems.length) {
      toast.error(en.exchange.replacementItemRequired)
      return
    }
    if (customer.gstin?.trim() && !isValidGstin(customer.gstin)) {
      toast.error(en.profile.invalidGstin)
      return
    }
    if (netSettlement > 0 && externalPaidNumber > 0 && !paymentMode) {
      toast.error(en.sales.paymentModeRequired)
      return
    }

    try {
      setSaving(true)
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      const result = await saveExchange({
        userId,
        linkedSaleId,
        customer,
        returnedItems: returnedItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          category: item.category,
          sku: item.sku,
          hsnCode: item.hsnCode,
          quantity: Number(item.quantity || 0),
          quantityUnit: item.quantityUnit,
          rate: Number(item.rate || 0),
          discount: Number(item.discount || 0),
          gstRate: Number(item.gstRate || 0),
          note: item.note,
        })),
        replacementItems: buildReplacementPayload(),
        sellerGstin: sellerProfile.gstin,
        sellerState: sellerProfile.state,
        gstEnabled,
        externalAmountPaid: externalPaidNumber,
        paymentMode: paymentMode || "Other",
        note,
      })
      toast.success(en.exchange.saveSuccess.replace("{reference}", result.exchangeReference))
      resetForm()
    } catch (error) {
      console.error("Exchange save failed", error)
      toast.error(error instanceof Error ? error.message : en.exchange.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="space-y-5 p-3 sm:p-4 lg:p-6">
      <PageHeader title={en.pages.exchangeTitle} description={en.pages.exchangeDescription} />

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label={en.exchange.returnTotalLabel} value={formatCurrency(returnTotals.totalAmount)} icon={<RotateCcw size={18} />} />
        <SummaryCard label={en.exchange.replacementTotalLabel} value={formatCurrency(replacementTotals.totalAmount)} icon={<BadgeIndianRupee size={18} />} />
        <SummaryCard
          label={netSettlement >= 0 ? en.exchange.customerPaysLabel : en.exchange.refundDueLabel}
          value={formatCurrency(Math.abs(netSettlement))}
          icon={<ArrowLeftRight size={18} />}
        />
      </section>

      <section className="premium-surface space-y-5 rounded-3xl p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
            <span>{en.exchange.linkSale}</span>
            <select
              value={linkedSaleId}
              onChange={(event) => handleLinkedSaleChange(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]"
            >
              <option value="">{en.common.select}</option>
              {saleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
            <span>{en.exchange.party}</span>
            <select
              value={selectedPartyId}
              onChange={(event) => handlePartyChange(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]"
            >
              <option value="">{en.common.select}</option>
              {partyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)]">
            <input type="checkbox" checked={gstEnabled} onChange={(event) => setGstEnabled(event.target.checked)} className="h-4 w-4" />
            {en.exchange.applyGst}
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Input label={en.exchange.partyName} value={customer.name || ""} onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))} />
          <Input label={en.parties.mobile} value={customer.phone || ""} onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))} />
          <Input label={en.parties.gstin} value={customer.gstin || ""} onChange={(event) => setCustomer((current) => ({ ...current, gstin: event.target.value }))} />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="space-y-3 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.exchange.returnSectionTitle}</h2>
              <p className="text-sm text-[var(--text-secondary)]">{en.exchange.returnSectionHelp}</p>
            </div>
            {!returnedItems.length && (
              <div className="rounded-2xl border border-dashed border-[var(--border-input)] p-4 text-sm text-[var(--text-secondary)]">
                {en.exchange.selectSaleFirst}
              </div>
            )}
            {returnedItems.map((item, index) => (
              <div key={`${item.productId || "return"}-${index}`} className="space-y-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3">
                <Input label={en.receipt.product} value={item.name} disabled />
                <div className="grid gap-3 md:grid-cols-4">
                  <Input label={en.exchange.quantity} type="number" min="0" step="0.01" value={item.quantity} onChange={(event) => updateReturnedItem(index, { quantity: event.target.value })} />
                  <Input label={en.quickPurchase.quantityUnit} value={item.quantityUnit} onChange={(event) => updateReturnedItem(index, { quantityUnit: event.target.value })} />
                  <Input label={en.receipt.rate} type="number" min="0" step="0.01" value={item.rate} onChange={(event) => updateReturnedItem(index, { rate: event.target.value })} />
                  <Input label={en.estimates.gstRate} type="number" min="0" step="0.01" value={item.gstRate} onChange={(event) => updateReturnedItem(index, { gstRate: event.target.value })} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">
                    {en.receipt.total}: {formatCurrency(returnedCalculatedItems[index]?.lineTotal || 0)}
                  </span>
                  <Button variant="delete" title={en.exchange.removeItem} onClick={() => removeReturnedItem(index)} />
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.exchange.replacementSectionTitle}</h2>
              <p className="text-sm text-[var(--text-secondary)]">{en.exchange.replacementSectionHelp}</p>
            </div>
            <Input
              label={en.exchange.productSearch}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={en.exchange.productSearchPlaceholder}
            />
            {search.trim() && (
              <div className="grid gap-2">
                {filteredProducts.length ? (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addReplacementProduct(product)}
                      className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3 text-left transition hover:border-[var(--accent)]"
                    >
                      <span className="block font-semibold text-[var(--text-primary)]">{product.name}</span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {formatCurrency(product.price)} - {product.quantity} {product.quantityUnit}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">{en.exchange.noProductFound}</p>
                )}
              </div>
            )}
            {!replacementItems.length && (
              <div className="rounded-2xl border border-dashed border-[var(--border-input)] p-4 text-sm text-[var(--text-secondary)]">
                {en.exchange.addReplacementItemsHelp}
              </div>
            )}
            {replacementItems.map((item, index) => (
              <div key={`${item.productId || "replacement"}-${index}`} className="space-y-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3">
                <Input label={en.receipt.product} value={item.name} disabled />
                <div className="grid gap-3 md:grid-cols-4">
                  <Input label={en.exchange.quantity} type="number" min="0" step="0.01" value={item.quantity} onChange={(event) => updateReplacementItem(index, { quantity: event.target.value })} />
                  <Input label={en.quickPurchase.quantityUnit} value={item.quantityUnit} onChange={(event) => updateReplacementItem(index, { quantityUnit: event.target.value })} />
                  <Input label={en.receipt.rate} type="number" min="0" step="0.01" value={item.rate} onChange={(event) => updateReplacementItem(index, { rate: event.target.value })} />
                  <Input label={en.estimates.gstRate} type="number" min="0" step="0.01" value={item.gstRate} onChange={(event) => updateReplacementItem(index, { gstRate: event.target.value })} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">
                    {en.receipt.total}: {formatCurrency(replacementCalculatedItems[index]?.lineTotal || 0)}
                  </span>
                  <Button variant="delete" title={en.exchange.removeItem} onClick={() => removeReplacementItem(index)} />
                </div>
              </div>
            ))}
          </section>
        </div>

        <section className="grid gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-4 md:grid-cols-4">
          <Input label={en.exchange.returnTotalLabel} value={formatCurrency(returnTotals.totalAmount)} disabled />
          <Input label={en.exchange.replacementTotalLabel} value={formatCurrency(replacementTotals.totalAmount)} disabled />
          <Input
            label={netSettlement >= 0 ? en.exchange.additionalPaymentLabel : en.exchange.refundDueLabel}
            type="number"
            min="0"
            step="0.01"
            value={netSettlement >= 0 ? externalAmountPaid : String(refundDue)}
            onChange={(event) => {
              if (netSettlement < 0) return
              setExternalAmountPaid(event.target.value)
            }}
            disabled={netSettlement < 0}
          />
          <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
            <span>{en.sales.paymentMode}</span>
            <select
              value={paymentMode}
              onChange={(event) => setPaymentMode(event.target.value as SalePaymentMode)}
              className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]"
              disabled={netSettlement <= 0}
            >
              <option value="">{en.common.select}</option>
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </label>
          <Input label={en.exchange.balanceDueLabel} value={formatCurrency(dueAfterExchange)} disabled containerClassName="md:col-span-2" />
          <Input label={en.exchange.note} value={note} onChange={(event) => setNote(event.target.value)} placeholder={en.exchange.notePlaceholder} containerClassName="md:col-span-2" />
        </section>

        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">{en.exchange.finalSettlement}</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(Math.abs(netSettlement))}</p>
            <p className="text-xs text-[var(--text-secondary)]">
              {netSettlement >= 0 ? en.exchange.customerPaysHelp : en.exchange.refundHelp}
            </p>
          </div>
          <Button title={en.exchange.saveExchange} icon={<ArrowLeftRight size={18} />} onClick={handleSave} loading={saving} disabled={!canCreate} />
        </div>
      </section>
    </main>
  )
}
