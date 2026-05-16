"use client"

import { useState } from "react"
import { Product } from "@/app/lib/db"
import Button from "@/app/components/ui/Button"
import StockInModal from "./StockInModal"
import StockOutModal from "./StockOutModal"
import { getExpiryInfo, getProductStockLevel } from "@/app/lib/inventory.utils"
import { formatQuantity } from "@/app/lib/quantityUnit"
import { en } from "@/app/messages/en"

type ModalType = "in" | "out" | null

export default function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const [modal, setModal] = useState<ModalType>(null)

  const handleModalClose = () => {
    setModal(null)
  }

  const stockLevel = getProductStockLevel(product)
  const isCritical = stockLevel === "critical"
  const isLow = stockLevel === "low"
  const isOut = stockLevel === "out"

  const stockBadge = isOut
    ? { label: en.inventory.outOfStock, cls: "bg-[var(--out-stock)] text-[var(--out-stock-text)]" }
    : isCritical
      ? { label: en.inventory.critical, cls: "bg-[var(--critical-stock)] text-[var(--critical-stock-text)]" }
      : isLow
        ? { label: en.inventory.low, cls: "bg-[var(--low-stock)] text-[var(--low-stock-text)]" }
        : { label: en.inventory.healthy, cls: "bg-[var(--all-inventory)] text-[var(--all-inventory-text)]" }

  const expInfo = getExpiryInfo(product.expiry)

  return (
    <>
      <div
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onClick()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`${en.inventory.productDetails}: ${product.name}`}
        className="premium-surface group relative flex min-w-0 cursor-pointer flex-col gap-4 rounded-2xl p-4 transition-all duration-200 sm:p-5"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold capitalize text-[var(--text-primary)] transition group-hover:text-emerald-600">
              {product.name}
            </h2>
            <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
              {product.category || en.inventory.noCategory}
              {product.sku ? ` - ${product.sku}` : ""}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${stockBadge.cls}`}>
            {stockBadge.label}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 text-center">
          <div className="rounded-xl bg-[var(--bg-primary)] p-2">
            <p className="mb-0.5 text-xs text-[var(--text-muted)]">{en.inventory.rateLabel}</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{en.common.rupeeSymbol} {product.price.toLocaleString("en-IN")}</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-primary)] p-2">
            <p className="mb-0.5 text-xs text-[var(--text-muted)]">{en.inventory.availableLabel}</p>
            <p className={`text-sm font-bold ${isOut ? "text-red-500" : isCritical ? "text-red-400" : isLow ? "text-amber-500" : "text-[var(--text-primary)]"}`}>
              {formatQuantity(product.quantity, product.quantityUnit)}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--bg-primary)] p-2">
            <p className="mb-0.5 text-xs text-[var(--text-muted)]">{en.inventory.valueLabel}</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {en.common.rupeeSymbol} {(product.price * product.quantity).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {(product.expiry || product.supplier) && (
          <div className="flex items-center justify-between gap-2 text-xs">
            {product.supplier ? (
              <span className="truncate text-[var(--text-muted)]">{product.supplier}</span>
            ) : (
              <span />
            )}
            {expInfo ? (
              <span className={`shrink-0 rounded-full px-2 py-0.5 font-medium ${expInfo.cls}`}>{expInfo.label}</span>
            ) : product.expiry ? (
              <span className="shrink-0 text-[var(--text-muted)]">{en.inventory.expPrefix}: {product.expiry}</span>
            ) : null}
          </div>
        )}

        <div className="responsive-actions mt-auto" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
          <Button variant="primary" title={en.inventory.stockInTitle} onClick={() => setModal("in")} className="flex-1" />
          <Button variant="danger" title={en.inventory.removeStock} onClick={() => setModal("out")} disabled={isOut} className="flex-1" />
        </div>
      </div>

      {modal === "in" && <StockInModal product={product} onClose={handleModalClose} />}
      {modal === "out" && <StockOutModal product={product} onClose={handleModalClose} />}
    </>
  )
}
