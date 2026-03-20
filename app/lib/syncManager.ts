let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export function scheduleSync() {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(async () => {
    try {
      const { autoSyncToDrive } = await import("./autoSync.service");
      await autoSyncToDrive(); // ✅ await added
    } catch (err) {
      console.error("❌ Scheduled sync failed:", err);
    }
  }, 5000); // ⏱️ 5 sec debounce
}