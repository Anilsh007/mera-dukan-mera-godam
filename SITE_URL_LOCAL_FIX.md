# Local SITE_URL and Loading Fix

Changes made:

- Removed the hardcoded production domain fallback.
- `SITE_URL` now falls back to `http://localhost:3000` when `NEXT_PUBLIC_SITE_URL` is not set.
- `.env.example` no longer tells you to use the old domain before purchase/configuration.
- Login no longer loads the heavy 3D background on the first screen, which avoids slow/stuck loading on weaker devices and during local development.
- Firebase config validation now rejects placeholder values such as `test`; real Firebase Web API keys usually start with `AIza`.

For local development:

```env
# Do not set NEXT_PUBLIC_SITE_URL locally unless you really need it.
# NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

After editing `.env.local`, restart Next.js:

```bash
rm -rf .next
npm run dev
```

On Windows PowerShell:

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```
