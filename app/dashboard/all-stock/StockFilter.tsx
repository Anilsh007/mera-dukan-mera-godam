"use client"

import { useState } from "react"
import Input from "@/app/components/utility/CommonInput"
import Button from "@/app/components/utility/Button"

type Filters = {
  name: string
  category: string
  supplier: string
  expiry: string
  createdAt: string
  sku: string
}

const filterFields = [
  { key: "name", label: "Name", placeholder: "Search by name", type: "text" },
  { key: "category", label: "Category", placeholder: "Enter category", type: "text" },
  { key: "supplier", label: "Supplier", placeholder: "Enter supplier", type: "text" },
  { key: "sku", label: "SKU", placeholder: "Enter SKU", type: "text" },
  { key: "expiry", label: "Expiry Date", placeholder: "Select expiry", type: "date" },
  { key: "createdAt", label: "Created Date", placeholder: "Select created date", type: "date" }
] as const

export default function StockFilter({
  onApply
}: {
  onApply: (filters: Filters) => void
}) {
  const [filters, setFilters] = useState<Filters>({
    name: "",
    category: "",
    supplier: "",
    expiry: "",
    createdAt: "",
    sku: ""
  })

  const [error, setError] = useState("")

  function handleChange(field: keyof Filters, value: string) {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  function validate() {
    const hasOne = Object.values(filters).some(v => v.trim() !== "")
    if (!hasOne) {
      setError("At least one filter is required")
      return false
    }
    setError("")
    return true
  }

  function handleApply() {
    if (!validate()) return
    onApply(filters)
  }

  function handleReset() {
    const empty = {
      name: "",
      category: "",
      supplier: "",
      expiry: "",
      createdAt: "",
      sku: ""
    }
    setFilters(empty)
    setError("")
    onApply(empty)
  }

  return (
    <div className="p-4 rounded-2xl border border-[var(--border-color)] mb-6 bg-[var(--bg-card)]">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filterFields.map(field => (
          <Input key={field.key} label={field.label} placeholder={field.placeholder} type={field.type} value={filters[field.key]} onChange={e => handleChange(field.key, e.target.value)} />
        ))}
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-3">{error}</p>
      )}

      <div className="flex gap-3 mt-4">
        <Button onClick={handleApply} variant="primary" title="Apply Filter"/>
        <Button onClick={handleReset} variant="black" title="Reset"/>
      </div>
    </div>
  )
}