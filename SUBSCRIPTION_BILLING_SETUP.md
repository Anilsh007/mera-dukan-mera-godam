# Subscription Billing Setup

This project now includes a server-side subscription billing scaffold inside the same Next.js app.

## What is already wired

- Client billing helper:
  - `app/lib/subscription/billing.client.ts`
- Server API routes:
  - `app/api/subscription/status/route.ts`
  - `app/api/subscription/checkout/route.ts`
  - `app/api/subscription/verify/route.ts`
  - `app/api/subscription/webhook/route.ts`
- Shared contracts and plan catalog:
  - `app/lib/subscription/catalog.ts`
  - `app/lib/subscription/contracts.ts`
  - `app/lib/subscription/server.ts`
- Billing UI:
  - `app/pricing/page.tsx`
  - `app/dashboard/settings/subscription/page.tsx`
  - `app/dashboard/settings/subscription/verify/page.tsx`
- Supabase migration:
  - `supabase/migrations/20260522_subscription_billing_scaffold.sql`

## Why this is safe

The backend is inside the same project, but it is still a separate server-side execution layer.

- Public frontend code never needs `RAZORPAY_KEY_SECRET`.
- Payment verification stays in `app/api/subscription/verify/route.ts`.
- Webhook verification stays in `app/api/subscription/webhook/route.ts`.
- Final plan access should come from `billing_subscriptions`, not from only local Dexie state.

## Environment variables to add

Add these to your deployment environment and `.env.local` when ready:

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_PLAN_ID_STARTER_MONTHLY=
RAZORPAY_PLAN_ID_STARTER_QUARTERLY=
RAZORPAY_PLAN_ID_STARTER_YEARLY=
RAZORPAY_PLAN_ID_PRO_MONTHLY=
RAZORPAY_PLAN_ID_PRO_QUARTERLY=
RAZORPAY_PLAN_ID_PRO_YEARLY=
RAZORPAY_PLAN_ID_BUSINESS_MONTHLY=
RAZORPAY_PLAN_ID_BUSINESS_QUARTERLY=
RAZORPAY_PLAN_ID_BUSINESS_YEARLY=
```

## Supabase setup

Run the migration:

```sql
supabase/migrations/20260522_subscription_billing_scaffold.sql
```

It creates:

- `public.billing_subscriptions`
- `public.billing_transactions`

## What still needs live Razorpay work

### 1. Checkout route

File: `app/api/subscription/checkout/route.ts`

Live path now supported when plan IDs are configured:

- create Razorpay subscription from the server
- save provider subscription id
- return checkout payload and short URL to the client
- pass `transactionId` through the return flow so verification can update the correct local billing intent

### 2. Client handoff

Files:

- `app/pricing/page.tsx`
- `app/dashboard/settings/subscription/page.tsx`

If `checkoutUrl` is returned, the client already knows how to redirect. If you instead use Razorpay Checkout JS, trigger it from the success response here.

### 3. Verify route

File: `app/api/subscription/verify/route.ts`

Implement:

- signature verification
- transaction update
- `billing_subscriptions` activation
- trial-to-paid plan transition
- for subscriptions, verify `razorpay_payment_id + "|" + razorpay_subscription_id`

### 4. Webhook route

File: `app/api/subscription/webhook/route.ts`

Implement:

- `x-razorpay-signature` verification
- recurring renewal handling
- failed payment handling
- cancellation handling

## Recommended redirect target

After payment success, return users to:

```text
/dashboard/settings/subscription/verify?transactionId=...&plan=starter&billingCycle=monthly&razorpay_payment_id=...&razorpay_subscription_id=...&razorpay_signature=...
```

## Important note

The current scaffold is intentionally safe-by-default:

- it does not mark payments successful on the client
- it does not activate plans without server verification
- it clearly exposes the exact points where real Razorpay logic must be added
