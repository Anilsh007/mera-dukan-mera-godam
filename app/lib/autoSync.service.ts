import { toast } from "sonner";
import { getGoogleDriveAccessToken } from "./auth.service";
import { syncToDrive } from "./drive.service";

let isSyncing = false;

export async function autoSyncToDrive(showToast = false) {
  if (isSyncing) return;

  try {
    isSyncing = true;

    const isConnected = localStorage.getItem("drive_connected");
    if (!isConnected || !navigator.onLine) return;

    const token = await getGoogleDriveAccessToken(false); // ❌ No popup
    if (!token) return;

    if (showToast) toast.info("Auto syncing start");
    await syncToDrive(token);
    if (showToast) toast.success("Auto sync success");
  } catch (err) {
    console.error("❌ Auto sync failed:", err);
    if (showToast) toast.error(`❌ Auto sync failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    isSyncing = false;
  }
}