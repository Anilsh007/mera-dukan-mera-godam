import { syncDexieToSupabase } from "./supabaseSync.service"

let isSyncing = false

export async function autoSyncToSupabase() {
  if (isSyncing) return

  try {
    isSyncing = true

    if (!navigator.onLine) return

    await syncDexieToSupabase()
  } catch (err) {
    console.error("Supabase auto sync failed:", err)
    throw err
  } finally {
    isSyncing = false
  }
}
