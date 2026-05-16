export type SupplierSummary = {
  name: string
  totalProducts: number
  totalQuantity: number
  totalValue: number
  purchaseBills: number
  purchaseValue: number
  paidAmount: number
  dueAmount: number
  dueBills: number
  lastPurchaseDate: string
  categories: string[]
}

export type SupplierFilter = "all" | "due" | "settled"
