"use client"

import { useState } from "react"
import { Product } from "@/app/lib/db"
import Button from "@/app/components/utility/Button"
import StockInModal from "./StockInModal"
import StockOutModal from "./StockOutModal"
import { getExpiryInfo, getStockLevel } from "@/app/lib/inventory.utils"
import { formatQuantity } from "@/app/lib/quantityUnit"

type ModalType = "in" | "out" | null

export default function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const [modal, setModal] = useState<ModalType>(null)

  const handleModalClose = () => {
    setModal(null)
  }

  const stockLevel = getStockLevel(product.quantity)
  const isCritical = stockLevel === "critical"
  const isLow = stockLevel === "low"
  const isOut = stockLevel === "out"

  const stockBadge = isOut ? { label: "Out of Stock", cls: "bg-[var(--out-stock)] text-[var(--out-stock-text)]" }
    : isCritical ? { label: "Critical", cls: "bg-[var(--critical-stock)] text-[var(--critical-stock-text)]" }
      : isLow ? { label: "Low Stock", cls: "bg-[var(--low-stock)] text-[var(--low-stock-text)]" }
        : { label: "In Stock", cls: "bg-[var(--all-stock)] text-[var(--all-stock-text)]" }

  const expInfo = getExpiryInfo(product.expiry)

  return (
    <>
      <div onClick={onClick} className="group relative p-5 rounded-2xl bg-[var(--bg-card-strong)] backdrop-blur-xl border border-[var(--border-card)] shadow-[var(--shadow-card)] cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col gap-4">
        {/* Top row */}
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h2 className="font-semibold text-base capitalize group-hover:text-emerald-600 transition truncate text-[var(--text-primary)]">
              {product.name}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
              {product.category || "Category nahi"}
              {product.sku ? ` · ${product.sku}` : ""}
            </p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${stockBadge.cls}`}>
            {stockBadge.label}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[var(--bg-primary)] rounded-xl p-2">
            <p className="text-xs text-[var(--text-muted)] mb-0.5">Price</p>
            <p className="font-semibold text-sm text-[var(--text-primary)]">₹{product.price.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-[var(--bg-primary)] rounded-xl p-2">
            <p className="text-xs text-[var(--text-muted)] mb-0.5">Qty</p>
            <p className={`font-bold text-sm ${isOut ? "text-red-500" : isCritical ? "text-red-400" : isLow ? "text-amber-500" : "text-[var(--text-primary)]"}`}>
              {formatQuantity(product.quantity, product.quantityUnit)}
            </p>
          </div>
          <div className="bg-[var(--bg-primary)] rounded-xl p-2">
            <p className="text-xs text-[var(--text-muted)] mb-0.5">Value</p>
            <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
              ₹{(product.price * product.quantity).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Expiry + Supplier footer */}
        {(product.expiry || product.supplier) && (
          <div className="flex items-center justify-between text-xs gap-2">
            {product.supplier
              ? <span className="text-[var(--text-muted)] truncate">🏭 {product.supplier}</span>
              : <span />
            }
            {expInfo
              ? <span className={`px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${expInfo.cls}`}>⏰ {expInfo.label}</span>
              : product.expiry
                ? <span className="text-[var(--text-muted)] flex-shrink-0">Exp: {product.expiry}</span>
                : null
            }
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-auto" onClick={e => e.stopPropagation()}>
          <Button variant="primary" title="+ Stock In" onClick={() => setModal("in")} className="flex-1" />
          <Button variant="danger" title="− Stock Out" onClick={() => setModal("out")} disabled={isOut} className="flex-1" />
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={handleModalClose} >
          <div className="bg-[var(--bg-card-strong)] backdrop-blur-xl rounded-2xl border border-[var(--border-card)] p-5 sm:p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()} >
            {modal === "in"
              ? <StockInModal product={product} onClose={handleModalClose} />
              : <StockOutModal product={product} onClose={handleModalClose} />
            }
          </div>
        </div>
      )}
    </>
  )
}
