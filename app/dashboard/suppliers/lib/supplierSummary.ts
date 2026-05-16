import type { Product, PurchaseRecord } from "@/app/lib/db"
import type { SupplierFilter, SupplierSummary } from "../types"

export function cleanSupplierName(name?: string) {
  return name?.trim() || "Supplier not available"
}

export function buildSupplierSummaries(products: Product[], purchases: PurchaseRecord[]) {
  const summaries: Record<string, SupplierSummary> = {}

  const ensureSupplier = (name: string) => {
    if (!summaries[name]) {
      summaries[name] = {
        name,
        totalProducts: 0,
        totalQuantity: 0,
        totalValue: 0,
        purchaseBills: 0,
        purchaseValue: 0,
        paidAmount: 0,
        dueAmount: 0,
        dueBills: 0,
        lastPurchaseDate: "",
        categories: [],
      }
    }

    return summaries[name]
  }

  for (const product of products) {
    const supplier = ensureSupplier(cleanSupplierName(product.supplier))
    supplier.totalProducts += 1
    supplier.totalQuantity += product.quantity
    supplier.totalValue += product.quantity * product.price

    if (product.category && !supplier.categories.includes(product.category)) {
      supplier.categories.push(product.category)
    }
  }

  for (const purchase of purchases) {
    const supplier = ensureSupplier(cleanSupplierName(purchase.supplierName))
    supplier.purchaseBills += 1
    supplier.purchaseValue += purchase.totalAmount
    supplier.paidAmount += purchase.amountPaid
    supplier.dueAmount += purchase.dueAmount
    if (purchase.dueAmount > 0) supplier.dueBills += 1

    const purchaseTime = purchase.purchaseDateTime || purchase.purchaseDate
    if (!supplier.lastPurchaseDate || purchaseTime > supplier.lastPurchaseDate) {
      supplier.lastPurchaseDate = purchaseTime
    }

    for (const item of purchase.items) {
      if (item.category && !supplier.categories.includes(item.category)) {
        supplier.categories.push(item.category)
      }
    }
  }

  return Object.values(summaries).sort((left, right) => {
    const rightValue = right.dueAmount || right.purchaseValue || right.totalValue
    const leftValue = left.dueAmount || left.purchaseValue || left.totalValue
    return rightValue - leftValue
  })
}

export function filterSuppliers(suppliers: SupplierSummary[], filter: SupplierFilter, search: string) {
  const query = search.trim().toLowerCase()

  return suppliers.filter((supplier) => {
    const matchesFilter = filter === "all" ? true : filter === "due" ? supplier.dueAmount > 0 : supplier.dueAmount <= 0
    const matchesSearch =
      !query ||
      supplier.name.toLowerCase().includes(query) ||
      supplier.categories.some((category) => category.toLowerCase().includes(query))

    return matchesFilter && matchesSearch
  })
}

export function getSupplierPurchases(supplier: SupplierSummary | null, purchases: PurchaseRecord[]) {
  if (!supplier) return []

  return purchases
    .filter((purchase) => cleanSupplierName(purchase.supplierName).toLowerCase() === supplier.name.toLowerCase())
    .sort((left, right) => (right.purchaseDateTime || right.purchaseDate).localeCompare(left.purchaseDateTime || left.purchaseDate))
}
