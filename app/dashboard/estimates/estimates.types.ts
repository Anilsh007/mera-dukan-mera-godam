import type { Dispatch, SetStateAction } from "react"
import type { EstimateRecord, EstimateStatus, SaleCustomer, SalePaymentMode, SalePaymentStatus } from "@/app/lib/db"

export type EstimateCartItem = {
  productId: string
  name: string
  category?: string
  sku?: string
  hsnCode?: string
  quantityUnit: string
  quantity: string
  salePrice: string
  discount: string
  gstRate: string
  note: string
}

export type ConvertState = {
  estimate: EstimateRecord
  paymentMode: SalePaymentMode | ""
  paymentStatus: SalePaymentStatus | ""
  amountPaid: string
  note: string
}

export type EstimatesPageCommonProps = {
  estimateNo: string
  setEstimateNo: Dispatch<SetStateAction<string>>
  estimateDate: string
  setEstimateDate: Dispatch<SetStateAction<string>>
  expiryDate: string
  setExpiryDate: Dispatch<SetStateAction<string>>
  status: EstimateStatus | ""
  setStatus: Dispatch<SetStateAction<EstimateStatus | "">>
  selectedPartyId: string
  setSelectedPartyId: Dispatch<SetStateAction<string>>
  customer: SaleCustomer
  setCustomer: Dispatch<SetStateAction<SaleCustomer>>
  search: string
  setSearch: Dispatch<SetStateAction<string>>
  cart: EstimateCartItem[]
  setCart: Dispatch<SetStateAction<EstimateCartItem[]>>
  gstEnabled: boolean
  setGstEnabled: Dispatch<SetStateAction<boolean>>
  note: string
  setNote: Dispatch<SetStateAction<string>>
  terms: string
  setTerms: Dispatch<SetStateAction<string>>
}
