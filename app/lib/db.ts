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
  batchNo?: string
  serialTrackingNote?: string
  reorderLevel?: number
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
  | "sale-cancellation"
  | "sales-return"
  | "purchase-return"
  | "credit-note"
  | "debit-note"
  | "delivery-challan"
  | "stock-adjustment"
  | "stock-correction"
  | "stock-transfer"

export type StockTransactionProduct = {
  productId?: string
  name: string
  category?: string
  sku?: string
  hsnCode?: string
  batchNo?: string
  locationId?: string
  locationName?: string
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
  batchNo?: string
  locationId?: string
  locationName?: string
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
export type SalePaymentStatus = "paid" | "partial" | "unpaid"
export type SalePaymentMode =
  | "Cash"
  | "UPI"
  | "Card"
  | "Bank Transfer"
  | "Credit"
  | "Other"
export type SaleRecordStatus = "completed" | "cancelled"
export type SaleEntryMode = "quick-sale" | "inventory-sale"

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
  batchNo?: string
  locationId?: string
  locationName?: string
  note?: string
  lineTotal: number
}

export interface PurchaseRecord {
  id: string
  userId: string
  billNo: string
  supplierName: string
  partyId?: string
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

export interface SaleCustomer {
  name?: string
  gstin?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
}

export interface SaleItem {
  id: string
  productId: string
  name: string
  category?: string
  sku?: string
  hsnCode?: string
  batchNo?: string
  locationId?: string
  locationName?: string
  quantity: number
  quantityUnit: string
  salePrice: number
  discount: number
  taxableAmount: number
  gstRate: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  gstAmount: number
  lineTotal: number
  note?: string
}

export interface SaleRecord {
  id: string
  userId: string
  receiptNo: string
  saleDate: string
  saleDateTime: string
  partyId?: string
  customer?: SaleCustomer
  items: SaleItem[]
  totalAmount: number
  taxableAmount: number
  gstAmount: number
  amountPaid: number
  dueAmount: number
  paymentStatus: SalePaymentStatus
  paymentMode: SalePaymentMode
  note?: string
  reference?: string
  gstEnabled: boolean
  entryMode: SaleEntryMode
  status: SaleRecordStatus
  cancelledAt?: string
  cancellationNote?: string
  createdAt: string
  updatedAt: string
}

export type EstimateStatus = "draft" | "sent" | "accepted" | "rejected" | "converted" | "expired"

export type EstimateItem = SaleItem

export interface EstimateRecord {
  id: string
  userId: string
  estimateNo: string
  estimateDate: string
  estimateDateTime: string
  expiryDate?: string
  partyId?: string
  customer?: SaleCustomer
  items: EstimateItem[]
  totalAmount: number
  taxableAmount: number
  gstAmount: number
  status: EstimateStatus
  note?: string
  terms?: string
  reference?: string
  gstEnabled: boolean
  convertedSaleId?: string
  convertedAt?: string
  convertedInvoiceDraftAt?: string
  createdAt: string
  updatedAt: string
}

export type ReturnDocumentKind =
  | "sales-return"
  | "purchase-return"
  | "credit-note"
  | "debit-note"
  | "delivery-challan"

export type ReturnDocumentStatus = "completed" | "draft"

export type ReturnStockImpact = "stock-in" | "stock-out" | "none"

export interface ReturnDocumentItem {
  id: string
  productId?: string
  name: string
  category?: string
  sku?: string
  hsnCode?: string
  batchNo?: string
  locationId?: string
  locationName?: string
  quantity: number
  quantityUnit: string
  rate: number
  discount: number
  taxableAmount: number
  gstRate: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  gstAmount: number
  lineTotal: number
  note?: string
}

export interface ReturnDocumentRecord {
  id: string
  userId: string
  documentNo: string
  kind: ReturnDocumentKind
  status: ReturnDocumentStatus
  documentDate: string
  documentDateTime: string
  partyId?: string
  party?: SaleCustomer
  linkedSaleId?: string
  linkedSaleReceiptNo?: string
  linkedPurchaseId?: string
  linkedPurchaseBillNo?: string
  linkedInvoiceId?: string
  linkedInvoiceNo?: string
  stockImpact: ReturnStockImpact
  items: ReturnDocumentItem[]
  totalAmount: number
  taxableAmount: number
  gstAmount: number
  paymentAdjustment: number
  dueAdjustment: number
  note?: string
  auditNote: string
  createdAt: string
  updatedAt: string
}

export type ExpenseCategory =
  | "rent"
  | "salary"
  | "transport"
  | "electricity"
  | "internet"
  | "packing"
  | "maintenance"
  | "other"

export interface ExpenseRecord {
  id: string
  userId: string
  expenseNo: string
  category: ExpenseCategory
  amount: number
  expenseDate: string
  expenseDateTime: string
  paymentMode: string
  note?: string
  reference?: string
  receiptAttachmentStatus?: "placeholder"
  createdAt: string
  updatedAt: string
}

export type CashbookEntryType = "cash-in" | "cash-out"
export type CashbookAccount = "cash" | "bank" | "upi"
export type CashbookEntrySource = "manual" | "sale" | "purchase" | "expense" | "payment"

export interface CashbookEntryRecord {
  id: string
  userId: string
  entryNo: string
  entryDate: string
  entryDateTime: string
  type: CashbookEntryType
  account: CashbookAccount
  amount: number
  paymentMode?: string
  note: string
  reference?: string
  source: CashbookEntrySource
  linkedRecordId?: string
  createdAt: string
  updatedAt: string
}

export interface InventoryLocationRecord {
  id: string
  userId: string
  name: string
  code?: string
  isDefault: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ProductLocationStockRecord {
  id: string
  userId: string
  productId: string
  locationId: string
  locationName: string
  quantity: number
  quantityUnit: string
  updatedAt: string
}

export interface InventoryBatchRecord {
  id: string
  userId: string
  productId: string
  productName: string
  batchNo?: string
  expiry?: string
  locationId: string
  locationName: string
  quantity: number
  quantityUnit: string
  updatedAt: string
}

export interface StockTransferRecord {
  id: string
  userId: string
  transferNo: string
  productId: string
  productName: string
  fromLocationId: string
  fromLocationName: string
  toLocationId: string
  toLocationName: string
  quantity: number
  quantityUnit: string
  note?: string
  createdAt: string
}

export type ProfileRecord = ProfileData

export type SubscriptionPlanId =
  | "trial"
  | "free/expired-readonly"
  | "starter"
  | "pro"
  | "business"

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "expired"
  | "cancelled"
  | "manual"

export type UsageTrackedFeature =
  | "sales"
  | "quickSales"
  | "purchases"
  | "gstInvoices"
  | "estimates"
  | "returns"
  | "accounting"
  | "exports"

export interface SubscriptionRecord {
  id: string
  userId: string
  plan: SubscriptionPlanId
  status: SubscriptionStatus
  trialStartedAt: string
  trialEndsAt: string
  subscriptionStartedAt?: string
  subscriptionEndsAt?: string
  provider?: string
  providerCustomerId?: string
  providerSubscriptionId?: string
  note?: string
  createdAt: string
  updatedAt: string
}

export interface UsageTrackingRecord {
  id: string
  userId: string
  feature: UsageTrackedFeature
  periodKey: string
  count: number
  createdAt: string
  updatedAt: string
}

export type PartyType = "customer" | "supplier" | "both"

export interface PartyRecord {
  id: string
  userId: string
  businessId?: string
  name: string
  normalizedName: string
  mobile?: string
  email?: string
  gstin?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  type: PartyType
  openingBalance: number
  receivable: number
  payable: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export type PartyLedgerEntryType = "payment-received" | "payment-paid" | "opening-balance"

export interface PartyLedgerRecord {
  id: string
  userId: string
  businessId?: string
  partyId: string
  type: PartyLedgerEntryType
  amount: number
  paymentMode?: string
  note?: string
  reference?: string
  entryDate: string
  createdAt: string
  updatedAt: string
}

const LATEST_STOCK_DB_SCHEMA: Record<string, string> = {
  products: "id,[userId+name+category],[userId+name+category+quantityUnit],userId,name,category,quantityUnit,sku,expiry",
  productLogs: "id,productId,date,type,quantityUnit,transactionId,transactionType,invoiceReceiptNo,locationId,batchNo,expiry",
  profiles: "userId,updatedAt",
  invoices: "id,[userId+invoiceNo],userId,invoiceNo,invoiceDate,buyerName,createdAt",
  purchases: "id,[userId+billNo],userId,billNo,supplierName,partyId,purchaseDate,paymentStatus,entryMode,detailsStatus,createdAt",
  sales: "id,[userId+receiptNo],userId,receiptNo,partyId,saleDate,paymentStatus,paymentMode,status,createdAt",
  estimates: "id,[userId+estimateNo],userId,estimateNo,partyId,estimateDate,expiryDate,status,createdAt",
  returnDocuments: "id,[userId+documentNo],userId,documentNo,kind,status,documentDate,linkedSaleId,linkedPurchaseId,linkedInvoiceId,createdAt",
  expenses: "id,[userId+expenseNo],userId,expenseNo,category,expenseDate,paymentMode,createdAt",
  cashbookEntries: "id,[userId+entryNo],userId,entryNo,entryDate,type,account,source,createdAt",
  inventoryLocations: "id,[userId+name],[userId+isDefault],userId,name,isDefault,updatedAt",
  productLocationStocks: "id,[userId+productId],[productId+locationId],userId,productId,locationId,updatedAt",
  inventoryBatches: "id,[userId+productId],[productId+locationId],[productId+batchNo],[productId+expiry],userId,productId,batchNo,expiry,locationId,updatedAt",
  stockTransfers: "id,[userId+transferNo],userId,transferNo,productId,fromLocationId,toLocationId,createdAt",
  parties: "id,[userId+normalizedName],[userId+type],[userId+mobile],[userId+email],[userId+gstin],userId,type,updatedAt",
  partyLedger: "id,[userId+partyId],[partyId+entryDate],userId,partyId,type,entryDate,updatedAt",
  subscriptions: "id,userId,status,plan,trialEndsAt,subscriptionEndsAt,updatedAt",
  usageTracking: "id,[userId+feature+periodKey],userId,feature,periodKey,updatedAt",
}

class StockDB extends Dexie {
  products!: Table<Product>
  productLogs!: Table<ProductLog>
  profiles!: Table<ProfileRecord>
  invoices!: Table<GSTInvoiceRecord>
  purchases!: Table<PurchaseRecord>
  sales!: Table<SaleRecord>
  estimates!: Table<EstimateRecord>
  returnDocuments!: Table<ReturnDocumentRecord>
  expenses!: Table<ExpenseRecord>
  cashbookEntries!: Table<CashbookEntryRecord>
  inventoryLocations!: Table<InventoryLocationRecord>
  productLocationStocks!: Table<ProductLocationStockRecord>
  inventoryBatches!: Table<InventoryBatchRecord>
  stockTransfers!: Table<StockTransferRecord>
  parties!: Table<PartyRecord>
  partyLedger!: Table<PartyLedgerRecord>
  subscriptions!: Table<SubscriptionRecord>
  usageTracking!: Table<UsageTrackingRecord>

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

