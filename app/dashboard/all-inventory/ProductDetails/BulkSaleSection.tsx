"use client"

import { useMemo, useState } from "react"
import { Product } from "@/app/lib/db"
import Button from "@/app/components/ui/Button"
import TableComponent, { TableItem } from "@/app/components/ui/Table"
import { getProductStockLevel } from "@/app/lib/inventory.utils"
import { en } from "@/app/messages/en"

type CategoryGroup = {
  key: string
  label: string
  products: Product[]
  totalQty: number
  totalValue: number
}

export default function BulkSaleSection({
  group,
  selectedSaleIds,
  setSelectedSaleIds,
  selectedSaleProducts,
  onCreateSale,
}: {
  group: CategoryGroup
  selectedSaleIds: Set<string>
  setSelectedSaleIds: React.Dispatch<React.SetStateAction<Set<string>>>
  selectedSaleProducts: Product[]
  onCreateSale: () => void
}) {
  const [showBulkSale, setShowBulkSale] = useState(false)

  const availableProducts = useMemo(
    () => group.products.filter((product) => product.quantity > 0),
    [group.products]
  )

  const tableData: TableItem[] = useMemo(
    () =>
      availableProducts.map((product) => ({
        id: product.id,
        name: product.name,
        supplier: product.supplier || "-",
        expiry: product.expiry || "-",
        price: product.price,
        quantity: product.quantity,
        quantityUnit: product.quantityUnit,
        lowStockThreshold: product.lowStockThreshold,
        criticalStockThreshold: product.criticalStockThreshold,
        createdAt: product.createdAt,
        note: product.sku ? `${en.inventory.code}: ${product.sku}` : "-",
      })),
    [availableProducts]
  )

  const handleToggleSelect = (id: string | number) => {
    setSelectedSaleIds((current) => {
      const next = new Set(current)
      const productId = String(id)

      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }

      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedSaleIds((current) =>
      current.size === availableProducts.length
        ? new Set()
        : new Set(availableProducts.map((product) => product.id))
    )
  }

  const handleSelectLowStock = () => {
    setSelectedSaleIds(
      new Set(
        availableProducts
          .filter((product) => {
            const level = getProductStockLevel(product)
            return level === "low" || level === "critical"
          })
          .map((product) => product.id)
      )
    )
  }

  return (
    <div className="border-t border-zinc-400/40 bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {en.inventory.multiItemSale}
          </h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {en.inventory.multiItemSaleHint}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {showBulkSale && (
            <>
              <Button
                title={
                  selectedSaleIds.size === availableProducts.length
                    ? en.stockHistory.clearSelection
                    : en.inventory.selectAll
                }
                variant="outline"
                onClick={handleSelectAll}
              />

              <Button
                title={en.inventory.selectLowStock}
                variant="outline"
                onClick={handleSelectLowStock}
              />

              <Button
                title={`${en.inventory.createSale} (${selectedSaleIds.size})`}
                variant="primary"
                onClick={onCreateSale}
                disabled={selectedSaleProducts.length === 0}
              />
            </>
          )}

          <Button
            title={showBulkSale ? en.inventory.closeSale : en.inventory.openSale}
            variant={showBulkSale ? "outline" : "secondary"}
            onClick={() => setShowBulkSale((value) => !value)}
          />
        </div>
      </div>

      {showBulkSale && (
        <div className="mt-4">
          <TableComponent
            data={tableData}
            showSelection
            selectedIds={selectedSaleIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            minWidth={720}
          />
        </div>
      )}
    </div>
  )
}
