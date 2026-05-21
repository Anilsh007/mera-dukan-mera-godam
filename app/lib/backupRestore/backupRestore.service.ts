"use client"

import type { GSTInvoiceRecord } from "@/app/dashboard/gst-invoice/types/gst.types"
import type { ProfileData } from "@/app/lib/profile/profile.service"
import {
  db,
  type CashbookEntryRecord,
  type EstimateRecord,
  type ExpenseRecord,
  type InventoryBatchRecord,
  type InventoryLocationRecord,
  type PartyLedgerRecord,
  type PartyRecord,
  type Product,
  type ProductLocationStockRecord,
  type ProductLog,
  type PurchaseRecord,
  type ReturnDocumentRecord,
  type SaleRecord,
  type StockTransferRecord,
} from "@/app/lib/db"
import { buildGstReportsSummary } from "@/app/lib/gstReports/gstReports.utils"
import { DEFAULT_QUANTITY_UNIT } from "@/app/lib/quantityUnit"
import { downloadTextFile } from "@/app/lib/share"
import { assertFeatureAccess, incrementUsage } from "@/app/lib/subscription/subscription.service"
import { en } from "@/app/messages/en"

export type BackupCollectionKey = "profiles" | "products" | "productLogs" | "invoices" | "purchases" | "sales" | "estimates" | "returnDocuments" | "expenses" | "cashbookEntries" | "inventoryLocations" | "productLocationStocks" | "inventoryBatches" | "stockTransfers" | "parties" | "partyLedger"
export type ExportModuleKey = "inventory" | "sales" | "purchases" | "customers" | "suppliers" | "expenses" | "gstReports"
export type SafeImportKind = "products" | "customers" | "suppliers"
export type BackupCollectionCounts = Record<BackupCollectionKey, number>

type FullBackupData = {
  profiles: ProfileData[]
  products: Product[]
  productLogs: ProductLog[]
  invoices: GSTInvoiceRecord[]
  purchases: PurchaseRecord[]
  sales: SaleRecord[]
  estimates: EstimateRecord[]
  returnDocuments: ReturnDocumentRecord[]
  expenses: ExpenseRecord[]
  cashbookEntries: CashbookEntryRecord[]
  inventoryLocations: InventoryLocationRecord[]
  productLocationStocks: ProductLocationStockRecord[]
  inventoryBatches: InventoryBatchRecord[]
  stockTransfers: StockTransferRecord[]
  parties: PartyRecord[]
  partyLedger: PartyLedgerRecord[]
}

export type FullBackupPayload = {
  meta: { kind: "mdmg-full-backup"; appName: string; schemaVersion: 1; exportedAt: string; userId: string }
  data: FullBackupData
  gstReportSnapshot: { generatedAt: string; totals: Record<string, number> }
}

export type BackupPreviewRow = { key: BackupCollectionKey; label: string; incoming: number; duplicates: number; willImport: number }
export type BackupPreview = { payload?: FullBackupPayload; rows: BackupPreviewRow[]; errors: string[]; warnings: string[]; totalIncoming: number; totalWillImport: number }
export type ImportPreviewRow = { label: string; incoming: number; duplicates: number; invalid: number; willImport: number }
export type SafeImportPreview = { kind: SafeImportKind; rows: ImportPreviewRow[]; products: Product[]; parties: PartyRecord[]; errors: string[]; warnings: string[]; totalIncoming: number; totalWillImport: number }

type BasicRecord = Record<string, unknown>
type CsvRow = Record<string, string>

type ImportableCollectionMap = {
  profiles: ProfileData
  products: Product
  productLogs: ProductLog
  invoices: GSTInvoiceRecord
  purchases: PurchaseRecord
  sales: SaleRecord
  estimates: EstimateRecord
  returnDocuments: ReturnDocumentRecord
  expenses: ExpenseRecord
  cashbookEntries: CashbookEntryRecord
  inventoryLocations: InventoryLocationRecord
  productLocationStocks: ProductLocationStockRecord
  inventoryBatches: InventoryBatchRecord
  stockTransfers: StockTransferRecord
  parties: PartyRecord
  partyLedger: PartyLedgerRecord
}

const COLLECTION_KEYS: BackupCollectionKey[] = ["profiles", "products", "productLogs", "invoices", "purchases", "sales", "estimates", "returnDocuments", "expenses", "cashbookEntries", "inventoryLocations", "productLocationStocks", "inventoryBatches", "stockTransfers", "parties", "partyLedger"]

