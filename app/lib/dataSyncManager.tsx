"use client"

import { useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { autoSyncToSupabase } from "./autoSupabaseSync.service"
import { syncSupabaseToDexie } from "./supabaseDownload.service"
import { auth } from "./firebase"
import { syncDexieToSupabase } from "./supabaseSync.service"
import { migrateLocalUserData } from "./userDataMigration"

export default function SupabaseSyncManager() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return

      try {
        await migrateLocalUserData(user)
        await syncSupabaseToDexie()
        await syncDexieToSupabase()
      } catch (err) {
        console.error("Initial Supabase sync failed:", err)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      autoSyncToSupabase()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return null
}
