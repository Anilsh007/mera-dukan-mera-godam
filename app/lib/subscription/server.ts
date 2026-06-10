import { createHmac, timingSafeEqual } from "crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { SubscriptionRecord } from "@/app/lib/db"
import { BILLING_PLAN_CATALOG, type BillingPlanCatalog } from "./catalog"
import type { SubscriptionInvoice } from "./contracts"
import type { PaidSubscriptionPlanId, SubscriptionBillingCycle } from "./catalog"
import { TRIAL_DAYS } from "./plans"

export const BILLING_SUBSCRIPTIONS_TABLE = "billing_subscriptions"
export const BILLING_TRANSACTIONS_TABLE = "billing_transactions"

function nowIso() {
  return new Date().toISOString()
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

export function hasRazorpayServerConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() &&
      process.env.RAZORPAY_KEY_SECRET?.trim() &&
      process.env.RAZORPAY_WEBHOOK_SECRET?.trim(),
  )
}

export function isMissingSupabaseTableError(error: unknown, tableName: string) {
  if (!error || typeof error !== "object") return false

  const details = error as { code?: string; message?: string }
  const message = details.message || ""
  return details.code === "42P01" || (new RegExp(tableName, "i").test(message) && /does not exist|schema cache/i.test(message))
}

export function buildServerTrialSubscription(userId: string): SubscriptionRecord {
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

export function mapSubscriptionRow(row: Record<string, unknown>): SubscriptionRecord {
  return {
    id: String(row.id ?? row.user_id ?? ""),
    userId: String(row.user_id ?? ""),
    plan: (String(row.plan ?? "trial") as SubscriptionRecord["plan"]) || "trial",
    status: (String(row.status ?? "trialing") as SubscriptionRecord["status"]) || "trialing",
    trialStartedAt: String(row.trial_started_at ?? ""),
    trialEndsAt: String(row.trial_ends_at ?? ""),
    subscriptionStartedAt: row.subscription_started_at ? String(row.subscription_started_at) : undefined,
    subscriptionEndsAt: row.subscription_ends_at ? String(row.subscription_ends_at) : undefined,
    provider: row.provider ? String(row.provider) : undefined,
    providerCustomerId: row.provider_customer_id ? String(row.provider_customer_id) : undefined,
    providerSubscriptionId: row.provider_subscription_id ? String(row.provider_subscription_id) : undefined,
    note: row.note ? String(row.note) : undefined,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    billingCycle: row.billing_cycle ? (String(row.billing_cycle) as SubscriptionRecord["billingCycle"]) : undefined,
    providerPaymentId: row.provider_payment_id ? String(row.provider_payment_id) : undefined,
  }
}

export function mapSubscriptionRecordToRow(record: SubscriptionRecord & { billingCycle?: string; providerPaymentId?: string }) {
  return {
    id: record.id,
    user_id: record.userId,
    plan: record.plan,
    status: record.status,
    trial_started_at: record.trialStartedAt,
    trial_ends_at: record.trialEndsAt,
    subscription_started_at: record.subscriptionStartedAt || null,
    subscription_ends_at: record.subscriptionEndsAt || null,
    provider: record.provider || "razorpay",
    provider_customer_id: record.providerCustomerId || null,
    provider_subscription_id: record.providerSubscriptionId || null,
    provider_payment_id: record.providerPaymentId || null,
    billing_cycle: record.billingCycle || null,
    note: record.note || null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  }
}

export function getRazorpayKeySecret() {
  return process.env.RAZORPAY_KEY_SECRET?.trim() || ""
}

export function getRazorpayWebhookSecret() {
  return process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || ""
}

export function verifyRazorpayPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const secret = getRazorpayKeySecret()
  if (!secret) return false

  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex")
  return safeCompare(expected, signature)
}

export function verifyRazorpaySubscriptionSignature(subscriptionId: string, paymentId: string, signature: string) {
  const secret = getRazorpayKeySecret()
  if (!secret) return false

  const expected = createHmac("sha256", secret).update(`${paymentId}|${subscriptionId}`).digest("hex")
  return safeCompare(expected, signature)
}

export function verifyRazorpayWebhookSignature(payload: string, signature: string) {
  const secret = getRazorpayWebhookSecret()
  if (!secret) return false

  const expected = createHmac("sha256", secret).update(payload).digest("hex")
  return safeCompare(expected, signature)
}