    this.version(14).stores({
      products: "id,[userId+name+category],[userId+name+category+quantityUnit],userId,name,category,quantityUnit",
      productLogs: "id,productId,date,type,quantityUnit,transactionId,transactionType,invoiceReceiptNo",
      profiles: "userId,updatedAt",
      invoices: "id,[userId+invoiceNo],userId,invoiceNo,invoiceDate,buyerName,createdAt",
      purchases: "id,[userId+billNo],userId,billNo,supplierName,purchaseDate,paymentStatus,entryMode,detailsStatus,createdAt",
      subscriptions: "id,userId,status,plan,trialEndsAt,subscriptionEndsAt,updatedAt",
      usageTracking: "id,[userId+feature+periodKey],userId,feature,periodKey,updatedAt",
    })

    this.version(15).stores({
      products: "id,[userId+name+category],[userId+name+category+quantityUnit],userId,name,category,quantityUnit",
      productLogs: "id,productId,date,type,quantityUnit,transactionId,transactionType,invoiceReceiptNo",
      profiles: "userId,updatedAt",
      invoices: "id,[userId+invoiceNo],userId,invoiceNo,invoiceDate,buyerName,createdAt",
      purchases: "id,[userId+billNo],userId,billNo,supplierName,purchaseDate,paymentStatus,entryMode,detailsStatus,createdAt",
      sales: "id,[userId+receiptNo],userId,receiptNo,saleDate,paymentStatus,paymentMode,status,createdAt",
      subscriptions: "id,userId,status,plan,trialEndsAt,subscriptionEndsAt,updatedAt",
      usageTracking: "id,[userId+feature+periodKey],userId,feature,periodKey,updatedAt",
    })

