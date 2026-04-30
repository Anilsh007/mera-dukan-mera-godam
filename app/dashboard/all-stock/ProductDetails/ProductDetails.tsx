"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, LayoutGrid, PackageSearch } from "lucide-react"
import { Product } from "@/app/lib/db"
import { getProductLogs } from "@/app/dashboard/add-product/product.service"
import Button from "@/app/components/utility/Button"
import StockHistoryTabs from "../StockHistoryTabs"
import StockInModal from "../StockInModal"
import StockOutModal from "../StockOutModal"
import ProductStats from "./ProductStats"
import MultiItemSaleModal from "../MultiItemSaleModal"
import ProductManagementModal from "../ProductManagementModal"

type CategoryGroup = {
  key: string
  label: string
  products: Product[]
  totalQty: number
  totalValue: number
}

type Log = {
  id: string
  date: string
  quantityAdded: number
  type?: "in" | "out"
  reason?: string
  price: number
  expiry?: string
  note?: string
  productId?: string
  correctedAt?: string
  correctionLabel?: string
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
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<"in" | "out" | null>(null)
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [selectedSaleIds, setSelectedSaleIds] = useState<Set<string>>(new Set())
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [productModal, setProductModal] = useState<"edit" | "delete" | null>(null)
  const [recentActionMessage, setRecentActionMessage] = useState("")

  const activeProduct = useMemo(
    () => group.products.find((product) => product.id === activeProductId) ?? group.products[0],
    [group.products, activeProductId]
  )

  const selectedSaleProducts = useMemo(
    () => group.products.filter((product) => selectedSaleIds.has(product.id)),
    [group.products, selectedSaleIds]
  )

  useEffect(() => {
    if (!activeProduct?.id) return

    getProductLogs(activeProduct.id).then((data) => {
      setLogs(data.map((log) => ({ ...log, id: String(log.id) })))
      setLoading(false)
    })
  }, [activeProduct?.id, refreshTrigger])

  const handleModalClose = () => {
    setModal(null)
    setLoading(true)
    setRefreshTrigger((count) => count + 1)
  }

  useEffect(() => {
    if (!recentActionMessage) return
    const timeout = window.setTimeout(() => setRecentActionMessage(""), 4500)
    return () => window.clearTimeout(timeout)
  }, [recentActionMessage])

  if (!activeProduct) {
    return (
      <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-8 sm:p-10 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-secondary)]">
          <PackageSearch size={22} />
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">No product found</h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Is category me abhi koi valid product available nahi hai.
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
                    {group.products.length} products
                  </span>
                  <span className="rounded-lg border border-[var(--border-card)] px-3 py-1">
                    Qty {group.totalQty}
                  </span>
                  <span className="rounded-lg border border-[var(--border-card)] px-3 py-1">
                    Rs {group.totalValue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {onBack && (
              <div className="flex justify-start lg:justify-end">
                <Button onClick={onBack} title="Back" variant="black" icon={<ArrowLeft size={16} />} />
              </div>
            )}
          </div>

          <div className="border-t border-zinc-400/40 bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 sm:p-5">
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Select product</h3>

            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
              {group.products.map((product) => {
                const isActive = product.id === activeProduct.id

                return (
                  <Button
                    key={product.id}
                    onClick={() => {
                      setLoading(true)
                      onChangeProduct(product.id ?? null)
                    }}
                    variant={isActive ? "success" : "outline"}
                    className="min-w-[140px] sm:min-w-[180px] !px-3 sm:!px-4 !py-2.5 sm:!py-3 text-xs sm:text-sm"
                    title={product.name}
                  />
                )
              })}
            </div>
          </div>

          <div className="border-t border-zinc-400/40 bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Quick Sale Selection</h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Multiple items select karo, buyer add karo, phir ek hi baar stock out + print + GST draft banao.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  title={selectedSaleIds.size === group.products.filter((product) => product.quantity > 0).length ? "Unselect All" : "Select All"}
                  variant="outline"
                  onClick={() =>
                    setSelectedSaleIds((current) =>
                      current.size === group.products.filter((product) => product.quantity > 0).length
                        ? new Set()
                        : new Set(group.products.filter((product) => product.quantity > 0).map((product) => product.id))
                    )
                  }
                />
                <Button
                  title={`Create Sale (${selectedSaleIds.size})`}
                  variant="primary"
                  onClick={() => setSaleModalOpen(true)}
                  disabled={selectedSaleProducts.length === 0}
                />
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {group.products.map((product) => {
                const checked = selectedSaleIds.has(product.id)
                const disabled = product.quantity <= 0

                return (
                  <label
                    key={product.id}
                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                      checked
                        ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                        : "border-[var(--border-card)] bg-[var(--bg-input)]"
                    } ${disabled ? "opacity-60" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() =>
                        setSelectedSaleIds((current) => {
                          const next = new Set(current)
                          if (next.has(product.id)) next.delete(product.id)
                          else next.add(product.id)
                          return next
                        })
                      }
                      className="mt-1 h-4 w-4 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium capitalize text-[var(--text-primary)]">{product.name}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{product.supplier || "No supplier"}</p>
                        </div>
                        <p className="text-sm font-semibold text-emerald-600">Rs {product.price.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
                        <span className="rounded-lg border border-[var(--border-card)] px-2 py-1">SKU: {product.sku || "-"}</span>
                        <span className="rounded-lg border border-[var(--border-card)] px-2 py-1">Qty: {product.quantity}</span>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-black/5 dark:bg-white/5">
                  <tr className="border-b border-[var(--border-card)]">
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Select</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Product</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Supplier</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">SKU</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Available Qty</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-card)]">
                  {group.products.map((product) => {
                    const checked = selectedSaleIds.has(product.id)
                    const disabled = product.quantity <= 0

                    return (
                      <tr key={product.id} className={checked ? "bg-emerald-50/40 dark:bg-emerald/[0.04]" : ""}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() =>
                              setSelectedSaleIds((current) => {
                                const next = new Set(current)
                                if (next.has(product.id)) next.delete(product.id)
                                else next.add(product.id)
                                return next
                              })
                            }
                            className="h-4 w-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium capitalize text-[var(--text-primary)]">{product.name}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{product.supplier || "-"}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{product.sku || "-"}</td>
                        <td className="px-4 py-3 text-[var(--text-primary)]">{product.quantity}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-600">Rs {product.price.toLocaleString("en-IN")}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
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
            <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">Stock history</h3>
            <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)]">
              Activity of <b>{activeProduct.name}</b>.
            </p>
          </div>

          {recentActionMessage && (
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Recent update applied</p>
                <p className="mt-1 text-xs sm:text-sm">{recentActionMessage}</p>
              </div>
              <Button title="Dismiss" variant="soft-primary" onClick={() => setRecentActionMessage("")} />
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--surface-secondary)] px-4 py-6 sm:py-8 text-center text-sm text-[var(--text-secondary)]">
              History is loading...
            </div>
          ) : (
            <StockHistoryTabs
              logs={logs}
              products={group.products}
              onDataChange={(message) => {
                if (message) {
                  setRecentActionMessage(message)
                }
                setLoading(true)
                setRefreshTrigger((count) => count + 1)
              }}
            />
          )}
        </div>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm"
          onClick={handleModalClose}
        >
          <div
            className="w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-[28px] bg-[var(--bg-card-strong)] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {modal === "in" ? (
              <StockInModal product={activeProduct} onClose={handleModalClose} />
            ) : (
              <StockOutModal product={activeProduct} onClose={handleModalClose} />
            )}
          </div>
        </div>
      )}

      {productModal && (
        <ProductManagementModal
          open={Boolean(productModal)}
          mode={productModal}
          product={activeProduct}
          historyCount={logs.length}
          onClose={() => setProductModal(null)}
          onSaved={(message) => {
            setRecentActionMessage(message)
            setLoading(true)
            setRefreshTrigger((count) => count + 1)
            if (productModal === "delete") {
              const remainingProducts = group.products.filter((product) => product.id !== activeProduct.id)
              onChangeProduct(remainingProducts[0]?.id ?? null)
              if (remainingProducts.length === 0) {
                onBack?.()
              }
            }
          }}
        />
      )}

      {saleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm"
          onClick={() => setSaleModalOpen(false)}
        >
          <div
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-[28px] bg-[var(--bg-card-strong)] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <MultiItemSaleModal
              products={selectedSaleProducts}
              onClose={() => setSaleModalOpen(false)}
              onSuccess={() => {
                setSelectedSaleIds(new Set())
                setLoading(true)
                setRefreshTrigger((count) => count + 1)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
