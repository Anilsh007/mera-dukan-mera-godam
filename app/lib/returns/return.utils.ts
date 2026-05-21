import type { ReturnDocumentKind, ReturnDocumentItem, SaleCustomer } from "@/app/lib/db"
import { roundCurrency } from "@/app/lib/gst.utils"
import { calculateSaleLine, calculateSaleTotals, type SaleDraftLineInput } from "@/app/lib/sales/sale.utils"
import { en } from "@/app/messages/en"

export type ReturnDraftLineInput = Omit<SaleDraftLineInput, "productId" | "salePrice"> & {
  productId?: string
  rate: number
}

export type ReturnCalculationContext = {
  party?: SaleCustomer
  sellerGstin?: string
  sellerState?: string
  gstEnabled?: boolean
}

const DOCUMENT_PREFIX: Record<ReturnDocumentKind, string> = {
  "sales-return": "SR",
  "purchase-return": "PR",
  "credit-note": "CN",
  "debit-note": "DN",
  "delivery-challan": "DC",
}

export function buildReturnDocumentNumber(kind: ReturnDocumentKind) {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "")
  return `${DOCUMENT_PREFIX[kind]}-${date}-${Date.now()}`
}

export function getReturnKindLabel(kind: ReturnDocumentKind) {
  return en.returns.kinds[kind]
}

export function getDefaultStockImpact(kind: ReturnDocumentKind) {
  if (kind === "sales-return" || kind === "credit-note") return "stock-in" as const
  if (kind === "purchase-return" || kind === "debit-note") return "stock-out" as const
  return "none" as const
}

export function buildReturnAuditNote({
  kind,
  documentNo,
  linkedReference,
  stockImpact,
  note,
}: {
  kind: ReturnDocumentKind
  documentNo: string
  linkedReference?: string
  stockImpact: "stock-in" | "stock-out" | "none"
  note?: string
}) {
  return [
    `${getReturnKindLabel(kind)} ${documentNo}`,
    linkedReference ? `${en.returns.linkedReference}: ${linkedReference}` : "",
    `${en.returns.stockImpact}: ${en.returns.stockImpacts[stockImpact]}`,
    note?.trim() || "",
  ]
    .filter(Boolean)
    .join(" | ")
}

export function calculateReturnLine(
  line: ReturnDraftLineInput,
  context: ReturnCalculationContext = {},
): ReturnDocumentItem {
  const calculated = calculateSaleLine(
    {
      ...line,
      productId: line.productId || `manual:${line.name}:${line.quantityUnit}`,
      salePrice: Number(line.rate || 0),
    },
    {
      customer: context.party,
      sellerGstin: context.sellerGstin,
      sellerState: context.sellerState,
      gstEnabled: context.gstEnabled,
    },
  )

  return {
    id: calculated.id,
    productId: calculated.productId,
    name: calculated.name,
    category: calculated.category,
    sku: calculated.sku,
    hsnCode: calculated.hsnCode,
    quantity: calculated.quantity,
    quantityUnit: calculated.quantityUnit,
    rate: calculated.salePrice,
    discount: calculated.discount,
    taxableAmount: calculated.taxableAmount,
    gstRate: calculated.gstRate,
    cgstAmount: calculated.cgstAmount,
    sgstAmount: calculated.sgstAmount,
    igstAmount: calculated.igstAmount,
    gstAmount: calculated.gstAmount,
    lineTotal: calculated.lineTotal,
    note: calculated.note,
  }
}

export function calculateReturnTotals(items: ReturnDocumentItem[]) {
  const totals = calculateSaleTotals(
    items.map((item) => ({
      id: item.id,
      productId: item.productId || item.id,
      name: item.name,
      category: item.category,
      sku: item.sku,
      hsnCode: item.hsnCode,
      quantity: item.quantity,
      quantityUnit: item.quantityUnit,
      salePrice: item.rate,
      discount: item.discount,
      taxableAmount: item.taxableAmount,
      gstRate: item.gstRate,
      cgstAmount: item.cgstAmount,
      sgstAmount: item.sgstAmount,
      igstAmount: item.igstAmount,
      gstAmount: item.gstAmount,
      lineTotal: item.lineTotal,
      note: item.note,
    })),
  )

  return {
    taxableAmount: roundCurrency(totals.taxableAmount),
    gstAmount: roundCurrency(totals.gstAmount),
    totalAmount: roundCurrency(totals.totalAmount),
  }
}