export async function loadBackupCounts(userId: string): Promise<BackupCollectionCounts> {
  const data = await loadUserBackupData(userId)
  return Object.fromEntries(COLLECTION_KEYS.map((key) => [key, data[key].length])) as BackupCollectionCounts
}

export async function buildFullBackupPayload(userId: string): Promise<FullBackupPayload> {
  const data = await loadUserBackupData(userId)
  const range = { from: "2000-01-01", to: new Date().toISOString().slice(0, 10) }
  const gst = buildGstReportsSummary({ invoices: data.invoices, sales: data.sales, purchases: data.purchases, productLogs: data.productLogs, returnDocuments: data.returnDocuments, range })
  return {
    meta: { kind: "mdmg-full-backup", appName: en.common.appName, schemaVersion: 1, exportedAt: new Date().toISOString(), userId },
    data,
    gstReportSnapshot: { generatedAt: new Date().toISOString(), totals: gst.totals },
  }
}

export async function exportFullBackup(userId: string) {
  await assertFeatureAccess(userId, "exports", { operation: "export", scope: "basic", incrementBy: 1 })
  const payload = await buildFullBackupPayload(userId)
  const ok = downloadTextFile(JSON.stringify(payload, null, 2), `mdmg-full-backup-${todayStamp()}.json`, "application/json;charset=utf-8")
  if (ok) await incrementUsage(userId, "exports")
  return ok
}

export async function exportModuleCsv(userId: string, moduleKey: ExportModuleKey) {
  await assertFeatureAccess(userId, "exports", { operation: "export", scope: "basic", incrementBy: 1 })
  const rows = await buildModuleRows(userId, moduleKey)
  const ok = downloadTextFile(rowsToCsv(rows), `mdmg-${moduleKey}-${todayStamp()}.csv`, "text/csv;charset=utf-8")
  if (ok) await incrementUsage(userId, "exports")
  return ok
}

export async function previewFullBackupText(text: string, userId: string): Promise<BackupPreview> {
  const parsed = parseBackupPayload(text)
  if (!parsed.payload) return emptyBackupPreview(parsed.errors)
  const payload = normalizeBackupPayload(parsed.payload, userId)
  const errors = validateFullBackupPayload(payload)
  const warnings = parsed.payload.meta.userId !== userId ? [en.backupRestore.differentUserWarning] : []
  const existing = await getExistingIdsByCollection()
  const rows = COLLECTION_KEYS.map((key) => {
    const incoming = payload.data[key]
    const duplicates = incoming.filter((record) => getRecordId(key, record) && existing[key].has(getRecordId(key, record))).length
    return { key, label: getCollectionLabel(key), incoming: incoming.length, duplicates, willImport: Math.max(incoming.length - duplicates, 0) }
  })
  return { payload: errors.length ? undefined : payload, rows, errors, warnings, totalIncoming: rows.reduce((sum, row) => sum + row.incoming, 0), totalWillImport: rows.reduce((sum, row) => sum + row.willImport, 0) }
}

export async function restoreFullBackup(userId: string, payload: FullBackupPayload) {
  await assertFeatureAccess(userId, "exports", { operation: "update", scope: "premium" })
  const normalized = normalizeBackupPayload(payload, userId)
  const validationErrors = validateFullBackupPayload(normalized)
  if (validationErrors.length) throw new Error(validationErrors.join(" "))
  const existing = await getExistingIdsByCollection()
  const filtered = filterNewBackupData(normalized.data, existing)

  await db.transaction("rw", [db.profiles, db.products, db.productLogs, db.invoices, db.purchases, db.sales, db.estimates, db.returnDocuments, db.expenses, db.cashbookEntries, db.inventoryLocations, db.productLocationStocks, db.inventoryBatches, db.stockTransfers, db.parties, db.partyLedger], async () => {
    if (filtered.profiles.length) await db.profiles.bulkAdd(filtered.profiles)
    if (filtered.products.length) await db.products.bulkAdd(filtered.products)
    if (filtered.productLogs.length) await db.productLogs.bulkAdd(filtered.productLogs)
    if (filtered.invoices.length) await db.invoices.bulkAdd(filtered.invoices)
    if (filtered.purchases.length) await db.purchases.bulkAdd(filtered.purchases)
    if (filtered.sales.length) await db.sales.bulkAdd(filtered.sales)
    if (filtered.estimates.length) await db.estimates.bulkAdd(filtered.estimates)
    if (filtered.returnDocuments.length) await db.returnDocuments.bulkAdd(filtered.returnDocuments)
    if (filtered.expenses.length) await db.expenses.bulkAdd(filtered.expenses)
    if (filtered.cashbookEntries.length) await db.cashbookEntries.bulkAdd(filtered.cashbookEntries)
    if (filtered.inventoryLocations.length) await db.inventoryLocations.bulkAdd(filtered.inventoryLocations)
    if (filtered.productLocationStocks.length) await db.productLocationStocks.bulkAdd(filtered.productLocationStocks)
    if (filtered.inventoryBatches.length) await db.inventoryBatches.bulkAdd(filtered.inventoryBatches)
    if (filtered.stockTransfers.length) await db.stockTransfers.bulkAdd(filtered.stockTransfers)
    if (filtered.parties.length) await db.parties.bulkAdd(filtered.parties)
    if (filtered.partyLedger.length) await db.partyLedger.bulkAdd(filtered.partyLedger)
  })

  return COLLECTION_KEYS.reduce((sum, key) => sum + filtered[key].length, 0)
}

