import type { PurchaseRecord, SaleRecord } from "@/app/lib/db"
import { normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import { roundCurrency } from "@/app/lib/gst.utils"
import type { DraftItem } from "./returns.types"

export function fromSaleItem(item: SaleRecord["items"][number]): DraftItem {
  return {
    productId: item.productId,
    name: item.name,
    category: item.category,
    sku: item.sku,
    hsnCode: item.hsnCode,
    quantity: String(item.quantity),
    quantityUnit: item.quantityUnit,
    rate: String(item.salePrice),
    discount: String(item.discount || 0),
    gstRate: String(item.gstRate || 0),
    note: item.note || "",
  }
}

export function fromPurchaseItem(item: PurchaseRecord["items"][number]): DraftItem {
  return {
    productId: item.productId,
    name: item.name,
    category: item.category,
    sku: item.sku,
    hsnCode: item.hsnCode,
    quantity: String(item.quantity),
    quantityUnit: item.quantityUnit,
    rate: String(item.price),
    discount: "0",
    gstRate: "0",
    note: item.note || "",
  }
}

export function createDraftItemFromProduct(product: {
  id: string
  name: string
  category?: string
  sku?: string
  hsnCode?: string
  quantityUnit: string
  price?: number | string | null
}) {
  return {
    productId: product.id,
    name: product.name,
    category: product.category,
    sku: product.sku,
    hsnCode: product.hsnCode,
    quantity: "1",
    quantityUnit: normalizeQuantityUnit(product.quantityUnit),
    rate: String(Number(product.price || 0)),
    discount: "0",
    gstRate: "18",
    note: "",
  } satisfies DraftItem
}

export function incrementDraftQuantity(quantity: string) {
  return String(roundCurrency(Number(quantity || 0) + 1))
}
