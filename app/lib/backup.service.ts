// lib/backup.service.ts
import { toast } from "sonner";
import { getGoogleDriveAccessToken } from "./auth.service";
import { syncToDrive } from "./drive.service";

export async function backupToDrive() {
    try {
        const accessToken = await getGoogleDriveAccessToken();
        if (!accessToken) {
            toast.error("❌ Failed to get access token");
            return;
        }
        await syncToDrive(accessToken);
        // no major change, just safer logs
        console.log("🔄 Syncing to Google Drive...");
        toast.info("🔄 Syncing to Google Drive...");
    } catch (error) {
        console.error("❌ Backup failed:", error);
        toast.error(`❌ Backup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}