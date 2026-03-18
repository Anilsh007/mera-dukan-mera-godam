"use client"
import { useState } from "react"
import StockTable from "./StockTable"
import Button from "@/app/components/utility/Button"

export default function AllStockPage() {
  const [showFilter, setShowFilter] = useState(false)

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Stock</h1>

        {/* Toggle Filter Button */}
        
        <Button onClick={()=>setShowFilter(prev=> !prev)} variant="primary" title={showFilter ? "Hide Filters" : "Show Filters"} />
      </div>

      {/* Conditional rendering of StockFilter */}
      {showFilter && <StockTable showFilter={true} />}

      {/* Agar filter hidden hai to table directly show kare */}
      {!showFilter && <StockTable showFilter={false} />}
    </>
  )
}