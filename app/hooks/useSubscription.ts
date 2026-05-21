"use client"

import { useEffect, useMemo, useState } from "react"
import { liveQuery } from "dexie"
import { db, type SubscriptionRecord } from "@/app/lib/db"
import { auth } from "@/app/lib/firebase"
import { getUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import {
  ensureSubscriptionRecord,
  getEffectivePlan,
  getTrialDaysLeft,
  isSubscriptionActive,
  isSubscriptionExpired,
  isTrialActive,
} from "@/app/lib/subscription/subscription.service"

type UseSubscriptionState = {
  subscription: SubscriptionRecord | null
  loading: boolean
}

export default function useSubscription(): UseSubscriptionState & {
  effectivePlan: ReturnType<typeof getEffectivePlan>
  trialDaysLeft: number
  trialActive: boolean
  subscriptionActive: boolean
  subscriptionExpired: boolean
} {
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let dexieSubscription: { unsubscribe: () => void } | null = null

    const reset = () => {
      dexieSubscription?.unsubscribe()
      dexieSubscription = null
      setSubscription(null)
      setLoading(false)
    }

    if (!auth) {
      reset()
      return
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      dexieSubscription?.unsubscribe()
      dexieSubscription = null

      const userId = getUserIdentityFromAuthUser(user)
      if (!userId) {
        reset()
        return
      }

      setLoading(true)
      await ensureSubscriptionRecord(userId)
      dexieSubscription = liveQuery(() => db.subscriptions.where("userId").equals(userId).first()).subscribe({
        next: (value) => {
          setSubscription(value || null)
          setLoading(false)
        },
        error: (error) => {
          console.error("Subscription live query failed", error)
          reset()
        },
      })
    })

    return () => {
      dexieSubscription?.unsubscribe()
      unsubscribe()
    }
  }, [])

  return useMemo(() => {
    const trialActive = isTrialActive(subscription)
    const subscriptionActive = isSubscriptionActive(subscription)
    const subscriptionExpired = isSubscriptionExpired(subscription)
    return {
      subscription,
      loading,
      effectivePlan: getEffectivePlan(subscription),
      trialDaysLeft: getTrialDaysLeft(subscription),
      trialActive,
      subscriptionActive,
      subscriptionExpired,
    }
  }, [loading, subscription])
}
