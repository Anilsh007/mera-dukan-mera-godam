export type StockHistoryLog = {
  id: string
  date: string
  quantityAdded: number
  quantityUnit?: string
  type?: "in" | "out"
  reason?: string
  price: number
  expiry?: string
  note?: string
  productId?: string
  correctedAt?: string
  correctionLabel?: string
}

export type HistoryRow = {
  id: string
  productId?: string
  productName: string
  category: string
  supplier: string
  sku: string
  hsnCode: string
  logType: "in" | "out"
  reason: string
  quantity: number
  quantityUnit: string
  price: number
  date: string
  expiry: string
  buyerName: string
  buyerPhone: string
  buyerGstin: string
  note: string
  correctedAt?: string
  correctionLabel?: string
}

export type HistoryTab = "all" | "in" | "sale" | "out"
