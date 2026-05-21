"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { FileCheck2, FilePlus2, FileText, ReceiptText, Search, Trash2 } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import PageHeader from "@/app/components/ui/PageHeader"
import ShareActions from "@/app/components/ui/ShareActions"
import SummaryCard from "@/app/components/ui/SummaryCard"
import BaseSelectField from "@/app/components/ui/SelectField"
import useDebouncedValue from "@/app/hooks/useDebouncedValue"
import useEstimates from "@/app/hooks/useEstimates"
import useFeatureGate from "@/app/hooks/useFeatureGate"
import useParties from "@/app/hooks/useParties"
import useProducts from "@/app/hooks/useProducts"
import useProfile from "@/app/dashboard/profile/useProfile"
import { saveSaleInvoiceDraft } from "@/app/dashboard/gst-invoice/invoiceDraft.service"
import { buildEstimateInvoiceDraft, buildEstimateTransactionDocument } from "@/app/lib/estimates/estimate.documents"
import { convertEstimateToSale, markEstimateInvoiceDraftCreated, saveEstimate, updateEstimateStatus } from "@/app/lib/estimates/estimate.service"
import { calculateEstimateLine, calculateEstimateTotals, buildEstimateNumber, getEffectiveEstimateStatus } from "@/app/lib/estimates/estimate.utils"
import { auth } from "@/app/lib/firebase"
import { roundCurrency } from "@/app/lib/gst.utils"
import { notify as toast } from "@/app/lib/notifications"
import { formatCurrency, formatIndianDate } from "@/app/lib/formatters"
import { buildBusinessDocumentProfile } from "@/app/lib/transactionDocument"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { en } from "@/app/messages/en"
import {
  EMPTY_SALE_CUSTOMER,
  SALE_PAYMENT_MODES,
  SALE_PAYMENT_STATUSES,
  buildSaleDraftLineFromCartItem,
  buildSaleDraftLinesFromCart,
  createSaleCartItemDraftFromProduct,
  mapPartyToSaleCustomer,
  type SaleCartItemDraft,
} from "@/app/lib/sales/saleForm.utils"
import { normalizePaidAmount } from "@/app/lib/sales/sale.utils"
import type { EstimateRecord, EstimateStatus, Product, SaleCustomer, SalePaymentMode, SalePaymentStatus } from "@/app/lib/db"
import { DASHBOARD_ROUTES } from "@/app/lib/navigation/dashboardRoutes"

const SEARCH_LIMIT = 8
const STATUS_OPTIONS: EstimateStatus[] = ["draft", "sent", "accepted", "rejected", "expired"]

type EstimateCartItem = SaleCartItemDraft

type ConvertState = {
  estimate: EstimateRecord
  paymentMode: SalePaymentMode
  paymentStatus: SalePaymentStatus
  amountPaid: string
  note: string
}

