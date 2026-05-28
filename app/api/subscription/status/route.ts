import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient, getUserIdentityFromRequest, toApiErrorResponse } from "@/app/api/_lib/auth"
import { enforceRateLimit } from "@/app/api/_lib/security"
import { BILLING_CYCLES } from "@/app/lib/subscription/catalog"
import { BILLING_SUBSCRIPTIONS_TABLE, buildServerTrialSubscription, getResolvedBillingCatalog, hasRazorpayServerConfig, isMissingSupabaseTableError, isRazorpayPlanConfigured, mapSubscriptionRecordToRow, mapSubscriptionRow } from "@/app/lib/subscription/server"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: "subscription:status", limit: 60, windowMs: 60_000 })
    const userId = await getUserIdentityFromRequest(request)
    const supabase = createSupabaseAdminClient()
    const resolvedCatalog = await getResolvedBillingCatalog()

    const configuredPlanMatrix = {
      starter: Object.fromEntries(BILLING_CYCLES.map((cycle) => [cycle, isRazorpayPlanConfigured("starter", cycle)])),
      pro: Object.fromEntries(BILLING_CYCLES.map((cycle) => [cycle, isRazorpayPlanConfigured("pro", cycle)])),
      business: Object.fromEntries(BILLING_CYCLES.map((cycle) => [cycle, isRazorpayPlanConfigured("business", cycle)])),
    }

    const { data: existing, error: selectError } = await supabase
      .from(BILLING_SUBSCRIPTIONS_TABLE)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (selectError) {
      if (isMissingSupabaseTableError(selectError, BILLING_SUBSCRIPTIONS_TABLE)) {
        return NextResponse.json({
          ok: true,
          provider: "razorpay-placeholder",
          providerConfigured: hasRazorpayServerConfig(),
          setupRequired: true,
          subscription: null,
          catalog: resolvedCatalog,
          configuredPlanMatrix,
          message: "Subscription backend scaffold is ready, but Supabase billing tables are not created yet.",
          nextSteps: [
            "Run the new Supabase billing migration.",
            "Add Razorpay keys in environment variables.",
            "Replace placeholder checkout and webhook logic with live Razorpay API calls.",
          ],
        })
      }

      return NextResponse.json({ message: selectError.message, code: selectError.code }, { status: 500 })
    }

    if (!existing) {
      const trial = buildServerTrialSubscription(userId)
      const { data: inserted, error: insertError } = await supabase
        .from(BILLING_SUBSCRIPTIONS_TABLE)
        .upsert(mapSubscriptionRecordToRow(trial), { onConflict: "user_id" })
        .select("*")
        .single()

      if (insertError) {
        return NextResponse.json({ message: insertError.message, code: insertError.code }, { status: 500 })
      }

      return NextResponse.json({
        ok: true,
        provider: "razorpay-placeholder",
        providerConfigured: hasRazorpayServerConfig(),
        setupRequired: false,
        subscription: mapSubscriptionRow(inserted),
        catalog: resolvedCatalog,
        configuredPlanMatrix,
      })
    }

    return NextResponse.json({
      ok: true,
      provider: "razorpay-placeholder",
      providerConfigured: hasRazorpayServerConfig(),
      setupRequired: false,
      subscription: mapSubscriptionRow(existing),
      catalog: resolvedCatalog,
      configuredPlanMatrix,
    })
  } catch (error) {
    return toApiErrorResponse(error, "Unexpected subscription status API error")
  }
}
