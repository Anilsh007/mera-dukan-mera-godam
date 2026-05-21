import type { GSTInvoiceRecord } from "@/app/dashboard/gst-invoice/types/gst.types"
import useAuthLiveQuery from "@/app/hooks/useAuthLiveQuery"
import { db, type ProductLog, type PurchaseRecord, type ReturnDocumentRecord, type SaleRecord } from "@/app/lib/db"
import { notify } from "@/app/lib/notifications"
import { en } from "@/app/messages/en"

export type GstReportsData = {
  invoices: GSTInvoiceRecord[]
  sales: SaleRecord[]
  purchases: PurchaseRecord[]
  productLogs: ProductLog[]
  returnDocuments: ReturnDocumentRecord[]
}

const EMPTY_GST_REPORTS_DATA: GstReportsData = {
  invoices: [],
  sales: [],
  purchases: [],
  productLogs: [],
  returnDocuments: [],
}

export default function useGstReportsData() {
  const { data, loading } = useAuthLiveQuery(
    EMPTY_GST_REPORTS_DATA,
    async (userId) => {
      const [invoices, sales, purchases, productLogs, returnDocuments] = await Promise.all([
        db.invoices.where("userId").equals(userId).toArray(),
        db.sales.where("userId").equals(userId).toArray(),
        db.purchases.where("userId").equals(userId).toArray(),
        db.productLogs.toArray(),
        db.returnDocuments.where("userId").equals(userId).toArray(),
      ])

      const productIds = new Set((await db.products.where("userId").equals(userId).toArray()).map((product) => product.id))
      const userProductLogs = productLogs.filter((log) => productIds.has(log.productId))

      return {
        invoices: invoices.sort((left, right) => (right.invoiceDate || right.createdAt).localeCompare(left.invoiceDate || left.createdAt)),
        sales: sales.sort((left, right) => (right.saleDate || right.createdAt).localeCompare(left.saleDate || left.createdAt)),
        purchases: purchases.sort((left, right) => (right.purchaseDate || right.createdAt).localeCompare(left.purchaseDate || left.createdAt)),
        productLogs: userProductLogs.sort((left, right) => right.date.localeCompare(left.date)),
        returnDocuments: returnDocuments.sort((left, right) => (right.documentDate || right.createdAt).localeCompare(left.documentDate || left.createdAt)),
      }
    },
    (error) => {
      console.error("GST report data fetch error:", error)
      notify.error(en.gstReports.loadFailed, { id: "gst-reports-load-failed" })
    },
  )

  return { data, loading }
}
