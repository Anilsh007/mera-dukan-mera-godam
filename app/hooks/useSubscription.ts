"use client"

import { useEffect, useMemo, useState } from "react"
import { liveQuery } from "dexie"
import { db, type SubscriptionRecord } from "@/app/lib/db"
import { auth } from "@/app/lib/firebase"
import { getUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import {
  ensureSubscriptionRecord,
  refreshSubscriptionFromServer,
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
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now())
    }, 60_000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

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
      try {
        await refreshSubscriptionFromServer(userId)
      } catch (error) {
        console.warn("Subscription server sync skipped", error)
      }
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
    const trialActive = isTrialActive(subscription, nowMs)
    const subscriptionActive = isSubscriptionActive(subscription, nowMs)
    const subscriptionExpired = isSubscriptionExpired(subscription, nowMs)
    return {
      subscription,
      loading,
      effectivePlan: getEffectivePlan(subscription),
      trialDaysLeft: getTrialDaysLeft(subscription, nowMs),
      trialActive,
      subscriptionActive,
      subscriptionExpired,
    }
  }, [loading, nowMs, subscription])
}
