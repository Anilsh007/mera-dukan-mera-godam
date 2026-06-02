"use client"

import { autoSyncToSupabase } from "@/app/lib/autoSupabaseSync.service"

let inFlightSync: Promise<boolean> | null = null
let scheduledSync: ReturnType<typeof globalThis.setTimeout> | null = null
let scheduledSyncPromise: Promise<boolean> | null = null
let resolveScheduledSync: ((value: boolean | PromiseLike<boolean>) => void) | null = null

const ONLINE_SYNC_DELAY_MS = 1000

export async function requestSupabaseSync(context: string) {
  if (typeof window === "undefined") {
    return runSync(context)
  }

  if (!window.navigator.onLine) {
    return Promise.resolve(false)
  }

  if (scheduledSync) {
    globalThis.clearTimeout(scheduledSync)
  }

  if (!scheduledSyncPromise) {
    scheduledSyncPromise = new Promise<boolean>((resolve) => {
      resolveScheduledSync = resolve
    })
  }

  scheduledSync = globalThis.setTimeout(() => {
    scheduledSync = null
    runSync(context)
      .then((result) => {
        resolveScheduledSync?.(result)
      })
      .finally(() => {
        scheduledSyncPromise = null
        resolveScheduledSync = null
      })
  }, ONLINE_SYNC_DELAY_MS)

  return scheduledSyncPromise
}

function runSync(context: string) {
  if (inFlightSync) return inFlightSync

  inFlightSync = autoSyncToSupabase()
    .then(() => true)
    .catch((error) => {
      console.error(`${context} sync failed. Local data is already saved and will retry on the next sync.`, error)
      return false
    })
    .finally(() => {
      inFlightSync = null
    })

  return inFlightSync
}
