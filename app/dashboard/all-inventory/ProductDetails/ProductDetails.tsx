"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, LayoutGrid, PackageSearch } from "lucide-react"
import { Product } from "@/app/lib/db"
import { getProductLogsByProductIds } from "@/app/dashboard/quick-purchase/product.service"
import Button from "@/app/components/ui/Button"
import StockHistoryTabs from "../StockHistoryTabs"
import StockInModal from "../StockInModal"
import StockOutModal from "../StockOutModal"
import ProductStats from "./ProductStats"
import MultiItemSaleModal from "../MultiItemSaleModal"
import ProductManagementModal from "../ProductManagementModal"
import { formatQuantity } from "@/app/lib/quantityUnit"
import { formatQuantityBreakdown, getProductStockLevel } from "@/app/lib/inventory.utils"
import type { StockHistoryLog } from "../stock-history.types"
import { en } from "@/app/messages/en"
import { notify as toast } from "@/app/lib/notifications"
import BulkSaleSection from "./BulkSaleSection"
import ShareActions from "@/app/components/ui/ShareActions"
import useDebouncedValue from "@/app/hooks/useDebouncedValue"
import { buildBusinessDocumentProfile, type TransactionDocumentData } from "@/app/lib/transactionDocument"
import useProfile from "@/app/dashboard/profile/useProfile"

type CategoryGroup = {
  key: string
  label: string
  products: Product[]
  totalQty: number
  totalValue: number
}

const PRODUCT_PICKER_PAGE_SIZE = 80

function simpleStockText(level: ReturnType<typeof getProductStockLevel>) {
  if (level === "out") return en.inventory.stockLevelOut
  if (level === "critical") return en.inventory.stockLevelCritical
  if (level === "low") return en.inventory.stockLevelLow
  return ""
}

