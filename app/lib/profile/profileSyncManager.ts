let syncTimeout: ReturnType<typeof setTimeout> | null = null;
import { saveProfileToSupabase } from "./profileSupabase.service";
import type { ProfileData } from "./profile.service";

export function scheduleProfileSync(profileData: Omit<ProfileData, "userId" | "updatedAt">) {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(async () => {
    try {
      await saveProfileToSupabase(profileData);
    } catch (err) {
      console.error("❌ Scheduled profile sync failed:", err);
    }
  }, 5000); // 5 sec debounce
}