    this.version(16).stores({
      products: "id,[userId+name+category],[userId+name+category+quantityUnit],userId,name,category,quantityUnit",
      productLogs: "id,productId,date,type,quantityUnit,transactionId,transactionType,invoiceReceiptNo",
      profiles: "userId,updatedAt",
      invoices: "id,[userId+invoiceNo],userId,invoiceNo,invoiceDate,buyerName,createdAt",
      purchases: "id,[userId+billNo],userId,billNo,supplierName,partyId,purchaseDate,paymentStatus,entryMode,detailsStatus,createdAt",
      sales: "id,[userId+receiptNo],userId,receiptNo,partyId,saleDate,paymentStatus,paymentMode,status,createdAt",
      parties: "id,[userId+normalizedName],[userId+type],[userId+mobile],[userId+email],[userId+gstin],userId,type,updatedAt",
      partyLedger: "id,[userId+partyId],[partyId+entryDate],userId,partyId,type,entryDate,updatedAt",
      subscriptions: "id,userId,status,plan,trialEndsAt,subscriptionEndsAt,updatedAt",
      usageTracking: "id,[userId+feature+periodKey],userId,feature,periodKey,updatedAt",
    })


    this.version(17).stores({
      products: "id,[userId+name+category],[userId+name+category+quantityUnit],userId,name,category,quantityUnit",
      productLogs: "id,productId,date,type,quantityUnit,transactionId,transactionType,invoiceReceiptNo",
      profiles: "userId,updatedAt",
      invoices: "id,[userId+invoiceNo],userId,invoiceNo,invoiceDate,buyerName,createdAt",
      purchases: "id,[userId+billNo],userId,billNo,supplierName,partyId,purchaseDate,paymentStatus,entryMode,detailsStatus,createdAt",
      sales: "id,[userId+receiptNo],userId,receiptNo,partyId,saleDate,paymentStatus,paymentMode,status,createdAt",
      estimates: "id,[userId+estimateNo],userId,estimateNo,partyId,estimateDate,expiryDate,status,createdAt",
      parties: "id,[userId+normalizedName],[userId+type],[userId+mobile],[userId+email],[userId+gstin],userId,type,updatedAt",
      partyLedger: "id,[userId+partyId],[partyId+entryDate],userId,partyId,type,entryDate,updatedAt",
      subscriptions: "id,userId,status,plan,trialEndsAt,subscriptionEndsAt,updatedAt",
      usageTracking: "id,[userId+feature+periodKey],userId,feature,periodKey,updatedAt",
    })


