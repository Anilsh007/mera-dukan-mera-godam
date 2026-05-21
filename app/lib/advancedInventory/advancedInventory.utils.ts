import type { InventoryBatchRecord, InventoryLocationRecord, Product, ProductLocationStockRecord, StockTransferRecord } from "@/app/lib/db"
import { formatQuantity, normalizeQuantityUnit } from "@/app/lib/quantityUnit"
import { en } from "@/app/messages/en"

export type AdvancedInventoryViewRow = {
  product: Product
  locationStocks: ProductLocationStockRecord[]
  batches: InventoryBatchRecord[]
  totalLocationQty: number
  locationNames: string
  batchLabels: string
  nearestExpiry?: string
}

export type AdvancedInventoryFilters = {
  search: string
  locationId: string
  batch: string
  expiry: string
}

export function buildAdvancedInventoryRows({
  products,
  locations,
  locationStocks,
  batches,
}: {
  products: Product[]
  locations: InventoryLocationRecord[]
  locationStocks: ProductLocationStockRecord[]
  batches: InventoryBatchRecord[]
}): AdvancedInventoryViewRow[] {
  const defaultLocation = locations.find((location) => location.isDefault)
  return products.map((product) => {
    const stocks = locationStocks.filter((stock) => stock.productId === product.id && Number(stock.quantity || 0) > 0)
    const productBatches = batches.filter((batch) => batch.productId === product.id && Number(batch.quantity || 0) > 0)
    const effectiveStocks = stocks.length
      ? stocks
      : defaultLocation
        ? [{
            id: `${product.id}:${defaultLocation.id}:virtual`,
            userId: product.userId,
            productId: product.id,
            locationId: defaultLocation.id,
            locationName: defaultLocation.name,
            quantity: Number(product.quantity || 0),
            quantityUnit: normalizeQuantityUnit(product.quantityUnit),
            updatedAt: product.createdAt,
          }]
        : []
    const nearestExpiry = getNearestBatchExpiry(productBatches, product.expiry)
    return {
      product,
      locationStocks: effectiveStocks,
      batches: productBatches,
      totalLocationQty: effectiveStocks.reduce((sum, stock) => sum + Number(stock.quantity || 0), 0),
      locationNames: effectiveStocks.map((stock) => `${stock.locationName}: ${formatQuantity(stock.quantity, stock.quantityUnit)}`).join(" | "),
      batchLabels: productBatches.map((batch) => `${batch.batchNo || en.advancedInventory.noBatch}: ${formatQuantity(batch.quantity, batch.quantityUnit)}${batch.expiry ? ` (${batch.expiry})` : ""}`).join(" | "),
      nearestExpiry,
    }
  })
}

export function filterAdvancedInventoryRows(rows: AdvancedInventoryViewRow[], filters: AdvancedInventoryFilters) {
  const query = filters.search.trim().toLowerCase()
  const batchQuery = filters.batch.trim().toLowerCase()
  return rows.filter((row) => {
    const haystack = [row.product.name, row.product.category, row.product.sku, row.product.hsnCode, row.locationNames, row.batchLabels]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    if (query && !haystack.includes(query)) return false
    if (filters.locationId && !row.locationStocks.some((stock) => stock.locationId === filters.locationId)) return false
    if (batchQuery && !row.batches.some((batch) => (batch.batchNo || "").toLowerCase().includes(batchQuery))) return false
    if (filters.expiry === "tracked" && !row.nearestExpiry) return false
    if (filters.expiry === "expired" && !row.batches.some((batch) => batch.expiry && new Date(batch.expiry).getTime() < Date.now())) return false
    if (filters.expiry === "next30" && !row.batches.some((batch) => {
      if (!batch.expiry) return false
      const days = Math.ceil((new Date(batch.expiry).getTime() - Date.now()) / 86400000)
      return days >= 0 && days <= 30
    })) return false
    return true
  })
}

export function buildAdvancedInventoryReportRows(rows: AdvancedInventoryViewRow[]) {
  return [
    [
      en.advancedInventory.product,
      en.advancedInventory.category,
      en.advancedInventory.totalStock,
      en.advancedInventory.locations,
      en.advancedInventory.batchNo,
      en.advancedInventory.nearestExpiry,
      en.advancedInventory.reorderLevel,
    ],
    ...rows.map((row) => [
      row.product.name,
      row.product.category || en.common.notAvailable,
      formatQuantity(row.product.quantity, row.product.quantityUnit),
      row.locationNames || en.advancedInventory.defaultGodownName,
      row.batchLabels || en.advancedInventory.noBatch,
      row.nearestExpiry || row.product.expiry || en.common.notAvailable,
      row.product.reorderLevel ?? row.product.lowStockThreshold ?? en.common.notAvailable,
    ]),
  ]
}

export function buildTransferReportRows(transfers: StockTransferRecord[]) {
  return [
    [en.advancedInventory.transferNo, en.stockHistory.labels.date, en.advancedInventory.product, en.advancedInventory.fromGodown, en.advancedInventory.toGodown, en.advancedInventory.quantity, en.advancedInventory.note],
    ...transfers.map((transfer) => [transfer.transferNo, new Date(transfer.createdAt).toLocaleString("en-IN"), transfer.productName, transfer.fromLocationName, transfer.toLocationName, formatQuantity(transfer.quantity, transfer.quantityUnit), transfer.note || ""]),
  ]
}

function getNearestBatchExpiry(batches: InventoryBatchRecord[], fallback?: string) {
  const expiries = batches
    .map((batch) => batch.expiry)
    .filter((expiry): expiry is string => Boolean(expiry))
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())
  return expiries[0] || fallback
}
