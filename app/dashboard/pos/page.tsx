"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { BarChart3, Boxes, FileText, PackageSearch, Plus, QrCode, ReceiptText, Search, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import dynamic from "next/dynamic"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import PageHeader from "@/app/components/ui/PageHeader"
import GuidedStepCard from "@/app/components/ui/GuidedStepCard"
import Modal from "@/app/components/ui/Modal"
import PageActionLinks from "@/app/components/ui/PageActionLinks"
import QuantityStepper from "@/app/components/ui/QuantityStepper"
import SimpleEmptyState from "@/app/components/ui/SimpleEmptyState"
import SummaryCard from "@/app/components/ui/SummaryCard"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import { SalePaymentModeSelect } from "@/app/components/sales/SalePaymentSelects"
import useDebouncedValue from "@/app/hooks/useDebouncedValue"
import useFeatureGate from "@/app/hooks/useFeatureGate"
import useParties from "@/app/hooks/useParties"
import useProducts from "@/app/hooks/useProducts"
import useSales from "@/app/hooks/useSales"
import useProfile from "@/app/dashboard/profile/useProfile"
import { saveSaleInvoiceDraft } from "@/app/dashboard/gst-invoice/invoiceDraft.service"
import { auth } from "@/app/lib/firebase"
import { isValidGstin } from "@/app/lib/gst.utils"
import { findProductByScannedCode } from "@/app/lib/barcode/barcode.utils"
import { notify as toast } from "@/app/lib/notifications"
import { formatCurrency } from "@/app/lib/formatters"
import { formatQuantity } from "@/app/lib/quantityUnit"
import { buildSaleInvoiceDraftFromRecord, buildSaleTransactionDocument } from "@/app/lib/sales/sale.documents"
import { saveSale } from "@/app/lib/sales/sale.service"
import { calculateSaleLine, calculateSaleTotals } from "@/app/lib/sales/sale.utils"
import { createTransactionOptions, runTransactionDocumentActions, ensureValidTransactionOptions } from "@/app/lib/transactionActions"
import { buildBusinessDocumentProfile, getProfileDocumentWarnings, type TransactionOptionFlags } from "@/app/lib/transactionDocument"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { en } from "@/app/messages/en"
import { DASHBOARD_ROUTES } from "@/app/lib/navigation/dashboardRoutes"
import {
  EMPTY_SALE_CUSTOMER,
  buildSaleDraftLineFromCartItem,
  buildSaleDraftLinesFromCart,
  createStockAwareSaleCartItemFromProduct,
  mapPartyToSaleCustomer,
  type StockAwareSaleCartItemDraft,
} from "@/app/lib/sales/saleForm.utils"
import type { Product, SaleCustomer, SalePaymentMode, SalePaymentStatus } from "@/app/lib/db"

const BarcodeScannerButton = dynamic(() => import("@/app/components/scanner/BarcodeScannerButton"), { ssr: false })

type PosCartItem = StockAwareSaleCartItemDraft

type ProductPick = {
  product: Product
  score: number
  lastSoldAt: string
}

const QUICK_SEARCH_LIMIT = 10
const QUICK_PICK_LIMIT = 8

