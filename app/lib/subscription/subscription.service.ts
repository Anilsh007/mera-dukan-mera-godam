"use client"

import { db, type SubscriptionPlanId, type SubscriptionRecord, type UsageTrackedFeature } from "@/app/lib/db"
import { auth } from "@/app/lib/firebase"
import { en } from "@/app/messages/en"
import { getUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { syncSubscriptionFromServer } from "./billing.client"
import { PLAN_LIMITS, PREMIUM_PLANS, TRIAL_DAYS, type SubscriptionFeatureKey, type SubscriptionFeatureLimit } from "./plans"
import { requestSupabaseSync } from "@/app/lib/persistence/supabaseSyncTrigger"

export type FeatureAccessScope = "basic" | "premium"
export type FeatureAccessOperation = "view" | "create" | "update" | "export"

export type FeatureAccessOptions = {
  scope?: FeatureAccessScope
  operation?: FeatureAccessOperation
  incrementBy?: number
}

export type FeatureAccessResult = {
  allowed: boolean
  effectivePlan: SubscriptionPlanId
  limit: SubscriptionFeatureLimit
  usage: number
  message?: string
}

export class SubscriptionAccessError extends Error {
  feature: SubscriptionFeatureKey
  effectivePlan: SubscriptionPlanId
  limit: SubscriptionFeatureLimit
  usage: number

  constructor(message: string, details: Omit<FeatureAccessResult, "allowed" | "message"> & { feature: SubscriptionFeatureKey }) {
    super(message)
    this.name = "SubscriptionAccessError"
    this.feature = details.feature
    this.effectivePlan = details.effectivePlan
    this.limit = details.limit
    this.usage = details.usage
  }
}

function nowIso() {
  return new Date().toISOString()
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function periodKey(date = new Date()) {
  return date.toISOString().slice(0, 7)
}

function usageTrackingId(userId: string, feature: UsageTrackedFeature, key: string) {
  return `${userId}:${feature}:${key}`
}

function normalizeSupplierName(value: string) {
  return value.trim().toLowerCase()
}

function isPaidPlan(plan: SubscriptionPlanId) {
  return PREMIUM_PLANS.includes(plan)
}

const SUBSCRIPTION_SYNC_TTL_MS = 5 * 60 * 1000
const syncTimestamps = new Map<string, number>()
const syncInFlight = new Map<string, Promise<void>>()

function buildTrialRecord(userId: string): SubscriptionRecord {
  const createdAt = nowIso()
  return {
    id: userId,
    userId,
    plan: "trial",
    status: "trialing",
    trialStartedAt: createdAt,
    trialEndsAt: addDays(new Date(createdAt), TRIAL_DAYS).toISOString(),
    createdAt,
    updatedAt: createdAt,
  }
}

export async function ensureSubscriptionRecord(userId: string): Promise<SubscriptionRecord> {
  await syncSubscriptionWithServerIfNeeded(userId)

  const existing = await db.subscriptions.where("userId").equals(userId).first()
  if (!existing) {
    const created = buildTrialRecord(userId)
    await db.subscriptions.put(created)
    await requestSupabaseSync("subscription")
    return created
  }

  const normalized = normalizeSubscriptionRecord(existing)
  if (normalized.updatedAt !== existing.updatedAt || normalized.plan !== existing.plan || normalized.status !== existing.status) {
    await db.subscriptions.put(normalized)
    await requestSupabaseSync("subscription")
  }
  return normalized
}

export async function getSubscriptionRecord(userId: string) {
  return ensureSubscriptionRecord(userId)
}

export async function refreshSubscriptionFromServer(userId: string) {
  const currentAuthUserId = getUserIdentityFromAuthUser(auth?.currentUser)
  if (!currentAuthUserId || currentAuthUserId !== userId) return null

  const response = await syncSubscriptionFromServer(userId)
  syncTimestamps.set(userId, Date.now())
  return response
}

export function isTrialActive(subscription: SubscriptionRecord | null | undefined, nowMs = Date.now()) {
  if (!subscription) return false
  return subscription.status === "trialing" && new Date(subscription.trialEndsAt).getTime() > nowMs
}

export function getTrialDaysLeft(subscription: SubscriptionRecord | null | undefined, nowMs = Date.now()) {
  if (!subscription || !isTrialActive(subscription, nowMs)) return 0
  const diff = new Date(subscription.trialEndsAt).getTime() - nowMs
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function isSubscriptionActive(subscription: SubscriptionRecord | null | undefined, nowMs = Date.now()) {
  if (!subscription) return false
  if (subscription.status === "manual") return true
  if (subscription.status !== "active") return false
  if (!subscription.subscriptionEndsAt) return true
  return new Date(subscription.subscriptionEndsAt).getTime() > nowMs
}

export function isSubscriptionExpired(subscription: SubscriptionRecord | null | undefined, nowMs = Date.now()) {
  if (!subscription) return false
  return !isTrialActive(subscription, nowMs) && !isSubscriptionActive(subscription, nowMs)
}

export function getEffectivePlan(subscription: SubscriptionRecord | null | undefined): SubscriptionPlanId {
  if (!subscription) return "trial"
  if (isSubscriptionActive(subscription) && isPaidPlan(subscription.plan)) return subscription.plan
  if (isTrialActive(subscription)) return "trial"
  return "free/expired-readonly"
}

export function getFeatureLimit(plan: SubscriptionPlanId, feature: SubscriptionFeatureKey) {
  return PLAN_LIMITS[plan][feature]
}

async function getCurrentPartyCount(userId: string, type: "customer" | "supplier") {
  const parties = await db.parties.where("userId").equals(userId).toArray()
  const partyNames = new Set(
    parties
      .filter((party) => party.type === type || party.type === "both")
      .map((party) => normalizeSupplierName(party.name)),
  )

  if (type === "supplier") {
    const purchases = await db.purchases.where("userId").equals(userId).toArray()
    purchases.forEach((purchase) => {
      const name = normalizeSupplierName(purchase.supplierName)
      if (name) partyNames.add(name)
    })
  } else {
    const sales = await db.sales.where("userId").equals(userId).toArray()
    sales.forEach((sale) => {
      const name = normalizeSupplierName(sale.customer?.name || "")
      if (name) partyNames.add(name)
    })
  }

  return partyNames.size
}

export async function getUsageCount(userId: string, feature: SubscriptionFeatureKey) {
  if (feature === "products") {
    return db.products.where("userId").equals(userId).count()
  }
  if (feature === "suppliers") {
    return getCurrentPartyCount(userId, "supplier")
  }
  if (feature === "customers") {
    return getCurrentPartyCount(userId, "customer")
  }
  if (feature === "businesses") {
    const count = await db.profiles.where("userId").equals(userId).count()
    return count > 0 ? 1 : 0
  }
  if (feature === "godowns") {
    return db.inventoryLocations.where("userId").equals(userId).count()
  }
  if (feature === "staffUsers") {
    return 0
  }

  const trackedFeature = feature as UsageTrackedFeature
  const key = periodKey()
  const usage = await db.usageTracking
    .where("[userId+feature+periodKey]")
    .equals([userId, trackedFeature, key])
    .first()

  return usage?.count || 0
}

export async function incrementUsage(userId: string, feature: UsageTrackedFeature, incrementBy = 1) {
  const key = periodKey()
  const id = usageTrackingId(userId, feature, key)
  const current = await db.usageTracking.get(id)
  const timestamp = nowIso()

  await db.usageTracking.put({
    id,
    userId,
    feature,
    periodKey: key,
    count: (current?.count || 0) + incrementBy,
    createdAt: current?.createdAt || timestamp,
    updatedAt: timestamp,
  })
  await requestSupabaseSync("usage tracking")
}

function buildFeatureMessage(feature: SubscriptionFeatureKey, options: FeatureAccessOptions, effectivePlan: SubscriptionPlanId, limit: SubscriptionFeatureLimit) {
  const isReadonlyPlan = effectivePlan === "free/expired-readonly"
  if (options.scope === "premium" && isReadonlyPlan) {
    return en.subscription.premiumActionRequiresUpgrade
  }
  if (typeof limit === "number" && limit <= 0 && isReadonlyPlan) {
    return en.subscription.readOnlyExpiredMessage
  }

  const labels: Record<SubscriptionFeatureKey, string> = {
    products: en.subscription.features.products,
    sales: en.subscription.features.sales,
    quickSales: en.subscription.features.quickSales,
    purchases: en.subscription.features.purchases,
    gstInvoices: en.subscription.features.gstInvoices,
    estimates: en.subscription.features.estimates,
    returns: en.subscription.features.returns,
    accounting: en.subscription.features.accounting,
    customers: en.subscription.features.customers,
    suppliers: en.subscription.features.suppliers,
    exports: en.subscription.features.exports,
    businesses: en.subscription.features.businesses,
    staffUsers: en.subscription.features.staffUsers,
    godowns: en.subscription.features.godowns,
    barcodeScanner: en.subscription.features.barcodeScanner,
    reports: en.subscription.features.reports,
    printShareDownload: en.subscription.features.printShareDownload,
  }

  return en.subscription.featureLimitReached
    .replace("{feature}", labels[feature])
    .replace("{limit}", typeof limit === "number" ? String(limit) : en.common.notAvailable)
}

export async function canUseFeature(
  userId: string,
  feature: SubscriptionFeatureKey,
  options: FeatureAccessOptions = {},
): Promise<FeatureAccessResult> {
  const subscription = await ensureSubscriptionRecord(userId)
  const effectivePlan = getEffectivePlan(subscription)
  const limit = getFeatureLimit(effectivePlan, feature)
  const usage = await getUsageCount(userId, feature)

  if (options.operation === "view") {
    return { allowed: true, effectivePlan, limit, usage }
  }

  if (feature === "reports" || feature === "printShareDownload" || feature === "barcodeScanner") {
    const allowed = limit === true
    return {
      allowed,
      effectivePlan,
      limit,
      usage,
      message: allowed ? undefined : buildFeatureMessage(feature, options, effectivePlan, limit),
    }
  }

  if (options.scope === "premium" && effectivePlan === "free/expired-readonly") {
    return {
      allowed: false,
      effectivePlan,
      limit,
      usage,
      message: buildFeatureMessage(feature, options, effectivePlan, limit),
    }
  }

  if (limit === null) {
    return { allowed: true, effectivePlan, limit, usage }
  }

  if (typeof limit === "boolean") {
    return {
      allowed: limit,
      effectivePlan,
      limit,
      usage,
      message: limit ? undefined : buildFeatureMessage(feature, options, effectivePlan, limit),
    }
  }

  const nextUsage = usage + (options.incrementBy || 0)
  const allowed = nextUsage <= limit
  return {
    allowed,
    effectivePlan,
    limit,
    usage,
    message: allowed ? undefined : buildFeatureMessage(feature, options, effectivePlan, limit),
  }
}

export async function assertFeatureAccess(
  userId: string,
  feature: SubscriptionFeatureKey,
  options: FeatureAccessOptions = {},
) {
  const result = await canUseFeature(userId, feature, options)
  if (result.allowed) return result

  throw new SubscriptionAccessError(result.message || en.subscription.subscriptionRequired, {
    feature,
    effectivePlan: result.effectivePlan,
    limit: result.limit,
    usage: result.usage,
  })
}

export async function ensureSupplierCapacity(userId: string, supplierName: string) {
  const normalized = normalizeSupplierName(supplierName)
  if (!normalized) return

  const alreadyExists = await hasPartyTypeByName(userId, normalized, "supplier")

  if (alreadyExists) return
  await assertFeatureAccess(userId, "suppliers", { incrementBy: 1 })
}

export async function ensureCustomerCapacity(userId: string, customerName: string) {
  const normalized = normalizeSupplierName(customerName)
  if (!normalized) return

  const alreadyExists = await hasPartyTypeByName(userId, normalized, "customer")
  if (alreadyExists) return
  await assertFeatureAccess(userId, "customers", { incrementBy: 1 })
}

async function hasPartyTypeByName(userId: string, normalizedName: string, type: "customer" | "supplier") {
  const party = await db.parties
    .where("[userId+normalizedName]")
    .equals([userId, normalizedName])
    .first()
  if (party) {
    return party.type === type || party.type === "both"
  }

  if (type === "supplier") {
    const purchases = await db.purchases.where("userId").equals(userId).toArray()
    return purchases.some((purchase) => normalizeSupplierName(purchase.supplierName) === normalizedName)
  }

  const sales = await db.sales.where("userId").equals(userId).toArray()
  return sales.some((sale) => normalizeSupplierName(sale.customer?.name || "") === normalizedName)
}

function normalizeSubscriptionRecord(subscription: SubscriptionRecord): SubscriptionRecord {
  const normalized = { ...subscription }

  if (isSubscriptionActive(normalized) && !isPaidPlan(normalized.plan)) {
    normalized.plan = "starter"
  }

  if (!isTrialActive(normalized) && !isSubscriptionActive(normalized)) {
    normalized.status = "expired"
    normalized.plan = "free/expired-readonly"
    normalized.updatedAt = nowIso()
  }

  return normalized
}

async function syncSubscriptionWithServerIfNeeded(userId: string) {
  if (typeof window === "undefined") return
  if (!window.navigator.onLine) return

  const currentAuthUserId = getUserIdentityFromAuthUser(auth?.currentUser)
  if (!currentAuthUserId || currentAuthUserId !== userId) return

  const lastSyncedAt = syncTimestamps.get(userId) || 0
  if (Date.now() - lastSyncedAt < SUBSCRIPTION_SYNC_TTL_MS) return

  const existing = syncInFlight.get(userId)
  if (existing) {
    await existing
    return
  }

  const task = (async () => {
    try {
      await syncSubscriptionFromServer(userId)
      syncTimestamps.set(userId, Date.now())
    } catch (error) {
      console.warn("Subscription server sync failed", error)
    } finally {
      syncInFlight.delete(userId)
    }
  })()

  syncInFlight.set(userId, task)
  await task
}
