"use client"

import { useMemo, useState, type SetStateAction } from "react"
import { useRouter } from "next/navigation"
import PageHeader from "@/app/components/ui/PageHeader"
import SuspendedAccessBanner from "@/app/components/subscription/SuspendedAccessBanner"
import useFeatureGate from "@/app/hooks/useFeatureGate"
import useProducts from "@/app/hooks/useProducts"
import useSubscription from "@/app/hooks/useSubscription"
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
import { matchesSearchQuery } from "@/app/lib/search.utils"
import { DASHBOARD_ROUTES } from "@/app/lib/navigation/dashboardRoutes"
import type { Product, SaleCustomer, SalePaymentMode, SalePaymentStatus } from "@/app/lib/db"
import { isValidGstin } from "@/app/lib/gst.utils"
import useParties from "@/app/hooks/useParties"
import {
  EMPTY_SALE_CUSTOMER,
  buildSaleDraftLineFromCartItem,
  buildSaleDraftLinesFromCart,
  createStockAwareSaleCartItemFromProduct,
  mapPartyToSaleCustomer,
} from "@/app/lib/sales/saleForm.utils"
import QuickSaleProductPicker from "./QuickSaleProductPicker"
import QuickSaleCartEditor from "./QuickSaleCartEditor"
import QuickSaleCheckout from "./QuickSaleCheckout"
import type { QuickSaleCartItem } from "./types"

export default function QuickSalePage() {
  const router = useRouter()
  const { products, loading: productsLoading } = useProducts()
  const { profile } = useProfile()
  const { parties: customerParties } = useParties("customer")
  const { subscriptionExpired } = useSubscription()
  const saleGate = useFeatureGate("quickSales")
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<QuickSaleCartItem[]>([])
  const [customer, setCustomer] = useState<SaleCustomer>(EMPTY_SALE_CUSTOMER)
  const [paymentMode, setPaymentMode] = useState<SalePaymentMode | "">("")
  const [paymentStatus, setPaymentStatus] = useState<SalePaymentStatus | "">("")
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
  const customerNameRequired = dueAmount > 0
  const customerNameReady = !customerNameRequired || Boolean(customer.name?.trim())
  const gstinReady = !customer.gstin?.trim() || isValidGstin(customer.gstin)
  const paymentReady =
    Boolean(paymentMode) &&
    Boolean(paymentStatus) &&
    (
      paymentStatus !== "partial" ||
      (Number(amountPaid || 0) > 0 && Number(amountPaid || 0) < totalAmount)
    )
  const canSaveSale = cart.length > 0 && customerNameReady && gstinReady && paymentReady && !saving

  const handlePaymentModeChange = (value: SetStateAction<SalePaymentMode | "">) => {
    const nextValue = typeof value === "function" ? value(paymentMode) : value
    setPaymentMode(nextValue)
    if (!nextValue) {
      setPaymentStatus("")
      setAmountPaid("")
    }
  }

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

  const updateCartItem = (productId: string, patch: Partial<QuickSaleCartItem>) => {
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
    if (!paymentMode) {
      toast.error(en.sales.paymentModeRequired)
      return
    }
    if (!paymentStatus) {
      toast.error(en.sales.paymentStatusRequired)
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
      setPaymentMode("")
      setPaymentStatus("")
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
      <PageHeader eyebrow={en.navigation.quickSale} title={en.pages.quickSaleTitle} description={en.pages.quickSaleDescription} />
      {subscriptionExpired ? (
        <SuspendedAccessBanner
          description={en.subscription.readOnlyExpiredMessage}
          featureLabel={en.subscription.features.quickSales}
          usage={saleGate.usage}
          limit={typeof saleGate.limit === "number" ? saleGate.limit : undefined}
          onOpenUpgrade={() => router.push("/pricing")}
        />
      ) : null}

      <section>
        <QuickSaleProductPicker search={search} onSearchChange={setSearch} filteredProducts={filteredProducts} productsLoading={productsLoading} saving={saving} onScannedCode={handleScannedCode} onAddProduct={addProductToCart} />

        <div className="space-y-4">
          <QuickSaleCartEditor cart={cart} calculatedItems={calculatedItems} gstEnabled={transactionOptions.generateGstInvoice} onUpdateCartItem={updateCartItem} onRemoveCartItem={removeCartItem} />

        <QuickSaleCheckout customerParties={customerParties} customer={customer} onCustomerPartyChange={handleCustomerPartyChange} setCustomer={setCustomer} paymentMode={paymentMode} setPaymentMode={handlePaymentModeChange} paymentStatus={paymentStatus} setPaymentStatus={setPaymentStatus} amountPaid={amountPaid} setAmountPaid={setAmountPaid} note={note} setNote={setNote} reference={reference} setReference={setReference} totalAmount={totalAmount} taxableAmount={totals.taxableAmount} gstAmount={totals.gstAmount} dueAmount={dueAmount} cartLength={cart.length} saving={saving} canSaveSale={canSaveSale} transactionOptions={transactionOptions} setTransactionOptions={setTransactionOptions} profileWarnings={profileWarnings} onSave={handleSave} />
        </div>
      </section>
    </div>
  )
}
