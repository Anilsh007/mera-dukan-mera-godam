"use client"

import { useMemo, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, FileText, Link2, RotateCcw, Search, Trash2 } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import PageHeader from "@/app/components/ui/PageHeader"
import ShareActions from "@/app/components/ui/ShareActions"
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
import { buildReturnTransactionDocument } from "@/app/lib/returns/return.documents"
import { saveReturnDocument } from "@/app/lib/returns/return.service"
import {
  buildReturnDocumentNumber,
  calculateReturnLine,
  calculateReturnTotals,
  getDefaultStockImpact,
  getReturnKindLabel,
} from "@/app/lib/returns/return.utils"
import { buildBusinessDocumentProfile } from "@/app/lib/transactionDocument"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import { en } from "@/app/messages/en"
import { EMPTY_SALE_CUSTOMER, mapPartyToSaleCustomer } from "@/app/lib/sales/saleForm.utils"
import type {
  Product,
  PurchaseRecord,
  ReturnDocumentKind,
  ReturnStockImpact,
  SaleCustomer,
  SaleRecord,
} from "@/app/lib/db"

const SEARCH_LIMIT = 8
const RETURN_KINDS: ReturnDocumentKind[] = [
  "sales-return",
  "purchase-return",
  "credit-note",
  "debit-note",
  "delivery-challan",
]
const STOCK_IMPACTS: ReturnStockImpact[] = ["stock-in", "stock-out", "none"]

type DraftItem = {
  productId?: string
  name: string
  category?: string
  sku?: string
  hsnCode?: string
  quantity: string
  quantityUnit: string
  rate: string
  discount: string
  gstRate: string
  note: string
}

