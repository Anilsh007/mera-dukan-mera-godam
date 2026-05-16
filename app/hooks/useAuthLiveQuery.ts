"use client"

import { useEffect, useRef, useState } from "react"
import { liveQuery } from "dexie"
import { auth } from "@/app/lib/firebase"
import { getUserIdentityFromAuthUser } from "@/app/lib/userIdentity"

type AuthLiveQueryState<T> = {
  data: T
  loading: boolean
}

export default function useAuthLiveQuery<T>(
  initialData: T,
  query: (userId: string) => Promise<T>,
  onError: (error: unknown) => void = console.error
): AuthLiveQueryState<T> {
  const [data, setData] = useState<T>(initialData)
  const [loading, setLoading] = useState(true)
  const queryRef = useRef(query)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    queryRef.current = query
    onErrorRef.current = onError
  }, [onError, query])

  useEffect(() => {
    let liveSubscription: { unsubscribe: () => void } | null = null

    const reset = () => {
      liveSubscription?.unsubscribe()
      liveSubscription = null
      setData(initialData)
      setLoading(false)
    }

    if (!auth) {
      reset()
      return
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      liveSubscription?.unsubscribe()
      liveSubscription = null

      const userId = getUserIdentityFromAuthUser(user)
      if (!userId) {
        reset()
        return
      }

      setLoading(true)
      liveSubscription = liveQuery(() => queryRef.current(userId)).subscribe({
        next: (nextData) => {
          setData(nextData)
          setLoading(false)
        },
        error: (error) => {
          onErrorRef.current(error)
          reset()
        },
      })
    })

    return () => {
      liveSubscription?.unsubscribe()
      unsubscribe()
    }
  }, [initialData])

  return { data, loading }
}
