"use client"

import { useMemo } from "react"
import useSubscription from "@/app/hooks/useSubscription"
import useUsageLimit from "@/app/hooks/useUsageLimit"
import { getFeatureLimit } from "@/app/lib/subscription/subscription.service"
import type { SubscriptionFeatureKey } from "@/app/lib/subscription/plans"

export default function useFeatureGate(feature: SubscriptionFeatureKey) {
  const { effectivePlan, loading: subscriptionLoading, subscriptionExpired } = useSubscription()
  const { usage, loading: usageLoading } = useUsageLimit(feature)

  return useMemo(() => {
    const limit = getFeatureLimit(effectivePlan, feature)
    const allowed =
      limit === null ||
      limit === true ||
      (typeof limit === "number" && usage < limit)

    return {
      allowed,
      usage,
      limit,
      effectivePlan,
      subscriptionExpired,
      loading: subscriptionLoading || usageLoading,
    }
  }, [effectivePlan, feature, subscriptionExpired, subscriptionLoading, usage, usageLoading])
}
