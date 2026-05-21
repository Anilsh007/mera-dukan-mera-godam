"use client"

import { useMemo, useState } from "react"
import { BarChart3, Boxes, FileText, PackageSearch, Plus, ReceiptText, Search, ShoppingCart, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import PageHeader from "@/app/components/ui/PageHeader"
import SummaryCard from "@/app/components/ui/SummaryCard"
import GuidedStepCard from "@/app/components/ui/GuidedStepCard"
import PageActionLinks from "@/app/components/ui/PageActionLinks"
import QuantityStepper from "@/app/components/ui/QuantityStepper"
import SimpleEmptyState from "@/app/components/ui/SimpleEmptyState"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import { SalePaymentModeSelect, SalePaymentStatusSelect } from "@/app/components/sales/SalePaymentSelects"
import useProducts from "@/app/hooks/useProducts"
import useProfile from "@/app/dashboard/profile/useProfile"
import { findProductByScannedCode } from "@/app/lib/barcode/barcode.utils"
import { notify as toast } from "@/app/lib/notifications"
import { auth } from "@/app/lib/firebase"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { buildBusinessDocumentProfile, getProfileDocumentWarnings, type TransactionOptionFlags } from "@/app/lib/transactionDocument"
import { buildSaleInvoiceDraftFromRecord, buildSaleTransactionDocument } from "@/app/lib/sales/sale.documents"
import { calculateSaleLine, calculateSaleTotals } from "@/app/lib/sales/sale.utils"
import { saveSale } from "@/app/lib/sales/sale.service"
import { saveSaleInvoiceDraft } from "@/app/dashboard/gst-invoice/invoiceDraft.service"
import { createTransactionOptions, runTransactionDocumentActions, ensureValidTransactionOptions } from "@/app/lib/transactionActions"
import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"
import { matchesSearchQuery } from "@/app/lib/search.utils"
import { DASHBOARD_ROUTES } from "@/app/lib/navigation/dashboardRoutes"
import type { Product, SaleCustomer, SalePaymentMode, SalePaymentStatus } from "@/app/lib/db"
import { formatQuantity } from "@/app/lib/quantityUnit"
import { isValidGstin } from "@/app/lib/gst.utils"
import useParties from "@/app/hooks/useParties"
import {
  EMPTY_SALE_CUSTOMER,
  buildSaleDraftLineFromCartItem,
  buildSaleDraftLinesFromCart,
  createStockAwareSaleCartItemFromProduct,
  mapPartyToSaleCustomer,
  type StockAwareSaleCartItemDraft,
} from "@/app/lib/sales/saleForm.utils"

const BarcodeScannerButton = dynamic(() => import("@/app/components/scanner/BarcodeScannerButton"), { ssr: false })

type CartItem = StockAwareSaleCartItemDraft

export default function QuickSalePage() {
  const router = useRouter()
  const { products, loading: productsLoading } = useProducts()
  const { profile } = useProfile()
  const { parties: customerParties } = useParties("customer")
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<SaleCustomer>(EMPTY_SALE_CUSTOMER)
  const [paymentMode, setPaymentMode] = useState<SalePaymentMode>("Cash")
  const [paymentStatus, setPaymentStatus] = useState<SalePaymentStatus>("paid")
  const [amountPaid, setAmountPaid] = useState("")
  const [note, setNote] = useState("")
  const [reference, setReference] = useState("")
  const [saving, setSaving] = useState(false)
  const [transactionOptions, setTransactionOptions] = useState<TransactionOptionFlags>(
    createTransactionOptions({
      printReceipt: true,
    }),
  )

  const sellerProfile = buildBusinessDocumentProfile(profile)
  const profileWarnings = getProfileDocumentWarnings(sellerProfile, {
    requireGstin: transactionOptions.generateGstInvoice,
  })

  const filteredProducts = useMemo(() => {
    const query = search.trim()
    return products
      .filter((product) => Number(product.quantity || 0) > 0)
      .filter((product) => matchesSearchQuery([product.name, product.category, product.sku], query))
      .slice(0, 12)
  }, [products, search])

  const calculatedItems = useMemo(
    () =>
      cart.map((item) =>
        calculateSaleLine(
          buildSaleDraftLineFromCartItem(item),
          {
            customer,
            sellerGstin: sellerProfile.gstin,
            sellerState: sellerProfile.state,
            gstEnabled: transactionOptions.generateGstInvoice,
          },
        ),
      ),
    [cart, customer, sellerProfile.gstin, sellerProfile.state, transactionOptions.generateGstInvoice],
  )

  const totals = useMemo(() => calculateSaleTotals(calculatedItems), [calculatedItems])
  const totalAmount = totals.totalAmount
  const normalizedPaidAmount =
    paymentStatus === "paid"
      ? totalAmount
      : paymentStatus === "unpaid"
        ? 0
        : Math.min(Math.max(Number(amountPaid || 0), 0), totalAmount)
  const dueAmount = Math.max(totalAmount - normalizedPaidAmount, 0)

  const addProductToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((entry) => entry.productId === product.id)
      if (existing) {
        return current.map((entry) =>
          entry.productId === product.id
            ? { ...entry, quantity: String(Math.min(Number(entry.quantity || 0) + 1, product.quantity)) }
            : entry,
        )
      }

      return [...current, createStockAwareSaleCartItemFromProduct(product)]
    })
  }

  const handleScannedCode = (code: string) => {
    const product = findProductByScannedCode(products, code, { inStockOnly: true })
    if (!product) {
      setSearch(code)
      toast.warning(en.scanner.productNotFoundSearchFilled.replace("{code}", code))
      return
    }

    addProductToCart(product)
    toast.success(en.scanner.productAddedToCart.replace("{name}", product.name))
  }

  const updateCartItem = (productId: string, patch: Partial<CartItem>) => {
    setCart((current) => current.map((item) => (item.productId === productId ? { ...item, ...patch } : item)))
  }

  const handleCustomerPartyChange = (value: string) => {
    const selected = customerParties.find((party) => party.name === value)
    if (!selected) {
      setCustomer((current) => ({ ...current, name: value }))
      return
    }
    setCustomer(mapPartyToSaleCustomer(selected))
  }

  const removeCartItem = (productId: string) => {
    setCart((current) => current.filter((item) => item.productId !== productId))
  }

  const handleSave = async () => {
    if (!cart.length) {
      toast.error(en.sales.addFirstProduct)
      return
    }

    for (const item of cart) {
      const quantity = Number(item.quantity || 0)
      const price = Number(item.salePrice || 0)
      if (!Number.isFinite(quantity) || quantity <= 0) {
        toast.error(en.sales.invalidQuantity)
        return
      }
      if (!Number.isFinite(price) || price < 0) {
        toast.error(en.sales.invalidPrice)
        return
      }
    }

    if (customer.gstin?.trim() && !isValidGstin(customer.gstin)) {
      toast.error(en.profile.invalidGstin)
      return
    }

    if (profileWarnings.length) {
      toast.warning(`${en.transaction.profileWarningTitle}: ${profileWarnings.join(" ")}`)
      if (transactionOptions.generateGstInvoice) return
    }

    if (!ensureValidTransactionOptions(transactionOptions)) return

    try {
      setSaving(true)
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      const sale = await saveSale({
        userId,
        items: buildSaleDraftLinesFromCart(cart),
        customer,
        sellerGstin: sellerProfile.gstin,
        sellerState: sellerProfile.state,
        paymentMode,
        paymentStatus,
        amountPaid: normalizedPaidAmount,
        note,
        reference,
        gstEnabled: transactionOptions.generateGstInvoice,
        entryMode: "quick-sale",
      })

      if (transactionOptions.generateGstInvoice) {
        saveSaleInvoiceDraft(buildSaleInvoiceDraftFromRecord(sale))
      }

      await runTransactionDocumentActions(buildSaleTransactionDocument(sale, sellerProfile), transactionOptions)
      toast.success(en.sales.saveSuccess)

      setCart([])
      setCustomer(EMPTY_SALE_CUSTOMER)
      setPaymentMode("Cash")
      setPaymentStatus("paid")
      setAmountPaid("")
      setNote("")
      setReference("")
      setSearch("")

      if (transactionOptions.generateGstInvoice) {
        toast.success(en.sales.gstDraftReady)
        router.push(DASHBOARD_ROUTES.gstInvoice)
      }
    } catch (error) {
      console.error("Quick sale save failed", error)
      toast.error(error instanceof Error ? error.message : en.sales.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-page space-y-6 pb-8">
      <PageHeader
        eyebrow={en.navigation.quickSale}
        title={en.pages.quickSaleTitle}
        description={en.pages.quickSaleDescription}
      />

      <PageActionLinks
        title={en.common.nextActions}
        description={en.common.nextActionsDescription}
        actions={[
          { href: DASHBOARD_ROUTES.sales, label: en.sales.goToSales, description: en.sales.goToSalesHelp, icon: <ReceiptText size={18} /> },
          { href: DASHBOARD_ROUTES.parties, label: en.sales.goToCustomers, description: en.sales.goToCustomersHelp, icon: <Users size={18} /> },
          { href: DASHBOARD_ROUTES.gstInvoice, label: en.sales.makeGstInvoice, description: en.sales.makeGstInvoiceHelp, icon: <FileText size={18} /> },
          { href: DASHBOARD_ROUTES.reports, label: en.sales.goToReports, description: en.sales.goToReportsHelp, icon: <BarChart3 size={18} /> },
        ]}
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GuidedStepCard
          step={1}
          title={en.sales.stepFindProductsTitle}
          description={en.sales.stepFindProductsDescription}
          icon={<PackageSearch size={18} />}
          contentClassName="space-y-4"
        >
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <label className="block text-sm font-medium text-[var(--text-primary)]">{en.sales.productSearch}</label>
              <BarcodeScannerButton
                onDetected={handleScannedCode}
                buttonTitle={en.scanner.scanForSale}
                disabled={saving}
                className="w-full sm:w-auto"
              />
            </div>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={en.sales.productSearchPlaceholder}
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{en.sales.searchResults}</p>
              <span className="text-xs text-[var(--text-secondary)]">{filteredProducts.length}</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProductToCart(product)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
                >
                  <div className="min-w-0">
                    <p className="font-medium capitalize text-[var(--text-primary)]">{product.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {[product.category, product.sku].filter(Boolean).join(" | ") || en.inventory.noCategory}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {formatQuantity(product.quantity, product.quantityUnit)} | {formatCurrency(product.price)}
                    </p>
                  </div>
                  <Button type="button" variant="outline" icon={<Plus size={16} />} />
                </button>
              ))}

              {!filteredProducts.length && !productsLoading ? (
                <SimpleEmptyState
                  title={en.sales.noProductFoundTitle}
                  description={en.sales.noProductFoundDescription}
                  icon={<Boxes size={18} aria-hidden="true" />}
                />
              ) : null}
            </div>
          </div>
        </GuidedStepCard>

        <div className="space-y-4">
          <GuidedStepCard
            step={2}
            title={en.sales.stepCartTitle}
            description={en.sales.stepCartDescription}
            icon={<ShoppingCart size={18} />}
          >
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={item.productId} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold capitalize text-[var(--text-primary)]">{item.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {formatQuantity(item.availableQty, item.quantityUnit)} | {item.category || en.inventory.noCategory}
                      </p>
                    </div>
                    <Button type="button" variant="delete" title={en.common.delete} onClick={() => removeCartItem(item.productId)} />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <QuantityStepper
                      label={en.inventory.quantityToSell}
                      value={item.quantity}
                      onChange={(value) => updateCartItem(item.productId, { quantity: value })}
                      min={1}
                      max={item.availableQty}
                      unitLabel={item.quantityUnit}
                      helperText={en.sales.availableStockHelp.replace("{quantity}", String(item.availableQty)).replace("{unit}", item.quantityUnit)}
                      decreaseLabel={en.pos.decreaseQuantity}
                      increaseLabel={en.pos.increaseQuantity}
                    />
                    <Input
                      type="number"
                      min={0}
                      label={en.inventory.saleRate}
                      value={item.salePrice}
                      onChange={(event) => updateCartItem(item.productId, { salePrice: event.target.value })}
                    />
                    <Input
                      type="number"
                      min={0}
                      label={en.sales.discount}
                      value={item.discount}
                      onChange={(event) => updateCartItem(item.productId, { discount: event.target.value })}
                      placeholder={en.sales.discountPlaceholder}
                    />
                    <Input
                      type="number"
                      min={0}
                      label={en.inventory.gstPercent}
                      value={item.gstRate}
                      onChange={(event) => updateCartItem(item.productId, { gstRate: event.target.value })}
                      disabled={!transactionOptions.generateGstInvoice}
                    />
                    <Input
                      label={en.inventory.note}
                      value={item.note}
                      onChange={(event) => updateCartItem(item.productId, { note: event.target.value })}
                      containerClassName="md:col-span-2"
                    />
                  </div>

                  <div className="mt-3 text-right text-sm font-semibold text-emerald-500">
                    {formatCurrency(calculatedItems[index]?.lineTotal || 0)}
                  </div>
                </div>
              ))}

              {!cart.length ? (
                <SimpleEmptyState
                  title={en.sales.emptyCartTitle}
                  description={en.sales.emptyCartDescription}
                  icon={<ShoppingCart size={18} aria-hidden="true" />}
                />
              ) : null}
            </div>
          </GuidedStepCard>

          <GuidedStepCard
            step={3}
            title={en.sales.stepCustomerPaymentTitle}
            description={en.sales.stepCustomerPaymentDescription}
            icon={<ReceiptText size={18} />}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <datalist id="customer-party-options">
                {customerParties.map((party) => (
                  <option key={party.id} value={party.name} />
                ))}
              </datalist>
              <Input
                label={en.parties.customerPartyLabel}
                value={customer.name || ""}
                placeholder={en.sales.customerNamePlaceholder}
                onChange={(event) => handleCustomerPartyChange(event.target.value)}
                datalist="customer-party-options"
              />
              <Input
                label={en.inventory.buyerGstin}
                value={customer.gstin || ""}
                onChange={(event) => setCustomer((current) => ({ ...current, gstin: event.target.value.toUpperCase() }))}
              />
              <Input
                label={en.inventory.phone}
                value={customer.phone || ""}
                onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))}
              />
              <Input
                label={en.inventory.email}
                value={customer.email || ""}
                onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))}
              />
              <Input
                label={en.sales.reference}
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
              <Input
                label={en.sales.noteReference}
                value={note}
                placeholder={en.sales.noteReferencePlaceholder}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <SalePaymentModeSelect value={paymentMode} onChange={setPaymentMode} />

              <SalePaymentStatusSelect value={paymentStatus} onChange={setPaymentStatus} />

              <Input
                type="number"
                min={0}
                label={en.sales.amountPaid}
                value={paymentStatus === "paid" ? String(totalAmount) : paymentStatus === "unpaid" ? "0" : amountPaid}
                onChange={(event) => setAmountPaid(event.target.value)}
                disabled={paymentStatus !== "partial"}
              />
            </div>

            <TransactionActionPanel
              value={transactionOptions}
              onChange={setTransactionOptions}
              profileWarnings={profileWarnings}
              allowGstInvoice
              disabled={saving}
              className="mt-5"
            />

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard label={en.sales.totalItems} value={String(cart.length)} />
              <SummaryCard label={en.sales.taxableAmount} value={formatCurrency(totals.taxableAmount)} />
              <SummaryCard label={en.sales.totalGst} value={formatCurrency(totals.gstAmount)} />
              <SummaryCard label={en.sales.totalAmount} value={formatCurrency(totalAmount)} />
              <SummaryCard label={en.sales.balanceDue} value={formatCurrency(dueAmount)} />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div className="text-sm text-[var(--text-secondary)]">{en.sales.reportsIncluded}</div>
              <Button
                type="button"
                variant="primary"
                title={saving ? en.sales.savingSale : en.sales.saveSale}
                onClick={handleSave}
                loading={saving}
                disabled={saving || !cart.length}
                className="w-full sm:w-auto"
              />
            </div>
          </GuidedStepCard>
        </div>
      </section>
    </div>
  )
}
