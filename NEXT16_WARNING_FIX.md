# Next.js 16 warning cleanup

Fixed two startup warnings reported in development:

1. Removed `optimizePackageImports` from `next.config.ts` because the installed Next.js version reported it as an unrecognized config key.
2. Migrated `middleware.ts` to `proxy.ts` and renamed the exported function from `middleware` to `proxy`, matching the Next.js 16 convention.

After this change run:

```bash
rm -rf .next
npm run dev
```

Expected result: the app should start without these two warnings.
