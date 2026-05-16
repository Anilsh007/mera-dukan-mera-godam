import type { StockTransactionProduct, StockTransactionType } from "@/app/lib/db"

export type StockHistoryLog = {
  id: string
  date: string
  quantityAdded: number
  quantity?: number
  quantityUnit?: string
  oldStock?: number
  newStock?: number
  type?: "in" | "out"
  reason?: string
  price: number
  amount?: number
  taxableAmount?: number
  gstRate?: number
  cgstAmount?: number
  sgstAmount?: number
  igstAmount?: number
  gstAmount?: number
  expiry?: string
  note?: string
  notes?: string
  productId?: string
  productName?: string
  productCategory?: string
  productSku?: string
  productHsnCode?: string
  transactionId?: string
  transactionType?: StockTransactionType
  invoiceReceiptNo?: string
  paymentMode?: string
  paymentStatus?: string
  products?: StockTransactionProduct[]
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
  oldStock?: number
  newStock?: number
  price: number
  amount: number
  taxableAmount?: number
  gstRate?: number
  cgstAmount?: number
  sgstAmount?: number
  igstAmount?: number
  gstAmount?: number
  date: string
  expiry: string
  buyerName: string
  buyerPhone: string
  buyerGstin: string
  transactionId?: string
  transactionType?: StockTransactionType
  invoiceReceiptNo?: string
  paymentMode?: string
  paymentStatus?: string
  products?: StockTransactionProduct[]
  note: string
  notes?: string
  correctedAt?: string
  correctionLabel?: string
}

export type HistoryTab = "all" | "in" | "sale" | "out"
