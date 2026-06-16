"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import PageHeader from "@/app/components/ui/PageHeader"
import SuspendedAccessBanner from "@/app/components/subscription/SuspendedAccessBanner"
import useDebouncedValue from "@/app/hooks/useDebouncedValue"
import useEstimates from "@/app/hooks/useEstimates"
import useFeatureGate from "@/app/hooks/useFeatureGate"
import useParties from "@/app/hooks/useParties"
import useProducts from "@/app/hooks/useProducts"
import useProfile from "@/app/dashboard/profile/useProfile"
import { saveSaleInvoiceDraft } from "@/app/dashboard/gst-invoice/invoiceDraft.service"
import { buildEstimateInvoiceDraft } from "@/app/lib/estimates/estimate.documents"
import { convertEstimateToSale, markEstimateInvoiceDraftCreated, saveEstimate, updateEstimateStatus } from "@/app/lib/estimates/estimate.service"
import { calculateEstimateLine, calculateEstimateTotals, buildEstimateNumber, getEffectiveEstimateStatus } from "@/app/lib/estimates/estimate.utils"
import { auth } from "@/app/lib/firebase"
import { roundCurrency } from "@/app/lib/gst.utils"
import { notify as toast } from "@/app/lib/notifications"
import { buildBusinessDocumentProfile } from "@/app/lib/transactionDocument"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { en } from "@/app/messages/en"
import {
  EMPTY_SALE_CUSTOMER,
  buildSaleDraftLineFromCartItem,
  buildSaleDraftLinesFromCart,
  createSaleCartItemDraftFromProduct,
  mapPartyToSaleCustomer,
} from "@/app/lib/sales/saleForm.utils"
import { normalizePaidAmount } from "@/app/lib/sales/sale.utils"
import type { EstimateRecord, EstimateStatus, Product, SaleCustomer } from "@/app/lib/db"
import { DASHBOARD_ROUTES } from "@/app/lib/navigation/dashboardRoutes"
import EstimatesWorkspace from "./EstimatesWorkspace"
import EstimatesListSection from "./EstimatesListSection"
import EstimateConvertModal from "./EstimateConvertModal"
import type { ConvertState, EstimateCartItem } from "./estimates.types"

const SEARCH_LIMIT = 8
//const STATUS_OPTIONS: EstimateStatus[] = ["draft", "sent", "accepted", "rejected", "expired"]

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
  const [status, setStatus] = useState<EstimateStatus | "">("")
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

  const visibleEstimates = useMemo(
    () => estimates.map((estimate) => ({ ...estimate, effectiveStatus: getEffectiveEstimateStatus(estimate) })),
    [estimates],
  )

  const resetForm = () => {
    setEstimateNo(buildEstimateNumber())
    setEstimateDate(new Date().toISOString().slice(0, 10))
    setExpiryDate("")
      setStatus("")
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
        customer,
        items: buildSaleDraftLinesFromCart(cart),
        sellerGstin: sellerProfile.gstin,
        sellerState: sellerProfile.state,
        note,
        terms,
        gstEnabled,
        status: status || undefined,
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
      paymentMode: "",
      paymentStatus: "",
      amountPaid: "",
      note: "",
    })
  }

  const handleConvertToSale = async () => {
    if (!convertState) return
    if (!convertState.paymentMode) {
      toast.error(en.sales.paymentModeRequired)
      return
    }
    if (!convertState.paymentStatus) {
      toast.error(en.sales.paymentStatusRequired)
      return
    }
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

  return (
    <div className="dashboard-page space-y-6 pb-8">
      <PageHeader title={en.pages.estimatesTitle} description={en.pages.estimatesDescription}/>
      {estimateGate.subscriptionExpired ? (
        <SuspendedAccessBanner
          description={en.subscription.readOnlyExpiredMessage}
          featureLabel={en.subscription.features.estimates}
          usage={estimateGate.usage}
          limit={typeof estimateGate.limit === "number" ? estimateGate.limit : undefined}
          onOpenUpgrade={() => router.push("/pricing")}
        />
      ) : null}

      {!estimateGate.subscriptionExpired && !canCreateEstimate && !estimateGate.loading ? (
        <section className="rounded-[28px] border border-amber-300/40 bg-amber-50 p-4 text-sm text-amber-800 shadow-[var(--shadow-card)] dark:bg-amber-500/10 dark:text-amber-100">
          {en.subscription.readOnlyExpiredMessage}
        </section>
      ) : null}

      <EstimatesWorkspace
        estimateNo={estimateNo}
        setEstimateNo={setEstimateNo}
        estimateDate={estimateDate}
        setEstimateDate={setEstimateDate}
        expiryDate={expiryDate}
        setExpiryDate={setExpiryDate}
        status={status}
        setStatus={setStatus}
        selectedPartyId={selectedPartyId}
        onPartyChange={handlePartyChange}
        customer={customer}
        setCustomer={setCustomer}
        search={search}
        setSearch={setSearch}
        filteredProducts={filteredProducts}
        addProductToCart={addProductToCart}
        productsLoading={productsLoading}
        cart={cart}
        calculatedItems={calculatedItems}
        updateCartItem={updateCartItem}
        removeCartItem={removeCartItem}
        gstEnabled={gstEnabled}
        setGstEnabled={setGstEnabled}
        totals={totals}
        note={note}
        setNote={setNote}
        terms={terms}
        setTerms={setTerms}
        canCreateEstimate={canCreateEstimate}
        saving={saving}
        onSaveEstimate={handleSaveEstimate}
        customerParties={customerParties}
      />

      <EstimatesListSection
        estimates={visibleEstimates}
        sellerProfile={sellerProfile}
        printShareAllowed={printShareAllowed}
        statusSavingId={statusSavingId}
        onStatusChange={handleStatusChange}
        onCreateGstDraft={handleCreateGstDraft}
        onOpenConvertModal={openConvertModal}
      />

      <EstimateConvertModal
        convertState={convertState}
        converting={converting}
        onClose={() => setConvertState(null)}
        onPrimary={handleConvertToSale}
        onChange={setConvertState}
      />
    </div>
  )
}