export default function ProductDetails({
  group,
  activeProductId,
  onChangeProduct,
  onBack,
}: {
  group: CategoryGroup
  activeProductId: string | null
  onChangeProduct: (productId: string | null) => void
  onBack?: () => void
}) {
  const [logs, setLogs] = useState<StockHistoryLog[]>([])
  const [historyLogs, setHistoryLogs] = useState<StockHistoryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<"in" | "out" | null>(null)
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [selectedSaleIds, setSelectedSaleIds] = useState<Set<string>>(new Set())
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [productModal, setProductModal] = useState<"edit" | "delete" | null>(null)
  const [recentActionMessage, setRecentActionMessage] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [productVisibleState, setProductVisibleState] = useState({
    key: "",
    limit: PRODUCT_PICKER_PAGE_SIZE,
  })
  const { profile } = useProfile()
  const debouncedProductSearch = useDebouncedValue(productSearch, 180)
  const logCacheRef = useRef(new Map<string, StockHistoryLog[]>())
  const logRequestRef = useRef(0)
  const activeProductIdRef = useRef<string | null>(null)

  const activeProduct = useMemo(
    () => group.products.find((product) => product.id === activeProductId) ?? group.products[0],
    [group.products, activeProductId]
  )

  const productIds = useMemo(
    () => group.products.map((product) => product.id).filter((id): id is string => Boolean(id)),
    [group.products]
  )

  const productIdsKey = productIds.join("|")

  const selectedSaleProducts = useMemo(
    () => group.products.filter((product) => selectedSaleIds.has(product.id)),
    [group.products, selectedSaleIds]
  )

  const productShareMessage = useMemo(
    () => buildProductShareMessage(activeProduct),
    [activeProduct]
  )

  const productShareDocument = useMemo<TransactionDocumentData | undefined>(() => {
    if (!activeProduct) return undefined
    return {
      type: "stock-adjustment",
      title: activeProduct.name,
      reference: activeProduct.sku || activeProduct.id || activeProduct.name,
      date: new Date().toLocaleString("en-IN"),
      seller: buildBusinessDocumentProfile(profile),
      partyLabel: en.inventory.category,
      party: { name: activeProduct.category || en.inventory.noCategory },
      items: [
        {
          name: activeProduct.name,
          description: [
            activeProduct.supplier ? `${en.inventory.supplier}: ${activeProduct.supplier}` : "",
            activeProduct.hsnCode ? `${en.stockHistory.labels.hsn}: ${activeProduct.hsnCode}` : "",
            activeProduct.expiry ? `${en.inventory.expiry}: ${activeProduct.expiry}` : "",
          ].filter(Boolean).join(" | "),
          quantity: activeProduct.quantity,
          unit: activeProduct.quantityUnit,
          rate: activeProduct.price,
          total: Number(activeProduct.quantity || 0) * Number(activeProduct.price || 0),
          note: activeProduct.note,
        },
      ],
      totals: {
        grandTotal: Number(activeProduct.quantity || 0) * Number(activeProduct.price || 0),
      },
      notes: productShareMessage,
    }
  }, [activeProduct, profile, productShareMessage])

  const filteredProductChoices = useMemo(() => {
    const search = debouncedProductSearch.trim().toLowerCase()
    if (!search) return group.products

    return group.products.filter((product) =>
      [product.name, product.sku, product.hsnCode, product.supplier, product.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    )
  }, [group.products, debouncedProductSearch])

  const productPickerKey = `${group.key}|${debouncedProductSearch}`
  const productVisibleLimit =
    productVisibleState.key === productPickerKey
      ? productVisibleState.limit
      : PRODUCT_PICKER_PAGE_SIZE

  const visibleProducts = useMemo(
    () => filteredProductChoices.slice(0, productVisibleLimit),
    [filteredProductChoices, productVisibleLimit]
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const activeId = activeProduct?.id ?? null
      activeProductIdRef.current = activeId

      if (!activeId) {
        setLogs([])
        setHistoryLogs([])
        setLoading(false)
        return
      }

      const cachedLogs = logCacheRef.current.get(activeId)
      if (cachedLogs) {
        setLogs(cachedLogs)
        setLoading(false)
        return
      }

      setLogs([])
      setLoading(true)
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [activeProduct?.id])

  useEffect(() => {
    let cancelled = false

    if (!productIds.length) {
      const timeout = window.setTimeout(() => {
        if (cancelled) return
        logCacheRef.current.clear()
        setLogs([])
        setHistoryLogs([])
        setLoading(false)
      }, 0)

      return () => {
        cancelled = true
        window.clearTimeout(timeout)
      }
    }
    const requestId = logRequestRef.current + 1
    logRequestRef.current = requestId
    const activeId = activeProductIdRef.current

    let loadingTimeout: number | undefined
    if (activeId && !logCacheRef.current.has(activeId)) {
      loadingTimeout = window.setTimeout(() => {
        if (!cancelled) setLoading(true)
      }, 0)
    }

    getProductLogsByProductIds(productIds)
      .then((logsByProduct) => {
        if (cancelled || requestId !== logRequestRef.current) return

        productIds.forEach((productId) => {
          const nextLogs = (logsByProduct.get(productId) || []).map((log) => ({
            ...log,
            id: String(log.id),
          }))
          logCacheRef.current.set(productId, nextLogs)
        })

        const combinedLogs: StockHistoryLog[] = []
        const seenIds = new Set<string>()
        productIds.forEach((productId) => {
          const productLogs = logCacheRef.current.get(productId) || []
          productLogs.forEach((log) => {
            const logId = String(log.id)
            if (seenIds.has(logId)) return
            seenIds.add(logId)
            combinedLogs.push(log)
          })
        })

        const currentActiveId = activeProductIdRef.current
        setLogs(currentActiveId ? logCacheRef.current.get(currentActiveId) || [] : [])
        setHistoryLogs(combinedLogs.sort((left, right) => right.date.localeCompare(left.date)))
        setLoading(false)
      })
      .catch(() => {
        toast.error(en.inventory.historyLoadFailed)
        if (!cancelled && requestId === logRequestRef.current) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
      if (loadingTimeout !== undefined) window.clearTimeout(loadingTimeout)
    }
  }, [productIds, productIdsKey, refreshTrigger])

  useEffect(() => {
    if (!recentActionMessage) return
    const timeout = window.setTimeout(() => setRecentActionMessage(""), 4500)
    return () => window.clearTimeout(timeout)
  }, [recentActionMessage])

  const handleModalClose = () => {
    setModal(null)
    logCacheRef.current.clear()
    setLoading(true)
    setRefreshTrigger((count) => count + 1)
  }

  if (!activeProduct) {
    return (
      <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-8 sm:p-10 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-secondary)]">
          <PackageSearch size={22} />
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {en.inventory.notFoundTitle}
        </h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {en.inventory.notFoundDescription}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="overflow-hidden rounded-[24px] sm:rounded-[28px] shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-4 bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex w-full items-start gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--btn-primary)]/10 text-[var(--btn-primary)] sm:h-14 sm:w-14">
                <LayoutGrid size={22} />
              </div>

              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] truncate">
                  {group.label}
                </h2>

                <div className="mt-2 flex flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm text-[var(--text-secondary)]">
                  <span className="rounded-lg border border-[var(--border-card)] px-3 py-1">
                    {group.products.length} {en.inventory.itemsSuffix}
                  </span>
                  <span className="rounded-lg border border-[var(--border-card)] px-3 py-1">
                    {en.inventory.remainingPrefix} {formatQuantityBreakdown(group.products)}
                  </span>
                  <span className="rounded-lg border border-[var(--border-card)] px-3 py-1">
                    {en.inventory.valuePrefix} {en.common.rupeeSymbol} {group.totalValue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
              <ShareActions
                document={productShareDocument}
                subject={activeProduct.name}
                showPrint={false}
                showDownload
                compact
              />
            {onBack && (
                <Button
                  onClick={onBack}
                  title={en.common.back}
                  variant="black"
                  icon={<ArrowLeft size={16} />}
                />
            )}
              </div>
          </div>

          <div className="border-t border-zinc-400/40 bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 sm:p-5">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {en.inventory.chooseItem}
                </h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {visibleProducts.length} / {filteredProductChoices.length} {en.inventory.visibleItemsCount}
                </p>
              </div>

              <input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder={en.inventory.searchInCategory}
                className="min-h-10 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-emerald-400 sm:max-w-xs"
              />
            </div>

            <div className="filter-scroll sm:gap-3">
              {visibleProducts.length === 0 ? (
                <div className="w-full rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--surface-primary)] px-4 py-5 text-sm text-[var(--text-secondary)]">
                  {en.inventory.searchNoResults}
                </div>
              ) : (
                <>
                  {visibleProducts.map((product) => {
                    const isActive = product.id === activeProduct.id
                    const stockLevel = getProductStockLevel(product)
                    const stockText = simpleStockText(stockLevel)

                    return (
                      <Button
                        key={product.id}
                        onClick={() => {
                          if (product.id === activeProduct.id) return
                          onChangeProduct(product.id ?? null)
                        }}
                        variant={isActive ? "success" : "outline"}
                        className="min-w-[140px] sm:min-w-[180px] !px-3 sm:!px-4 !py-2.5 sm:!py-3 text-xs sm:text-sm"
                        title={`${product.name} (${formatQuantity(product.quantity, product.quantityUnit)}${
                          stockText ? `, ${stockText}` : ""
                        })`}
                      />
                    )
                  })}
                  {filteredProductChoices.length > visibleProducts.length && (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-w-[160px] !px-3 !py-2.5 text-xs sm:text-sm"
                      title={`${en.inventory.showMoreItems} (${filteredProductChoices.length - visibleProducts.length})`}
                      onClick={() =>
                        setProductVisibleState({
                          key: productPickerKey,
                          limit: productVisibleLimit + PRODUCT_PICKER_PAGE_SIZE,
                        })
                      }
                    />
                  )}
                </>
              )}
            </div>
          </div>

          <BulkSaleSection
            group={group}
            selectedSaleIds={selectedSaleIds}
            setSelectedSaleIds={setSelectedSaleIds}
            selectedSaleProducts={selectedSaleProducts}
            onCreateSale={() => setSaleModalOpen(true)}
          />
        </div>

        <ProductStats
          product={activeProduct}
          logs={logs}
          setModal={setModal}
          onEditProduct={() => setProductModal("edit")}
          onDeleteProduct={() => setProductModal("delete")}
        />

        <div className="rounded-[24px] sm:rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 sm:p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
              {en.inventory.historyTitle}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)]">
              {en.inventory.historyDescription} <b>{group.label}</b>.
            </p>
          </div>

          {recentActionMessage && (
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{en.inventory.updated}</p>
                <p className="mt-1 text-xs sm:text-sm">{recentActionMessage}</p>
              </div>
              <Button
                title={en.inventory.dismiss}
                variant="soft-primary"
                onClick={() => setRecentActionMessage("")}
              />
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--surface-secondary)] px-4 py-6 sm:py-8 text-center text-sm text-[var(--text-secondary)]">
              {en.inventory.historyLoading}
            </div>
          ) : (
            <StockHistoryTabs
              logs={historyLogs}
              products={group.products}
              onDataChange={(message) => {
                if (message) setRecentActionMessage(message)
                logCacheRef.current.clear()
                setLoading(true)
                setRefreshTrigger((count) => count + 1)
              }}
            />
          )}
        </div>
      </div>

      {modal === "in" && <StockInModal product={activeProduct} onClose={handleModalClose} />}
      {modal === "out" && <StockOutModal product={activeProduct} onClose={handleModalClose} />}

      {productModal && (
        <ProductManagementModal
          open={Boolean(productModal)}
          mode={productModal}
          product={activeProduct}
          historyCount={logs.length}
          onClose={() => setProductModal(null)}
          onSaved={(message) => {
            setRecentActionMessage(message)
            logCacheRef.current.clear()
            setLoading(true)
            setRefreshTrigger((count) => count + 1)

            if (productModal === "delete") {
              const remainingProducts = group.products.filter(
                (product) => product.id !== activeProduct.id
              )
              onChangeProduct(remainingProducts[0]?.id ?? null)

              if (remainingProducts.length === 0) {
                onBack?.()
              }
            }
          }}
        />
      )}

      {saleModalOpen && (
        <MultiItemSaleModal
          products={selectedSaleProducts}
          onClose={() => setSaleModalOpen(false)}
          onSuccess={() => {
            setSelectedSaleIds(new Set())
            logCacheRef.current.clear()
            setLoading(true)
            setRefreshTrigger((count) => count + 1)
          }}
        />
      )}
    </>
  )
}

function buildProductShareMessage(product?: Product) {
  if (!product) return en.share.noDetailsToShare
  return [
    en.common.appName,
    en.share.transactionDetails,
    `${en.receipt.product}: ${product.name}`,
    `${en.inventory.category}: ${product.category || en.inventory.noCategory}`,
    `${en.inventory.sku}: ${product.sku || "-"}`,
    `${en.gstInvoice.hsnSac}: ${product.hsnCode || "-"}`,
    `${en.inventory.rateLabel}: ${en.common.rupeeSymbol} ${Number(product.price || 0).toLocaleString("en-IN")}`,
    `${en.inventory.availableLabel}: ${formatQuantity(product.quantity, product.quantityUnit)}`,
    `${en.inventory.valueLabel}: ${en.common.rupeeSymbol} ${Number(product.price * product.quantity || 0).toLocaleString("en-IN")}`,
    `${en.inventory.supplier}: ${product.supplier || "-"}`,
    `${en.inventory.expiry}: ${product.expiry || "-"}`,
    "",
    en.share.footerNote,
  ].join("\n")
}
