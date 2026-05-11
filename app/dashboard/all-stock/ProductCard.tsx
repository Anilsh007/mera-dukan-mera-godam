"use client"

import { useState } from "react"
import { Product } from "@/app/lib/db"
import Button from "@/app/components/ui/Button"
import StockInModal from "./StockInModal"
import StockOutModal from "./StockOutModal"
import { getExpiryInfo, getProductStockLevel } from "@/app/lib/inventory.utils"
import { formatQuantity } from "@/app/lib/quantityUnit"

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
    ? { label: "Out", cls: "bg-[var(--out-stock)] text-[var(--out-stock-text)]" }
    : isCritical
      ? { label: "Critical", cls: "bg-[var(--critical-stock)] text-[var(--critical-stock-text)]" }
      : isLow
        ? { label: "Low", cls: "bg-[var(--low-stock)] text-[var(--low-stock-text)]" }
        : { label: "In Stock", cls: "bg-[var(--all-stock)] text-[var(--all-stock-text)]" }

  const expInfo = getExpiryInfo(product.expiry)

  return (
    <>
      <div onClick={onClick} className="group relative flex cursor-pointer flex-col gap-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold capitalize text-[var(--text-primary)] transition group-hover:text-emerald-600">
              {product.name}
            </h2>
            <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
              {product.category || "Category nahi"}
              {product.sku ? ` - ${product.sku}` : ""}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${stockBadge.cls}`}>
            {stockBadge.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-[var(--bg-primary)] p-2">
            <p className="mb-0.5 text-xs text-[var(--text-muted)]">Rate</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Rs {product.price.toLocaleString("en-IN")}</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-primary)] p-2">
            <p className="mb-0.5 text-xs text-[var(--text-muted)]">Left Item</p>
            <p className={`text-sm font-bold ${isOut ? "text-red-500" : isCritical ? "text-red-400" : isLow ? "text-amber-500" : "text-[var(--text-primary)]"}`}>
              {formatQuantity(product.quantity, product.quantityUnit)}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--bg-primary)] p-2">
            <p className="mb-0.5 text-xs text-[var(--text-muted)]">Total</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Rs {(product.price * product.quantity).toLocaleString("en-IN")}
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
              <span className="shrink-0 text-[var(--text-muted)]">Expiry: {product.expiry}</span>
            ) : null}
          </div>
        )}

        <div className="mt-auto flex gap-2" onClick={(event) => event.stopPropagation()}>
          <Button variant="primary" title="Stock add" onClick={() => setModal("in")} className="flex-1" />
          <Button variant="danger" title="Stock nikalo" onClick={() => setModal("out")} disabled={isOut} className="flex-1" />
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={handleModalClose}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-5 shadow-2xl backdrop-blur-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            {modal === "in" ? (
              <StockInModal product={product} onClose={handleModalClose} />
            ) : (
              <StockOutModal product={product} onClose={handleModalClose} />
            )}
          </div>
        </div>
      )}
    </>
  )
}
