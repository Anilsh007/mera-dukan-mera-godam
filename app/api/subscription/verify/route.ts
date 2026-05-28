import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient, getUserIdentityFromRequest, toApiErrorResponse } from "@/app/api/_lib/auth"
import { assertContentLength, enforceRateLimit, readJsonBody, sanitizeOptionalText, SecurityError } from "@/app/api/_lib/security"
import { isPaidSubscriptionPlanId, isSubscriptionBillingCycle } from "@/app/lib/subscription/catalog"
import type { VerifyPaymentRequest } from "@/app/lib/subscription/contracts"
import { activateVerifiedSubscription, findTransactionByProviderOrderId, hasRazorpayServerConfig, isMissingSupabaseTableError, markBillingTransactionStatus, verifyRazorpayPaymentSignature, verifyRazorpaySubscriptionSignature } from "@/app/lib/subscription/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: "subscription:verify", limit: 30, windowMs: 60_000 })
    assertContentLength(request, 32 * 1024)
    const userId = await getUserIdentityFromRequest(request)
    const payload = validatePayload(await readJsonBody<VerifyPaymentRequest>(request))
    const providerConfigured = hasRazorpayServerConfig()

    if (!providerConfigured) {
      return NextResponse.json({
        ok: false,
        provider: "razorpay-placeholder",
        message: "Razorpay keys are missing. Add them before enabling payment verification.",
        nextSteps: [
          "Add NEXT_PUBLIC_RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET.",
          "Keep verification strictly server-side.",
          "Do not activate subscriptions from the client.",
        ],
      })
    }

    if (!payload.razorpayPaymentId || !payload.razorpaySignature || (!payload.razorpayOrderId && !payload.razorpaySubscriptionId)) {
      return NextResponse.json({
        ok: false,
        provider: "razorpay-placeholder",
        message: "Missing Razorpay payment identifiers for verification.",
        nextSteps: [
          "Pass razorpay_payment_id and razorpay_signature to this route after checkout success.",
          "Also pass either razorpay_order_id for one-time orders or razorpay_subscription_id for subscriptions.",
          "Include transactionId as well so the matching billing transaction can be updated exactly.",
        ],
      }, { status: 400 })
    }

    const signatureValid = payload.razorpaySubscriptionId
      ? verifyRazorpaySubscriptionSignature(
          payload.razorpaySubscriptionId,
          payload.razorpayPaymentId,
          payload.razorpaySignature,
        )
      : verifyRazorpayPaymentSignature(
          payload.razorpayOrderId!,
          payload.razorpayPaymentId,
          payload.razorpaySignature,
        )

    if (!signatureValid) {
      const supabase = createSupabaseAdminClient()
      if (payload.transactionId) {
        try {
          await markBillingTransactionStatus(supabase, payload.transactionId, {
            status: "verification_failed",
            providerOrderId: payload.razorpayOrderId,
            providerPaymentId: payload.razorpayPaymentId,
            providerSubscriptionId: payload.razorpaySubscriptionId,
            providerSignature: payload.razorpaySignature,
          })
        } catch (error) {
          if (!isMissingSupabaseTableError(error, "billing_transactions")) throw error
        }
      }

      return NextResponse.json({
        ok: false,
        provider: "razorpay",
        message: "Razorpay payment signature verification failed.",
        nextSteps: [
          "Confirm the backend is using the correct Razorpay key secret.",
          payload.razorpaySubscriptionId
            ? "Verify that subscription_id and payment_id belong to the same completed authorization payment."
            : "Verify that order_id and payment_id belong to the same completed checkout.",
        ],
      }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()
    const fallbackTransaction = payload.transactionId
      ? null
      : payload.razorpayOrderId
        ? await findTransactionByProviderOrderId(supabase, payload.razorpayOrderId)
        : null
    const transactionId = payload.transactionId || (fallbackTransaction ? String(fallbackTransaction.id) : undefined)
    const subscription = await activateVerifiedSubscription(supabase, {
      userId,
      plan: payload.plan,
      billingCycle: payload.billingCycle,
      transactionId,
      providerOrderId: payload.razorpayOrderId,
      providerPaymentId: payload.razorpayPaymentId,
      providerSignature: payload.razorpaySignature,
      providerSubscriptionId:
        payload.razorpaySubscriptionId ||
        (fallbackTransaction?.provider_subscription_id ? String(fallbackTransaction.provider_subscription_id) : undefined),
      note: `Activated from verified Razorpay payment on ${new Date().toLocaleString("en-IN")}`,
    })

    return NextResponse.json({
      ok: true,
      provider: "razorpay",
      message: `Subscription activated for ${subscription.plan} (${payload.billingCycle}).`,
      nextSteps: [
        "Keep the webhook route active as the source of truth for renewals and cancellations.",
        "Redirect the user back to billing or dashboard after this verification step.",
      ],
    })
  } catch (error) {
    return toApiErrorResponse(error, "Unexpected subscription verification API error")
  }
}

function validatePayload(payload: VerifyPaymentRequest): VerifyPaymentRequest {
  if (!payload || typeof payload !== "object") {
    throw new SecurityError("Invalid payment verification payload", 400)
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
    transactionId: sanitizeOptionalText(payload.transactionId, 200),
    razorpayOrderId: sanitizeOptionalText(payload.razorpayOrderId, 200),
    razorpaySubscriptionId: sanitizeOptionalText(payload.razorpaySubscriptionId, 200),
    razorpayPaymentId: sanitizeOptionalText(payload.razorpayPaymentId, 200),
    razorpaySignature: sanitizeOptionalText(payload.razorpaySignature, 500),
  }
}