export default function PosPage() {
  const searchRef = useRef<HTMLInputElement>(null)
  const { products, loading: productsLoading } = useProducts()
  const { sales } = useSales()
  const { profile } = useProfile()
  const { parties: customerParties } = useParties("customer")
  const saleGate = useFeatureGate("quickSales")
  const printShareGate = useFeatureGate("printShareDownload")

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 120)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [cart, setCart] = useState<PosCartItem[]>([])
  const [customer, setCustomer] = useState<SaleCustomer>(EMPTY_SALE_CUSTOMER)
  const [paymentMode, setPaymentMode] = useState<SalePaymentMode>("Cash")
  const [cashReceived, setCashReceived] = useState("")
  const [note, setNote] = useState("")
  const [reference, setReference] = useState("")
  const [gstEnabled, setGstEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [transactionOptions, setTransactionOptions] = useState<TransactionOptionFlags>(
    createTransactionOptions({ printReceipt: true }),
  )

  const sellerProfile = buildBusinessDocumentProfile(profile)
  const profileWarnings = getProfileDocumentWarnings(sellerProfile, {
    requireGstin: transactionOptions.generateGstInvoice || gstEnabled,
  })
  const printShareAllowed = printShareGate.allowed && !printShareGate.loading

  useEffect(() => {
    if (printShareAllowed || printShareGate.loading) return
    setTransactionOptions((current) => ({
      ...current,
      printReceipt: false,
      downloadPdf: false,
      shareWhatsApp: false,
      shareEmail: false,
      copyDetails: false,
    }))
  }, [printShareAllowed, printShareGate.loading])

  const availableProducts = useMemo(
    () => products.filter((product) => Number(product.quantity || 0) > 0),
    [products],
  )

  const filteredProducts = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    if (!query) return availableProducts.slice(0, QUICK_SEARCH_LIMIT)

    return availableProducts
      .map((product) => {
        const haystack = [product.name, product.category, product.sku, product.hsnCode]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        const name = product.name.toLowerCase()
        const startsWithScore = name.startsWith(query) ? 3 : 0
        const includesScore = haystack.includes(query) ? 1 : 0
        return { product, score: startsWithScore + includesScore }
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || left.product.name.localeCompare(right.product.name))
      .slice(0, QUICK_SEARCH_LIMIT)
      .map((entry) => entry.product)
  }, [availableProducts, debouncedSearch])

  useEffect(() => {
    setSelectedIndex(0)
  }, [debouncedSearch])

  const quickPickProducts = useMemo(() => {
    const productMap = new Map(availableProducts.map((product) => [product.id, product]))
    const picks = new Map<string, ProductPick>()

    sales
      .filter((sale) => sale.status === "completed")
      .forEach((sale) => {
        sale.items.forEach((item) => {
          const product = productMap.get(item.productId)
          if (!product) return
          const current = picks.get(product.id)
          picks.set(product.id, {
            product,
            score: (current?.score || 0) + Number(item.quantity || 0),
            lastSoldAt: current && current.lastSoldAt > sale.saleDateTime ? current.lastSoldAt : sale.saleDateTime,
          })
        })
      })

    const frequent = Array.from(picks.values())
      .sort((left, right) => right.score - left.score || right.lastSoldAt.localeCompare(left.lastSoldAt))
      .map((entry) => entry.product)

    if (frequent.length >= QUICK_PICK_LIMIT) return frequent.slice(0, QUICK_PICK_LIMIT)

    const pickedIds = new Set(frequent.map((product) => product.id))
    const fallback = availableProducts
      .filter((product) => !pickedIds.has(product.id))
      .sort((left, right) => left.name.localeCompare(right.name))
      .slice(0, QUICK_PICK_LIMIT - frequent.length)

    return [...frequent, ...fallback]
  }, [availableProducts, sales])

  const calculatedItems = useMemo(
    () =>
      cart.map((item) =>
        calculateSaleLine(
          buildSaleDraftLineFromCartItem(item),
          {
            customer,
            sellerGstin: sellerProfile.gstin,
            sellerState: sellerProfile.state,
            gstEnabled,
          },
        ),
      ),
    [cart, customer, gstEnabled, sellerProfile.gstin, sellerProfile.state],
  )

  const totals = useMemo(() => calculateSaleTotals(calculatedItems), [calculatedItems])
  const totalAmount = totals.totalAmount
  const cashReceivedAmount = Math.max(Number(cashReceived || 0), 0)
  const amountReceived = paymentMode === "Cash" ? cashReceivedAmount : paymentMode === "Credit" ? 0 : totalAmount
  const amountPaid = Math.min(amountReceived, totalAmount)
  const changeReturn = paymentMode === "Cash" ? Math.max(cashReceivedAmount - totalAmount, 0) : 0
  const dueAmount = Math.max(totalAmount - amountPaid, 0)
  const paymentStatus: SalePaymentStatus = dueAmount <= 0 ? "paid" : amountPaid > 0 ? "partial" : "unpaid"

  const upiQrValue = useMemo(() => {
    const upiId = (profile.business.upiId || "").trim()
    if (paymentMode !== "UPI" || !upiId || totalAmount <= 0) return ""

    const params = new URLSearchParams({
      pa: upiId,
      pn: profile.business.shopName || en.common.appName,
      am: totalAmount.toFixed(2),
      cu: "INR",
    })
    return `upi://pay?${params.toString()}`
  }, [paymentMode, profile.business.shopName, profile.business.upiId, totalAmount])

  const addProductToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((entry) => entry.productId === product.id)
      if (existing) {
        const nextQuantity = Math.min(Number(existing.quantity || 0) + 1, Number(product.quantity || 0))
        if (nextQuantity === Number(existing.quantity || 0)) toast.warning(en.pos.stockLimitReached)
        return current.map((entry) => (entry.productId === product.id ? { ...entry, quantity: String(nextQuantity) } : entry))
      }

      return [...current, createStockAwareSaleCartItemFromProduct(product)]
    })
    setSearch("")
    searchRef.current?.focus()
  }

  const handleScannedCode = (code: string) => {
    const product = findProductByScannedCode(products, code, { inStockOnly: true })
    if (!product) {
      setSearch(code)
      toast.warning(en.scanner.productNotFoundSearchFilled.replace("{code}", code))
      searchRef.current?.focus()
      return
    }

    addProductToCart(product)
    toast.success(en.scanner.productAddedToCart.replace("{name}", product.name))
  }

  const updateCartItem = (productId: string, patch: Partial<PosCartItem>) => {
    setCart((current) => current.map((item) => (item.productId === productId ? { ...item, ...patch } : item)))
  }

  const removeCartItem = (productId: string) => {
    setCart((current) => current.filter((item) => item.productId !== productId))
  }

  const resetBill = () => {
    setClearConfirmOpen(false)
    setCart([])
    setSearch("")
    setCashReceived("")
    setPaymentMode("Cash")
    setCustomer(EMPTY_SALE_CUSTOMER)
    setNote("")
    setReference("")
    setGstEnabled(false)
    searchRef.current?.focus()
    toast.info(en.pos.billCleared)
  }

  const handleProductSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setSelectedIndex((current) => Math.min(current + 1, Math.max(filteredProducts.length - 1, 0)))
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setSelectedIndex((current) => Math.max(current - 1, 0))
    }

    if (event.key === "Enter") {
      event.preventDefault()
      const selectedProduct = filteredProducts[selectedIndex] || filteredProducts[0]
      if (selectedProduct) addProductToCart(selectedProduct)
    }

    if (event.key === "Escape") {
      event.preventDefault()
      setSearch("")
    }
  }

  const handleCustomerPartyChange = (value: string) => {
    const selected = customerParties.find((party) => party.name === value)
    if (!selected) {
      setCustomer((current) => ({ ...current, name: value }))
      return
    }
    setCustomer(mapPartyToSaleCustomer(selected))
  }

  const handleSave = async () => {
    if (!cart.length) {
      toast.error(en.sales.addFirstProduct)
      return
    }

    if (!saleGate.allowed && !saleGate.loading) {
      toast.warning(en.subscription.featureLimitReached.replace("{feature}", en.subscription.features.quickSales).replace("{limit}", formatPlanLimit(saleGate.limit)))
      return
    }

    for (const item of cart) {
      const quantity = Number(item.quantity || 0)
      const price = Number(item.salePrice || 0)
      if (!Number.isFinite(quantity) || quantity <= 0) {
        toast.error(en.sales.invalidQuantity)
        return
      }
      if (quantity > item.availableQty) {
        toast.error(en.sales.availableForProduct.replace("{quantity}", String(item.availableQty)).replace("{unit}", item.quantityUnit).replace("{name}", item.name))
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

    if (dueAmount > 0 && !customer.name?.trim()) {
      toast.warning(en.pos.customerRequiredForDue)
      return
    }

    if (profileWarnings.length) {
      toast.warning(`${en.transaction.profileWarningTitle}: ${profileWarnings.join(" ")}`)
      if (transactionOptions.generateGstInvoice || gstEnabled) return
    }

    if (!ensureValidTransactionOptions(transactionOptions)) return

    const needsPrintShareAccess = Boolean(
      transactionOptions.printReceipt ||
        transactionOptions.downloadPdf ||
        transactionOptions.shareWhatsApp ||
        transactionOptions.shareEmail ||
        transactionOptions.copyDetails,
    )
    if (needsPrintShareAccess && !printShareAllowed) {
      toast.warning(en.subscription.featureLimitReached.replace("{feature}", en.subscription.features.printShareDownload).replace("{limit}", formatPlanLimit(printShareGate.limit)))
      return
    }

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
        amountPaid,
        note,
        reference,
        gstEnabled,
        entryMode: "quick-sale",
      })

      if (transactionOptions.generateGstInvoice) {
        await saveSaleInvoiceDraft(buildSaleInvoiceDraftFromRecord(sale))
      }

      await runTransactionDocumentActions(buildSaleTransactionDocument(sale, sellerProfile), transactionOptions)
      toast.success(en.pos.saleCompleted)

      setCart([])
      setSearch("")
      setCashReceived("")
      setPaymentMode("Cash")
      setCustomer(EMPTY_SALE_CUSTOMER)
      setNote("")
      setReference("")
      setGstEnabled(false)
      searchRef.current?.focus()
    } catch (error) {
      console.error("POS sale save failed", error)
      toast.error(error instanceof Error ? error.message : en.sales.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-page space-y-5 pb-8">
      <PageHeader eyebrow={en.navigation.pos} title={en.pages.posTitle} description={en.pages.posDescription} />

      <PageActionLinks
        title={en.common.nextActions}
        description={en.common.nextActionsDescription}
        actions={[
          { href: DASHBOARD_ROUTES.quickSale, label: en.pos.goToQuickSale, description: en.pos.goToQuickSaleHelp, icon: <FileText size={18} /> },
          { href: DASHBOARD_ROUTES.sales, label: en.sales.goToSales, description: en.pos.goToSalesHelp, icon: <ReceiptText size={18} /> },
          { href: DASHBOARD_ROUTES.inventory, label: en.pos.goToInventory, description: en.pos.goToInventoryHelp, icon: <Boxes size={18} /> },
          { href: DASHBOARD_ROUTES.reports, label: en.sales.goToReports, description: en.sales.goToReportsHelp, icon: <BarChart3 size={18} /> },
        ]}
      />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <SummaryCard label={en.pos.cartItems} value={String(cart.length)} />
        <SummaryCard label={en.sales.totalAmount} value={formatCurrency(totalAmount)} />
        <SummaryCard label={en.pos.cashReceived} value={formatCurrency(amountReceived)} />
        <SummaryCard label={en.pos.changeReturn} value={formatCurrency(changeReturn)} />
      </section>

      {!saleGate.allowed && !saleGate.loading ? (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="font-bold">{en.subscription.subscriptionRequired}</p>
          <p>{en.subscription.readOnlyExpiredMessage}</p>
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="space-y-4">
          <GuidedStepCard
            step={1}
            title={en.pos.searchStepTitle}
            description={en.pos.searchStepDescription}
            icon={<PackageSearch size={18} />}
          >
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[var(--text-primary)]">{en.pos.fastSearch}</label>
                  <p className="text-xs text-[var(--text-secondary)]">{en.pos.keyboardHint}</p>
                </div>
                <BarcodeScannerButton
                  onDetected={handleScannedCode}
                  buttonTitle={en.scanner.scanForPos}
                  disabled={saving}
                  className="w-full sm:w-auto"
                />
              </div>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden="true" />
                <Input
                  ref={searchRef}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={handleProductSearchKeyDown}
                  placeholder={en.pos.searchPlaceholder}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2" role="listbox" aria-label={en.pos.searchResults}>
              {filteredProducts.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  role="option"
                  aria-selected={selectedIndex === index}
                  onClick={() => addProductToCart(product)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)] ${
                    selectedIndex === index
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border-card)] bg-[var(--surface-primary)]"
                  }`}
                >
                  <ProductSearchSummary product={product} />
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-card-strong)] text-[var(--accent)]">
                    <Plus size={16} aria-hidden="true" />
                  </span>
                </button>
              ))}

              {!filteredProducts.length && !productsLoading ? (
                <SimpleEmptyState
                  title={en.sales.noProductFoundTitle}
                  description={en.pos.noProductFound}
                  icon={<Boxes size={18} aria-hidden="true" />}
                />
              ) : null}
            </div>
          </GuidedStepCard>

          <GuidedStepCard
            title={en.pos.quickPickStepTitle}
            description={en.pos.quickPickStepDescription}
            icon={<ShoppingBag size={18} />}
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
              {quickPickProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProductToCart(product)}
                  className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
                >
                  <p className="line-clamp-1 font-semibold capitalize text-[var(--text-primary)]">{product.name}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{formatQuantity(product.quantity, product.quantityUnit)}</p>
                  <p className="mt-1 text-sm font-bold text-emerald-500">{formatCurrency(product.price)}</p>
                </button>
              ))}
            </div>
          </GuidedStepCard>
        </div>

        <div className="space-y-4">
          <GuidedStepCard
            step={2}
            title={en.pos.cartStepTitle}
            description={en.pos.cartStepDescription}
            icon={<ShoppingCart size={18} />}
            actions={(
              <>
                <Button type="button" variant="outline" title={en.pos.holdBill} disabled ariaLabel={en.pos.holdBillUnavailable} />
                <Button type="button" variant="soft-danger" title={en.pos.clearBill} onClick={() => setClearConfirmOpen(true)} disabled={!cart.length || saving} />
              </>
            )}
          >
            <div className="space-y-3">
              {cart.map((item, index) => (
                <article key={item.productId} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold capitalize text-[var(--text-primary)]">{item.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {formatQuantity(item.availableQty, item.quantityUnit)} · {item.category || en.inventory.noCategory}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-500">{formatCurrency(calculatedItems[index]?.lineTotal || 0)}</p>
                      <Button
                        type="button"
                        variant="delete"
                        icon={<Trash2 size={16} aria-hidden="true" />}
                        ariaLabel={en.pos.removeItem}
                        onClick={() => removeCartItem(item.productId)}
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1.1fr_1fr_1fr]">
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
                    />
                    {gstEnabled ? (
                      <Input
                        type="number"
                        min={0}
                        label={en.inventory.gstPercent}
                        value={item.gstRate}
                        onChange={(event) => updateCartItem(item.productId, { gstRate: event.target.value })}
                      />
                    ) : null}
                  </div>
                </article>
              ))}

              {!cart.length ? (
                <SimpleEmptyState
                  title={en.sales.emptyCartTitle}
                  description={en.pos.emptyCartDescription}
                  icon={<ShoppingCart size={18} aria-hidden="true" />}
                />
              ) : null}
            </div>
          </GuidedStepCard>

          <GuidedStepCard
            step={3}
            title={en.pos.paymentStepTitle}
            description={en.pos.paymentStepDescription}
            icon={<ReceiptText size={18} />}
          >

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <datalist id="pos-customer-party-options">
                {customerParties.map((party) => (
                  <option key={party.id} value={party.name} />
                ))}
              </datalist>
              <Input
                label={en.parties.customerPartyLabel}
                value={customer.name || ""}
                placeholder={en.sales.customerNamePlaceholder}
                onChange={(event) => handleCustomerPartyChange(event.target.value)}
                datalist="pos-customer-party-options"
                helperText={dueAmount > 0 ? en.pos.customerRequiredForDue : en.sales.customerOptional}
              />
              <Input
                label={en.inventory.phone}
                value={customer.phone || ""}
                onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))}
              />
              <Input
                label={en.inventory.buyerGstin}
                value={customer.gstin || ""}
                onChange={(event) => setCustomer((current) => ({ ...current, gstin: event.target.value.toUpperCase() }))}
              />
              <Input label={en.sales.reference} value={reference} onChange={(event) => setReference(event.target.value)} />
              <Input
                label={en.sales.noteReference}
                value={note}
                placeholder={en.sales.noteReferencePlaceholder}
                onChange={(event) => setNote(event.target.value)}
                containerClassName="md:col-span-2"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <SalePaymentModeSelect value={paymentMode} onChange={setPaymentMode} />

              <Input
                type="number"
                min={0}
                label={en.pos.cashReceived}
                value={paymentMode === "Cash" ? cashReceived : String(amountReceived)}
                onChange={(event) => setCashReceived(event.target.value)}
                disabled={paymentMode !== "Cash"}
              />

              <Input label={en.pos.changeReturn} value={formatCurrency(changeReturn)} readOnly />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard label={en.sales.taxableAmount} value={formatCurrency(totals.taxableAmount)} />
              <SummaryCard label={en.sales.totalGst} value={formatCurrency(totals.gstAmount)} />
              <SummaryCard label={en.sales.totalAmount} value={formatCurrency(totalAmount)} />
              <SummaryCard label={en.sales.amountPaid} value={formatCurrency(amountPaid)} />
              <SummaryCard label={en.sales.balanceDue} value={formatCurrency(dueAmount)} />
            </div>

            {paymentMode === "UPI" ? (
              <div className="mt-4 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    <QrCode size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[var(--text-primary)]">{en.pos.upiQrTitle}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{upiQrValue ? en.pos.upiQrHelp : en.pos.upiMissingProfile}</p>
                  </div>
                  {upiQrValue ? (
                    <div className="rounded-2xl bg-white p-3">
                      <QRCodeSVG value={upiQrValue} size={112} aria-label={en.pos.upiQrTitle} />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-3 text-sm font-semibold text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={gstEnabled}
                onChange={(event) => setGstEnabled(event.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <span>{en.sales.gstToggle}</span>
            </label>

            <TransactionActionPanel
              value={transactionOptions}
              onChange={setTransactionOptions}
              profileWarnings={profileWarnings}
              allowGstInvoice
              allowPrint={printShareAllowed}
              allowDownloadPdf={printShareAllowed}
              allowShareWhatsApp={printShareAllowed}
              allowShareEmail={printShareAllowed}
              allowCopyDetails={printShareAllowed}
              disabled={saving}
              className="mt-4"
            />

            {!printShareAllowed && !printShareGate.loading ? (
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-200">{en.pos.printShareLocked}</p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--text-secondary)]">{en.pos.stockAndLedgerHelp}</p>
              <Button
                type="button"
                variant="primary"
                title={saving ? en.pos.completingBill : en.pos.completeBill}
                onClick={handleSave}
                loading={saving}
                disabled={saving || !cart.length || (!saleGate.allowed && !saleGate.loading)}
                className="w-full sm:w-auto"
              />
            </div>
          </GuidedStepCard>
        </div>
      </section>

      <Modal
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        title={en.pos.clearBillConfirmTitle}
        description={en.pos.clearBillConfirmDescription}
        primaryLabel={en.common.clearNow}
        primaryVariant="danger"
        cancelLabel={en.common.keepEditing}
        variant="warning"
        onPrimary={resetBill}
      />
    </div>
  )
}

function ProductSearchSummary({ product }: { product: Product }) {
  return (
    <div className="min-w-0">
      <p className="font-semibold capitalize text-[var(--text-primary)]">{product.name}</p>
      <p className="text-xs text-[var(--text-secondary)]">
        {[product.category, product.sku].filter(Boolean).join(" | ") || en.inventory.noCategory}
      </p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">
        {formatQuantity(product.quantity, product.quantityUnit)} · {formatCurrency(product.price)}
      </p>
    </div>
  )
}

function formatPlanLimit(limit: unknown) {
  if (typeof limit === "number") return String(limit)
  return en.common.notAvailable
}