export async function previewSafeImportText(text: string, kind: SafeImportKind, userId: string): Promise<SafeImportPreview> {
  const rows = parseImportRows(text)
  const errors: string[] = []
  const warnings: string[] = []
  if (!rows.length) errors.push(en.backupRestore.noImportRows)

  if (kind === "products") {
    const normalized = rows.map((row) => normalizeProductImport(row, userId))
    const products = normalized.flatMap((item) => item.record ? [item.record] : [])
    errors.push(...normalized.flatMap((item) => item.errors))
    const existing = await db.products.where("userId").equals(userId).toArray()
    const duplicates = products.filter((product) => isDuplicateProduct(product, existing)).length
    const filtered = products.filter((product) => !isDuplicateProduct(product, existing))
    if (duplicates) warnings.push(en.backupRestore.duplicatesWillBeSkipped)
    return { kind, rows: [{ label: en.backupRestore.productsImport, incoming: rows.length, duplicates, invalid: normalized.length - products.length, willImport: filtered.length }], products: filtered, parties: [], errors, warnings, totalIncoming: rows.length, totalWillImport: filtered.length }
  }

  const partyType = kind === "customers" ? "customer" : "supplier"
  const normalized = rows.map((row) => normalizePartyImport(row, userId, partyType))
  const parties = normalized.flatMap((item) => item.record ? [item.record] : [])
  errors.push(...normalized.flatMap((item) => item.errors))
  const existing = await db.parties.where("userId").equals(userId).toArray()
  const duplicates = parties.filter((party) => isDuplicateParty(party, existing)).length
  const filtered = parties.filter((party) => !isDuplicateParty(party, existing))
  if (duplicates) warnings.push(en.backupRestore.duplicatesWillBeSkipped)
  return { kind, rows: [{ label: kind === "customers" ? en.backupRestore.customersImport : en.backupRestore.suppliersImport, incoming: rows.length, duplicates, invalid: normalized.length - parties.length, willImport: filtered.length }], products: [], parties: filtered, errors, warnings, totalIncoming: rows.length, totalWillImport: filtered.length }
}

export async function importSafeRecords(userId: string, preview: SafeImportPreview) {
  if (preview.kind === "products") {
    const existing = await db.products.where("userId").equals(userId).toArray()
    const safeProducts = preview.products.filter((product) => !isDuplicateProduct(product, existing))
    await assertFeatureAccess(userId, "products", { operation: "create", incrementBy: safeProducts.length })
    if (!safeProducts.length) return 0
    await db.transaction("rw", db.products, async () => {
      await db.products.bulkAdd(safeProducts)
    })
    return safeProducts.length
  }
  const feature = preview.kind === "customers" ? "customers" : "suppliers"
  const existing = await db.parties.where("userId").equals(userId).toArray()
  const safeParties = preview.parties.filter((party) => !isDuplicateParty(party, existing))
  await assertFeatureAccess(userId, feature, { operation: "create", incrementBy: safeParties.length })
  if (!safeParties.length) return 0
  await db.transaction("rw", db.parties, async () => {
    await db.parties.bulkAdd(safeParties)
  })
  return safeParties.length
}

