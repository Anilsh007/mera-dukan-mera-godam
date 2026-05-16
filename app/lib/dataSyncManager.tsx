"use client"

import { useEffect, useRef } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { autoSyncToSupabase } from "./autoSupabaseSync.service"
import { syncSupabaseToDexie } from "./supabaseDownload.service"
import { auth } from "./firebase"
import { syncDexieToSupabase } from "./supabaseSync.service"
import { migrateLocalUserData } from "./userDataMigration"
import { notify } from "./notifications"
import { en } from "../messages/en"

export default function SupabaseSyncManager() {
  const hasShownSyncErrorRef = useRef(false)

  const showSyncError = () => {
    if (hasShownSyncErrorRef.current) return

    notify.error(en.notifications.syncError)
    hasShownSyncErrorRef.current = true
  }

  const resetSyncErrorGuard = () => {
    hasShownSyncErrorRef.current = false
  }

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return

      try {
        await migrateLocalUserData(user)
        await syncSupabaseToDexie()
        await syncDexieToSupabase()
        resetSyncErrorGuard()
      } catch (err) {
        console.error("Initial Supabase sync failed:", err instanceof Error ? err.message : err)
        showSyncError()
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const runPeriodicSync = () => {
      autoSyncToSupabase()
        .then(() => {
          resetSyncErrorGuard()
        })
        .catch((err) => {
          console.error("Scheduled Supabase sync failed:", err instanceof Error ? err.message : err)
          showSyncError()
        })
    }

    const interval = setInterval(() => {
      runPeriodicSync()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return null
}
