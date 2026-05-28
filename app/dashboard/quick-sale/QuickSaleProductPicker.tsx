"use client"

import { Boxes, PackageSearch, Plus, Search } from "lucide-react"
import dynamic from "next/dynamic"
import Button from "@/app/components/ui/Button"
import GuidedStepCard from "@/app/components/ui/GuidedStepCard"
import Input from "@/app/components/ui/Input"
import SimpleEmptyState from "@/app/components/ui/SimpleEmptyState"
import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"
import { formatQuantity } from "@/app/lib/quantityUnit"
import type { Product } from "@/app/lib/db"

const BarcodeScannerButton = dynamic(() => import("@/app/components/scanner/BarcodeScannerButton"), { ssr: false })

type QuickSaleProductPickerProps = {
  search: string
  onSearchChange: (value: string) => void
  filteredProducts: Product[]
  productsLoading: boolean
  saving: boolean
  onScannedCode: (code: string) => void
  onAddProduct: (product: Product) => void
}

export default function QuickSaleProductPicker({
  search,
  onSearchChange,
  filteredProducts,
  productsLoading,
  saving,
  onScannedCode,
  onAddProduct,
}: QuickSaleProductPickerProps) {
  return (
    <GuidedStepCard step={1} title={en.sales.stepFindProductsTitle} description={en.sales.stepFindProductsDescription} icon={<PackageSearch size={18} />} contentClassName="px-4" >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full">
          <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder={en.sales.productSearchPlaceholder} className="pl-9" />
        </div>
        <div>
          <BarcodeScannerButton onDetected={onScannedCode} buttonTitle={en.scanner.scanForSale} disabled={saving} className="w-full sm:w-auto" />
        </div>
      </div>

      <div className="mt-4 flex overflow-auto gap-3 w-full">

        {filteredProducts.map((product) => (
          <button key={product.id} type="button" onClick={() => onAddProduct(product)} className="flex w-fit gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)]" >
            <div className="w-[max-content]">
              <p className="font-medium capitalize text-[var(--text-primary)] mb-0">{product.name}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {[product.category, product.sku].filter(Boolean).join(" | ") || en.inventory.noCategory}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {formatQuantity(product.quantity, product.quantityUnit)} | {formatCurrency(product.price)}
              </p>
            </div>
          </button>
        ))}

        {!filteredProducts.length && !productsLoading ? (
          <SimpleEmptyState title={en.sales.noProductFoundTitle} description={en.sales.noProductFoundDescription} icon={<Boxes size={18} aria-hidden="true" />} />
        ) : null}

      </div>
    </GuidedStepCard>
  )
}
