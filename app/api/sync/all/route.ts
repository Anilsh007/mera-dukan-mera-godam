import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient, getUserIdentityFromRequest, toApiErrorResponse } from "@/app/api/_lib/auth"
import {
  assertContentLength,
  enforceRateLimit,
  readJsonBody,
  sanitizeOptionalText,
  sanitizeRequiredText,
  SecurityError,
} from "@/app/api/_lib/security"

export const runtime = "nodejs"

type SyncEntityName =
  | "profiles"
  | "invoices"
  | "sales"
  | "estimates"
  | "returnDocuments"
  | "expenses"
  | "cashbookEntries"
  | "inventoryLocations"
  | "productLocationStocks"
  | "inventoryBatches"
  | "stockTransfers"
  | "parties"
  | "partyLedger"
  | "subscriptions"
  | "usageTracking"

type SyncPayload = Partial<Record<SyncEntityName, Array<Record<string, unknown>>>> & {
  deleted?: Partial<Record<SyncEntityName, string[]>>
}

type EntityConfig = {
  dbTable: string
  orderBy?: string
  onConflict?: string
  deleteMatchColumn?: string
  serialize: (record: Record<string, unknown>, userId: string) => Record<string, unknown>
  deserialize?: (row: Record<string, unknown>) => Record<string, unknown> | null
}

