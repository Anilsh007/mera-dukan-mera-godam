"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowUpRight, FileText, RotateCcw } from "lucide-react"
import { useSearchParams } from "next/navigation"
import PageHeader from "@/app/components/ui/PageHeader"
import SuspendedAccessBanner from "@/app/components/subscription/SuspendedAccessBanner"
import SummaryCard from "@/app/components/ui/SummaryCard"
import useDebouncedValue from "@/app/hooks/useDebouncedValue"
import useFeatureGate from "@/app/hooks/useFeatureGate"
import useParties from "@/app/hooks/useParties"
import useProducts from "@/app/hooks/useProducts"
import usePurchases from "@/app/hooks/usePurchases"
import useReturnDocuments from "@/app/hooks/useReturnDocuments"
import useSales from "@/app/hooks/useSales"
import useProfile from "@/app/dashboard/profile/useProfile"
import { auth } from "@/app/lib/firebase"
import { formatCurrency } from "@/app/lib/formatters"
import { roundCurrency } from "@/app/lib/gst.utils"
import { notify as toast } from "@/app/lib/notifications"
import { saveReturnDocument } from "@/app/lib/returns/return.service"
import {
  buildReturnDocumentNumber,
  calculateReturnLine,
  calculateReturnTotals,
  getDefaultStockImpact,
} from "@/app/lib/returns/return.utils"
import { buildBusinessDocumentProfile } from "@/app/lib/transactionDocument"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { en } from "@/app/messages/en"
import { EMPTY_SALE_CUSTOMER, mapPartyToSaleCustomer } from "@/app/lib/sales/saleForm.utils"
import type {
  Product,
  ReturnDocumentKind,
  ReturnStockImpact,
  SaleCustomer,
} from "@/app/lib/db"
import ReturnsEditor from "./ReturnsEditor"
import ReturnsSidebar from "./ReturnsSidebar"
import ReturnsConfirmModal from "./ReturnsConfirmModal"
import type { DraftItem } from "./returns.types"
import { createDraftItemFromProduct, fromPurchaseItem, fromSaleItem } from "./returns.utils"
const SEARCH_LIMIT = 8