    this.version(18).stores({
      products: "id,[userId+name+category],[userId+name+category+quantityUnit],userId,name,category,quantityUnit",
      productLogs: "id,productId,date,type,quantityUnit,transactionId,transactionType,invoiceReceiptNo",
      profiles: "userId,updatedAt",
      invoices: "id,[userId+invoiceNo],userId,invoiceNo,invoiceDate,buyerName,createdAt",
      purchases: "id,[userId+billNo],userId,billNo,supplierName,partyId,purchaseDate,paymentStatus,entryMode,detailsStatus,createdAt",
      sales: "id,[userId+receiptNo],userId,receiptNo,partyId,saleDate,paymentStatus,paymentMode,status,createdAt",
      estimates: "id,[userId+estimateNo],userId,estimateNo,partyId,estimateDate,expiryDate,status,createdAt",
      returnDocuments: "id,[userId+documentNo],userId,documentNo,kind,status,documentDate,linkedSaleId,linkedPurchaseId,linkedInvoiceId,createdAt",
      parties: "id,[userId+normalizedName],[userId+type],[userId+mobile],[userId+email],[userId+gstin],userId,type,updatedAt",
      partyLedger: "id,[userId+partyId],[partyId+entryDate],userId,partyId,type,entryDate,updatedAt",
      subscriptions: "id,userId,status,plan,trialEndsAt,subscriptionEndsAt,updatedAt",
      usageTracking: "id,[userId+feature+periodKey],userId,feature,periodKey,updatedAt",
    })


