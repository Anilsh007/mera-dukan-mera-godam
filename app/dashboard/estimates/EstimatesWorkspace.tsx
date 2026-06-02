"use client"

import { FilePlus2, Search, Trash2 } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"
import type {  Product, SaleCustomer, EstimateStatus } from "@/app/lib/db"
import type { EstimateCartItem } from "./estimates.types"
import { Field, SelectField, SummaryRow, TextAreaField } from "./EstimateFields"

type EstimatesWorkspaceProps = {
  estimateNo: string
  setEstimateNo: (value: string) => void
  estimateDate: string
  setEstimateDate: (value: string) => void
  expiryDate: string
  setExpiryDate: (value: string) => void
  status: EstimateStatus | ""
  setStatus: (value: EstimateStatus | "") => void
  selectedPartyId: string
  onPartyChange: (partyId: string) => void
  customer: SaleCustomer
  setCustomer: React.Dispatch<React.SetStateAction<SaleCustomer>>
  search: string
  setSearch: (value: string) => void
  filteredProducts: Product[]
  addProductToCart: (product: Product) => void
  productsLoading: boolean
  cart: EstimateCartItem[]
  calculatedItems: Array<{ lineTotal?: number }>
  updateCartItem: (productId: string, patch: Partial<EstimateCartItem>) => void
  removeCartItem: (productId: string) => void
  gstEnabled: boolean
  setGstEnabled: React.Dispatch<React.SetStateAction<boolean>>
  totals: { taxableAmount: number; gstAmount: number; totalAmount: number }
  note: string
  setNote: React.Dispatch<React.SetStateAction<string>>
  terms: string
  setTerms: React.Dispatch<React.SetStateAction<string>>
  canCreateEstimate: boolean
  saving: boolean
  onSaveEstimate: () => void
  customerParties: Array<{ id: string; name: string }>
}

const STATUS_OPTIONS: EstimateStatus[] = ["draft", "sent", "accepted", "rejected", "expired"]

export default function EstimatesWorkspace({
  estimateNo,
  setEstimateNo,
  estimateDate,
  setEstimateDate,
  expiryDate,
  setExpiryDate,
  status,
  setStatus,
  selectedPartyId,
  onPartyChange,
  customer,
  setCustomer,
  search,
  setSearch,
  filteredProducts,
  addProductToCart,
  productsLoading,
  cart,
  calculatedItems,
  updateCartItem,
  removeCartItem,
  gstEnabled,
  setGstEnabled,
  totals,
  note,
  setNote,
  terms,
  setTerms,
  canCreateEstimate,
  saving,
  onSaveEstimate,
  customerParties,
}: EstimatesWorkspaceProps) {
  return (
    <section>
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

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Field label={en.estimates.estimateNo} value={estimateNo} onChange={setEstimateNo} />
            <Field label={en.estimates.estimateDate} type="date" value={estimateDate} onChange={setEstimateDate} />
            <Field label={en.estimates.expiryDate} type="date" value={expiryDate} onChange={setExpiryDate} />
            <SelectField label={en.estimates.statusLabel} value={status} onChange={(value) => setStatus(value as EstimateStatus | "")} options={STATUS_OPTIONS.map((entry) => ({ value: entry, label: en.estimates.statuses[entry] }))} />
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.estimates.customerDetails}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.estimates.customerHelp}</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
            <SelectField label={en.estimates.selectCustomer} value={selectedPartyId} onChange={onPartyChange}
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

          <div className="mt-4 flex overflow-auto gap-3 w-full py-3" aria-label={en.estimates.searchResults}>
            {filteredProducts.map((product) => (
              <button key={product.id} type="button" onClick={() => addProductToCart(product)} className="flex w-fit gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)] cursor-pointer">
                <div className="w-[max-content]">
                  <p className="font-semibold text-[var(--text-primary)]">{product.name}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{[product.category, product.sku].filter(Boolean).join(" | ") || en.common.notAvailable}</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--accent)]">{formatCurrency(product.price)}</p>
                </div>
              </button>
            ))}
            {!productsLoading && search && filteredProducts.length === 0 ? (
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
                    <div className="flex flex-wrap align-items-center justify-between gap-3">
                      <div className="flex gap-2">
                        <p className="font-semibold text-[var(--text-primary)]">{item.name} </p>
                        <span className="mt-1 text-xs text-[var(--text-muted)]"> ({[item.category, item.sku].filter(Boolean).join(" | ") || en.common.notAvailable})</span>
                      </div>
                      <div>
                        <span className="mr-2 border border-[var(--border-card)] bg-[var(--surface-secondary)] rounded-2xl w-full px-2 py-3 text-sm font-semibold text-emerald-500">{formatCurrency(line?.lineTotal || 0)}</span>
                        <Button type="button" variant="delete" ariaLabel={en.estimates.removeItem} icon={<Trash2 size={16} />} onClick={() => removeCartItem(item.productId)} className="min-h-9 px-2 py-2" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:grid-cols-4">
                      <Field label={en.estimates.quantity} type="number" value={item.quantity} onChange={(value) => updateCartItem(item.productId, { quantity: value })} />
                      <Field label={en.estimates.price} type="number" value={item.salePrice} onChange={(value) => updateCartItem(item.productId, { salePrice: value })} />
                      <Field label={en.estimates.discount} type="number" value={item.discount} onChange={(value) => updateCartItem(item.productId, { discount: value })} />
                      <Field label={en.estimates.gstRate} type="number" value={item.gstRate} onChange={(value) => updateCartItem(item.productId, { gstRate: value })} />
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <aside className="mt-4 space-y-5">
        <section className="sticky top-4 rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{en.estimates.totals}</h2>
          <div className="mt-4 text-sm text-[var(--text-secondary)] grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3">
            <SummaryRow label={en.estimates.taxableAmount} value={formatCurrency(totals.taxableAmount)} />
            <SummaryRow label={en.estimates.totalGst} value={formatCurrency(totals.gstAmount)} />
            <SummaryRow label={en.estimates.grandTotal} value={formatCurrency(totals.totalAmount)} />
          </div>
          <div className="mt-4 space-y-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2">
            <TextAreaField label={en.estimates.terms} value={terms} onChange={setTerms} placeholder={en.estimates.termsPlaceholder} />
            <TextAreaField label={en.estimates.notes} value={note} onChange={setNote} placeholder={en.estimates.notesPlaceholder} />
          </div>
          <Button type="button" variant="primary" title={en.estimates.saveEstimate} icon={<FilePlus2 size={16} />} loading={saving} disabled={!canCreateEstimate || cart.length === 0} onClick={onSaveEstimate} className="mt-4 w-full" />
        </section>
      </aside>
    </section>
  )
}
