import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient, getUserIdentityFromRequest, toApiErrorResponse } from "@/app/api/_lib/auth"
import { enforceRateLimit } from "@/app/api/_lib/security"
import { BILLING_SUBSCRIPTIONS_TABLE, fetchRazorpaySubscriptionInvoices, hasRazorpayServerConfig, isMissingSupabaseTableError } from "@/app/lib/subscription/server"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: "subscription:invoices", limit: 60, windowMs: 60_000 })
    const userId = await getUserIdentityFromRequest(request)

    if (!hasRazorpayServerConfig()) {
      return NextResponse.json({
        ok: true,
        provider: "razorpay-placeholder",
        invoices: [],
        message: "Razorpay billing is not configured yet.",
      })
    }

    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from(BILLING_SUBSCRIPTIONS_TABLE)
      .select("provider_subscription_id")
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      if (isMissingSupabaseTableError(error, BILLING_SUBSCRIPTIONS_TABLE)) {
        return NextResponse.json({
          ok: true,
          provider: "razorpay-placeholder",
          invoices: [],
          message: "Billing tables are not ready yet.",
        })
      }

      return NextResponse.json({ message: error.message, code: error.code }, { status: 500 })
    }

    const providerSubscriptionId = data?.provider_subscription_id ? String(data.provider_subscription_id) : ""
    if (!providerSubscriptionId) {
      return NextResponse.json({
        ok: true,
        provider: "razorpay",
        invoices: [],
        message: "No active provider subscription found for this account yet.",
      })
    }

    const invoices = await fetchRazorpaySubscriptionInvoices(providerSubscriptionId)
    return NextResponse.json({
      ok: true,
      provider: "razorpay",
      invoices,
    })
  } catch (error) {
    return toApiErrorResponse(error, "Unexpected subscription invoices API error")
  }
}
