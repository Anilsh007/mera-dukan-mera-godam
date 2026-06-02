import type { Product, SaleItem } from "@/app/lib/db"
import type { StockAwareSaleCartItemDraft } from "@/app/lib/sales/saleForm.utils"

export type PosCartItem = StockAwareSaleCartItemDraft
export type PosCalculatedItem = SaleItem
export type ProductPick = {
  product: Product
  score: number
  lastSoldAt: string
}
