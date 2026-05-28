create table if not exists public.billing_subscriptions (
  id text primary key,
  user_id text not null unique,
  plan text not null default 'trial',
  status text not null default 'trialing',
  trial_started_at timestamptz not null,
  trial_ends_at timestamptz not null,
  subscription_started_at timestamptz null,
  subscription_ends_at timestamptz null,
  provider text null default 'razorpay',
  provider_customer_id text null,
  provider_subscription_id text null,
  provider_payment_id text null,
  billing_cycle text null,
  note text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists billing_subscriptions_user_id_idx
  on public.billing_subscriptions (user_id);

create table if not exists public.billing_transactions (
  id uuid primary key,
  user_id text not null,
  plan text not null,
  billing_cycle text not null,
  amount_in_paise bigint not null,
  currency text not null default 'INR',
  provider text not null default 'razorpay',
  status text not null,
  provider_order_id text null,
  provider_payment_id text null,
  provider_subscription_id text null,
  provider_signature text null,
  webhook_event_id text null,
  verified_at timestamptz null,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists billing_transactions_user_id_idx
  on public.billing_transactions (user_id, created_at desc);
