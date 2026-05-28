import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/app/api/_lib/auth"
import { assertContentLength, enforceRateLimit } from "@/app/api/_lib/security"
import type { PaidSubscriptionPlanId, SubscriptionBillingCycle } from "@/app/lib/subscription/catalog"
import { activateVerifiedSubscription, findTransactionByProviderOrderId, findTransactionByProviderSubscriptionId, hasRazorpayServerConfig, markBillingTransactionStatus, verifyRazorpayWebhookSignature } from "@/app/lib/subscription/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  enforceRateLimit(request, { key: "subscription:webhook", limit: 120, windowMs: 60_000 })
  assertContentLength(request, 256 * 1024)

  const payload = await request.text()
  const signature = request.headers.get("x-razorpay-signature") || ""
  const eventId = request.headers.get("x-razorpay-event-id") || ""
  const providerConfigured = hasRazorpayServerConfig()

  if (!providerConfigured) {
    return NextResponse.json({
      ok: false,
      provider: "razorpay-placeholder",
      providerConfigured,
      message: "Webhook secret is not configured.",
      payloadReceived: Boolean(payload),
      nextSteps: [
        "Add RAZORPAY_WEBHOOK_SECRET on the server.",
      ],
    }, { status: 400 })
  }

  if (!signature || !verifyRazorpayWebhookSignature(payload, signature)) {
    return NextResponse.json({
      ok: false,
      provider: "razorpay-placeholder",
      providerConfigured,
      message: "Webhook signature verification failed.",
      payloadReceived: Boolean(payload),
      nextSteps: [
        "Confirm the Razorpay webhook secret matches the dashboard configuration.",
      ],
    }, { status: 400 })
  }

  const parsed = parseWebhookPayload(payload)
  const supabase = createSupabaseAdminClient()
  const transaction =
    parsed.providerSubscriptionId
      ? await findTransactionByProviderSubscriptionId(supabase, parsed.providerSubscriptionId)
      : parsed.providerOrderId
        ? await findTransactionByProviderOrderId(supabase, parsed.providerOrderId)
        : null

  if (transaction?.id) {
    await markBillingTransactionStatus(supabase, String(transaction.id), {
      status: parsed.status,
      providerOrderId: parsed.providerOrderId,
      providerPaymentId: parsed.providerPaymentId,
      providerSubscriptionId: parsed.providerSubscriptionId,
      webhookEventId: eventId || undefined,
      metadata: parsed.raw as Record<string, unknown>,
    })

    if (parsed.status === "verified" && transaction.user_id && parsed.plan && parsed.billingCycle) {
      await activateVerifiedSubscription(supabase, {
        userId: String(transaction.user_id),
        plan: parsed.plan,
        billingCycle: parsed.billingCycle,
        transactionId: String(transaction.id),
        providerOrderId: parsed.providerOrderId,
        providerPaymentId: parsed.providerPaymentId,
        providerSubscriptionId: parsed.providerSubscriptionId,
        note: `Activated from Razorpay webhook event ${parsed.event}.`,
      })
    }
  }

  return NextResponse.json({
    ok: true,
    provider: "razorpay-placeholder",
    providerConfigured,
    message: `Webhook accepted${parsed.event ? `: ${parsed.event}` : ""}.`,
    payloadReceived: Boolean(payload),
    nextSteps: [
      "Map the exact live Razorpay event set you plan to use for subscriptions or orders.",
      "Expand webhook handling for renewal, failure, and cancellation states.",
    ],
  })
}

function parseWebhookPayload(payload: string) {
  try {
    const raw = JSON.parse(payload) as Record<string, unknown>
    const event = typeof raw.event === "string" ? raw.event : ""
    const paymentEntity = (((raw.payload as Record<string, unknown> | undefined)?.payment as Record<string, unknown> | undefined)?.entity as Record<string, unknown> | undefined) || {}
    const subscriptionEntity = (((raw.payload as Record<string, unknown> | undefined)?.subscription as Record<string, unknown> | undefined)?.entity as Record<string, unknown> | undefined) || {}

    const notes = (paymentEntity.notes as Record<string, unknown> | undefined) || (subscriptionEntity.notes as Record<string, unknown> | undefined) || {}
    const plan: PaidSubscriptionPlanId | undefined =
      notes.plan === "starter" || notes.plan === "pro" || notes.plan === "business" ? notes.plan : undefined
    const billingCycle: SubscriptionBillingCycle | undefined =
      notes.billingCycle === "monthly" || notes.billingCycle === "quarterly" || notes.billingCycle === "yearly"
        ? notes.billingCycle
        : undefined

    return {
      raw,
      event,
      providerOrderId: typeof paymentEntity.order_id === "string" ? paymentEntity.order_id : undefined,
      providerPaymentId: typeof paymentEntity.id === "string" ? paymentEntity.id : undefined,
      providerSubscriptionId: typeof subscriptionEntity.id === "string" ? subscriptionEntity.id : undefined,
      plan,
      billingCycle,
      status: event === "payment.captured" || event === "subscription.charged" ? "verified" : "webhook_received",
    }
  } catch {
    return {
      raw: {},
      event: "",
      providerOrderId: undefined,
      providerPaymentId: undefined,
      providerSubscriptionId: undefined,
      plan: undefined,
      billingCycle: undefined,
      status: "webhook_received",
    }
  }
}
