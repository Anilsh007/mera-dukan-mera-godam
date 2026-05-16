"use client"

import { useEffect, useRef } from "react"
import { notify } from "@/app/lib/notifications"
import { en } from "@/app/messages/en"

export default function NetworkStatusNotifier() {
  const wasOfflineRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const showOffline = () => {
      wasOfflineRef.current = true
      notify.warning(en.notifications.offlineMode, { id: "network-offline" })
    }

    const showOnline = () => {
      notify.dismiss("network-offline")
      if (wasOfflineRef.current) {
        notify.info(en.notifications.connectionRestored, { id: "network-online" })
      }
      wasOfflineRef.current = false
    }

    if (!window.navigator.onLine) {
      showOffline()
    }

    window.addEventListener("offline", showOffline)
    window.addEventListener("online", showOnline)

    return () => {
      window.removeEventListener("offline", showOffline)
      window.removeEventListener("online", showOnline)
    }
  }, [])

  return null
}
