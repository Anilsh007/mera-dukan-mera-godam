import Dexie, { Table } from "dexie"
import type { GSTInvoiceRecord } from "@/app/dashboard/gst-invoice/types/gst.types"
import type { ProfileData } from "./profile/profile.service"
import { DEFAULT_QUANTITY_UNIT } from "./quantityUnit"

export interface Product {
  id: string
  name: string
  price: number
  quantity: number
  quantityUnit: string
  category?: string
  supplier?: string
  note?: string
  expiry?: string
  sku?: string
  hsnCode?: string
  lowStockThreshold?: number
  criticalStockThreshold?: number
  userId: string
  createdAt: string
}

export type StockTransactionType =
  | "purchase"
  | "quick-purchase"
  | "stock-in"
  | "sale"
  | "multi-item-sale"
  | "stock-adjustment"
  | "stock-correction"

export type StockTransactionProduct = {
  productId?: string
  name: string
  category?: string
  sku?: string
  hsnCode?: string
  quantity: number
  quantityUnit: string
  oldStock?: number
  newStock?: number
  rate: number
  amount: number
  gstRate?: number
  gstAmount?: number
}

export interface ProductLog {
  id: string
  productId: string
  productName?: string
  productCategory?: string
  productSku?: string
  productHsnCode?: string
  quantityAdded: number
  quantity: number
  quantityUnit: string
  oldStock?: number
  newStock?: number
  type: "in" | "out"
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
  date: string
  transactionId?: string
  transactionType?: StockTransactionType
  invoiceReceiptNo?: string
  paymentMode?: string
  paymentStatus?: string
  products?: StockTransactionProduct[]
  note?: string
  notes?: string
  correctedAt?: string
  correctionLabel?: string
}

export type PurchasePaymentStatus = "paid" | "partial" | "unpaid"
export type PurchaseEntryMode = "quick" | "detailed"
export type PurchaseDetailsStatus = "pending" | "completed"

export interface PurchaseItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  quantityUnit: string
  category?: string
  expiry?: string
  sku?: string
  hsnCode?: string
  note?: string
  lineTotal: number
}

export interface PurchaseRecord {
  id: string
  userId: string
  billNo: string
  supplierName: string
  purchaseDate: string
  purchaseDateTime?: string
  paymentStatus: PurchasePaymentStatus
  paymentMode?: string
  amountPaid: number
  totalAmount: number
  dueAmount: number
  note?: string
  entryMode?: PurchaseEntryMode
  detailsStatus?: PurchaseDetailsStatus
  detailsCompletedAt?: string
  items: PurchaseItem[]
  createdAt: string
  updatedAt: string
}

export type ProfileRecord = ProfileData

class StockDB extends Dexie {
  products!: Table<Product>
  productLogs!: Table<ProductLog>
  profiles!: Table<ProfileRecord>
  invoices!: Table<GSTInvoiceRecord>
  purchases!: Table<PurchaseRecord>

  constructor() {
    super("StockDatabase")

    this.version(3).stores({
      products: "++id,[userId+name+category],userId,name,price,quantity,category,sku,createdAt",
      productLogs: "++id,productId,date",
    })

    this.version(4)
      .stores({
        products: "++id,[userId+name+category],userId,name,price,quantity,category,sku,createdAt",
        productLogs: "++id,productId,date,type",
      })
      .upgrade((tx) => {
        return tx.table("productLogs").toCollection().modify((log) => {
          if (!log.type) log.type = "in"
        })
      })

    this.version(6).stores({
      products: "id,[userId+name+category],userId,name,category",
      productLogs: "id,productId,date,type",
    })

    this.version(7).stores({
      products: "id,[userId+name+category],userId,name,category",
      productLogs: "id,productId,date,type",
      profiles: "userId,updatedAt",
    })

    this.version(8).stores({
      products: "id,[userId+name+category],userId,name,category",
      productLogs: "id,productId,date,type",
      profiles: "userId,updatedAt",
      invoices: "id,[userId+invoiceNo],userId,invoiceNo,invoiceDate,buyerName,createdAt",
    })

    this.version(9)
      .stores({
        products: "id,[userId+name+category],[userId+name+category+quantityUnit],userId,name,category,quantityUnit",
        productLogs: "id,productId,date,type,quantityUnit",
        profiles: "userId,updatedAt",
        invoices: "id,[userId+invoiceNo],userId,invoiceNo,invoiceDate,buyerName,createdAt",
      })
      .upgrade((tx) => {
        const products = tx.table("products").toCollection().modify((product) => {
          if (!product.quantityUnit) product.quantityUnit = DEFAULT_QUANTITY_UNIT
        })
        const logs = tx.table("productLogs").toCollection().modify((log) => {
          if (!log.quantityUnit) log.quantityUnit = DEFAULT_QUANTITY_UNIT
        })

        return Promise.all([products, logs])
      })

    this.version(10).stores({
      products: "id,[userId+name+category],[userId+name+category+quantityUnit],userId,name,category,quantityUnit",
      productLogs: "id,productId,date,type,quantityUnit",
      profiles: "userId,updatedAt",
      invoices: "id,[userId+invoiceNo],userId,invoiceNo,invoiceDate,buyerName,createdAt",
      purchases: "id,[userId+billNo],userId,billNo,supplierName,purchaseDate,paymentStatus,createdAt",
    })

    this.version(11).stores({
      products: "id,[userId+name+category],[userId+name+category+quantityUnit],userId,name,category,quantityUnit",
      productLogs: "id,productId,date,type,quantityUnit",
      profiles: "userId,updatedAt",
      invoices: "id,[userId+invoiceNo],userId,invoiceNo,invoiceDate,buyerName,createdAt",
      purchases: "id,[userId+billNo],userId,billNo,supplierName,purchaseDate,paymentStatus,createdAt",
    })

    this.version(12)
      .stores({
        products: "id,[userId+name+category],[userId+name+category+quantityUnit],userId,name,category,quantityUnit",
        productLogs: "id,productId,date,type,quantityUnit",
        profiles: "userId,updatedAt",
        invoices: "id,[userId+invoiceNo],userId,invoiceNo,invoiceDate,buyerName,createdAt",
        purchases: "id,[userId+billNo],userId,billNo,supplierName,purchaseDate,paymentStatus,entryMode,detailsStatus,createdAt",
      })
      .upgrade((tx) => {
        return tx.table("purchases").toCollection().modify((purchase) => {
          if (!purchase.entryMode) purchase.entryMode = "detailed"
          if (!purchase.detailsStatus) purchase.detailsStatus = "completed"
        })
      })

    this.version(13)
      .stores({
        products: "id,[userId+name+category],[userId+name+category+quantityUnit],userId,name,category,quantityUnit",
        productLogs: "id,productId,date,type,quantityUnit,transactionId,transactionType,invoiceReceiptNo",
        profiles: "userId,updatedAt",
        invoices: "id,[userId+invoiceNo],userId,invoiceNo,invoiceDate,buyerName,createdAt",
        purchases: "id,[userId+billNo],userId,billNo,supplierName,purchaseDate,paymentStatus,entryMode,detailsStatus,createdAt",
      })
      .upgrade((tx) => {
        return tx.table("productLogs").toCollection().modify((log) => {
          const quantity = Math.abs(Number(log.quantityAdded || log.quantity || 0))
          log.quantity = quantity
          log.amount = Number(log.amount ?? Number(log.price || 0) * quantity)
          log.gstAmount = Number(log.gstAmount || 0)
          if (!log.transactionType) log.transactionType = log.type === "in" ? "stock-in" : "stock-adjustment"
        })
      })
  }
}

export const db = new StockDB()
