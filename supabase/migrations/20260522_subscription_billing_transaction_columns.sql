alter table if exists public.billing_transactions
  add column if not exists provider_subscription_id text null,
  add column if not exists provider_signature text null,
  add column if not exists webhook_event_id text null,
  add column if not exists verified_at timestamptz null;
