import type { Product } from "@/app/lib/db"

export function normalizeBarcodeValue(value: string) {
  return value.trim().replace(/\s+/g, "")
}

export function productMatchesScannedCode(product: Product, code: string) {
  const normalizedCode = normalizeBarcodeValue(code).toLowerCase()
  if (!normalizedCode) return false

  const sku = normalizeBarcodeValue(product.sku || "").toLowerCase()
  const id = normalizeBarcodeValue(product.id || "").toLowerCase()
  const hsnCode = normalizeBarcodeValue(product.hsnCode || "").toLowerCase()

  return Boolean(
    (sku && sku === normalizedCode) ||
    (id && id === normalizedCode) ||
    (hsnCode && hsnCode === normalizedCode),
  )
}

export function findProductByScannedCode(products: Product[], code: string, options: { inStockOnly?: boolean } = {}) {
  const candidates = options.inStockOnly
    ? products.filter((product) => Number(product.quantity || 0) > 0)
    : products

  return candidates.find((product) => productMatchesScannedCode(product, code)) || null
}