const ENTITY_CONFIG: Record<SyncEntityName, EntityConfig> = {
  profiles: {
    dbTable: "profiles",
    onConflict: "user_id",
    deleteMatchColumn: "user_id",
    serialize: (record, userId) => {
      const personal = record.personal && typeof record.personal === "object" ? record.personal as Record<string, unknown> : {}
      const business = record.business && typeof record.business === "object" ? record.business as Record<string, unknown> : {}
      const address = record.address && typeof record.address === "object" ? record.address as Record<string, unknown> : {}
      const banking = record.banking && typeof record.banking === "object" ? record.banking as Record<string, unknown> : {}
      const settings = record.settings && typeof record.settings === "object" ? record.settings as Record<string, unknown> : {}

      return {
        user_id: userId,
        display_name: sanitizeOptionalText(personal.displayName, 160),
        email: sanitizeOptionalText(personal.email, 160),
        phone: sanitizeOptionalText(personal.phone, 80),
        alternate_email: sanitizeOptionalText(personal.alternateEmail, 160),
        photo_url: sanitizeOptionalText(personal.photoURL || personal.photoUrl, 500),
        shop_name: sanitizeOptionalText(business.shopName, 160),
        gst_number: sanitizeOptionalText(business.gstNumber, 40),
        business_type: sanitizeOptionalText(business.businessType, 80),
        upi_id: sanitizeOptionalText(business.upiId, 120),
        invoice_prefix: sanitizeOptionalText(business.invoicePrefix, 40),
        address: sanitizeOptionalText(address.address, 300),
        district: sanitizeOptionalText(address.district, 120),
        state: sanitizeOptionalText(address.state, 120),
        pincode: sanitizeOptionalText(address.pincode, 20),
        account_holder_name: sanitizeOptionalText(banking.accountHolderName, 160),
        account_number: sanitizeOptionalText(banking.accountNumber, 80),
        ifsc_code: sanitizeOptionalText(banking.ifscCode, 40),
        bank_name: sanitizeOptionalText(banking.bankName, 160),
        terms_and_conditions: sanitizeOptionalText(settings.termsAndConditions, 3000),
        updated_at: sanitizeOptionalText(record.updatedAt, 80),
        payload: { ...record, userId },
      }
    },
  },
  invoices: {
    dbTable: "gst_invoices",
    orderBy: "invoice_date",
    serialize: (record, userId) => ({
      id: sanitizeRequiredText(record.id, 120, "Invoice id"),
      user_id: userId,
      sale_id: sanitizeOptionalText(record.saleId, 120),
      party_id: sanitizeOptionalText(record.partyId, 120),
      invoice_no: sanitizeRequiredText(record.invoiceNo, 120, "Invoice number"),
      invoice_date: sanitizeOptionalText(record.invoiceDate, 80),
      due_date: sanitizeOptionalText(record.dueDate, 80),
      buyer_name: sanitizeOptionalText(record.buyerName, 160),
      buyer_gstin: sanitizeOptionalText(record.buyerGstin, 40),
      status: sanitizeOptionalText(record.status, 80),
      updated_at: sanitizeOptionalText(record.updatedAt, 80),
      payload: { ...record, userId },
    }),
  },
  sales: {
    dbTable: "sales",
    orderBy: "sale_date",
    serialize: (record, userId) => ({
      id: sanitizeRequiredText(record.id, 120, "Sale id"),
      user_id: userId,
      receipt_no: sanitizeRequiredText(record.receiptNo, 120, "Sale receipt number"),
      sale_date: sanitizeOptionalText(record.saleDate, 80),
      sale_date_time: sanitizeOptionalText(record.saleDateTime, 80),
      party_id: sanitizeOptionalText(record.partyId, 120),
      payment_status: sanitizeOptionalText(record.paymentStatus, 80),
      payment_mode: sanitizeOptionalText(record.paymentMode, 80),
      status: sanitizeOptionalText(record.status, 80),
      updated_at: sanitizeOptionalText(record.updatedAt, 80),
      payload: { ...record, userId },
    }),
  },
  estimates: {
    dbTable: "estimates",
    orderBy: "estimate_date",
    serialize: (record, userId) => ({
      id: sanitizeRequiredText(record.id, 120, "Estimate id"),
      user_id: userId,
      estimate_no: sanitizeRequiredText(record.estimateNo, 120, "Estimate number"),
      estimate_date: sanitizeOptionalText(record.estimateDate, 80),
      estimate_date_time: sanitizeOptionalText(record.estimateDateTime, 80),
      party_id: sanitizeOptionalText(record.partyId, 120),
      status: sanitizeOptionalText(record.status, 80),
      updated_at: sanitizeOptionalText(record.updatedAt, 80),
      payload: { ...record, userId },
    }),
  },
  returnDocuments: {
    dbTable: "return_documents",
    orderBy: "document_date",
    serialize: (record, userId) => ({
      id: sanitizeRequiredText(record.id, 120, "Return document id"),
      user_id: userId,
      document_no: sanitizeRequiredText(record.documentNo, 120, "Return document number"),
      kind: sanitizeRequiredText(record.kind, 80, "Return document kind"),
      status: sanitizeOptionalText(record.status, 80),
      document_date: sanitizeOptionalText(record.documentDate, 80),
      party_id: sanitizeOptionalText(record.partyId, 120),
      updated_at: sanitizeOptionalText(record.updatedAt, 80),
      payload: { ...record, userId },
    }),
  },
  expenses: {
    dbTable: "expenses",
    orderBy: "expense_date",
    serialize: (record, userId) => ({
      id: sanitizeRequiredText(record.id, 120, "Expense id"),
      user_id: userId,
      expense_no: sanitizeRequiredText(record.expenseNo, 120, "Expense number"),
      category: sanitizeOptionalText(record.category, 80),
      expense_date: sanitizeOptionalText(record.expenseDate, 80),
      payment_mode: sanitizeOptionalText(record.paymentMode, 80),
      updated_at: sanitizeOptionalText(record.updatedAt, 80),
      payload: { ...record, userId },
    }),
  },
  cashbookEntries: {
    dbTable: "cashbook_entries",
    orderBy: "entry_date",
    serialize: (record, userId) => ({
      id: sanitizeRequiredText(record.id, 120, "Cashbook entry id"),
      user_id: userId,
      entry_no: sanitizeRequiredText(record.entryNo, 120, "Cashbook number"),
      entry_date: sanitizeOptionalText(record.entryDate, 80),
      type: sanitizeOptionalText(record.type, 80),
      account: sanitizeOptionalText(record.account, 80),
      source_type: sanitizeOptionalText(record.source, 80),
      source_id: sanitizeOptionalText(record.linkedRecordId, 120),
      updated_at: sanitizeOptionalText(record.updatedAt, 80),
      payload: { ...record, userId },
    }),
  },
  inventoryLocations: {
    dbTable: "inventory_locations",
    serialize: (record, userId) => ({
      id: sanitizeRequiredText(record.id, 120, "Location id"),
      user_id: userId,
      name: sanitizeRequiredText(record.name, 160, "Location name"),
      is_default: Boolean(record.isDefault),
      note: sanitizeOptionalText(record.notes, 1000),
      updated_at: sanitizeOptionalText(record.updatedAt, 80),
      payload: { ...record, userId },
    }),
  },
  productLocationStocks: {
    dbTable: "product_location_stocks",
    serialize: (record, userId) => ({
      id: sanitizeRequiredText(record.id, 160, "Location stock id"),
      user_id: userId,
      product_id: sanitizeRequiredText(record.productId, 120, "Location stock product id"),
      location_id: sanitizeRequiredText(record.locationId, 120, "Location stock location id"),
      location_name: sanitizeOptionalText(record.locationName, 160),
      updated_at: sanitizeOptionalText(record.updatedAt, 80),
      payload: { ...record, userId },
    }),
  },
  inventoryBatches: {
    dbTable: "inventory_batches",
    serialize: (record, userId) => ({
      id: sanitizeRequiredText(record.id, 160, "Inventory batch id"),
      user_id: userId,
      product_id: sanitizeRequiredText(record.productId, 120, "Inventory batch product id"),
      location_id: sanitizeRequiredText(record.locationId, 120, "Inventory batch location id"),
      location_name: sanitizeOptionalText(record.locationName, 160),
      batch_no: sanitizeOptionalText(record.batchNo, 120),
      expiry: sanitizeOptionalText(record.expiry, 80),
      updated_at: sanitizeOptionalText(record.updatedAt, 80),
      payload: { ...record, userId },
    }),
  },
  stockTransfers: {
    dbTable: "stock_transfers",
    orderBy: "created_at",
    serialize: (record, userId) => ({
      id: sanitizeRequiredText(record.id, 160, "Stock transfer id"),
      user_id: userId,
      transfer_no: sanitizeRequiredText(record.transferNo, 120, "Transfer number"),
      product_id: sanitizeRequiredText(record.productId, 120, "Transfer product id"),
      from_location_id: sanitizeRequiredText(record.fromLocationId, 120, "From location id"),
      to_location_id: sanitizeRequiredText(record.toLocationId, 120, "To location id"),
      updated_at: sanitizeOptionalText(record.updatedAt || record.createdAt, 80),
      payload: { ...record, userId },
    }),
  },
  parties: {
    dbTable: "parties",
    orderBy: "updated_at",
    serialize: (record, userId) => ({
      id: sanitizeRequiredText(record.id, 120, "Party id"),
      user_id: userId,
      business_id: sanitizeOptionalText(record.businessId, 120),
      type: sanitizeOptionalText(record.type, 40),
      name: sanitizeRequiredText(record.name, 160, "Party name"),
      normalized_name: sanitizeRequiredText(record.normalizedName, 160, "Party normalized name"),
      mobile: sanitizeOptionalText(record.mobile, 40),
      email: sanitizeOptionalText(record.email, 160),
      gstin: sanitizeOptionalText(record.gstin, 40),
      updated_at: sanitizeOptionalText(record.updatedAt, 80),
      payload: { ...record, userId },
    }),
  },
  partyLedger: {
    dbTable: "party_ledger",
    orderBy: "entry_date",
    serialize: (record, userId) => ({
      id: sanitizeRequiredText(record.id, 120, "Party ledger id"),
      user_id: userId,
      business_id: sanitizeOptionalText(record.businessId, 120),
      party_id: sanitizeRequiredText(record.partyId, 120, "Party ledger party id"),
      type: sanitizeRequiredText(record.type, 80, "Party ledger type"),
      reference: sanitizeOptionalText(record.reference, 120),
      entry_date: sanitizeOptionalText(record.entryDate, 80),
      updated_at: sanitizeOptionalText(record.updatedAt, 80),
      payload: { ...record, userId },
    }),
  },
  subscriptions: {
    dbTable: "subscriptions",
    serialize: (record, userId) => ({
      id: sanitizeRequiredText(record.id || userId, 120, "Subscription id"),
      user_id: userId,
      plan: sanitizeOptionalText(record.plan, 80),
      status: sanitizeOptionalText(record.status, 80),
      trial_ends_at: sanitizeOptionalText(record.trialEndsAt, 80),
      subscription_ends_at: sanitizeOptionalText(record.subscriptionEndsAt, 80),
      updated_at: sanitizeOptionalText(record.updatedAt, 80),
      payload: { ...record, userId },
    }),
  },
  usageTracking: {
    dbTable: "usage_tracking",
    serialize: (record, userId) => ({
      id: sanitizeRequiredText(record.id, 160, "Usage tracking id"),
      user_id: userId,
      feature: sanitizeRequiredText(record.feature, 80, "Usage tracking feature"),
      period_key: sanitizeRequiredText(record.periodKey, 80, "Usage tracking period key"),
      used_count: Number(record.count || 0),
      updated_at: sanitizeOptionalText(record.updatedAt, 80),
      payload: { ...record, userId },
    }),
  },
}

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: "all-sync:get", limit: 60, windowMs: 60_000 })
    const userId = await getUserIdentityFromRequest(request)
    const supabase = createSupabaseAdminClient()
    const result: Partial<Record<SyncEntityName, Array<Record<string, unknown>>>> = {}

    for (const [entityName, config] of Object.entries(ENTITY_CONFIG) as Array<[SyncEntityName, EntityConfig]>) {
      let query = supabase.from(config.dbTable).select("*").eq("user_id", userId)
      if (config.orderBy) {
        query = query.order(config.orderBy, { ascending: false })
      }

      const { data, error } = await query
      if (error) {
        return NextResponse.json(
          { code: error.code, message: error.message, details: error.details, hint: error.hint, table: config.dbTable },
          { status: 500 },
        )
      }

      result[entityName] = ((data || []) as Record<string, unknown>[])
        .map((row) => {
          const payload = row.payload
          if (payload && typeof payload === "object") {
            return payload as Record<string, unknown>
          }
          return config.deserialize?.(row) || null
        })
        .filter(Boolean) as Array<Record<string, unknown>>
    }

    return NextResponse.json(result)
  } catch (error) {
    return toApiErrorResponse(error, "Unexpected sync API error")
  }
}

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: "all-sync:post", limit: 30, windowMs: 60_000 })
    assertContentLength(request, 5 * 1024 * 1024)
    const userId = await getUserIdentityFromRequest(request)
    const payload = validatePayload(await readJsonBody<SyncPayload>(request))
    const supabase = createSupabaseAdminClient()

    for (const [entityName, records] of Object.entries(payload) as Array<[string, Array<Record<string, unknown>>]>) {
      if (entityName === "deleted") continue
      const typedEntityName = entityName as SyncEntityName
      if (!records.length) continue
      const config = ENTITY_CONFIG[typedEntityName]
      const rows = records.map((record) => config.serialize(record, userId))
      const { error } = await supabase.from(config.dbTable).upsert(rows, { onConflict: config.onConflict || "id" })
      if (error) {
        return NextResponse.json(
          { code: error.code, message: error.message, details: error.details, hint: error.hint, table: config.dbTable },
          { status: 500 },
        )
      }
    }

    const deleted = payload.deleted || {}
    for (const [entityName, recordIds] of Object.entries(deleted) as Array<[SyncEntityName, string[]]>) {
      if (!recordIds.length) continue
      const config = ENTITY_CONFIG[entityName]
      const { error } = await supabase.from(config.dbTable).delete().in(config.deleteMatchColumn || "id", recordIds).eq("user_id", userId)
      if (error) {
        return NextResponse.json(
          { code: error.code, message: error.message, details: error.details, hint: error.hint, table: config.dbTable },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return toApiErrorResponse(error, "Unexpected sync API error")
  }
}

function validatePayload(payload: SyncPayload) {
  if (!payload || typeof payload !== "object") {
    throw new SecurityError("Invalid sync payload", 400)
  }

  const normalized: SyncPayload = {}
  for (const entityName of Object.keys(ENTITY_CONFIG) as SyncEntityName[]) {
    const records = payload[entityName]
    if (!records) continue
    if (!Array.isArray(records)) {
      throw new SecurityError(`Invalid ${entityName} sync payload`, 400)
    }
    if (records.length > 10000) {
      throw new SecurityError(`${entityName} sync payload exceeds allowed size`, 400)
    }
    normalized[entityName] = records.map((record) => {
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        throw new SecurityError(`Invalid ${entityName} record`, 400)
      }
      return record
    })
  }

  if (payload.deleted) {
    normalized.deleted = {}
    for (const entityName of Object.keys(ENTITY_CONFIG) as SyncEntityName[]) {
      const ids = payload.deleted[entityName]
      if (!ids) continue
      if (!Array.isArray(ids)) {
        throw new SecurityError(`Invalid ${entityName} delete payload`, 400)
      }
      if (ids.length > 10000) {
        throw new SecurityError(`${entityName} delete payload exceeds allowed size`, 400)
      }
      normalized.deleted[entityName] = ids.map((id) => sanitizeRequiredText(id, 160, `${entityName} delete id`))
    }
  }

  return normalized
}