async function loadUserBackupData(userId: string): Promise<FullBackupData> {
  const products = await db.products.where("userId").equals(userId).toArray()
  const productIds = new Set(products.map((product) => product.id))
  const productLogs = (await db.productLogs.toArray()).filter((log) => productIds.has(log.productId))
  const [profiles, invoices, purchases, sales, estimates, returnDocuments, expenses, cashbookEntries, inventoryLocations, productLocationStocks, inventoryBatches, stockTransfers, parties, partyLedger] = await Promise.all([
    db.profiles.where("userId").equals(userId).toArray(),
    db.invoices.where("userId").equals(userId).toArray(),
    db.purchases.where("userId").equals(userId).toArray(),
    db.sales.where("userId").equals(userId).toArray(),
    db.estimates.where("userId").equals(userId).toArray(),
    db.returnDocuments.where("userId").equals(userId).toArray(),
    db.expenses.where("userId").equals(userId).toArray(),
    db.cashbookEntries.where("userId").equals(userId).toArray(),
    db.inventoryLocations.where("userId").equals(userId).toArray(),
    db.productLocationStocks.where("userId").equals(userId).toArray(),
    db.inventoryBatches.where("userId").equals(userId).toArray(),
    db.stockTransfers.where("userId").equals(userId).toArray(),
    db.parties.where("userId").equals(userId).toArray(),
    db.partyLedger.where("userId").equals(userId).toArray(),
  ])
  return { profiles, products, productLogs, invoices, purchases, sales, estimates, returnDocuments, expenses, cashbookEntries, inventoryLocations, productLocationStocks, inventoryBatches, stockTransfers, parties, partyLedger }
}

async function buildModuleRows(userId: string, moduleKey: ExportModuleKey): Promise<Array<Array<string | number>>> {
  if (moduleKey === "inventory") {
    const products = await db.products.where("userId").equals(userId).toArray()
    return [[en.backupRestore.csvHeaders.id, en.backupRestore.csvHeaders.name, en.backupRestore.csvHeaders.sku, en.backupRestore.csvHeaders.category, en.backupRestore.csvHeaders.quantity, en.backupRestore.csvHeaders.unit, en.backupRestore.csvHeaders.price, en.backupRestore.csvHeaders.expiry], ...products.map((p) => [p.id, p.name, p.sku || "", p.category || "", p.quantity, p.quantityUnit || DEFAULT_QUANTITY_UNIT, p.price, p.expiry || ""])]
  }
  if (moduleKey === "sales") {
    const sales = await db.sales.where("userId").equals(userId).toArray()
    return [[en.backupRestore.csvHeaders.id, en.backupRestore.csvHeaders.documentNo, en.backupRestore.csvHeaders.date, en.backupRestore.csvHeaders.party, en.backupRestore.csvHeaders.total, en.backupRestore.csvHeaders.paid, en.backupRestore.csvHeaders.due, en.backupRestore.csvHeaders.paymentMode], ...sales.map((s) => [s.id, s.receiptNo, s.saleDate, s.customer?.name || "", s.totalAmount, s.amountPaid, s.dueAmount, s.paymentMode])]
  }
  if (moduleKey === "purchases") {
    const purchases = await db.purchases.where("userId").equals(userId).toArray()
    return [[en.backupRestore.csvHeaders.id, en.backupRestore.csvHeaders.documentNo, en.backupRestore.csvHeaders.date, en.backupRestore.csvHeaders.party, en.backupRestore.csvHeaders.total, en.backupRestore.csvHeaders.paid, en.backupRestore.csvHeaders.due, en.backupRestore.csvHeaders.paymentMode], ...purchases.map((p) => [p.id, p.billNo, p.purchaseDate, p.supplierName, p.totalAmount, p.amountPaid, p.dueAmount, p.paymentMode || ""])]
  }
  if (moduleKey === "customers" || moduleKey === "suppliers") {
    const type = moduleKey === "customers" ? "customer" : "supplier"
    const parties = (await db.parties.where("userId").equals(userId).toArray()).filter((p) => p.type === type || p.type === "both")
    return [[en.backupRestore.csvHeaders.id, en.backupRestore.csvHeaders.name, en.backupRestore.csvHeaders.mobile, en.backupRestore.csvHeaders.email, en.backupRestore.csvHeaders.gstin, en.backupRestore.csvHeaders.address, en.backupRestore.csvHeaders.balance], ...parties.map((p) => [p.id, p.name, p.mobile || "", p.email || "", p.gstin || "", p.address || "", type === "customer" ? p.receivable : p.payable])]
  }
  if (moduleKey === "expenses") {
    const expenses = await db.expenses.where("userId").equals(userId).toArray()
    return [[en.backupRestore.csvHeaders.id, en.backupRestore.csvHeaders.documentNo, en.backupRestore.csvHeaders.date, en.backupRestore.csvHeaders.category, en.backupRestore.csvHeaders.amount, en.backupRestore.csvHeaders.paymentMode, en.backupRestore.csvHeaders.reference], ...expenses.map((e) => [e.id, e.expenseNo, e.expenseDate, e.category, e.amount, e.paymentMode, e.reference || ""])]
  }
  const payload = await buildFullBackupPayload(userId)
  return [[en.backupRestore.csvHeaders.metric, en.backupRestore.csvHeaders.amount], [en.gstReports.gstCollected, payload.gstReportSnapshot.totals.gstCollected || 0], [en.gstReports.gstPaid, payload.gstReportSnapshot.totals.gstPaid || 0], [en.gstReports.netGstPayable, payload.gstReportSnapshot.totals.netGstPayable || 0], [en.gstReports.salesRegister, payload.gstReportSnapshot.totals.salesTotal || 0], [en.gstReports.purchaseRegister, payload.gstReportSnapshot.totals.purchaseTotal || 0]]
}

