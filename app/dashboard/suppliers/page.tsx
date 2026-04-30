"use client"

import useInventoryData from "../hooks/useInventoryData"

type SupplierSummary = {
  name: string
  totalProducts: number
  totalQuantity: number
  totalValue: number
  categories: string[]
}

export default function SuppliersPage() {
  const { products, loading } = useInventoryData()

  const suppliers = products.reduce<Record<string, SupplierSummary>>((acc, product) => {
    const supplierName = product.supplier?.trim() || "Unknown Supplier"
    if (!acc[supplierName]) {
      acc[supplierName] = {
        name: supplierName,
        totalProducts: 0,
        totalQuantity: 0,
        totalValue: 0,
        categories: [],
      }
    }

    acc[supplierName].totalProducts += 1
    acc[supplierName].totalQuantity += product.quantity
    acc[supplierName].totalValue += product.quantity * product.price

    if (product.category && !acc[supplierName].categories.includes(product.category)) {
      acc[supplierName].categories.push(product.category)
    }

    return acc
  }, {})

  const supplierList = Object.values(suppliers).sort((left, right) => right.totalValue - left.totalValue)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Suppliers</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Supplier-wise stock concentration aur value yahan se track kar sakte ho.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Total Suppliers</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{supplierList.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Named Suppliers</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {supplierList.filter((supplier) => supplier.name !== "Unknown Supplier").length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Unknown Tagged Stock</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {supplierList.find((supplier) => supplier.name === "Unknown Supplier")?.totalProducts || 0}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] backdrop-blur-xl shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr className="border-b border-[var(--border-card)]">
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Supplier</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Products</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Units</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Inventory Value</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Categories</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-card)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    Loading suppliers...
                  </td>
                </tr>
              ) : supplierList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    Supplier data abhi available nahi hai.
                  </td>
                </tr>
              ) : (
                supplierList.map((supplier) => (
                  <tr key={supplier.name} className="hover:bg-emerald-50/40 dark:hover:bg-emerald/[0.03]">
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{supplier.name}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{supplier.totalProducts}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{supplier.totalQuantity}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      Rs {supplier.totalValue.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {supplier.categories.length ? supplier.categories.join(", ") : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
