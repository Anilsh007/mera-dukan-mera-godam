"use client"

import { Boxes, PackageSearch, Plus, Search, ShoppingBag } from "lucide-react"
import dynamic from "next/dynamic"
import type { RefObject, KeyboardEvent } from "react"
import GuidedStepCard from "@/app/components/ui/GuidedStepCard"
import Input from "@/app/components/ui/Input"
import SimpleEmptyState from "@/app/components/ui/SimpleEmptyState"
import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"
import { formatQuantity } from "@/app/lib/quantityUnit"
import type { Product } from "@/app/lib/db"

const BarcodeScannerButton = dynamic(() => import("@/app/components/scanner/BarcodeScannerButton"), { ssr: false })

type PosProductPickerProps = {
  search: string
  searchRef: RefObject<HTMLInputElement | null>
  onSearchChange: (value: string) => void
  onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  filteredProducts: Product[]
  productsLoading: boolean
  saving: boolean
  selectedIndex: number
  quickPickProducts: Product[]
  onScannedCode: (code: string) => void
  onAddProduct: (product: Product) => void
}

export default function PosProductPicker({
  search,
  searchRef,
  onSearchChange,
  onSearchKeyDown,
  filteredProducts,
  productsLoading,
  saving,
  selectedIndex,
  quickPickProducts,
  onScannedCode,
  onAddProduct,
}: PosProductPickerProps) {
  return (
    <div className="space-y-4">
      <GuidedStepCard
        step={1}
        title={en.pos.searchStepTitle}
        description={en.pos.searchStepDescription}
        icon={<PackageSearch size={18} />}
      >
        <div className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full">
              <Input ref={searchRef} value={search} onChange={(event) => onSearchChange(event.target.value)} onKeyDown={onSearchKeyDown} placeholder={en.pos.searchPlaceholder} className="pl-9" />
            </div>
            <div>
              <BarcodeScannerButton onDetected={onScannedCode} buttonTitle={en.scanner.scanForPos} disabled={saving} className="w-full sm:w-auto" />
            </div>
          </div>

        </div>

        <div className="mt-4 flex overflow-auto gap-3 w-full py-3" aria-label={en.pos.searchResults}>
          {filteredProducts.map((product, index) => (
            <button key={product.id} type="button" role="option" aria-selected={selectedIndex === index} onClick={() => onAddProduct(product)}
              className={`flex w-fit gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)] cursor-pointer ${selectedIndex === index
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--border-card)] bg-[var(--surface-primary)]"
                }`}
            >
              <div className="w-[max-content]">
                <p className="font-semibold capitalize text-[var(--text-primary)]">{product.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {[product.category, product.sku].filter(Boolean).join(" | ") || en.inventory.noCategory}
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {formatQuantity(product.quantity, product.quantityUnit)} · {formatCurrency(product.price)}
                </p>
              </div>
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

      
    </div>
  )
}
