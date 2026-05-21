"use client"

import { v4 as uuidv4 } from "uuid"
import {
  db,
  type PartyLedgerRecord,
  type PartyLedgerEntryType,
  type PartyRecord,
  type PartyType,
  type PurchasePaymentStatus,
  type PurchaseRecord,
  type SalePaymentStatus,
  type SaleRecord,
} from "@/app/lib/db"
import { autoSyncToSupabase } from "@/app/lib/autoSupabaseSync.service"
import { assertFeatureAccess } from "@/app/lib/subscription/subscription.service"
import { en } from "@/app/messages/en"

export type PartyRoleFilter = "all" | PartyType
export type PartyPaymentDirection = "received" | "paid"

export type PartyInput = {
  userId: string
  businessId?: string
  name: string
  mobile?: string
  email?: string
  gstin?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  type: PartyType
  openingBalance?: number
  notes?: string
}

export type PartyPaymentInput = {
  userId: string
  partyId: string
  direction: PartyPaymentDirection
  amount: number
  paymentMode?: string
  note?: string
  reference?: string
  entryDate?: string
}

export type PartyLedgerViewEntry = {
  id: string
  type: "sale" | "purchase" | PartyLedgerEntryType
  label: string
  amount: number
  paidAmount?: number
  dueAmount?: number
  date: string
  paymentMode?: string
  paymentStatus?: string
  reference?: string
  note?: string
}

export type PartyDetailData = {
  party: PartyRecord
  sales: SaleRecord[]
  purchases: PurchaseRecord[]
  ledger: PartyLedgerViewEntry[]
  paymentReceivedTotal: number
  paymentPaidTotal: number
  balanceDue: number
}

function nowIso() {
  return new Date().toISOString()
}

export function normalizePartyName(value?: string) {
  return value?.trim().toLowerCase() || ""
}

export function includesPartyType(type: PartyType, target: "customer" | "supplier") {
  return type === target || type === "both"
}

function mergePartyType(current: PartyType, incoming: PartyType): PartyType {
  if (current === incoming) return current
  if (current === "both" || incoming === "both") return "both"
  return "both"
}