function parseBackupPayload(text: string): { payload?: FullBackupPayload; errors: string[] } {
  try {
    const parsed = JSON.parse(text) as unknown
    if (!isRecord(parsed) || !isRecord(parsed.meta) || parsed.meta.kind !== "mdmg-full-backup" || !isRecord(parsed.data)) return { errors: [en.backupRestore.invalidBackupFile] }
    return { payload: parsed as FullBackupPayload, errors: [] }
  } catch {
    return { errors: [en.backupRestore.invalidJson] }
  }
}

function validateFullBackupPayload(payload: FullBackupPayload) {
  const errors: string[] = []
  if (payload.meta.schemaVersion !== 1) errors.push(en.backupRestore.unsupportedSchema)
  for (const key of COLLECTION_KEYS) if (!Array.isArray(payload.data[key])) errors.push(en.backupRestore.invalidCollection.replace("{collection}", getCollectionLabel(key)))
  if (!payload.data.products.every((p) => p.id && p.name && Number.isFinite(Number(p.quantity)))) errors.push(en.backupRestore.invalidProductRows)
  return errors
}

function normalizeBackupPayload(payload: FullBackupPayload, userId: string): FullBackupPayload {
  const withUser = <T extends { userId: string }>(records: T[]) => records.map((record) => ({ ...record, userId })) as T[]
  return { ...payload, data: { profiles: payload.data.profiles.map((profile) => ({ ...profile, userId })), products: withUser(payload.data.products), productLogs: payload.data.productLogs, invoices: withUser(payload.data.invoices), purchases: withUser(payload.data.purchases), sales: withUser(payload.data.sales), estimates: withUser(payload.data.estimates), returnDocuments: withUser(payload.data.returnDocuments), expenses: withUser(payload.data.expenses), cashbookEntries: withUser(payload.data.cashbookEntries), inventoryLocations: withUser(payload.data.inventoryLocations), productLocationStocks: withUser(payload.data.productLocationStocks), inventoryBatches: withUser(payload.data.inventoryBatches), stockTransfers: withUser(payload.data.stockTransfers), parties: withUser(payload.data.parties), partyLedger: withUser(payload.data.partyLedger) } }
}

function filterNewBackupData(data: FullBackupData, existing: Record<BackupCollectionKey, Set<string>>): FullBackupData {
  const keep = <K extends BackupCollectionKey>(key: K, records: ImportableCollectionMap[K][]) => records.filter((record) => !existing[key].has(getRecordId(key, record)))
  return { profiles: keep("profiles", data.profiles), products: keep("products", data.products), productLogs: keep("productLogs", data.productLogs), invoices: keep("invoices", data.invoices), purchases: keep("purchases", data.purchases), sales: keep("sales", data.sales), estimates: keep("estimates", data.estimates), returnDocuments: keep("returnDocuments", data.returnDocuments), expenses: keep("expenses", data.expenses), cashbookEntries: keep("cashbookEntries", data.cashbookEntries), inventoryLocations: keep("inventoryLocations", data.inventoryLocations), productLocationStocks: keep("productLocationStocks", data.productLocationStocks), inventoryBatches: keep("inventoryBatches", data.inventoryBatches), stockTransfers: keep("stockTransfers", data.stockTransfers), parties: keep("parties", data.parties), partyLedger: keep("partyLedger", data.partyLedger) }
}