export default function ReturnsPage() {
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
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          category: product.category,
          sku: product.sku,
          hsnCode: product.hsnCode,
          quantity: "1",
          quantityUnit: normalizeQuantityUnit(product.quantityUnit),
          rate: String(Number(product.price || 0)),
          discount: "0",
          gstRate: "18",
          note: "",
        },
      ]
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

  const handleLinkedSaleChange = (saleId: string) => {
    setLinkedSaleId(saleId)
    const sale = sales.find((entry) => entry.id === saleId)
    if (!sale) return
    setParty(sale.customer || EMPTY_SALE_CUSTOMER)
    setSelectedPartyId(sale.partyId || "")
    setItems(sale.items.map(fromSaleItem))
    if (kind !== "credit-note") setKind("sales-return")
    setStockImpact("stock-in")
  }

  const handleLinkedPurchaseChange = (purchaseId: string) => {
    setLinkedPurchaseId(purchaseId)
    const purchase = purchases.find((entry) => entry.id === purchaseId)
    if (!purchase) return
    setParty({ name: purchase.supplierName })
    setSelectedPartyId(purchase.partyId || "")
    setItems(purchase.items.map(fromPurchaseItem))
    if (kind !== "debit-note") setKind("purchase-return")
    setStockImpact("stock-out")
  }

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

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label={en.returns.documentsSaved} value={String(documents.length)} icon={<FileText size={18} />} />
        <SummaryCard label={en.returns.stockCorrection} value={en.returns.stockImpacts[stockImpact]} icon={<RotateCcw size={18} />} />
        <SummaryCard label={en.returns.totalCorrection} value={formatCurrency(totals.totalAmount)} icon={<ArrowUpRight size={18} />} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.6fr)]">
        <div className="premium-surface space-y-5 rounded-3xl p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
              <span>{en.returns.documentType}</span>
              <select value={kind} onChange={(event) => handleKindChange(event.target.value as ReturnDocumentKind)} className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
                {RETURN_KINDS.map((option) => (
                  <option key={option} value={option}>{getReturnKindLabel(option)}</option>
                ))}
              </select>
            </label>
            <Input label={en.returns.documentNo} value={documentNo} onChange={(event) => setDocumentNo(event.target.value)} />
            <Input label={en.returns.documentDate} type="date" value={documentDate} onChange={(event) => setDocumentDate(event.target.value)} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
              <span>{en.returns.linkSale}</span>
              <select value={linkedSaleId} onChange={(event) => handleLinkedSaleChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
                <option value="">{en.returns.noLinkedSale}</option>
                {sales.filter((sale) => sale.status !== "cancelled").slice(0, 80).map((sale) => (
                  <option key={sale.id} value={sale.id}>{sale.receiptNo} - {sale.customer?.name || en.sales.customerName}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
              <span>{en.returns.linkPurchase}</span>
              <select value={linkedPurchaseId} onChange={(event) => handleLinkedPurchaseChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
                <option value="">{en.returns.noLinkedPurchase}</option>
                {purchases.slice(0, 80).map((purchase) => (
                  <option key={purchase.id} value={purchase.id}>{purchase.billNo} - {purchase.supplierName}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
              <span>{en.returns.stockImpact}</span>
              <select value={stockImpact} onChange={(event) => setStockImpact(event.target.value as ReturnStockImpact)} className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
                {STOCK_IMPACTS.map((option) => (
                  <option key={option} value={option}>{en.returns.stockImpacts[option]}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
              <span>{en.returns.party}</span>
              <select value={selectedPartyId} onChange={(event) => handlePartyChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
                <option value="">{en.parties.optionalPartyHint}</option>
                {parties.map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.name}</option>
                ))}
              </select>
            </label>
            <Input label={en.returns.partyName} value={party.name || ""} onChange={(event) => setParty((current) => ({ ...current, name: event.target.value }))} placeholder={en.returns.partyNamePlaceholder} />
            <Input label={en.parties.mobile} value={party.phone || ""} onChange={(event) => setParty((current) => ({ ...current, phone: event.target.value }))} />
            <Input label={en.parties.gstin} value={party.gstin || ""} onChange={(event) => setParty((current) => ({ ...current, gstin: event.target.value }))} />
          </div>

          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Input label={en.returns.productSearch} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={en.returns.productSearchPlaceholder} leftAddon={<Search size={16} />} containerClassName="flex-1" />
              <Button variant="secondary" title={en.returns.addManualItem} icon={<FileText size={16} />} onClick={addManualItem} />
            </div>
            {search.trim() && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {filteredProducts.length ? filteredProducts.map((product) => (
                  <button key={product.id} type="button" onClick={() => addProductToItems(product)} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3 text-left transition hover:border-[var(--accent)]">
                    <span className="block font-semibold text-[var(--text-primary)]">{product.name}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{formatCurrency(product.price)} - {product.quantity} {product.quantityUnit}</span>
                  </button>
                )) : <p className="text-sm text-[var(--text-secondary)]">{en.returns.noProductFound}</p>}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.returns.itemsTitle}</h2>
                <p className="text-sm text-[var(--text-secondary)]">{en.returns.itemsHelp}</p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]">
                <input type="checkbox" checked={gstEnabled} onChange={(event) => setGstEnabled(event.target.checked)} className="h-4 w-4" />
                {en.estimates.applyGst}
              </label>
            </div>

            {!items.length && (
              <div className="rounded-2xl border border-dashed border-[var(--border-input)] p-5 text-center text-sm text-[var(--text-secondary)]">
                {en.returns.emptyItemsDescription}
              </div>
            )}

            {items.map((item, index) => {
              const calculated = calculatedItems[index]
              return (
                <div key={`${item.productId || "manual"}-${index}`} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3">
                  <div className="grid gap-3 md:grid-cols-12">
                    <Input label={en.receipt.product} value={item.name} onChange={(event) => updateItem(index, { name: event.target.value })} containerClassName="md:col-span-3" />
                    <Input label={en.returns.quantity} type="number" min="0" step="0.01" value={item.quantity} onChange={(event) => updateItem(index, { quantity: event.target.value })} containerClassName="md:col-span-2" />
                    <Input label={en.quickPurchase.quantityUnit} value={item.quantityUnit} onChange={(event) => updateItem(index, { quantityUnit: event.target.value })} containerClassName="md:col-span-1" />
                    <Input label={en.receipt.rate} type="number" min="0" step="0.01" value={item.rate} onChange={(event) => updateItem(index, { rate: event.target.value })} containerClassName="md:col-span-2" />
                    <Input label={en.estimates.discount} type="number" min="0" step="0.01" value={item.discount} onChange={(event) => updateItem(index, { discount: event.target.value })} containerClassName="md:col-span-1" />
                    <Input label={en.estimates.gstRate} type="number" min="0" step="0.01" value={item.gstRate} onChange={(event) => updateItem(index, { gstRate: event.target.value })} containerClassName="md:col-span-1" />
                    <div className="flex items-end justify-between gap-2 md:col-span-2">
                      <div>
                        <p className="text-xs text-[var(--text-secondary)]">{en.receipt.total}</p>
                        <p className="font-bold text-[var(--text-primary)]">{formatCurrency(calculated?.lineTotal || 0)}</p>
                      </div>
                      <Button variant="delete" ariaLabel={en.returns.removeItem} icon={<Trash2 size={16} />} onClick={() => removeItem(index)} className="px-3" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Input label={en.returns.note} value={note} onChange={(event) => setNote(event.target.value)} placeholder={en.returns.notePlaceholder} />

          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">{en.returns.totalCorrection}</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(totals.totalAmount)}</p>
              <p className="text-xs text-[var(--text-secondary)]">{en.returns.safeCorrectionHelp}</p>
            </div>
            <Button title={en.returns.saveDocument} icon={<RotateCcw size={18} />} onClick={requestSave} loading={saving} disabled={!canCreate} />
          </div>
        </div>

        <aside className="premium-surface h-fit rounded-3xl p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Link2 size={18} className="text-[var(--accent)]" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.returns.savedDocuments}</h2>
          </div>
          {documentsLoading ? (
            <p className="text-sm text-[var(--text-secondary)]">{en.common.loading}</p>
          ) : visibleDocuments.length ? (
            <div className="space-y-3">
              {visibleDocuments.map((record) => {
                const document = buildReturnTransactionDocument(record, sellerProfile)
                return (
                  <div key={record.id} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{record.documentNo}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{getReturnKindLabel(record.kind)} - {formatCurrency(record.totalAmount)}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{en.returns.stockImpacts[record.stockImpact]}</p>
                      </div>
                      {record.stockImpact === "stock-in" ? <ArrowDownLeft size={18} className="text-emerald-500" /> : record.stockImpact === "stock-out" ? <ArrowUpRight size={18} className="text-amber-500" /> : <FileText size={18} className="text-[var(--accent)]" />}
                    </div>
                    {canPrintShare ? (
                      <ShareActions document={document} compact className="mt-3" />
                    ) : (
                      <p className="mt-3 text-xs text-[var(--text-secondary)]">{en.returns.printShareLocked}</p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border-input)] p-5 text-center">
              <p className="font-semibold text-[var(--text-primary)]">{en.returns.noDocumentsTitle}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.returns.noDocumentsDescription}</p>
            </div>
          )}
        </aside>
      </section>

      <Modal
        open={confirmOpen}
        title={en.returns.confirmTitle}
        description={en.returns.confirmDescription}
        onClose={() => setConfirmOpen(false)}
        primaryLabel={en.common.confirm}
        primaryVariant={stockImpact === "stock-out" ? "warning" : "primary"}
        cancelLabel={en.common.keepEditing}
        variant={stockImpact === "stock-out" ? "warning" : "confirmation"}
        onPrimary={confirmSave}
        loading={saving}
      >
        <div className="space-y-3 text-sm text-[var(--text-secondary)]">
          <p><strong>{en.returns.documentType}:</strong> {getReturnKindLabel(kind)}</p>
          <p><strong>{en.returns.stockImpact}:</strong> {en.returns.stockImpacts[stockImpact]}</p>
          <p><strong>{en.returns.totalCorrection}:</strong> {formatCurrency(totals.totalAmount)}</p>
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">{en.returns.confirmStockWarning}</p>
        </div>
      </Modal>
    </main>
  )
}

function fromSaleItem(item: SaleRecord["items"][number]): DraftItem {
  return {
    productId: item.productId,
    name: item.name,
    category: item.category,
    sku: item.sku,
    hsnCode: item.hsnCode,
    quantity: String(item.quantity),
    quantityUnit: item.quantityUnit,
    rate: String(item.salePrice),
    discount: String(item.discount || 0),
    gstRate: String(item.gstRate || 0),
    note: item.note || "",
  }
}

function fromPurchaseItem(item: PurchaseRecord["items"][number]): DraftItem {
  return {
    productId: item.productId,
    name: item.name,
    category: item.category,
    sku: item.sku,
    hsnCode: item.hsnCode,
    quantity: String(item.quantity),
    quantityUnit: item.quantityUnit,
    rate: String(item.price),
    discount: "0",
    gstRate: "0",
    note: item.note || "",
  }
}
