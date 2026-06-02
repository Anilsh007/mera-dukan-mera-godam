import { saveProfileWithSync } from "./profilePersistence.service"
import type { ProfileData } from "./profile.service"

let syncTimeout: ReturnType<typeof setTimeout> | null = null

export function scheduleProfileSync(profileData: ProfileData) {
  if (syncTimeout) {
    clearTimeout(syncTimeout)
  }

  syncTimeout = setTimeout(async () => {
    try {
      await saveProfileWithSync(profileData, profileData.userId)
    } catch (error) {
      console.error("Scheduled profile sync failed:", error)
    }
  }, 5000)
}
