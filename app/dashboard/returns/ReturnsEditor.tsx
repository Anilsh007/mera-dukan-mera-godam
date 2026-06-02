"use client"

import { FileText, RotateCcw, Search, Trash2 } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"
import type { Product, ReturnDocumentKind, ReturnStockImpact, SaleCustomer } from "@/app/lib/db"
import { getReturnKindLabel } from "@/app/lib/returns/return.utils"
import type { DraftItem } from "./returns.types"

type ReturnsEditorProps = {
  kind: ReturnDocumentKind
  onKindChange: (nextKind: ReturnDocumentKind) => void
  documentNo: string
  setDocumentNo: (value: string) => void
  documentDate: string
  setDocumentDate: (value: string) => void
  linkedSaleId: string
  onLinkedSaleChange: (value: string) => void
  salesOptions: Array<{ value: string; label: string }>
  linkedPurchaseId: string
  onLinkedPurchaseChange: (value: string) => void
  purchaseOptions: Array<{ value: string; label: string }>
  stockImpact: ReturnStockImpact
  setStockImpact: (value: ReturnStockImpact) => void
  selectedPartyId: string
  onPartyChange: (value: string) => void
  partyOptions: Array<{ value: string; label: string }>
  party: SaleCustomer
  setParty: React.Dispatch<React.SetStateAction<SaleCustomer>>
  search: string
  setSearch: (value: string) => void
  filteredProducts: Product[]
  onAddProduct: (product: Product) => void
  onAddManualItem: () => void
  items: DraftItem[]
  calculatedItems: Array<{ lineTotal?: number }>
  onUpdateItem: (index: number, patch: Partial<DraftItem>) => void
  onRemoveItem: (index: number) => void
  gstEnabled: boolean
  setGstEnabled: (value: boolean) => void
  note: string
  setNote: (value: string) => void
  totals: { totalAmount: number }
  canCreate: boolean
  saving: boolean
  onRequestSave: () => void
}

const RETURN_KINDS: ReturnDocumentKind[] = ["sales-return", "purchase-return", "credit-note", "debit-note", "delivery-challan"]
const STOCK_IMPACTS: ReturnStockImpact[] = ["stock-in", "stock-out", "none"]

export default function ReturnsEditor({
  kind,
  onKindChange,
  documentNo,
  setDocumentNo,
  documentDate,
  setDocumentDate,
  linkedSaleId,
  onLinkedSaleChange,
  salesOptions,
  linkedPurchaseId,
  onLinkedPurchaseChange,
  purchaseOptions,
  stockImpact,
  setStockImpact,
  selectedPartyId,
  onPartyChange,
  partyOptions,
  party,
  setParty,
  search,
  setSearch,
  filteredProducts,
  onAddProduct,
  onAddManualItem,
  items,
  calculatedItems,
  onUpdateItem,
  onRemoveItem,
  gstEnabled,
  setGstEnabled,
  note,
  setNote,
  totals,
  canCreate,
  saving,
  onRequestSave,
}: ReturnsEditorProps) {
  return (
    <div className="premium-surface space-y-5 rounded-3xl p-4 sm:p-5">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
          <span>{en.returns.documentType}</span>
          <select value={kind} onChange={(event) => onKindChange(event.target.value as ReturnDocumentKind)} className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
            <option value="" disabled>{en.common.select}</option>
            {RETURN_KINDS.map((option) => <option key={option} value={option}>{getReturnKindLabel(option)}</option>)}
          </select>
        </label>
        <Input label={en.returns.documentNo} value={documentNo} onChange={(event) => setDocumentNo(event.target.value)} />
        <Input label={en.returns.documentDate} type="date" value={documentDate} onChange={(event) => setDocumentDate(event.target.value)} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
          <span>{en.returns.linkSale}</span>
          <select value={linkedSaleId} onChange={(event) => onLinkedSaleChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
            <option value="" disabled>{en.common.select}</option>
            {salesOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
          <span>{en.returns.linkPurchase}</span>
          <select value={linkedPurchaseId} onChange={(event) => onLinkedPurchaseChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
            <option value="" disabled>{en.common.select}</option>
            {purchaseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
          <span>{en.returns.stockImpact}</span>
          <select value={stockImpact} onChange={(event) => setStockImpact(event.target.value as ReturnStockImpact)} className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
            {STOCK_IMPACTS.map((option) => <option key={option} value={option}>{en.returns.stockImpacts[option]}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold text-[var(--text-secondary)]">
          <span>{en.returns.party}</span>
          <select value={selectedPartyId} onChange={(event) => onPartyChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
            <option value="" disabled>{en.common.select}</option>
            {partyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <Input label={en.returns.partyName} value={party.name || ""} onChange={(event) => setParty((current) => ({ ...current, name: event.target.value }))} placeholder={en.returns.partyNamePlaceholder} />
        <Input label={en.parties.mobile} value={party.phone || ""} onChange={(event) => setParty((current) => ({ ...current, phone: event.target.value }))} />
        <Input label={en.parties.gstin} value={party.gstin || ""} onChange={(event) => setParty((current) => ({ ...current, gstin: event.target.value }))} />
      </div>

      <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input label={en.returns.productSearch} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={en.returns.productSearchPlaceholder} leftAddon={<Search size={16} />} containerClassName="flex-1" />
          <Button variant="secondary" title={en.returns.addManualItem} icon={<FileText size={16} />} onClick={onAddManualItem} />
        </div>
        {search.trim() && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {filteredProducts.length ? filteredProducts.map((product) => (
              <button key={product.id} type="button" onClick={() => onAddProduct(product)} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3 text-left transition hover:border-[var(--accent)]">
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
                <Input label={en.receipt.product} value={item.name} onChange={(event) => onUpdateItem(index, { name: event.target.value })} containerClassName="md:col-span-3" />
                <Input label={en.returns.quantity} type="number" min="0" step="0.01" value={item.quantity} onChange={(event) => onUpdateItem(index, { quantity: event.target.value })} containerClassName="md:col-span-2" />
                <Input label={en.quickPurchase.quantityUnit} value={item.quantityUnit} onChange={(event) => onUpdateItem(index, { quantityUnit: event.target.value })} containerClassName="md:col-span-1" />
                <Input label={en.receipt.rate} type="number" min="0" step="0.01" value={item.rate} onChange={(event) => onUpdateItem(index, { rate: event.target.value })} containerClassName="md:col-span-2" />
                <Input label={en.estimates.discount} type="number" min="0" step="0.01" value={item.discount} onChange={(event) => onUpdateItem(index, { discount: event.target.value })} containerClassName="md:col-span-1" />
                <Input label={en.estimates.gstRate} type="number" min="0" step="0.01" value={item.gstRate} onChange={(event) => onUpdateItem(index, { gstRate: event.target.value })} containerClassName="md:col-span-1" />
                <div className="flex items-end justify-between gap-2 md:col-span-2">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">{en.receipt.total}</p>
                    <p className="font-bold text-[var(--text-primary)]">{formatCurrency(calculated?.lineTotal || 0)}</p>
                  </div>
                  <Button variant="delete" ariaLabel={en.returns.removeItem} icon={<Trash2 size={16} />} onClick={() => onRemoveItem(index)} className="px-3" />
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
        <Button title={en.returns.saveDocument} icon={<RotateCcw size={18} />} onClick={onRequestSave} loading={saving} disabled={!canCreate} />
      </div>
    </div>
  )
}
