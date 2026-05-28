import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient, getUserIdentityFromRequest, toApiErrorResponse } from "@/app/api/_lib/auth"
import { assertContentLength, enforceRateLimit, readJsonBody, sanitizeOptionalText, SecurityError } from "@/app/api/_lib/security"
import { isPaidSubscriptionPlanId, isSubscriptionBillingCycle } from "@/app/lib/subscription/catalog"
import type { CreateCheckoutSessionRequest } from "@/app/lib/subscription/contracts"
import { BILLING_SUBSCRIPTIONS_TABLE, BILLING_TRANSACTIONS_TABLE, buildServerTrialSubscription, createRazorpaySubscriptionCheckout, getRazorpayPlanId, hasRazorpayServerConfig, isMissingSupabaseTableError, mapSubscriptionRecordToRow, markBillingTransactionStatus, resolveBillingPrice } from "@/app/lib/subscription/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: "subscription:checkout", limit: 20, windowMs: 60_000 })
    assertContentLength(request, 32 * 1024)
    const userId = await getUserIdentityFromRequest(request)
    const payload = validatePayload(await readJsonBody<CreateCheckoutSessionRequest>(request))
    const supabase = createSupabaseAdminClient()
    const providerConfigured = hasRazorpayServerConfig()
    const pricing = await resolveBillingPrice(payload.plan, payload.billingCycle)
    const planIdConfigured = Boolean(getRazorpayPlanId(payload.plan, payload.billingCycle))

    const trialRecord = buildServerTrialSubscription(userId)
    const { error: trialError } = await supabase
      .from(BILLING_SUBSCRIPTIONS_TABLE)
      .upsert(mapSubscriptionRecordToRow(trialRecord), { onConflict: "user_id", ignoreDuplicates: true })

    if (trialError && !isMissingSupabaseTableError(trialError, BILLING_SUBSCRIPTIONS_TABLE)) {
      return NextResponse.json({ message: trialError.message, code: trialError.code }, { status: 500 })
    }

    const transactionId = randomUUID()
    const transactionPayload = {
      id: transactionId,
      user_id: userId,
      plan: payload.plan,
      billing_cycle: payload.billingCycle,
      amount_in_paise: pricing.amountInPaise,
      currency: "INR",
      provider: "razorpay",
      status: providerConfigured && planIdConfigured ? "created" : providerConfigured ? "integration_pending" : "config_pending",
      provider_order_id: null,
      provider_payment_id: null,
      provider_subscription_id: null,
      provider_signature: null,
      webhook_event_id: null,
      verified_at: null,
      metadata: {
        returnUrl: payload.returnUrl || null,
        placeholder: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: transactionError } = await supabase
      .from(BILLING_TRANSACTIONS_TABLE)
      .insert(transactionPayload)

    if (transactionError && !isMissingSupabaseTableError(transactionError, BILLING_TRANSACTIONS_TABLE)) {
      return NextResponse.json({ message: transactionError.message, code: transactionError.code }, { status: 500 })
    }

    if (providerConfigured && planIdConfigured) {
      const createdSubscription = await createRazorpaySubscriptionCheckout({
        plan: payload.plan,
        billingCycle: payload.billingCycle,
        transactionId,
        userId,
        returnUrl: payload.returnUrl,
      })

      if (createdSubscription) {
        const amountLabel = encodeURIComponent(pricing.label)
        const returnCheckoutUrl =
          `${request.nextUrl.origin}/dashboard/settings/subscription/checkout` +
          `?subscriptionId=${encodeURIComponent(createdSubscription.providerSubscriptionId)}` +
          `&transactionId=${encodeURIComponent(transactionId)}` +
          `&plan=${encodeURIComponent(payload.plan)}` +
          `&billingCycle=${encodeURIComponent(payload.billingCycle)}` +
          `&amount=${encodeURIComponent(pricing.label)}` +
          `&label=${amountLabel}`

        await markBillingTransactionStatus(supabase, transactionId, {
          status: createdSubscription.providerStatus,
          providerSubscriptionId: createdSubscription.providerSubscriptionId,
          metadata: {
            hostedShortUrl: createdSubscription.checkoutUrl,
            checkoutUrl: returnCheckoutUrl,
          },
        })

        return NextResponse.json({
          ok: true,
          provider: "razorpay",
          providerConfigured: true,
          mode: "live-subscription",
          transactionId,
          plan: payload.plan,
          billingCycle: payload.billingCycle,
          amountInPaise: pricing.amountInPaise,
          checkoutUrl: returnCheckoutUrl,
          providerOrderId: null,
          providerSubscriptionId: createdSubscription.providerSubscriptionId || null,
          message: "Razorpay subscription created. Opening secure checkout...",
          nextSteps: [
            "The customer will complete payment inside Razorpay checkout on your site.",
            "On success, the client verifies the payment and returns to the dashboard automatically.",
          ],
        })
      }
    }

    return NextResponse.json({
      ok: true,
      provider: "razorpay-placeholder",
      providerConfigured,
      mode: "placeholder",
      transactionId,
      plan: payload.plan,
      billingCycle: payload.billingCycle,
      amountInPaise: pricing.amountInPaise,
      checkoutUrl: null,
      providerOrderId: null,
      providerSubscriptionId: null,
      message: providerConfigured
        ? "Checkout intent saved. Add Razorpay plan ids to enable live subscription creation."
        : "Checkout intent saved. Add Razorpay keys before wiring the live payment call.",
      nextSteps: [
        "Create Razorpay plans in the dashboard for monthly, quarterly, and yearly billing.",
        "Add the matching Razorpay plan ids to environment variables.",
        "Save the returned provider order or subscription id against this transaction id.",
        "Return checkout details or open Razorpay Checkout on the client.",
        "Verify payment signature in /api/subscription/verify and webhook events in /api/subscription/webhook.",
      ],
    })
  } catch (error) {
    return toApiErrorResponse(error, "Unexpected subscription checkout API error")
  }
}

function validatePayload(payload: CreateCheckoutSessionRequest): CreateCheckoutSessionRequest {
  if (!payload || typeof payload !== "object") {
    throw new SecurityError("Invalid checkout payload", 400)
  }

  if (!isPaidSubscriptionPlanId(String(payload.plan))) {
    throw new SecurityError("Invalid subscription plan", 400)
  }

  if (!isSubscriptionBillingCycle(String(payload.billingCycle))) {
    throw new SecurityError("Invalid billing cycle", 400)
  }

  return {
    plan: payload.plan,
    billingCycle: payload.billingCycle,
    returnUrl: sanitizeOptionalText(payload.returnUrl, 500),
  }
}
