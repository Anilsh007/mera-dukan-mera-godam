"use client"

import { useEffect, useState } from "react"
import { auth } from "@/app/lib/firebase"
import { getUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { getUsageCount } from "@/app/lib/subscription/subscription.service"
import type { SubscriptionFeatureKey } from "@/app/lib/subscription/plans"

export default function useUsageLimit(feature: SubscriptionFeatureKey) {
  const [usage, setUsage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      const userId = getUserIdentityFromAuthUser(auth?.currentUser)
      if (!userId) {
        if (active) {
          setUsage(0)
          setLoading(false)
        }
        return
      }

      try {
        const count = await getUsageCount(userId, feature)
        if (active) setUsage(count)
      } catch (error) {
        console.error("Usage limit load failed", error)
        if (active) setUsage(0)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [feature])

  return { usage, loading }
}
