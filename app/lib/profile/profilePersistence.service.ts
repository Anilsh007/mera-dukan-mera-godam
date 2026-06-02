"use client"

import { deleteProfileFromDb, loadProfileFromDb, saveProfileToDb } from "./profileDb.service"
import type { ProfileState } from "@/app/dashboard/profile/useProfile"
import { deleteProfileFromSupabase, saveProfileToSupabase } from "./profileSupabase.service"
import { stripProfileMeta } from "./profileSync.utils"
import { requestSupabaseSync } from "@/app/lib/persistence/supabaseSyncTrigger"
import { runWithCrudBusy } from "@/app/lib/crudBusy"

export async function loadProfileWithSync(userId?: string) {
  return loadProfileFromDb(userId)
}

export async function saveProfileWithSync(profile: ProfileState, userId?: string) {
  return runWithCrudBusy("Saving profile", async () => {
    const localProfile = await saveProfileToDb(stripProfileMeta(profile), userId)
    const payload = stripProfileMeta(localProfile)
    const cloudSyncSkipped = typeof window !== "undefined" ? !window.navigator.onLine : false

    if (!cloudSyncSkipped) {
      try {
        const cloudProfile = await saveProfileToSupabase(payload)
        return { profile: cloudProfile, cloudSyncSkipped: false }
      } catch (error) {
        console.error("Profile cloud sync failed:", error)
        void requestSupabaseSync("profile")
        return { profile: localProfile, cloudSyncSkipped: true }
      }
    }

    void requestSupabaseSync("profile")
    return { profile: localProfile, cloudSyncSkipped: true }
  })
}

export async function deleteProfileWithSync(userId?: string) {
  return runWithCrudBusy("Deleting profile", async () => {
    await deleteProfileFromDb(userId)
    const cloudSyncSkipped = typeof window !== "undefined" ? !window.navigator.onLine : false

    if (!cloudSyncSkipped) {
      try {
        await deleteProfileFromSupabase()
        return { cloudSyncSkipped: false }
      } catch (error) {
        console.error("Profile cloud delete failed:", error)
        void requestSupabaseSync("profile delete")
        return { cloudSyncSkipped: true }
      }
    }

    void requestSupabaseSync("profile delete")
    return { cloudSyncSkipped: true }
  })
}