function safeCompare(expected: string, actual: string) {
  const left = Buffer.from(expected)
  const right = Buffer.from(actual)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function getSubscriptionEndDate(startIso: string, billingCycle: SubscriptionBillingCycle) {
  const start = new Date(startIso)
  if (billingCycle === "monthly") return addMonths(start, 1).toISOString()
  if (billingCycle === "quarterly") return addMonths(start, 3).toISOString()
  return addMonths(start, 12).toISOString()
}

export function getRazorpayPlanId(plan: PaidSubscriptionPlanId, billingCycle: SubscriptionBillingCycle) {
  const key = `RAZORPAY_PLAN_ID_${plan.toUpperCase()}_${billingCycle.toUpperCase()}`
  return process.env[key]?.trim() || ""
}

export function isRazorpayPlanConfigured(plan: PaidSubscriptionPlanId, billingCycle: SubscriptionBillingCycle) {
  return Boolean(getRazorpayPlanId(plan, billingCycle))
}

export function getTotalCountForBillingCycle(billingCycle: SubscriptionBillingCycle) {
  if (billingCycle === "monthly") return 1200
  if (billingCycle === "quarterly") return 400
  return 100
}

export async function createRazorpaySubscriptionCheckout(input: {
  plan: PaidSubscriptionPlanId
  billingCycle: SubscriptionBillingCycle
  transactionId: string
  userId: string
  returnUrl?: string
}) {
  const normalizedKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || ""
  const keySecret = getRazorpayKeySecret()
  const planId = getRazorpayPlanId(input.plan, input.billingCycle)

  if (!normalizedKeyId || !keySecret || !planId) {
    return null
  }

  const expireBy = Math.floor(Date.now() / 1000) + 60 * 60 * 24
  const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${normalizedKeyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: planId,
      total_count: getTotalCountForBillingCycle(input.billingCycle),
      quantity: 1,
      customer_notify: true,
      expire_by: expireBy,
      notes: {
        transactionId: input.transactionId,
        plan: input.plan,
        billingCycle: input.billingCycle,
        userId: input.userId,
        returnUrl: input.returnUrl || "",
      },
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Razorpay subscription create failed: ${message || response.statusText}`)
  }

  const data = (await response.json()) as Record<string, unknown>
  return {
    providerSubscriptionId: typeof data.id === "string" ? data.id : "",
    checkoutUrl: typeof data.short_url === "string" ? data.short_url : "",
    providerStatus: typeof data.status === "string" ? data.status : "created",
  }
}

export async function fetchRazorpayPlanPricing(plan: PaidSubscriptionPlanId, billingCycle: SubscriptionBillingCycle) {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || ""
  const keySecret = getRazorpayKeySecret()
  const planId = getRazorpayPlanId(plan, billingCycle)

  if (!keyId || !keySecret || !planId) return null

  const response = await fetch(`https://api.razorpay.com/v1/plans/${planId}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    cache: "no-store",
  })

  if (!response.ok) return null

  const data = (await response.json()) as Record<string, unknown>
  const item = (data.item as Record<string, unknown> | undefined) || {}
  const amountInPaise = Number(item.amount ?? 0)
  if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) return null

  const interval = Number(data.interval ?? 1)
  const period = typeof data.period === "string" ? data.period : billingCycle === "yearly" ? "yearly" : "monthly"
  const cycleLabel =
    period === "yearly"
      ? "per year"
      : interval === 3
        ? "every 3 months"
        : interval === 1
          ? "per month"
          : `every ${interval} months`

  return {
    amountInPaise,
    label: `Rs ${Math.round(amountInPaise / 100).toLocaleString("en-IN")}`,
    periodLabel: cycleLabel,
    note: "Live Razorpay test plan",
  }
}

export async function getResolvedBillingCatalog() {
  const resolvedCatalog: BillingPlanCatalog = structuredClone(BILLING_PLAN_CATALOG)

  const planEntries = (Object.keys(BILLING_PLAN_CATALOG) as PaidSubscriptionPlanId[]).flatMap((plan) =>
    (["monthly", "quarterly", "yearly"] as SubscriptionBillingCycle[]).map((billingCycle) => ({
      plan,
      billingCycle,
    })),
  )

  await Promise.all(
    planEntries.map(async ({ plan, billingCycle }) => {
      try {
        const pricing = await fetchRazorpayPlanPricing(plan, billingCycle)
        if (pricing) {
          resolvedCatalog[plan].prices[billingCycle] = pricing
        }
      } catch (error) {
        console.warn("Razorpay pricing lookup failed", { plan, billingCycle, error })
      }
    }),
  )

  return resolvedCatalog
}

export async function resolveBillingPrice(plan: PaidSubscriptionPlanId, billingCycle: SubscriptionBillingCycle) {
  try {
    const livePricing = await fetchRazorpayPlanPricing(plan, billingCycle)
    return livePricing || BILLING_PLAN_CATALOG[plan].prices[billingCycle]
  } catch (error) {
    console.warn("Razorpay pricing resolution failed", { plan, billingCycle, error })
    return BILLING_PLAN_CATALOG[plan].prices[billingCycle]
  }
}