export default function EstimatesPage() {
  const router = useRouter()
  const { products, loading: productsLoading } = useProducts()
  const { parties: customerParties } = useParties("customer")
  const { profile } = useProfile()
  const { estimates, loading: estimatesLoading } = useEstimates()
  const estimateGate = useFeatureGate("estimates")
  const printShareGate = useFeatureGate("printShareDownload")

  const [estimateNo, setEstimateNo] = useState(() => buildEstimateNumber())
  const [estimateDate, setEstimateDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [expiryDate, setExpiryDate] = useState("")
  const [status, setStatus] = useState<EstimateStatus>("draft")
  const [selectedPartyId, setSelectedPartyId] = useState("")
  const [customer, setCustomer] = useState<SaleCustomer>(EMPTY_SALE_CUSTOMER)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 160)
  const [cart, setCart] = useState<EstimateCartItem[]>([])
  const [gstEnabled, setGstEnabled] = useState(true)
  const [note, setNote] = useState("")
  const [terms, setTerms] = useState(() => profile.settings.termsAndConditions || "")
  const [saving, setSaving] = useState(false)
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null)
  const [convertState, setConvertState] = useState<ConvertState | null>(null)
  const [converting, setConverting] = useState(false)

  const sellerProfile = buildBusinessDocumentProfile(profile)
  const printShareAllowed = printShareGate.allowed && !printShareGate.loading
  const canCreateEstimate = estimateGate.allowed && !estimateGate.loading

  const filteredProducts = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    if (!query) return products.slice(0, SEARCH_LIMIT)

    return products
      .map((product) => {
        const haystack = [product.name, product.category, product.sku, product.hsnCode]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        const score = product.name.toLowerCase().startsWith(query) ? 2 : haystack.includes(query) ? 1 : 0
        return { product, score }
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || left.product.name.localeCompare(right.product.name))
      .slice(0, SEARCH_LIMIT)
      .map((entry) => entry.product)
  }, [debouncedSearch, products])

  const calculatedItems = useMemo(
    () =>
      cart.map((item, index) => ({
        ...calculateEstimateLine(
          buildSaleDraftLineFromCartItem(item),
          {
            customer,
            sellerGstin: sellerProfile.gstin,
            sellerState: sellerProfile.state,
            gstEnabled,
          },
        ),
        id: `${item.productId}-${index + 1}`,
      })),
    [cart, customer, gstEnabled, sellerProfile.gstin, sellerProfile.state],
  )

  const totals = useMemo(() => calculateEstimateTotals(calculatedItems), [calculatedItems])

  const resetForm = () => {
    setEstimateNo(buildEstimateNumber())
    setEstimateDate(new Date().toISOString().slice(0, 10))
    setExpiryDate("")
    setStatus("draft")
    setSelectedPartyId("")
    setCustomer(EMPTY_SALE_CUSTOMER)
    setSearch("")
    setCart([])
    setGstEnabled(true)
    setNote("")
    setTerms(profile.settings.termsAndConditions || "")
  }

  const addProductToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id)
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: String(roundCurrency(Number(item.quantity || 0) + 1)) }
            : item,
        )
      }

      return [...current, createSaleCartItemDraftFromProduct(product)]
    })
    setSearch("")
  }

  const updateCartItem = (productId: string, patch: Partial<EstimateCartItem>) => {
    setCart((current) => current.map((item) => (item.productId === productId ? { ...item, ...patch } : item)))
  }

  const removeCartItem = (productId: string) => {
    setCart((current) => current.filter((item) => item.productId !== productId))
  }

  const handlePartyChange = (partyId: string) => {
    setSelectedPartyId(partyId)
    const party = customerParties.find((entry) => entry.id === partyId)
    if (!party) return
    setCustomer(mapPartyToSaleCustomer(party))
  }

  const handleSaveEstimate = async () => {
    if (!canCreateEstimate) {
      toast.error(en.subscription.subscriptionRequired)
      return
    }
    if (!cart.length) {
      toast.warning(en.estimates.addAtLeastOneItem)
      return
    }

    try {
      setSaving(true)
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      await saveEstimate({
        userId,
        estimateNo,
        estimateDate,
        estimateDateTime: `${estimateDate}T${new Date().toTimeString().slice(0, 8)}`,
        expiryDate,
        status,
        customer,
        items: buildSaleDraftLinesFromCart(cart),
        sellerGstin: sellerProfile.gstin,
        sellerState: sellerProfile.state,
        note,
        terms,
        gstEnabled,
      })
      toast.success(en.estimates.saveSuccess)
      resetForm()
    } catch (error) {
      console.error("Estimate save failed", error)
      toast.error(error instanceof Error ? error.message : en.estimates.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (estimate: EstimateRecord, nextStatus: EstimateStatus) => {
    if (estimate.status === nextStatus) return
    try {
      setStatusSavingId(estimate.id)
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      await updateEstimateStatus({ estimateId: estimate.id, userId, status: nextStatus })
      toast.success(en.estimates.statusUpdated)
    } catch (error) {
      console.error("Estimate status update failed", error)
      toast.error(error instanceof Error ? error.message : en.estimates.statusUpdateFailed)
    } finally {
      setStatusSavingId(null)
    }
  }

  const handleCreateGstDraft = async (estimate: EstimateRecord) => {
    if (!estimate.customer?.name?.trim()) {
      toast.warning(en.estimates.gstDraftNeedsCustomer)
      return
    }
    try {
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      saveSaleInvoiceDraft(buildEstimateInvoiceDraft(estimate))
      await markEstimateInvoiceDraftCreated({ estimateId: estimate.id, userId })
      toast.success(en.estimates.gstDraftReady)
      router.push(DASHBOARD_ROUTES.gstInvoice)
    } catch (error) {
      console.error("Estimate GST draft failed", error)
      toast.error(error instanceof Error ? error.message : en.estimates.gstDraftFailed)
    }
  }

  const openConvertModal = (estimate: EstimateRecord) => {
    setConvertState({
      estimate,
      paymentMode: "Cash",
      paymentStatus: "paid",
      amountPaid: String(estimate.totalAmount),
      note: "",
    })
  }

  const handleConvertToSale = async () => {
    if (!convertState) return
    try {
      setConverting(true)
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      const amountPaid = normalizePaidAmount(
        convertState.estimate.totalAmount,
        convertState.paymentStatus,
        Number(convertState.amountPaid || 0),
      )
      await convertEstimateToSale({
        estimateId: convertState.estimate.id,
        userId,
        paymentMode: convertState.paymentMode,
        paymentStatus: convertState.paymentStatus,
        amountPaid,
        note: convertState.note,
        sellerGstin: sellerProfile.gstin,
        sellerState: sellerProfile.state,
      })
      toast.success(en.estimates.convertSuccess)
      setConvertState(null)
    } catch (error) {
      console.error("Estimate conversion failed", error)
      toast.error(error instanceof Error ? error.message : en.estimates.convertFailed)
    } finally {
      setConverting(false)
    }
  }

  const visibleEstimates = useMemo(
    () => estimates.map((estimate) => ({ ...estimate, effectiveStatus: getEffectiveEstimateStatus(estimate) })),
    [estimates],
  )

  return (
    <div className="dashboard-page space-y-6 pb-8">
      <PageHeader
        eyebrow={en.navigation.estimates}
        title={en.pages.estimatesTitle}
        description={en.pages.estimatesDescription}
        actions={<Button type="button" variant="outline" title={en.estimates.stockSafeHelp} icon={<FileCheck2 size={16} />} disabled className="w-full sm:w-auto" />}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SummaryCard label={en.estimates.taxableAmount} value={formatCurrency(totals.taxableAmount)} icon={<ReceiptText size={18} />} />
        <SummaryCard label={en.estimates.totalGst} value={formatCurrency(totals.gstAmount)} icon={<FileText size={18} />} />
        <SummaryCard label={en.estimates.grandTotal} value={formatCurrency(totals.totalAmount)} tone="emerald" icon={<FileCheck2 size={18} />} />
      </section>

      {!canCreateEstimate && !estimateGate.loading ? (
        <section className="rounded-[28px] border border-amber-300/40 bg-amber-50 p-4 text-sm text-amber-800 shadow-[var(--shadow-card)] dark:bg-amber-500/10 dark:text-amber-100">
          {en.subscription.readOnlyExpiredMessage}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.65fr)]">
        <div className="space-y-5">
          <section className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{en.estimates.createTitle}</p>
                <h2 className="mt-1 text-xl font-bold text-[var(--text-primary)]">{en.estimates.documentTitle}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.estimates.createDescription}</p>
              </div>
              <label className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]">
                <input type="checkbox" checked={gstEnabled} onChange={(event) => setGstEnabled(event.target.checked)} />
                {en.estimates.applyGst}
              </label>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
              <Field label={en.estimates.estimateNo} value={estimateNo} onChange={setEstimateNo} />
              <Field label={en.estimates.estimateDate} type="date" value={estimateDate} onChange={setEstimateDate} />
              <Field label={en.estimates.expiryDate} type="date" value={expiryDate} onChange={setExpiryDate} />
              <SelectField
                label={en.estimates.statusLabel}
                value={status}
                onChange={(value) => setStatus(value as EstimateStatus)}
                options={STATUS_OPTIONS.map((entry) => ({ value: entry, label: en.estimates.statuses[entry] }))}
              />
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.estimates.customerDetails}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.estimates.customerHelp}</p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <SelectField
                label={en.estimates.selectCustomer}
                value={selectedPartyId}
                onChange={handlePartyChange}
                options={[
                  { value: "", label: en.estimates.walkInCustomer },
                  ...customerParties.map((party) => ({ value: party.id, label: party.name })),
                ]}
              />
              <Field label={en.estimates.customerName} placeholder={en.estimates.customerNamePlaceholder} value={customer.name || ""} onChange={(value) => setCustomer((current) => ({ ...current, name: value }))} />
              <Field label={en.estimates.customerPhone} value={customer.phone || ""} onChange={(value) => setCustomer((current) => ({ ...current, phone: value }))} />
              <Field label={en.estimates.customerEmail} type="email" value={customer.email || ""} onChange={(value) => setCustomer((current) => ({ ...current, email: value }))} />
              <Field label={en.estimates.customerGstin} value={customer.gstin || ""} onChange={(value) => setCustomer((current) => ({ ...current, gstin: value.toUpperCase() }))} />
              <Field label={en.estimates.customerState} value={customer.state || ""} onChange={(value) => setCustomer((current) => ({ ...current, state: value }))} />
              <Field label={en.estimates.customerAddress} value={customer.address || ""} onChange={(value) => setCustomer((current) => ({ ...current, address: value }))} />
              <Field label={en.estimates.customerCity} value={customer.city || ""} onChange={(value) => setCustomer((current) => ({ ...current, city: value }))} />
              <Field label={en.estimates.customerPincode} value={customer.pincode || ""} onChange={(value) => setCustomer((current) => ({ ...current, pincode: value }))} />
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
            <label className="block text-sm font-semibold text-[var(--text-primary)]" htmlFor="estimate-product-search">{en.estimates.productSearch}</label>
            <div className="relative mt-2">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input id="estimate-product-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={en.estimates.productSearchPlaceholder} className="pl-9" />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-label={en.estimates.searchResults}>
              {filteredProducts.map((product) => (
                <button key={product.id} type="button" onClick={() => addProductToCart(product)} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--button-shadow)]">
                  <p className="font-semibold text-[var(--text-primary)]">{product.name}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{[product.category, product.sku].filter(Boolean).join(" | ") || en.common.notAvailable}</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--accent)]">{formatCurrency(product.price)}</p>
                </button>
              ))}
              {!productsLoading && debouncedSearch && filteredProducts.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[var(--border-card)] p-4 text-sm text-[var(--text-secondary)]">{en.sales.productNotFound}</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.estimates.itemsTitle}</h2>
            {cart.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--border-card)] p-5 text-center">
                <p className="font-semibold text-[var(--text-primary)]">{en.estimates.emptyItemsTitle}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.estimates.emptyItemsDescription}</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {cart.map((item, index) => {
                  const line = calculatedItems[index]
                  return (
                    <article key={item.productId} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--text-primary)]">{item.name}</p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">{[item.category, item.sku].filter(Boolean).join(" | ") || en.common.notAvailable}</p>
                        </div>
                        <Button type="button" variant="delete" ariaLabel={en.estimates.removeItem} icon={<Trash2 size={16} />} onClick={() => removeCartItem(item.productId)} className="min-h-9 px-2 py-2" />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
                        <Field label={en.estimates.quantity} type="number" value={item.quantity} onChange={(value) => updateCartItem(item.productId, { quantity: value })} />
                        <Field label={en.estimates.price} type="number" value={item.salePrice} onChange={(value) => updateCartItem(item.productId, { salePrice: value })} />
                        <Field label={en.estimates.discount} type="number" value={item.discount} onChange={(value) => updateCartItem(item.productId, { discount: value })} />
                        <Field label={en.estimates.gstRate} type="number" value={item.gstRate} onChange={(value) => updateCartItem(item.productId, { gstRate: value })} />
                        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-3">
                          <p className="text-xs font-medium text-[var(--text-muted)]">{en.receipt.total}</p>
                          <p className="mt-1 font-bold text-[var(--text-primary)]">{formatCurrency(line?.lineTotal || 0)}</p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="sticky top-4 rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.estimates.totals}</h2>
            <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
              <SummaryRow label={en.estimates.taxableAmount} value={formatCurrency(totals.taxableAmount)} />
              <SummaryRow label={en.estimates.totalGst} value={formatCurrency(totals.gstAmount)} />
              <SummaryRow label={en.estimates.grandTotal} value={formatCurrency(totals.totalAmount)} strong />
            </div>
            <div className="mt-4 space-y-3">
              <TextAreaField label={en.estimates.terms} value={terms} onChange={setTerms} placeholder={en.estimates.termsPlaceholder} />
              <TextAreaField label={en.estimates.notes} value={note} onChange={setNote} placeholder={en.estimates.notesPlaceholder} />
            </div>
            <Button type="button" variant="primary" title={en.estimates.saveEstimate} icon={<FilePlus2 size={16} />} loading={saving} disabled={!canCreateEstimate || cart.length === 0} onClick={handleSaveEstimate} className="mt-4 w-full" />
          </section>
        </aside>
      </section>

      <section className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{en.estimates.savedListTitle}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.estimates.stockSafeHelp}</p>
          </div>
        </div>

        {estimatesLoading ? (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">{en.common.loading}</p>
        ) : visibleEstimates.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--border-card)] p-5 text-center">
            <p className="font-semibold text-[var(--text-primary)]">{en.estimates.noEstimatesTitle}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.estimates.noEstimatesDescription}</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {visibleEstimates.map((estimate) => {
              const effectiveStatus = estimate.effectiveStatus
              const canConvert = effectiveStatus !== "converted" && effectiveStatus !== "rejected" && effectiveStatus !== "expired"
              return (
                <article key={estimate.id} className="rounded-[24px] border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{en.estimates.estimateNo}</p>
                      <h3 className="mt-1 text-lg font-bold text-[var(--text-primary)]">{estimate.estimateNo}</h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{estimate.customer?.name || en.common.notAvailable}</p>
                    </div>
                    <StatusPill status={effectiveStatus} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[var(--text-secondary)]">
                    <SummaryRow label={en.estimates.estimateDate} value={formatIndianDate(estimate.estimateDate)} />
                    <SummaryRow label={en.estimates.expiryDate} value={estimate.expiryDate ? formatIndianDate(estimate.expiryDate) : en.common.notAvailable} />
                    <SummaryRow label={en.sales.totalItems} value={String(estimate.items.length)} />
                    <SummaryRow label={en.estimates.grandTotal} value={formatCurrency(estimate.totalAmount)} strong />
                  </div>

                  <div className="mt-4">
                    <SelectField
                      label={en.estimates.updateStatus}
                      value={estimate.status}
                      onChange={(value) => handleStatusChange(estimate, value as EstimateStatus)}
                      disabled={statusSavingId === estimate.id || estimate.status === "converted"}
                      options={STATUS_OPTIONS.map((entry) => ({ value: entry, label: en.estimates.statuses[entry] }))}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" variant="success" title={en.estimates.convertToSale} icon={<ReceiptText size={16} />} onClick={() => openConvertModal(estimate)} disabled={!canConvert} />
                    <Button type="button" variant="secondary" title={en.estimates.createGstDraft} icon={<FileText size={16} />} onClick={() => handleCreateGstDraft(estimate)} disabled={effectiveStatus === "rejected"} />
                  </div>

                  <div className="mt-4">
                    {printShareAllowed ? (
                      <ShareActions document={buildEstimateTransactionDocument(estimate, sellerProfile)} filename={`${estimate.estimateNo}.pdf`} />
                    ) : (
                      <p className="rounded-2xl border border-amber-300/40 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-100">{en.estimates.printShareLocked}</p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {convertState ? (
        <Modal
          open
          title={en.estimates.convertToSaleTitle}
          description={en.estimates.convertToSaleDescription}
          onClose={() => setConvertState(null)}
          primaryLabel={en.estimates.convertToSale}
          primaryVariant="success"
          cancelLabel={en.common.keepEditing}
          loading={converting}
          onPrimary={handleConvertToSale}
          size="md"
        >
          <div className="space-y-4">
            <p className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-3 text-sm text-[var(--text-secondary)]">{en.estimates.conversionPaymentHelp}</p>
            <SummaryRow label={en.estimates.estimateNo} value={convertState.estimate.estimateNo} />
            <SummaryRow label={en.estimates.grandTotal} value={formatCurrency(convertState.estimate.totalAmount)} strong />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SelectField
                label={en.sales.paymentMode}
                value={convertState.paymentMode}
                onChange={(value) => setConvertState((current) => current ? { ...current, paymentMode: value as SalePaymentMode } : current)}
                options={SALE_PAYMENT_MODES}
              />
              <SelectField
                label={en.sales.paymentStatus}
                value={convertState.paymentStatus}
                onChange={(value) => setConvertState((current) => current ? { ...current, paymentStatus: value as SalePaymentStatus, amountPaid: value === "paid" ? String(current.estimate.totalAmount) : value === "unpaid" ? "0" : current.amountPaid } : current)}
                options={SALE_PAYMENT_STATUSES}
              />
              <Field label={en.sales.amountPaid} type="number" value={convertState.amountPaid} onChange={(value) => setConvertState((current) => current ? { ...current, amountPaid: value } : current)} />
              <Field label={en.estimates.notes} value={convertState.note} onChange={(value) => setConvertState((current) => current ? { ...current, note: value } : current)} />
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}


function StatusPill({ status }: { status: EstimateStatus }) {
  const tone =
    status === "accepted" || status === "converted"
      ? "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-100"
      : status === "rejected" || status === "expired"
        ? "border-rose-300/60 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-100"
        : "border-amber-300/60 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-100"

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>{en.estimates.statuses[status]}</span>
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <label className="block text-sm font-medium text-[var(--text-primary)]">
      <span>{label}</span>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1" />
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="block text-sm font-medium text-[var(--text-primary)]">
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 min-h-24 w-full rounded-2xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  disabled?: boolean
}) {
  return (
    <BaseSelectField
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      options={options}
      className="rounded-2xl text-sm"
    />
  )
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] px-3 py-2">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className={strong ? "font-bold text-[var(--text-primary)]" : "font-semibold text-[var(--text-primary)]"}>{value}</span>
    </div>
  )
}