async function getExistingIdsByCollection(): Promise<Record<BackupCollectionKey, Set<string>>> {
  const [profiles, products, productLogs, invoices, purchases, sales, estimates, returnDocuments, expenses, cashbookEntries, inventoryLocations, productLocationStocks, inventoryBatches, stockTransfers, parties, partyLedger] = await Promise.all([db.profiles.toArray(), db.products.toArray(), db.productLogs.toArray(), db.invoices.toArray(), db.purchases.toArray(), db.sales.toArray(), db.estimates.toArray(), db.returnDocuments.toArray(), db.expenses.toArray(), db.cashbookEntries.toArray(), db.inventoryLocations.toArray(), db.productLocationStocks.toArray(), db.inventoryBatches.toArray(), db.stockTransfers.toArray(), db.parties.toArray(), db.partyLedger.toArray()])
  return { profiles: new Set(profiles.map((r) => r.userId)), products: new Set(products.map((r) => r.id)), productLogs: new Set(productLogs.map((r) => r.id)), invoices: new Set(invoices.map((r) => r.id)), purchases: new Set(purchases.map((r) => r.id)), sales: new Set(sales.map((r) => r.id)), estimates: new Set(estimates.map((r) => r.id)), returnDocuments: new Set(returnDocuments.map((r) => r.id)), expenses: new Set(expenses.map((r) => r.id)), cashbookEntries: new Set(cashbookEntries.map((r) => r.id)), inventoryLocations: new Set(inventoryLocations.map((r) => r.id)), productLocationStocks: new Set(productLocationStocks.map((r) => r.id)), inventoryBatches: new Set(inventoryBatches.map((r) => r.id)), stockTransfers: new Set(stockTransfers.map((r) => r.id)), parties: new Set(parties.map((r) => r.id)), partyLedger: new Set(partyLedger.map((r) => r.id)) }
}

function parseImportRows(text: string): BasicRecord[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as unknown
    if (Array.isArray(parsed)) return parsed.filter(isRecord)
    if (isRecord(parsed) && Array.isArray(parsed.rows)) return parsed.rows.filter(isRecord)
    if (isRecord(parsed) && Array.isArray(parsed.products)) return parsed.products.filter(isRecord)
    if (isRecord(parsed) && Array.isArray(parsed.parties)) return parsed.parties.filter(isRecord)
    return []
  }
  return parseCsv(trimmed)
}

function normalizeProductImport(row: BasicRecord, userId: string): { record?: Product; errors: string[] } {
  const name = getText(row, ["name", "product", "productName"])
  if (!name) return { errors: [en.backupRestore.productNameRequired] }
  const now = new Date().toISOString()
  return { errors: [], record: { id: getText(row, ["id"]) || createId("product"), userId, name, price: Math.max(0, getNumber(row, ["price", "rate", "salePrice"], 0)), quantity: Math.max(0, getNumber(row, ["quantity", "qty", "stock"], 0)), quantityUnit: getText(row, ["quantityUnit", "unit"]) || DEFAULT_QUANTITY_UNIT, category: getText(row, ["category"]), supplier: getText(row, ["supplier"]), note: getText(row, ["note"]), expiry: getText(row, ["expiry"]), sku: getText(row, ["sku", "barcode"]), hsnCode: getText(row, ["hsnCode", "hsn"]), batchNo: getText(row, ["batchNo", "batch"]), reorderLevel: optionalNumber(row, ["reorderLevel"]), lowStockThreshold: optionalNumber(row, ["lowStockThreshold"]), criticalStockThreshold: optionalNumber(row, ["criticalStockThreshold"]), createdAt: getText(row, ["createdAt"]) || now } }
}