function sanitizeOptional(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

async function assertPartyCapacity(
  userId: string,
  existingType: PartyType | null,
  nextType: PartyType,
  skipLimits = false,
) {
  if (skipLimits) return
  const needsCustomer = includesPartyType(nextType, "customer") && !existingTypeHas(existingType, "customer")
  const needsSupplier = includesPartyType(nextType, "supplier") && !existingTypeHas(existingType, "supplier")

  if (needsCustomer) {
    await assertFeatureAccess(userId, "customers", { operation: "create", incrementBy: 1 })
  }
  if (needsSupplier) {
    await assertFeatureAccess(userId, "suppliers", { operation: "create", incrementBy: 1 })
  }
}

function existingTypeHas(type: PartyType | null, target: "customer" | "supplier") {
  return type ? includesPartyType(type, target) : false
}

function sanitizePartyInput(input: PartyInput) {
  const name = input.name.trim()
  if (!name) {
    throw new Error(en.parties.nameRequired)
  }

  return {
    ...input,
    name,
    normalizedName: normalizePartyName(name),
    mobile: sanitizeOptional(input.mobile),
    email: sanitizeOptional(input.email),
    gstin: sanitizeOptional(input.gstin)?.toUpperCase(),
    address: sanitizeOptional(input.address),
    city: sanitizeOptional(input.city),
    state: sanitizeOptional(input.state),
    pincode: sanitizeOptional(input.pincode),
    notes: sanitizeOptional(input.notes),
    openingBalance: Number(input.openingBalance || 0),
  }
}

async function putParty(
  input: PartyInput,
  options: { skipLimits?: boolean } = {},
) {
  const clean = sanitizePartyInput(input)
  const now = nowIso()
  const existing = await db.parties
    .where("[userId+normalizedName]")
    .equals([input.userId, clean.normalizedName])
    .first()

  await assertPartyCapacity(input.userId, existing?.type || null, clean.type, options.skipLimits)

  if (existing) {
    const updated: PartyRecord = {
      ...existing,
      businessId: clean.businessId || existing.businessId,
      name: clean.name,
      normalizedName: clean.normalizedName,
      mobile: clean.mobile || existing.mobile,
      email: clean.email || existing.email,
      gstin: clean.gstin || existing.gstin,
      address: clean.address || existing.address,
      city: clean.city || existing.city,
      state: clean.state || existing.state,
      pincode: clean.pincode || existing.pincode,
      type: mergePartyType(existing.type, clean.type),
      openingBalance: existing.openingBalance || clean.openingBalance || 0,
      notes: clean.notes || existing.notes,
      updatedAt: now,
    }
    await db.parties.put(updated)
    await syncPartyBalances(input.userId, updated.id)
    return updated
  }

  const created: PartyRecord = {
    id: uuidv4(),
    userId: input.userId,
    businessId: clean.businessId,
    name: clean.name,
    normalizedName: clean.normalizedName,
    mobile: clean.mobile,
    email: clean.email,
    gstin: clean.gstin,
    address: clean.address,
    city: clean.city,
    state: clean.state,
    pincode: clean.pincode,
    type: clean.type,
    openingBalance: clean.openingBalance,
    receivable: 0,
    payable: 0,
    notes: clean.notes,
    createdAt: now,
    updatedAt: now,
  }
  await db.parties.add(created)
  await syncPartyBalances(input.userId, created.id)
  return created
}

export async function ensurePartyRecord(
  input: PartyInput,
  options: { skipLimits?: boolean } = {},
) {
  const party = await putParty(input, options)
  await autoSyncToSupabase()
  return party
}

export async function ensurePartiesBackfilled(userId: string) {
  const purchases = await db.purchases.where("userId").equals(userId).toArray()
  const sales = await db.sales.where("userId").equals(userId).toArray()

  for (const purchase of purchases) {
    const supplierName = purchase.supplierName?.trim()
    if (!supplierName) continue
    const party = await putParty(
      {
        userId,
        name: supplierName,
        type: "supplier",
      },
      { skipLimits: true },
    )
    if (purchase.partyId !== party.id) {
      await db.purchases.update(purchase.id, { partyId: party.id })
    }
  }

  for (const sale of sales) {
    const customerName = sale.customer?.name?.trim()
    if (!customerName) continue
    const party = await putParty(
      {
        userId,
        name: customerName,
        mobile: sale.customer?.phone,
        email: sale.customer?.email,
        gstin: sale.customer?.gstin,
        address: sale.customer?.address,
        city: sale.customer?.city,
        state: sale.customer?.state,
        pincode: sale.customer?.pincode,
        type: "customer",
      },
      { skipLimits: true },
    )
    if (sale.partyId !== party.id) {
      await db.sales.update(sale.id, { partyId: party.id })
    }
  }
}

export async function loadParties(userId: string, filter: PartyRoleFilter = "all") {
  await ensurePartiesBackfilled(userId)
  const parties = await db.parties.where("userId").equals(userId).toArray()
  return parties
    .filter((party) => {
      if (filter === "all") return true
      if (filter === "both") return party.type === "both"
      return includesPartyType(party.type, filter)
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export async function getPartyById(userId: string, partyId: string) {
  await ensurePartiesBackfilled(userId)
  const party = await db.parties.get(partyId)
  if (!party || party.userId !== userId) return null
  return party
}

async function getPartyPurchases(userId: string, party: PartyRecord) {
  const purchases = await db.purchases.where("userId").equals(userId).toArray()
  return purchases
    .filter(
      (purchase) =>
        purchase.partyId === party.id ||
        normalizePartyName(purchase.supplierName) === party.normalizedName,
    )
    .sort((left, right) =>
      (right.purchaseDateTime || right.purchaseDate).localeCompare(left.purchaseDateTime || left.purchaseDate),
    )
}

async function getPartySales(userId: string, party: PartyRecord) {
  const sales = await db.sales.where("userId").equals(userId).toArray()
  return sales
    .filter(
      (sale) =>
        sale.partyId === party.id ||
        normalizePartyName(sale.customer?.name) === party.normalizedName,
    )
    .sort((left, right) => right.saleDateTime.localeCompare(left.saleDateTime))
}

export async function syncPartyBalances(userId: string, partyId: string) {
  const party = await db.parties.get(partyId)
  if (!party || party.userId !== userId) return null

  const [purchases, sales] = await Promise.all([
    getPartyPurchases(userId, party),
    getPartySales(userId, party),
  ])

  const openingReceivable = party.openingBalance > 0 ? party.openingBalance : 0
  const openingPayable = party.openingBalance < 0 ? Math.abs(party.openingBalance) : 0
  const receivable = openingReceivable + sales
    .filter((sale) => sale.status !== "cancelled")
    .reduce((sum, sale) => sum + Number(sale.dueAmount || 0), 0)
  const payable = openingPayable + purchases.reduce((sum, purchase) => sum + Number(purchase.dueAmount || 0), 0)

  const updatedAt = nowIso()
  await db.parties.update(party.id, { receivable, payable, updatedAt })
  return { receivable, payable }
}

export async function getPartyDetail(userId: string, partyId: string): Promise<PartyDetailData | null> {
  await ensurePartiesBackfilled(userId)
  const party = await getPartyById(userId, partyId)
  if (!party) return null

  const [sales, purchases, ledgerEntries] = await Promise.all([
    getPartySales(userId, party),
    getPartyPurchases(userId, party),
    db.partyLedger.where("[userId+partyId]").equals([userId, partyId]).toArray(),
  ])

  const ledger: PartyLedgerViewEntry[] = [
    ...sales
      .filter((sale) => sale.status !== "cancelled")
      .map((sale) => ({
        id: `sale:${sale.id}`,
        type: "sale" as const,
        label: `${en.sales.receiptNo}: ${sale.receiptNo}`,
        amount: sale.totalAmount,
        paidAmount: sale.amountPaid,
        dueAmount: sale.dueAmount,
        date: sale.saleDateTime,
        paymentMode: sale.paymentMode,
        paymentStatus: sale.paymentStatus,
        reference: sale.reference || sale.receiptNo,
        note: sale.note,
      })),
    ...purchases.map((purchase) => ({
      id: `purchase:${purchase.id}`,
      type: "purchase" as const,
      label: `${en.purchases.purchaseBill}: ${purchase.billNo}`,
      amount: purchase.totalAmount,
      paidAmount: purchase.amountPaid,
      dueAmount: purchase.dueAmount,
      date: purchase.purchaseDateTime || purchase.purchaseDate,
      paymentMode: purchase.paymentMode,
      paymentStatus: purchase.paymentStatus,
      reference: purchase.billNo,
      note: purchase.note,
    })),
    ...ledgerEntries.map((entry) => ({
      id: entry.id,
      type: entry.type,
      label:
        entry.type === "payment-received"
          ? en.parties.paymentReceived
          : entry.type === "payment-paid"
            ? en.parties.paymentPaid
            : en.parties.openingBalance,
      amount: entry.amount,
      date: entry.entryDate,
      paymentMode: entry.paymentMode,
      reference: entry.reference,
      note: entry.note,
    })),
  ].sort((left, right) => right.date.localeCompare(left.date))

  const paymentReceivedTotal = ledgerEntries
    .filter((entry) => entry.type === "payment-received")
    .reduce((sum, entry) => sum + entry.amount, 0)
  const paymentPaidTotal = ledgerEntries
    .filter((entry) => entry.type === "payment-paid")
    .reduce((sum, entry) => sum + entry.amount, 0)
  const balanceDue = party.receivable - party.payable

  return {
    party,
    sales,
    purchases,
    ledger,
    paymentReceivedTotal,
    paymentPaidTotal,
    balanceDue,
  }
}

export async function recordPartyPayment(input: PartyPaymentInput) {
  const party = await db.parties.get(input.partyId)
  if (!party || party.userId !== input.userId) {
    throw new Error(en.parties.partyNotFound)
  }

  const amount = Number(input.amount || 0)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(en.parties.invalidPaymentAmount)
  }

  const now = nowIso()
  const paymentDate = input.entryDate || now
  const targetSales = input.direction === "received" ? await getPartySales(input.userId, party) : []
  const targetPurchases = input.direction === "paid" ? await getPartyPurchases(input.userId, party) : []

  if (input.direction === "received") {
    const dueSales = targetSales
      .filter((sale) => sale.status !== "cancelled" && sale.dueAmount > 0)
      .sort((left, right) => left.saleDateTime.localeCompare(right.saleDateTime))
    const totalDue = dueSales.reduce((sum, sale) => sum + sale.dueAmount, 0)
    if (totalDue <= 0) {
      throw new Error(en.parties.noReceivableDue)
    }

    let remaining = Math.min(amount, totalDue)
    await db.transaction("rw", db.sales, db.partyLedger, db.parties, async () => {
      for (const sale of dueSales) {
        if (remaining <= 0) break
        const applied = Math.min(remaining, sale.dueAmount)
        const nextPaid = sale.amountPaid + applied
        const nextDue = Math.max(sale.totalAmount - nextPaid, 0)
        const nextStatus: SalePaymentStatus = nextDue === 0 ? "paid" : "partial"
        await db.sales.update(sale.id, {
          partyId: party.id,
          amountPaid: nextPaid,
          dueAmount: nextDue,
          paymentStatus: nextStatus,
          paymentMode: (input.paymentMode?.trim() as SaleRecord["paymentMode"] | undefined) || sale.paymentMode,
          updatedAt: now,
        })
        remaining -= applied
      }

      await db.partyLedger.add(createLedgerRecord({
        userId: input.userId,
        party,
        type: "payment-received",
        amount: Math.min(amount, totalDue),
        paymentMode: input.paymentMode,
        note: input.note,
        reference: input.reference,
        entryDate: paymentDate,
        now,
      }))
    })
  } else {
    const duePurchases = targetPurchases
      .filter((purchase) => purchase.dueAmount > 0)
      .sort((left, right) =>
        (left.purchaseDateTime || left.purchaseDate).localeCompare(right.purchaseDateTime || right.purchaseDate),
      )
    const totalDue = duePurchases.reduce((sum, purchase) => sum + purchase.dueAmount, 0)
    if (totalDue <= 0) {
      throw new Error(en.parties.noPayableDue)
    }

    let remaining = Math.min(amount, totalDue)
    await db.transaction("rw", db.purchases, db.partyLedger, db.parties, async () => {
      for (const purchase of duePurchases) {
        if (remaining <= 0) break
        const applied = Math.min(remaining, purchase.dueAmount)
        const nextPaid = purchase.amountPaid + applied
        const nextDue = Math.max(purchase.totalAmount - nextPaid, 0)
        const nextStatus: PurchasePaymentStatus = nextDue === 0 ? "paid" : "partial"
        await db.purchases.update(purchase.id, {
          partyId: party.id,
          amountPaid: nextPaid,
          dueAmount: nextDue,
          paymentStatus: nextStatus,
          paymentMode: input.paymentMode?.trim() || purchase.paymentMode,
          updatedAt: now,
        })
        remaining -= applied
      }

      await db.partyLedger.add(createLedgerRecord({
        userId: input.userId,
        party,
        type: "payment-paid",
        amount: Math.min(amount, totalDue),
        paymentMode: input.paymentMode,
        note: input.note,
        reference: input.reference,
        entryDate: paymentDate,
        now,
      }))
    })
  }

  await syncPartyBalances(input.userId, party.id)
  await autoSyncToSupabase()
}

function createLedgerRecord({
  userId,
  party,
  type,
  amount,
  paymentMode,
  note,
  reference,
  entryDate,
  now,
}: {
  userId: string
  party: PartyRecord
  type: PartyLedgerEntryType
  amount: number
  paymentMode?: string
  note?: string
  reference?: string
  entryDate: string
  now: string
}): PartyLedgerRecord {
  return {
    id: uuidv4(),
    userId,
    businessId: party.businessId,
    partyId: party.id,
    type,
    amount,
    paymentMode: sanitizeOptional(paymentMode),
    note: sanitizeOptional(note),
    reference: sanitizeOptional(reference),
    entryDate,
    createdAt: now,
    updatedAt: now,
  }
}

export function buildPartyDueReminder(detail: PartyDetailData) {
  const dueLabel =
    detail.balanceDue > 0
      ? `${en.parties.receivable}: ${en.common.rupeeSymbol} ${detail.party.receivable.toLocaleString("en-IN")}`
      : `${en.parties.payable}: ${en.common.rupeeSymbol} ${detail.party.payable.toLocaleString("en-IN")}`

  return [
    `${en.parties.whatsAppReminderGreeting} ${detail.party.name},`,
    en.parties.whatsAppReminderBody,
    dueLabel,
    `${en.parties.statementDate}: ${new Date().toLocaleDateString("en-IN")}`,
  ].join("\n")
}
