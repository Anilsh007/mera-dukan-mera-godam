import type { PartyRecord, Product, SaleCustomer, SalePaymentMode, SalePaymentStatus } from "@/app/lib/db"
import { normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import type { SaleDraftLineInput } from "@/app/lib/sales/sale.utils"
import { en } from "@/app/messages/en"

export type SaleCartItemDraft = {
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

export type StockAwareSaleCartItemDraft = SaleCartItemDraft & {
  availableQty: number
}

export const EMPTY_SALE_CUSTOMER: SaleCustomer = {
  name: "",
  gstin: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
}

export const SALE_PAYMENT_MODES: Array<{ value: SalePaymentMode; label: string }> = [
  { value: "Cash", label: en.sales.paymentModes.cash },
  { value: "UPI", label: en.sales.paymentModes.upi },
  { value: "Card", label: en.sales.paymentModes.card },
  { value: "Bank Transfer", label: en.sales.paymentModes.bankTransfer },
  { value: "Credit", label: en.sales.paymentModes.credit },
  { value: "Other", label: en.sales.paymentModes.other },
]

export const SALE_PAYMENT_STATUSES: Array<{ value: SalePaymentStatus; label: string }> = [
  { value: "paid", label: en.sales.paymentStatuses.paid },
  { value: "partial", label: en.sales.paymentStatuses.partial },
  { value: "unpaid", label: en.sales.paymentStatuses.unpaid },
]

export function mapPartyToSaleCustomer(
  party: Pick<PartyRecord, "name" | "gstin" | "mobile" | "email" | "address" | "city" | "state" | "pincode">,
): SaleCustomer {
  return {
    name: party.name,
    gstin: party.gstin || "",
    phone: party.mobile || "",
    email: party.email || "",
    address: party.address || "",
    city: party.city || "",
    state: party.state || "",
    pincode: party.pincode || "",
  }
}

export function createSaleCartItemDraftFromProduct(product: Product): SaleCartItemDraft {
  return {
    productId: product.id,
    name: product.name,
    category: product.category,
    sku: product.sku,
    hsnCode: product.hsnCode,
    quantityUnit: normalizeQuantityUnit(product.quantityUnit),
    quantity: "1",
    salePrice: String(Number(product.price || 0)),
    discount: "0",
    gstRate: "18",
    note: "",
  }
}

export function createStockAwareSaleCartItemFromProduct(product: Product): StockAwareSaleCartItemDraft {
  return {
    ...createSaleCartItemDraftFromProduct(product),
    availableQty: Number(product.quantity || 0),
  }
}

export function buildSaleDraftLineFromCartItem(item: SaleCartItemDraft): SaleDraftLineInput {
  return {
    productId: item.productId,
    name: item.name,
    category: item.category,
    sku: item.sku,
    hsnCode: item.hsnCode,
    quantity: Number(item.quantity || 0),
    quantityUnit: item.quantityUnit,
    salePrice: Number(item.salePrice || 0),
    discount: Number(item.discount || 0),
    gstRate: Number(item.gstRate || 0),
    note: item.note,
  }
}

export function buildSaleDraftLinesFromCart<T extends SaleCartItemDraft>(items: T[]): SaleDraftLineInput[] {
  return items.map(buildSaleDraftLineFromCartItem)
}
