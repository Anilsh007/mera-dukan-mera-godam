# Firebase invalid-api-key fix

The app was crashing on the login page when Firebase environment variables were missing or invalid.

Fixes included:
- `app/lib/firebase.js` now initializes Firebase inside a safe guard/try-catch.
- Missing/invalid Firebase config no longer crashes the whole Next.js screen.
- Login now shows a clear setup message instead of throwing `auth/invalid-api-key`.
- Auth listeners and logout paths now check whether Firebase Auth exists before using it.
- Added `.env.example` with all required Firebase keys.

To run locally:
1. Copy `.env.example` to `.env.local`.
2. Fill Firebase Web App values from Firebase Console.
3. Restart `npm run dev`.