export default function ReturnsPage() {
  const searchParams = useSearchParams()
  const { products } = useProducts()
  const { sales } = useSales()
  const { purchases } = usePurchases()
  const { parties } = useParties("all")
  const { documents, loading: documentsLoading } = useReturnDocuments()
  const { profile } = useProfile()
  const returnsGate = useFeatureGate("returns")
  const printShareGate = useFeatureGate("printShareDownload")

  const [kind, setKind] = useState<ReturnDocumentKind>("sales-return")
  const [documentNo, setDocumentNo] = useState(() => buildReturnDocumentNumber("sales-return"))
  const [documentDate, setDocumentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [stockImpact, setStockImpact] = useState<ReturnStockImpact>("stock-in")
  const [linkedSaleId, setLinkedSaleId] = useState("")
  const [linkedPurchaseId, setLinkedPurchaseId] = useState("")
  const [selectedPartyId, setSelectedPartyId] = useState("")
  const [party, setParty] = useState<SaleCustomer>(EMPTY_SALE_CUSTOMER)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 160)
  const [items, setItems] = useState<DraftItem[]>([])
  const [gstEnabled, setGstEnabled] = useState(true)
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const sellerProfile = buildBusinessDocumentProfile(profile)
  const canCreate = returnsGate.allowed && !returnsGate.loading
  const canPrintShare = printShareGate.allowed && !printShareGate.loading

  const calculatedItems = useMemo(
    () =>
      items.map((item, index) => ({
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
            party,
            sellerGstin: sellerProfile.gstin,
            sellerState: sellerProfile.state,
            gstEnabled,
          },
        ),
        id: `${item.productId || "manual"}-${index + 1}`,
      })),
    [gstEnabled, items, party, sellerProfile.gstin, sellerProfile.state],
  )

  const totals = useMemo(() => calculateReturnTotals(calculatedItems), [calculatedItems])
  const filteredProducts = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    if (!query) return products.slice(0, SEARCH_LIMIT)

    return products
      .filter((product) =>
        [product.name, product.category, product.sku, product.hsnCode]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
      .slice(0, SEARCH_LIMIT)
  }, [debouncedSearch, products])

  const visibleDocuments = useMemo(() => documents.slice(0, 12), [documents])
  const saleOptions = useMemo(
    () =>
      sales
        .filter((sale) => sale.status !== "cancelled")
        .slice(0, 80)
        .map((sale) => ({ value: sale.id, label: `${sale.receiptNo} - ${sale.customer?.name || en.sales.customerName}` })),
    [sales],
  )
  const purchaseOptions = useMemo(
    () =>
      purchases
        .slice(0, 80)
        .map((purchase) => ({ value: purchase.id, label: `${purchase.billNo} - ${purchase.supplierName}` })),
    [purchases],
  )
  const partyOptions = useMemo(() => parties.map((entry) => ({ value: entry.id, label: entry.name })), [parties])

  const handleKindChange = (nextKind: ReturnDocumentKind) => {
    setKind(nextKind)
    setDocumentNo(buildReturnDocumentNumber(nextKind))
    setStockImpact(getDefaultStockImpact(nextKind))
    setLinkedSaleId("")
    setLinkedPurchaseId("")
  }

  const resetForm = () => {
    setDocumentNo(buildReturnDocumentNumber(kind))
    setDocumentDate(new Date().toISOString().slice(0, 10))
    setLinkedSaleId("")
    setLinkedPurchaseId("")
    setSelectedPartyId("")
    setParty(EMPTY_SALE_CUSTOMER)
    setSearch("")
    setItems([])
    setGstEnabled(true)
    setNote("")
    setStockImpact(getDefaultStockImpact(kind))
  }

  const addProductToItems = (product: Product) => {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id)
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: String(roundCurrency(Number(item.quantity || 0) + 1)) }
            : item,
        )
      }
      return [...current, createDraftItemFromProduct(product)]
    })
    setSearch("")
  }

  const addManualItem = () => {
    setItems((current) => [
      ...current,
      {
        name: "",
        quantity: "1",
        quantityUnit: "pcs",
        rate: "0",
        discount: "0",
        gstRate: "0",
        note: "",
      },
    ])
  }

  const updateItem = (index: number, patch: Partial<DraftItem>) => {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const handlePartyChange = (partyId: string) => {
    setSelectedPartyId(partyId)
    const selected = parties.find((entry) => entry.id === partyId)
    if (!selected) return
    setParty(mapPartyToSaleCustomer(selected))
  }

  const handleLinkedSaleChange = useCallback((saleId: string) => {
    setLinkedSaleId(saleId)
    const sale = sales.find((entry) => entry.id === saleId)
    if (!sale) return
    setParty(sale.customer || EMPTY_SALE_CUSTOMER)
    setSelectedPartyId(sale.partyId || "")
    setItems(sale.items.map(fromSaleItem))
    if (kind !== "credit-note") setKind("sales-return")
    setStockImpact("stock-in")
  }, [kind, sales])

  const handleLinkedPurchaseChange = useCallback((purchaseId: string) => {
    setLinkedPurchaseId(purchaseId)
    const purchase = purchases.find((entry) => entry.id === purchaseId)
    if (!purchase) return
    setParty({ name: purchase.supplierName })
    setSelectedPartyId(purchase.partyId || "")
    setItems(purchase.items.map(fromPurchaseItem))
    if (kind !== "debit-note") setKind("purchase-return")
    setStockImpact("stock-out")
  }, [kind, purchases])

  useEffect(() => {
    const saleId = searchParams.get("saleId")
    if (!saleId || linkedSaleId === saleId || !sales.length) return
    const sale = sales.find((entry) => entry.id === saleId)
    if (!sale) return
    queueMicrotask(() => {
      handleLinkedSaleChange(saleId)
    })
  }, [handleLinkedSaleChange, linkedSaleId, sales, searchParams])

  const requestSave = () => {
    if (!canCreate) {
      toast.error(en.subscription.subscriptionRequired)
      return
    }
    if (!items.length) {
      toast.warning(en.returns.addAtLeastOneItem)
      return
    }
    setConfirmOpen(true)
  }

  const confirmSave = async () => {
    try {
      setSaving(true)
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      await saveReturnDocument({
        userId,
        kind,
        documentNo,
        documentDate,
        documentDateTime: `${documentDate}T${new Date().toTimeString().slice(0, 8)}`,
        party,
        items: items.map((item) => ({
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
        sellerGstin: sellerProfile.gstin,
        sellerState: sellerProfile.state,
        gstEnabled,
        note,
        linkedSaleId: linkedSaleId || undefined,
        linkedPurchaseId: linkedPurchaseId || undefined,
        stockImpact,
      })
      toast.success(en.returns.saveSuccess)
      setConfirmOpen(false)
      resetForm()
    } catch (error) {
      console.error("Return document save failed", error)
      toast.error(error instanceof Error ? error.message : en.returns.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="space-y-5 p-3 sm:p-4 lg:p-6">
      <PageHeader title={en.returns.title} description={en.returns.description} />
      {returnsGate.subscriptionExpired ? (
        <SuspendedAccessBanner
          description={en.subscription.readOnlyExpiredMessage}
          featureLabel={en.subscription.features.returns}
          usage={returnsGate.usage}
          limit={typeof returnsGate.limit === "number" ? returnsGate.limit : undefined}
          onOpenUpgrade={() => window.location.assign("/pricing")}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label={en.returns.documentsSaved} value={String(documents.length)} icon={<FileText size={18} />} />
        <SummaryCard label={en.returns.stockCorrection} value={en.returns.stockImpacts[stockImpact]} icon={<RotateCcw size={18} />} />
        <SummaryCard label={en.returns.totalCorrection} value={formatCurrency(totals.totalAmount)} icon={<ArrowUpRight size={18} />} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.6fr)]">
        <ReturnsEditor
          kind={kind}
          onKindChange={handleKindChange}
          documentNo={documentNo}
          setDocumentNo={setDocumentNo}
          documentDate={documentDate}
          setDocumentDate={setDocumentDate}
          linkedSaleId={linkedSaleId}
          onLinkedSaleChange={handleLinkedSaleChange}
          salesOptions={saleOptions}
          linkedPurchaseId={linkedPurchaseId}
          onLinkedPurchaseChange={handleLinkedPurchaseChange}
          purchaseOptions={purchaseOptions}
          stockImpact={stockImpact}
          setStockImpact={setStockImpact}
          selectedPartyId={selectedPartyId}
          onPartyChange={handlePartyChange}
          partyOptions={partyOptions}
          party={party}
          setParty={setParty}
          search={search}
          setSearch={setSearch}
          filteredProducts={filteredProducts}
          onAddProduct={addProductToItems}
          onAddManualItem={addManualItem}
          items={items}
          calculatedItems={calculatedItems}
          onUpdateItem={updateItem}
          onRemoveItem={removeItem}
          gstEnabled={gstEnabled}
          setGstEnabled={setGstEnabled}
          note={note}
          setNote={setNote}
          totals={totals}
          canCreate={canCreate}
          saving={saving}
          onRequestSave={requestSave}
        />

        <ReturnsSidebar
          documentsLoading={documentsLoading}
          visibleDocuments={visibleDocuments}
          sellerProfile={sellerProfile}
          canPrintShare={canPrintShare}
        />
      </section>

      <ReturnsConfirmModal
        open={confirmOpen}
        kind={kind}
        stockImpact={stockImpact}
        totalAmount={totals.totalAmount}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmSave}
        saving={saving}
      />
    </main>
  )
}
