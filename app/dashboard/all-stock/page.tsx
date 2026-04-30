"use client"

import { useMemo, useState } from "react"
import ProductGrid from "./ProductGrid/ProductGrid"
import ProductDetails from "./ProductDetails/ProductDetails"
import { Product } from "@/app/lib/db"
import useProducts from "./useProducts"

export type CategoryGroup = {
  key: string
  label: string
  products: Product[]
  totalQty: number
  totalValue: number
}

function normalizeCategory(category?: string) {
  return category?.trim() || "Uncategorized"
}

export default function AllStockPage() {
  const [selectedGroup, setSelectedGroup] = useState<CategoryGroup | null>(null)
  const [activeProductId, setActiveProductId] = useState<string | null>(null)
  const { products, loading } = useProducts()

  const groupedProducts = useMemo<CategoryGroup[]>(() => {
    const map = new Map<string, Product[]>()

    products.forEach((product) => {
      const key = normalizeCategory(product.category)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(product)
    })

    return Array.from(map.entries())
      .map(([label, items]) => ({
        key: label.toLowerCase(),
        label,
        products: [...items].sort((a, b) => a.name.localeCompare(b.name)),
        totalQty: items.reduce((sum, item) => sum + item.quantity, 0),
        totalValue: items.reduce((sum, item) => sum + item.quantity * item.price, 0),
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [products])

  const handleSelectGroup = (group: CategoryGroup) => {
    setSelectedGroup(group)
    setActiveProductId(group.products[0]?.id ?? null)
  }

  const selectedGroupLive = useMemo(() => {
    if (!selectedGroup) return null
    return groupedProducts.find((group) => group.label === selectedGroup.label) ?? null
  }, [groupedProducts, selectedGroup])

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">All Stock</h2>

      {!selectedGroupLive ? (
        <ProductGrid groups={groupedProducts} loading={loading} onSelectGroup={handleSelectGroup} />
      ) : (
        <ProductDetails
          group={selectedGroupLive}
          activeProductId={activeProductId}
          onChangeProduct={setActiveProductId}
          onBack={() => {
            setSelectedGroup(null)
            setActiveProductId(null)
          }}
        />
      )}
    </>
  )
}