export async function ensureServerSubscriptionRecord(supabase: SupabaseClient, userId: string) {
  const { data: existing, error } = await supabase
    .from(BILLING_SUBSCRIPTIONS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error
  if (existing) return mapSubscriptionRow(existing)

  const trial = buildServerTrialSubscription(userId)
  const { data: inserted, error: insertError } = await supabase
    .from(BILLING_SUBSCRIPTIONS_TABLE)
    .upsert(mapSubscriptionRecordToRow(trial), { onConflict: "user_id" })
    .select("*")
    .single()

  if (insertError) throw insertError
  return mapSubscriptionRow(inserted)
}

export async function activateVerifiedSubscription(
  supabase: SupabaseClient,
  input: {
    userId: string
    plan: PaidSubscriptionPlanId
    billingCycle: SubscriptionBillingCycle
    transactionId?: string
    providerOrderId?: string
    providerPaymentId?: string
    providerSignature?: string
    providerSubscriptionId?: string
    note?: string
  },
) {
  const current = await ensureServerSubscriptionRecord(supabase, input.userId)
  const startedAt = nowIso()
  const activeRecord: SubscriptionRecord = {
    ...current,
    id: current.id || input.userId,
    userId: input.userId,
    plan: input.plan,
    status: "active",
    subscriptionStartedAt: startedAt,
    subscriptionEndsAt: getSubscriptionEndDate(startedAt, input.billingCycle),
    provider: "razorpay",
    providerSubscriptionId: input.providerSubscriptionId || current.providerSubscriptionId,
    providerPaymentId: input.providerPaymentId || current.providerPaymentId,
    billingCycle: input.billingCycle,
    note: input.note || current.note,
    updatedAt: startedAt,
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from(BILLING_SUBSCRIPTIONS_TABLE)
    .upsert(mapSubscriptionRecordToRow(activeRecord), { onConflict: "user_id" })
    .select("*")
    .single()

  if (subscriptionError) throw subscriptionError

  if (input.transactionId) {
    await markBillingTransactionStatus(supabase, input.transactionId, {
      status: "verified",
      providerOrderId: input.providerOrderId,
      providerPaymentId: input.providerPaymentId,
      providerSubscriptionId: input.providerSubscriptionId,
      providerSignature: input.providerSignature,
    })
  }

  return mapSubscriptionRow(subscription)
}

export async function markBillingTransactionStatus(
  supabase: SupabaseClient,
  transactionId: string,
  input: {
    status: string
    providerOrderId?: string
    providerPaymentId?: string
    providerSubscriptionId?: string
    providerSignature?: string
    webhookEventId?: string
    metadata?: Record<string, unknown>
  },
) {
  const payload = {
    status: input.status,
    provider_order_id: input.providerOrderId || null,
    provider_payment_id: input.providerPaymentId || null,
    provider_subscription_id: input.providerSubscriptionId || null,
    provider_signature: input.providerSignature || null,
    webhook_event_id: input.webhookEventId || null,
    metadata: input.metadata || {},
    verified_at: input.status === "verified" ? nowIso() : null,
    updated_at: nowIso(),
  }

  const { error } = await supabase
    .from(BILLING_TRANSACTIONS_TABLE)
    .update(payload)
    .eq("id", transactionId)

  if (error) throw error
}

export async function findTransactionByProviderOrderId(supabase: SupabaseClient, providerOrderId: string) {
  const { data, error } = await supabase
    .from(BILLING_TRANSACTIONS_TABLE)
    .select("*")
    .eq("provider_order_id", providerOrderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function findTransactionByProviderSubscriptionId(supabase: SupabaseClient, providerSubscriptionId: string) {
  const { data, error } = await supabase
    .from(BILLING_TRANSACTIONS_TABLE)
    .select("*")
    .eq("provider_subscription_id", providerSubscriptionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function fetchRazorpaySubscriptionInvoices(providerSubscriptionId: string): Promise<SubscriptionInvoice[]> {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""
  const keySecret = getRazorpayKeySecret()

  if (!keyId || !keySecret || !providerSubscriptionId) {
    return []
  }

  const response = await fetch(`https://api.razorpay.com/v1/invoices?subscription_id=${encodeURIComponent(providerSubscriptionId)}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Could not fetch subscription invoices: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as { items?: Record<string, unknown>[] }
  const items = Array.isArray(data.items) ? data.items : []

  return items.map((item) => ({
    id: String(item.id ?? ""),
    status: String(item.status ?? ""),
    amountInPaise: Number(item.amount ?? 0),
    amountPaidInPaise: Number(item.amount_paid ?? 0),
    currencySymbol: String(item.currency_symbol ?? "Rs"),
    shortUrl: item.short_url ? String(item.short_url) : undefined,
    invoiceNumber: item.invoice_number ? String(item.invoice_number) : undefined,
    paymentId: item.payment_id ? String(item.payment_id) : undefined,
    issuedAt: typeof item.issued_at === "number" ? item.issued_at : undefined,
    paidAt: typeof item.paid_at === "number" ? item.paid_at : undefined,
    billingStart: typeof item.billing_start === "number" ? item.billing_start : undefined,
    billingEnd: typeof item.billing_end === "number" ? item.billing_end : undefined,
  }))
}
