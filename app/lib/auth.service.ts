import { auth, provider } from "./firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

// manual = user clicked "connect drive" button
export async function getGoogleDriveAccessToken(manual = false): Promise<string | null> {
  const user = auth.currentUser;

  if (manual && !user) {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) throw new Error("No access token");

      localStorage.setItem("drive_token", credential.accessToken);
      localStorage.setItem("drive_connected", "true");

      return credential.accessToken;
    } catch (err) {
      console.error("❌ Firebase popup error:", err);
      localStorage.setItem("drive_connected", "false");
      return null;
    }
  }

  // ✅ Background: reuse stored token, no popup
  const token = localStorage.getItem("drive_token");
  if (!token) return null;
  return token;
}