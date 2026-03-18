"use client"
import TableComponent from "@/app/components/utility/CommonTable"
import useGetStock from "./useGetStock"
import StockFilter from "./StockFilter"
import { useEffect, useState } from "react"

type Filters = {
  name: string
  category: string
  supplier: string
  expiry: string
  createdAt: string
  sku: string
}

export default function StockTable({ showFilter }: { showFilter: boolean }) {
  const { products, loading } = useGetStock()
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])

  useEffect(() => {
    setFilteredProducts(products)
  }, [products])

  function handleFilter(filters: Filters) {
    const filtered = products.filter(p => {
      const createdDate = new Date(p.createdAt).toISOString().slice(0, 10)
      return (
        (!filters.name || p.name.toLowerCase().includes(filters.name.toLowerCase())) &&
        (!filters.category || p.category?.toLowerCase().includes(filters.category.toLowerCase())) &&
        (!filters.supplier || p.supplier?.toLowerCase().includes(filters.supplier.toLowerCase())) &&
        (!filters.expiry || p.expiry === filters.expiry) &&
        (!filters.createdAt || createdDate === filters.createdAt) &&
        (!filters.sku || p.sku?.toLowerCase().includes(filters.sku.toLowerCase()))
      )
    })
    setFilteredProducts(filtered)
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400 animate-pulse font-medium">
          Loading inventory...
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Only show filter if toggle is true */}
      {showFilter && <StockFilter onApply={handleFilter} />}

      {filteredProducts.length === 0 ? (
        <p className="text-center text-gray-500 mt-6">No products found</p>
      ) : (
        <TableComponent data={filteredProducts as any} />
      )}
    </>
  )
}