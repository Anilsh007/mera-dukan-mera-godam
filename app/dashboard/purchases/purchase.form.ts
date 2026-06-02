import type { PurchasePaymentStatus } from "@/app/lib/db"
import type { PurchaseRow } from "./purchase.types"
import { en } from "@/app/messages/en"

export function createPurchaseRow(): PurchaseRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    category: "",
    sku: "",
    hsnCode: "",
    expiry: "",
    batchNo: "",
    locationId: "",
    locationName: "",
    price: "",
    quantity: "",
    quantityUnit: "",
    note: "",
  }
}

export function todayDateInput() {
  return new Date().toISOString().slice(0, 10)
}

export function makePurchaseBillNo() {
  return `PUR-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Date.now().toString().slice(-5)}`
}

export function focusPurchaseField(id: string) {
  if (!id) return
  requestAnimationFrame(() => {
    const field = document.getElementById(id)
    field?.scrollIntoView({ behavior: "smooth", block: "center" })
    field?.focus()
  })
}

export function validatePurchaseForm({
  supplierName,
  purchaseDate,
  rows,
  paymentStatus,
  amountPaid,
  totalAmount,
}: {
  supplierName: string
  purchaseDate: string
  rows: PurchaseRow[]
  paymentStatus: PurchasePaymentStatus | ""
  amountPaid: string
  totalAmount: number
}) {
  const errors: string[] = []
  let focusId = ""
  const setFocus = (id: string) => {
    if (!focusId) focusId = id
  }

  if (!supplierName.trim()) {
    errors.push(en.purchases.validation.supplierRequired)
    setFocus("purchase-supplier")
  }
  if (!purchaseDate) {
    errors.push(en.purchases.validation.purchaseDateRequired)
    setFocus("purchase-date")
  }
  if (!rows.length) errors.push(en.purchases.validation.addAtLeastOneProduct)
  if (!paymentStatus) {
    errors.push(en.purchases.validation.paymentStatusRequired)
    setFocus("purchase-payment-status")
  }

  rows.forEach((row, index) => {
    const rowNo = index + 1
    const quantity = Number(row.quantity)
    const rate = Number(row.price)

    if (!row.name.trim()) {
      errors.push(`${en.purchases.validation.itemPrefix} ${rowNo}: ${en.purchases.validation.productNameRequired}`)
      setFocus(`purchase-item-${row.id}-name`)
    }
    if (!row.category.trim()) {
      errors.push(`${en.purchases.validation.itemPrefix} ${rowNo}: ${en.purchases.validation.categoryRequired}`)
      setFocus(`purchase-item-${row.id}-category`)
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.push(`${en.purchases.validation.itemPrefix} ${rowNo}: ${en.purchases.validation.quantityInvalid}`)
      setFocus(`purchase-item-${row.id}-quantity`)
    }
    if (!row.quantityUnit.trim()) {
      errors.push(`${en.purchases.validation.itemPrefix} ${rowNo}: ${en.purchases.validation.unitRequired}`)
      setFocus(`purchase-item-${row.id}-unit`)
    }
    if (!Number.isFinite(rate) || rate < 0) {
      errors.push(`${en.purchases.validation.itemPrefix} ${rowNo}: ${en.purchases.validation.priceInvalid}`)
      setFocus(`purchase-item-${row.id}-price`)
    }
  })

  if (totalAmount <= 0) errors.push(en.purchases.validation.totalZero)

  if (paymentStatus === "partial") {
    const paid = Number(amountPaid)
    if (!Number.isFinite(paid) || paid <= 0) {
      errors.push(en.purchases.validation.partialPaidRequired)
      setFocus("purchase-paid-amount")
    } else if (paid >= totalAmount) {
      errors.push(en.purchases.validation.selectPaidInstead)
      setFocus("purchase-paid-amount")
    }
  }

  return { errors, focusId }
}
