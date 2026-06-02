"use client"

import { useEffect, useMemo, useRef, useState, type SetStateAction } from "react"
import type { Product, SaleCustomer, SalePaymentMode, SalePaymentStatus } from "@/app/lib/db"
import PageHeader from "@/app/components/ui/PageHeader"
import Modal from "@/app/components/ui/Modal"
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
import { buildSaleInvoiceDraftFromRecord, buildSaleTransactionDocument } from "@/app/lib/sales/sale.documents"
import { saveSale } from "@/app/lib/sales/sale.service"
import { calculateSaleLine, calculateSaleTotals } from "@/app/lib/sales/sale.utils"
import { createTransactionOptions, runTransactionDocumentActions, ensureValidTransactionOptions } from "@/app/lib/transactionActions"
import { buildBusinessDocumentProfile, getProfileDocumentWarnings, type TransactionOptionFlags } from "@/app/lib/transactionDocument"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { en } from "@/app/messages/en"
import {
  EMPTY_SALE_CUSTOMER,
  buildSaleDraftLineFromCartItem,
  buildSaleDraftLinesFromCart,
  createStockAwareSaleCartItemFromProduct,
  mapPartyToSaleCustomer,
} from "@/app/lib/sales/saleForm.utils"
import PosProductPicker from "./PosProductPicker"
import PosCartEditor from "./PosCartEditor"
import PosCheckout from "./PosCheckout"
import type { PosCartItem, ProductPick } from "./types"

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
  const [paymentMode, setPaymentMode] = useState<SalePaymentMode | "">("")
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
  const effectiveTransactionOptions = useMemo(
    () =>
      printShareAllowed || printShareGate.loading
        ? transactionOptions
        : {
            ...transactionOptions,
            printReceipt: false,
            downloadPdf: false,
            shareWhatsApp: false,
            shareEmail: false,
            copyDetails: false,
          },
    [printShareAllowed, printShareGate.loading, transactionOptions],
  )

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
  const amountReceived = paymentMode === "Cash" ? cashReceivedAmount : paymentMode === "Credit" ? 0 : paymentMode ? totalAmount : 0
  const amountPaid = Math.min(amountReceived, totalAmount)
  const changeReturn = paymentMode === "Cash" ? Math.max(cashReceivedAmount - totalAmount, 0) : 0
  const dueAmount = paymentMode ? Math.max(totalAmount - amountPaid, 0) : totalAmount
  const paymentStatus: SalePaymentStatus | "" = paymentMode ? (dueAmount <= 0 ? "paid" : amountPaid > 0 ? "partial" : "unpaid") : ""
  const customerNameRequired = dueAmount > 0
  const customerNameReady = !customerNameRequired || Boolean(customer.name?.trim())
  const gstinReady = !customer.gstin?.trim() || isValidGstin(customer.gstin)
  const paymentReady =
    Boolean(paymentMode) &&
    (paymentMode !== "Cash" || cashReceivedAmount > 0)
  const canCompleteBill = cart.length > 0 && customerNameReady && gstinReady && paymentReady && (saleGate.allowed || saleGate.loading)

  const handlePaymentModeChange = (value: SetStateAction<SalePaymentMode | "">) => {
    const nextValue = typeof value === "function" ? value(paymentMode) : value
    setPaymentMode(nextValue)
    if (nextValue !== "Cash" && cashReceived) {
      setCashReceived("")
    }
  }

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
    setPaymentMode("")
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
    if (!paymentMode) {
      toast.error(en.sales.paymentModeRequired)
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
      if (effectiveTransactionOptions.generateGstInvoice || gstEnabled) return
    }

    if (!ensureValidTransactionOptions(effectiveTransactionOptions)) return

    const needsPrintShareAccess = Boolean(
      effectiveTransactionOptions.printReceipt ||
        effectiveTransactionOptions.downloadPdf ||
        effectiveTransactionOptions.shareWhatsApp ||
        effectiveTransactionOptions.shareEmail ||
        effectiveTransactionOptions.copyDetails,
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
        paymentStatus: paymentStatus as SalePaymentStatus,
        amountPaid,
        note,
        reference,
        gstEnabled,
        entryMode: "quick-sale",
      })

      if (effectiveTransactionOptions.generateGstInvoice) {
        await saveSaleInvoiceDraft(buildSaleInvoiceDraftFromRecord(sale))
      }

      await runTransactionDocumentActions(buildSaleTransactionDocument(sale, sellerProfile), effectiveTransactionOptions)
      toast.success(en.pos.saleCompleted)

      setCart([])
      setSearch("")
      setCashReceived("")
      setPaymentMode("")
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
    <div className="dashboard-page space-y-6 pb-8">
      <PageHeader eyebrow={en.navigation.pos} title={en.pages.posTitle} description={en.pages.posDescription} />

      {/* <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <SummaryCard label={en.pos.cartItems} value={String(cart.length)} />
        <SummaryCard label={en.sales.totalAmount} value={formatCurrency(totalAmount)} />
        <SummaryCard label={en.pos.cashReceived} value={formatCurrency(amountReceived)} />
        <SummaryCard label={en.pos.changeReturn} value={formatCurrency(changeReturn)} />
      </section> */}

      {/* {!saleGate.allowed && !saleGate.loading ? (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="font-bold">{en.subscription.subscriptionRequired}</p>
          <p>{en.subscription.readOnlyExpiredMessage}</p>
        </section>
      ) : null} */}

      <section className="space-y-4">
        <PosProductPicker
          search={search}
          searchRef={searchRef}
          onSearchChange={(value) => {
            setSearch(value)
            setSelectedIndex(0)
          }}
          onSearchKeyDown={handleProductSearchKeyDown}
          filteredProducts={filteredProducts}
          productsLoading={productsLoading}
          saving={saving}
          selectedIndex={selectedIndex}
          quickPickProducts={quickPickProducts}
          onScannedCode={handleScannedCode}
          onAddProduct={addProductToCart}
        />

        <PosCartEditor
          cart={cart}
          calculatedItems={calculatedItems}
          gstEnabled={gstEnabled}
          onUpdateCartItem={updateCartItem}
          onRemoveCartItem={removeCartItem}
        />

        <PosCheckout
          customer={customer}
          customerParties={customerParties}
          onCustomerPartyChange={handleCustomerPartyChange}
          setCustomer={setCustomer}
          paymentMode={paymentMode}
          setPaymentMode={handlePaymentModeChange}
          cashReceived={cashReceived}
          setCashReceived={setCashReceived}
          note={note}
          setNote={setNote}
          reference={reference}
          setReference={setReference}
          totalAmount={totalAmount}
          taxableAmount={totals.taxableAmount}
          gstAmount={totals.gstAmount}
          amountReceived={amountReceived}
          amountPaid={amountPaid}
          dueAmount={dueAmount}
          changeReturn={changeReturn}
          paymentStatus={paymentStatus}
          gstEnabled={gstEnabled}
          setGstEnabled={setGstEnabled}
          transactionOptions={effectiveTransactionOptions}
          setTransactionOptions={setTransactionOptions}
          profileWarnings={profileWarnings}
          saving={saving}
          canSaveSale={canCompleteBill}
          printShareAllowed={printShareAllowed}
          printShareLoading={printShareGate.loading}
          upiQrValue={upiQrValue}
          onSave={handleSave}
        />
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

function formatPlanLimit(limit: unknown) {
  if (typeof limit === "number") return String(limit)
  return en.common.notAvailable
}
