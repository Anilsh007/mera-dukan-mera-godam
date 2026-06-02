import type { Dispatch, SetStateAction } from "react"
import type { ReturnDocumentKind, ReturnStockImpact, SaleCustomer } from "@/app/lib/db"

export type DraftItem = {
  productId?: string
  name: string
  category?: string
  sku?: string
  hsnCode?: string
  quantity: string
  quantityUnit: string
  rate: string
  discount: string
  gstRate: string
  note: string
}

export type ReturnsPageState = {
  kind: ReturnDocumentKind
  setKind: Dispatch<SetStateAction<ReturnDocumentKind>>
  documentNo: string
  setDocumentNo: Dispatch<SetStateAction<string>>
  documentDate: string
  setDocumentDate: Dispatch<SetStateAction<string>>
  stockImpact: ReturnStockImpact
  setStockImpact: Dispatch<SetStateAction<ReturnStockImpact>>
  linkedSaleId: string
  onLinkedSaleChange: (value: string) => void
  linkedPurchaseId: string
  onLinkedPurchaseChange: (value: string) => void
  selectedPartyId: string
  setSelectedPartyId: Dispatch<SetStateAction<string>>
  party: SaleCustomer
  setParty: Dispatch<SetStateAction<SaleCustomer>>
  search: string
  setSearch: Dispatch<SetStateAction<string>>
  items: DraftItem[]
  setItems: Dispatch<SetStateAction<DraftItem[]>>
  gstEnabled: boolean
  setGstEnabled: Dispatch<SetStateAction<boolean>>
  note: string
  setNote: Dispatch<SetStateAction<string>>
}