function normalizePartyImport(row: BasicRecord, userId: string, type: "customer" | "supplier"): { record?: PartyRecord; errors: string[] } {
  const name = getText(row, ["name", "party", "partyName", type])
  if (!name) return { errors: [en.backupRestore.partyNameRequired] }
  const now = new Date().toISOString()
  return { errors: [], record: { id: getText(row, ["id"]) || createId(type), userId, name, normalizedName: normalizeName(name), mobile: getText(row, ["mobile", "phone"]), email: getText(row, ["email"]), gstin: getText(row, ["gstin", "gst"]), address: getText(row, ["address"]), city: getText(row, ["city"]), state: getText(row, ["state"]), pincode: getText(row, ["pincode", "pin"]), type, openingBalance: getNumber(row, ["openingBalance", "balance"], 0), receivable: type === "customer" ? getNumber(row, ["receivable", "balance"], 0) : 0, payable: type === "supplier" ? getNumber(row, ["payable", "balance"], 0) : 0, notes: getText(row, ["notes", "note"]), createdAt: getText(row, ["createdAt"]) || now, updatedAt: now } }
}

function isDuplicateProduct(product: Product, existing: Product[]) {
  const sku = product.sku?.trim().toLowerCase()
  const key = `${normalizeName(product.name)}|${normalizeName(product.category || "")}|${normalizeName(product.quantityUnit || DEFAULT_QUANTITY_UNIT)}`
  return existing.some((item) => item.id === product.id || Boolean(sku && item.sku?.trim().toLowerCase() === sku) || `${normalizeName(item.name)}|${normalizeName(item.category || "")}|${normalizeName(item.quantityUnit || DEFAULT_QUANTITY_UNIT)}` === key)
}

function isDuplicateParty(party: PartyRecord, existing: PartyRecord[]) {
  const gstin = party.gstin?.trim().toLowerCase()
  const mobile = party.mobile?.trim()
  const email = party.email?.trim().toLowerCase()
  return existing.some((item) => {
    const typeMatches = item.type === party.type || item.type === "both" || party.type === "both"
    return item.id === party.id || (typeMatches && item.normalizedName === party.normalizedName) || Boolean(gstin && item.gstin?.trim().toLowerCase() === gstin) || Boolean(mobile && item.mobile?.trim() === mobile) || Boolean(email && item.email?.trim().toLowerCase() === email)
  })
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = []
  let current = ""
  let row: string[] = []
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]
    if (char === '"' && quoted && next === '"') { current += '"'; index += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === "," && !quoted) { row.push(current); current = "" }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && next === "\n") index += 1; row.push(current); rows.push(row); row = []; current = "" }
    else current += char
  }
  row.push(current)
  rows.push(row)
  const [headers = [], ...body] = rows.filter((cells) => cells.some((cell) => cell.trim()))
  const normalized = headers.map((header) => header.trim())
  return body.map((cells) => normalized.reduce<CsvRow>((record, header, index) => ({ ...record, [header]: cells[index]?.trim() || "" }), {}))
}

function rowsToCsv(rows: Array<Array<string | number>>) { return rows.map((row) => row.map(csvCell).join(",")).join("\n") }
function csvCell(value: string | number) { const text = String(value ?? "").replaceAll('"', '""'); return text.includes(",") || text.includes("\n") ? `"${text}"` : text }
function getText(record: BasicRecord, keys: string[]) { for (const key of keys) { const value = record[key]; if (typeof value === "string" && value.trim()) return value.trim(); if (typeof value === "number" && Number.isFinite(value)) return String(value) } return undefined }
function getNumber(record: BasicRecord, keys: string[], fallback: number) { for (const key of keys) { const value = record[key]; const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/,/g, "")) : Number.NaN; if (Number.isFinite(parsed)) return parsed } return fallback }
function optionalNumber(record: BasicRecord, keys: string[]) { const value = getNumber(record, keys, Number.NaN); return Number.isFinite(value) ? value : undefined }
function isRecord(value: unknown): value is BasicRecord { return typeof value === "object" && value !== null && !Array.isArray(value) }
function normalizeName(value: string) { return value.trim().toLowerCase().replace(/\s+/g, " ") }
function createId(prefix: string) { const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`; return `${prefix}-${random}` }
function todayStamp() { return new Date().toISOString().slice(0, 10) }
function getCollectionLabel(key: BackupCollectionKey) { return en.backupRestore.collectionLabels[key] }
function getRecordId<K extends BackupCollectionKey>(key: K, record: ImportableCollectionMap[K]) {
  if (key === "profiles") return (record as ProfileData).userId
  return "id" in record ? String(record.id) : ""
}
function emptyBackupPreview(errors: string[]): BackupPreview { return { rows: [], errors, warnings: [], totalIncoming: 0, totalWillImport: 0 } }