    this.version(19).stores({
      products: "id,[userId+name+category],[userId+name+category+quantityUnit],userId,name,category,quantityUnit",
      productLogs: "id,productId,date,type,quantityUnit,transactionId,transactionType,invoiceReceiptNo",
      profiles: "userId,updatedAt",
      invoices: "id,[userId+invoiceNo],userId,invoiceNo,invoiceDate,buyerName,createdAt",
      purchases: "id,[userId+billNo],userId,billNo,supplierName,partyId,purchaseDate,paymentStatus,entryMode,detailsStatus,createdAt",
      sales: "id,[userId+receiptNo],userId,receiptNo,partyId,saleDate,paymentStatus,paymentMode,status,createdAt",
      estimates: "id,[userId+estimateNo],userId,estimateNo,partyId,estimateDate,expiryDate,status,createdAt",
      returnDocuments: "id,[userId+documentNo],userId,documentNo,kind,status,documentDate,linkedSaleId,linkedPurchaseId,linkedInvoiceId,createdAt",
      expenses: "id,[userId+expenseNo],userId,expenseNo,category,expenseDate,paymentMode,createdAt",
      cashbookEntries: "id,[userId+entryNo],userId,entryNo,entryDate,type,account,source,createdAt",
      parties: "id,[userId+normalizedName],[userId+type],[userId+mobile],[userId+email],[userId+gstin],userId,type,updatedAt",
      partyLedger: "id,[userId+partyId],[partyId+entryDate],userId,partyId,type,entryDate,updatedAt",
      subscriptions: "id,userId,status,plan,trialEndsAt,subscriptionEndsAt,updatedAt",
      usageTracking: "id,[userId+feature+periodKey],userId,feature,periodKey,updatedAt",
    })

    this.version(20)
      .stores(LATEST_STOCK_DB_SCHEMA)
      .upgrade((tx) => {
        return Promise.all([
          tx.table("products").toCollection().modify((product) => {
            if (product.reorderLevel === undefined && product.lowStockThreshold !== undefined) {
              product.reorderLevel = product.lowStockThreshold
            }
          }),
          tx.table("productLogs").toCollection().modify((log) => {
            if (!log.locationName && log.locationId) log.locationName = log.locationId
          }),
        ])
      })

    this.version(21).stores(LATEST_STOCK_DB_SCHEMA)
  }
}

export const db = new StockDB()
