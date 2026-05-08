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
  userId: string
  createdAt: string
}

export interface ProductLog {
  id: string
  productId: string
  quantityAdded: number
  quantityUnit: string
  type: "in" | "out"
  reason?: string
  price: number
  expiry?: string
  date: string
  note?: string
  correctedAt?: string
  correctionLabel?: string
}

export type ProfileRecord = ProfileData

class StockDB extends Dexie {
  products!: Table<Product>
  productLogs!: Table<ProductLog>
  profiles!: Table<ProfileRecord>
  invoices!: Table<GSTInvoiceRecord>

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
  }
}

export const db = new StockDB()
