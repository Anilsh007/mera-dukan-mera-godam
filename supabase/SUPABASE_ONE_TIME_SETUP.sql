-- MDMG complete Supabase setup
-- Safe/idempotent: creates missing tables/columns/indexes/policies and keeps existing data.
-- Run once in Supabase SQL Editor. You can run it again after future releases.
-- App note: this project currently uses Firebase user ids in user_id (TEXT), so server/API
-- routes with SUPABASE_SERVICE_ROLE_KEY are the safest sync path unless Supabase Auth JWTs
-- are wired to the same user_id values.

create extension if not exists pgcrypto;

create or replace function public.mdmg_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Profile and business profile
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  display_name text,
  email text,
  phone text,
  photo_url text,
  alternate_email text,
  shop_name text,
  gst_number text,
  business_type text default 'retail',
  upi_id text,
  invoice_prefix text default 'INV',
  address text,
  district text,
  state text,
  pincode text,
  account_holder_name text,
  account_number text,
  ifsc_code text,
  bank_name text,
  terms_and_conditions text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists user_id text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists photo_url text;
alter table public.profiles add column if not exists alternate_email text;
alter table public.profiles add column if not exists shop_name text;
alter table public.profiles add column if not exists gst_number text;
alter table public.profiles add column if not exists business_type text default 'retail';
alter table public.profiles add column if not exists upi_id text;
alter table public.profiles add column if not exists invoice_prefix text default 'INV';
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists district text;
alter table public.profiles add column if not exists state text;
alter table public.profiles add column if not exists pincode text;
alter table public.profiles add column if not exists account_holder_name text;
alter table public.profiles add column if not exists account_number text;
alter table public.profiles add column if not exists ifsc_code text;
alter table public.profiles add column if not exists bank_name text;
alter table public.profiles add column if not exists terms_and_conditions text;
alter table public.profiles add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.profiles add column if not exists updated_at timestamptz not null default timezone('utc', now());
create unique index if not exists profiles_user_id_key on public.profiles (user_id);

create table if not exists public.business_profiles (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  profile_id text,
  business_name text,
  owner_name text,
  gstin text,
  business_type text,
  phone text,
  email text,
  logo_url text,
  address text,
  city text,
  district text,
  state text,
  pincode text,
  upi_id text,
  bank_name text,
  account_holder_name text,
  account_number text,
  ifsc_code text,
  invoice_prefix text,
  terms text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.business_profiles add column if not exists user_id text;
alter table public.business_profiles add column if not exists profile_id text;
alter table public.business_profiles add column if not exists business_name text;
alter table public.business_profiles add column if not exists owner_name text;
alter table public.business_profiles add column if not exists gstin text;
alter table public.business_profiles add column if not exists business_type text;
alter table public.business_profiles add column if not exists phone text;
alter table public.business_profiles add column if not exists email text;
alter table public.business_profiles add column if not exists logo_url text;
alter table public.business_profiles add column if not exists address text;
alter table public.business_profiles add column if not exists city text;
alter table public.business_profiles add column if not exists district text;
alter table public.business_profiles add column if not exists state text;
alter table public.business_profiles add column if not exists pincode text;
alter table public.business_profiles add column if not exists upi_id text;
alter table public.business_profiles add column if not exists bank_name text;
alter table public.business_profiles add column if not exists account_holder_name text;
alter table public.business_profiles add column if not exists account_number text;
alter table public.business_profiles add column if not exists ifsc_code text;
alter table public.business_profiles add column if not exists invoice_prefix text;
alter table public.business_profiles add column if not exists terms text;
alter table public.business_profiles add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.business_profiles add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.business_profiles add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists business_profiles_user_id_idx on public.business_profiles (user_id);

-- -----------------------------------------------------------------------------
-- Inventory/catalog and stock logs
-- -----------------------------------------------------------------------------
create table if not exists public.product_categories (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.product_categories add column if not exists user_id text;
alter table public.product_categories add column if not exists name text;
alter table public.product_categories add column if not exists description text;
alter table public.product_categories add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.product_categories add column if not exists updated_at timestamptz not null default timezone('utc', now());
create unique index if not exists product_categories_user_name_key on public.product_categories (user_id, lower(name));

create table if not exists public.products (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  category_id text,
  name text not null,
  category text,
  sku text,
  barcode text,
  hsn_code text,
  gst_rate numeric(7,2) default 0,
  quantity numeric(14,3) not null default 0,
  quantity_unit text not null default 'pcs',
  price numeric(14,2) not null default 0,
  purchase_price numeric(14,2) default 0,
  sale_price numeric(14,2) default 0,
  low_stock_threshold numeric(14,3),
  critical_stock_threshold numeric(14,3),
  reorder_level numeric(14,3),
  supplier text,
  expiry date,
  batch_no text,
  serial_tracking_note text,
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.products add column if not exists user_id text;
alter table public.products add column if not exists category_id text;
alter table public.products add column if not exists name text;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists sku text;
alter table public.products add column if not exists barcode text;
alter table public.products add column if not exists hsn_code text;
alter table public.products add column if not exists gst_rate numeric(7,2) default 0;
alter table public.products add column if not exists quantity numeric(14,3) default 0;
alter table public.products add column if not exists quantity_unit text not null default 'pcs';
alter table public.products add column if not exists price numeric(14,2) default 0;
alter table public.products add column if not exists purchase_price numeric(14,2) default 0;
alter table public.products add column if not exists sale_price numeric(14,2) default 0;
alter table public.products add column if not exists low_stock_threshold numeric(14,3);
alter table public.products add column if not exists critical_stock_threshold numeric(14,3);
alter table public.products add column if not exists reorder_level numeric(14,3);
alter table public.products add column if not exists supplier text;
alter table public.products add column if not exists expiry date;
alter table public.products add column if not exists batch_no text;
alter table public.products add column if not exists serial_tracking_note text;
alter table public.products add column if not exists note text;
alter table public.products add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.products add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists products_user_id_idx on public.products (user_id);
create index if not exists products_user_name_idx on public.products (user_id, name);
create index if not exists products_user_category_idx on public.products (user_id, category);
create index if not exists products_user_sku_idx on public.products (user_id, sku);
create index if not exists products_user_expiry_idx on public.products (user_id, expiry);

create table if not exists public.product_logs (
  id text primary key default gen_random_uuid()::text,
  user_id text,
  product_id text not null,
  product_name text,
  product_category text,
  product_sku text,
  product_hsn_code text,
  batch_no text,
  location_id text,
  location_name text,
  quantity_added numeric(14,3) not null default 0,
  quantity numeric(14,3),
  quantity_unit text not null default 'pcs',
  old_stock numeric(14,3),
  new_stock numeric(14,3),
  type text not null default 'in',
  reason text,
  price numeric(14,2) not null default 0,
  amount numeric(14,2),
  taxable_amount numeric(14,2),
  gst_rate numeric(7,2),
  cgst_amount numeric(14,2),
  sgst_amount numeric(14,2),
  igst_amount numeric(14,2),
  gst_amount numeric(14,2),
  expiry date,
  date timestamptz not null default timezone('utc', now()),
  transaction_id text,
  transaction_type text,
  invoice_receipt_no text,
  payment_mode text,
  payment_status text,
  products jsonb,
  note text,
  notes text,
  corrected_at timestamptz,
  correction_label text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.product_logs add column if not exists user_id text;
alter table public.product_logs add column if not exists product_id text;
alter table public.product_logs add column if not exists product_name text;
alter table public.product_logs add column if not exists product_category text;
alter table public.product_logs add column if not exists product_sku text;
alter table public.product_logs add column if not exists product_hsn_code text;
alter table public.product_logs add column if not exists batch_no text;
alter table public.product_logs add column if not exists location_id text;
alter table public.product_logs add column if not exists location_name text;
alter table public.product_logs add column if not exists quantity_added numeric(14,3) default 0;
alter table public.product_logs add column if not exists quantity numeric(14,3);
alter table public.product_logs add column if not exists quantity_unit text not null default 'pcs';
alter table public.product_logs add column if not exists old_stock numeric(14,3);
alter table public.product_logs add column if not exists new_stock numeric(14,3);
alter table public.product_logs add column if not exists type text default 'in';
alter table public.product_logs add column if not exists reason text;
alter table public.product_logs add column if not exists price numeric(14,2) default 0;
alter table public.product_logs add column if not exists amount numeric(14,2);
alter table public.product_logs add column if not exists taxable_amount numeric(14,2);
alter table public.product_logs add column if not exists gst_rate numeric(7,2);
alter table public.product_logs add column if not exists cgst_amount numeric(14,2);
alter table public.product_logs add column if not exists sgst_amount numeric(14,2);
alter table public.product_logs add column if not exists igst_amount numeric(14,2);
alter table public.product_logs add column if not exists gst_amount numeric(14,2);
alter table public.product_logs add column if not exists expiry date;
alter table public.product_logs add column if not exists date timestamptz default timezone('utc', now());
alter table public.product_logs add column if not exists transaction_id text;
alter table public.product_logs add column if not exists transaction_type text;
alter table public.product_logs add column if not exists invoice_receipt_no text;
alter table public.product_logs add column if not exists payment_mode text;
alter table public.product_logs add column if not exists payment_status text;
alter table public.product_logs add column if not exists products jsonb;
alter table public.product_logs add column if not exists note text;
alter table public.product_logs add column if not exists notes text;
alter table public.product_logs add column if not exists corrected_at timestamptz;
alter table public.product_logs add column if not exists correction_label text;
alter table public.product_logs add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.product_logs add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists product_logs_user_id_idx on public.product_logs (user_id);
create index if not exists product_logs_product_date_idx on public.product_logs (product_id, date desc);
create index if not exists product_logs_transaction_id_idx on public.product_logs (transaction_id);
create index if not exists product_logs_invoice_receipt_no_idx on public.product_logs (invoice_receipt_no);

create or replace function public.mdmg_product_logs_set_user_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.user_id is null and new.product_id is not null then
    select p.user_id into new.user_id from public.products p where p.id = new.product_id limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists mdmg_product_logs_set_user_id_trg on public.product_logs;
create trigger mdmg_product_logs_set_user_id_trg
before insert or update on public.product_logs
for each row execute function public.mdmg_product_logs_set_user_id();

create table if not exists public.inventory_locations (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  name text not null,
  is_default boolean not null default false,
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.inventory_locations add column if not exists user_id text;
alter table public.inventory_locations add column if not exists name text;
alter table public.inventory_locations add column if not exists is_default boolean not null default false;
alter table public.inventory_locations add column if not exists note text;
alter table public.inventory_locations add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.inventory_locations add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.inventory_locations add column if not exists updated_at timestamptz not null default timezone('utc', now());
create unique index if not exists inventory_locations_user_name_key on public.inventory_locations (user_id, lower(name));

create table if not exists public.product_location_stocks (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  product_id text not null,
  location_id text not null,
  quantity numeric(14,3) not null default 0,
  quantity_unit text default 'pcs',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.product_location_stocks add column if not exists user_id text;
alter table public.product_location_stocks add column if not exists product_id text;
alter table public.product_location_stocks add column if not exists location_id text;
alter table public.product_location_stocks add column if not exists quantity numeric(14,3) default 0;
alter table public.product_location_stocks add column if not exists quantity_unit text default 'pcs';
alter table public.product_location_stocks add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.product_location_stocks add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.product_location_stocks add column if not exists updated_at timestamptz not null default timezone('utc', now());
create unique index if not exists product_location_stocks_product_location_key on public.product_location_stocks (product_id, location_id);
create index if not exists product_location_stocks_user_product_idx on public.product_location_stocks (user_id, product_id);

create table if not exists public.inventory_batches (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  product_id text not null,
  location_id text,
  location_name text,
  batch_no text,
  expiry date,
  quantity numeric(14,3) not null default 0,
  quantity_unit text default 'pcs',
  cost_price numeric(14,2),
  sale_price numeric(14,2),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.inventory_batches add column if not exists user_id text;
alter table public.inventory_batches add column if not exists product_id text;
alter table public.inventory_batches add column if not exists location_id text;
alter table public.inventory_batches add column if not exists location_name text;
alter table public.inventory_batches add column if not exists batch_no text;
alter table public.inventory_batches add column if not exists expiry date;
alter table public.inventory_batches add column if not exists quantity numeric(14,3) default 0;
alter table public.inventory_batches add column if not exists quantity_unit text default 'pcs';
alter table public.inventory_batches add column if not exists cost_price numeric(14,2);
alter table public.inventory_batches add column if not exists sale_price numeric(14,2);
alter table public.inventory_batches add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.inventory_batches add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.inventory_batches add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists inventory_batches_user_product_idx on public.inventory_batches (user_id, product_id);
create index if not exists inventory_batches_product_expiry_idx on public.inventory_batches (product_id, expiry);

create table if not exists public.stock_transfers (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  transfer_no text,
  product_id text,
  product_name text,
  from_location_id text,
  from_location_name text,
  to_location_id text,
  to_location_name text,
  quantity numeric(14,3) not null default 0,
  quantity_unit text default 'pcs',
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.stock_transfers add column if not exists user_id text;
alter table public.stock_transfers add column if not exists transfer_no text;
alter table public.stock_transfers add column if not exists product_id text;
alter table public.stock_transfers add column if not exists product_name text;
alter table public.stock_transfers add column if not exists from_location_id text;
alter table public.stock_transfers add column if not exists from_location_name text;
alter table public.stock_transfers add column if not exists to_location_id text;
alter table public.stock_transfers add column if not exists to_location_name text;
alter table public.stock_transfers add column if not exists quantity numeric(14,3) default 0;
alter table public.stock_transfers add column if not exists quantity_unit text default 'pcs';
alter table public.stock_transfers add column if not exists note text;
alter table public.stock_transfers add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.stock_transfers add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.stock_transfers add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists stock_transfers_user_created_idx on public.stock_transfers (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Parties, sales, purchases, GST, returns, accounting
-- -----------------------------------------------------------------------------
create table if not exists public.parties (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  business_id text,
  type text not null default 'customer',
  name text not null,
  normalized_name text,
  mobile text,
  phone text,
  email text,
  gstin text,
  address text,
  city text,
  district text,
  state text,
  pincode text,
  opening_balance numeric(14,2) not null default 0,
  receivable numeric(14,2) not null default 0,
  payable numeric(14,2) not null default 0,
  notes text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.parties add column if not exists user_id text;
alter table public.parties add column if not exists business_id text;
alter table public.parties add column if not exists type text default 'customer';
alter table public.parties add column if not exists name text;
alter table public.parties add column if not exists normalized_name text;
alter table public.parties add column if not exists mobile text;
alter table public.parties add column if not exists phone text;
alter table public.parties add column if not exists email text;
alter table public.parties add column if not exists gstin text;
alter table public.parties add column if not exists address text;
alter table public.parties add column if not exists city text;
alter table public.parties add column if not exists district text;
alter table public.parties add column if not exists state text;
alter table public.parties add column if not exists pincode text;
alter table public.parties add column if not exists opening_balance numeric(14,2) default 0;
alter table public.parties add column if not exists receivable numeric(14,2) default 0;
alter table public.parties add column if not exists payable numeric(14,2) default 0;
alter table public.parties add column if not exists notes text;
alter table public.parties add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.parties add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.parties add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists parties_user_type_idx on public.parties (user_id, type);
create unique index if not exists parties_user_normalized_name_idx on public.parties (user_id, normalized_name);

create table if not exists public.customers (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  party_id text,
  name text not null,
  mobile text,
  email text,
  gstin text,
  address text,
  city text,
  state text,
  pincode text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.customers add column if not exists user_id text;
alter table public.customers add column if not exists party_id text;
alter table public.customers add column if not exists name text;
alter table public.customers add column if not exists mobile text;
alter table public.customers add column if not exists email text;
alter table public.customers add column if not exists gstin text;
alter table public.customers add column if not exists address text;
alter table public.customers add column if not exists city text;
alter table public.customers add column if not exists state text;
alter table public.customers add column if not exists pincode text;
alter table public.customers add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.customers add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.customers add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists customers_user_name_idx on public.customers (user_id, name);

create table if not exists public.suppliers (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  party_id text,
  name text not null,
  mobile text,
  email text,
  gstin text,
  address text,
  city text,
  state text,
  pincode text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.suppliers add column if not exists user_id text;
alter table public.suppliers add column if not exists party_id text;
alter table public.suppliers add column if not exists name text;
alter table public.suppliers add column if not exists mobile text;
alter table public.suppliers add column if not exists email text;
alter table public.suppliers add column if not exists gstin text;
alter table public.suppliers add column if not exists address text;
alter table public.suppliers add column if not exists city text;
alter table public.suppliers add column if not exists state text;
alter table public.suppliers add column if not exists pincode text;
alter table public.suppliers add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.suppliers add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.suppliers add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists suppliers_user_name_idx on public.suppliers (user_id, name);

create table if not exists public.party_ledger (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  business_id text,
  party_id text not null,
  type text not null,
  amount numeric(14,2) not null default 0,
  payment_mode text,
  note text,
  reference text,
  entry_date timestamptz not null default timezone('utc', now()),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.party_ledger add column if not exists user_id text;
alter table public.party_ledger add column if not exists business_id text;
alter table public.party_ledger add column if not exists party_id text;
alter table public.party_ledger add column if not exists type text;
alter table public.party_ledger add column if not exists amount numeric(14,2) default 0;
alter table public.party_ledger add column if not exists payment_mode text;
alter table public.party_ledger add column if not exists note text;
alter table public.party_ledger add column if not exists reference text;
alter table public.party_ledger add column if not exists entry_date timestamptz default timezone('utc', now());
alter table public.party_ledger add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.party_ledger add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.party_ledger add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists party_ledger_user_party_idx on public.party_ledger (user_id, party_id, entry_date desc);

create table if not exists public.sales (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  receipt_no text,
  sale_date date,
  sale_date_time timestamptz default timezone('utc', now()),
  party_id text,
  customer jsonb,
  taxable_amount numeric(14,2) default 0,
  gst_amount numeric(14,2) default 0,
  total_amount numeric(14,2) default 0,
  amount_paid numeric(14,2) default 0,
  due_amount numeric(14,2) default 0,
  payment_status text,
  payment_mode text,
  entry_mode text,
  status text default 'completed',
  gst_enabled boolean default false,
  note text,
  reference text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.sales add column if not exists user_id text;
alter table public.sales add column if not exists receipt_no text;
alter table public.sales add column if not exists sale_date date;
alter table public.sales add column if not exists sale_date_time timestamptz default timezone('utc', now());
alter table public.sales add column if not exists party_id text;
alter table public.sales add column if not exists customer jsonb;
alter table public.sales add column if not exists taxable_amount numeric(14,2) default 0;
alter table public.sales add column if not exists gst_amount numeric(14,2) default 0;
alter table public.sales add column if not exists total_amount numeric(14,2) default 0;
alter table public.sales add column if not exists amount_paid numeric(14,2) default 0;
alter table public.sales add column if not exists due_amount numeric(14,2) default 0;
alter table public.sales add column if not exists payment_status text;
alter table public.sales add column if not exists payment_mode text;
alter table public.sales add column if not exists entry_mode text;
alter table public.sales add column if not exists status text default 'completed';
alter table public.sales add column if not exists gst_enabled boolean default false;
alter table public.sales add column if not exists note text;
alter table public.sales add column if not exists reference text;
alter table public.sales add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.sales add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.sales add column if not exists updated_at timestamptz not null default timezone('utc', now());
create unique index if not exists sales_user_receipt_no_key on public.sales (user_id, receipt_no);
create index if not exists sales_user_sale_date_idx on public.sales (user_id, sale_date desc);
create index if not exists sales_user_party_idx on public.sales (user_id, party_id);

create table if not exists public.sale_items (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  sale_id text not null,
  product_id text,
  name text not null,
  category text,
  sku text,
  hsn_code text,
  quantity numeric(14,3) default 0,
  quantity_unit text default 'pcs',
  sale_price numeric(14,2) default 0,
  discount numeric(14,2) default 0,
  taxable_amount numeric(14,2) default 0,
  gst_rate numeric(7,2) default 0,
  cgst_amount numeric(14,2) default 0,
  sgst_amount numeric(14,2) default 0,
  igst_amount numeric(14,2) default 0,
  gst_amount numeric(14,2) default 0,
  line_total numeric(14,2) default 0,
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.sale_items add column if not exists user_id text;
alter table public.sale_items add column if not exists sale_id text;
alter table public.sale_items add column if not exists product_id text;
alter table public.sale_items add column if not exists name text;
alter table public.sale_items add column if not exists category text;
alter table public.sale_items add column if not exists sku text;
alter table public.sale_items add column if not exists hsn_code text;
alter table public.sale_items add column if not exists quantity numeric(14,3) default 0;
alter table public.sale_items add column if not exists quantity_unit text default 'pcs';
alter table public.sale_items add column if not exists sale_price numeric(14,2) default 0;
alter table public.sale_items add column if not exists discount numeric(14,2) default 0;
alter table public.sale_items add column if not exists taxable_amount numeric(14,2) default 0;
alter table public.sale_items add column if not exists gst_rate numeric(7,2) default 0;
alter table public.sale_items add column if not exists cgst_amount numeric(14,2) default 0;
alter table public.sale_items add column if not exists sgst_amount numeric(14,2) default 0;
alter table public.sale_items add column if not exists igst_amount numeric(14,2) default 0;
alter table public.sale_items add column if not exists gst_amount numeric(14,2) default 0;
alter table public.sale_items add column if not exists line_total numeric(14,2) default 0;
alter table public.sale_items add column if not exists note text;
alter table public.sale_items add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.sale_items add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.sale_items add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists sale_items_user_sale_idx on public.sale_items (user_id, sale_id);
create index if not exists sale_items_product_idx on public.sale_items (product_id);

create table if not exists public.purchases (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  supplier_id text,
  party_id text,
  bill_no text,
  supplier_name text,
  purchase_date date,
  purchase_date_time timestamptz default timezone('utc', now()),
  payment_status text,
  payment_mode text,
  entry_mode text,
  details_status text,
  taxable_amount numeric(14,2) default 0,
  cgst_total numeric(14,2) default 0,
  sgst_total numeric(14,2) default 0,
  igst_total numeric(14,2) default 0,
  gst_amount numeric(14,2) default 0,
  total_amount numeric(14,2) default 0,
  amount_paid numeric(14,2) default 0,
  due_amount numeric(14,2) default 0,
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.purchases add column if not exists user_id text;
alter table public.purchases add column if not exists supplier_id text;
alter table public.purchases add column if not exists party_id text;
alter table public.purchases add column if not exists bill_no text;
alter table public.purchases add column if not exists supplier_name text;
alter table public.purchases add column if not exists purchase_date date;
alter table public.purchases add column if not exists purchase_date_time timestamptz default timezone('utc', now());
alter table public.purchases add column if not exists payment_status text;
alter table public.purchases add column if not exists payment_mode text;
alter table public.purchases add column if not exists entry_mode text;
alter table public.purchases add column if not exists details_status text;
alter table public.purchases add column if not exists taxable_amount numeric(14,2) default 0;
alter table public.purchases add column if not exists cgst_total numeric(14,2) default 0;
alter table public.purchases add column if not exists sgst_total numeric(14,2) default 0;
alter table public.purchases add column if not exists igst_total numeric(14,2) default 0;
alter table public.purchases add column if not exists gst_amount numeric(14,2) default 0;
alter table public.purchases add column if not exists total_amount numeric(14,2) default 0;
alter table public.purchases add column if not exists amount_paid numeric(14,2) default 0;
alter table public.purchases add column if not exists due_amount numeric(14,2) default 0;
alter table public.purchases add column if not exists note text;
alter table public.purchases add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.purchases add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.purchases add column if not exists updated_at timestamptz not null default timezone('utc', now());
create unique index if not exists purchases_user_bill_no_key on public.purchases (user_id, bill_no);
create index if not exists purchases_user_purchase_date_idx on public.purchases (user_id, purchase_date desc);
create index if not exists purchases_user_supplier_idx on public.purchases (user_id, supplier_name);
create index if not exists purchases_user_payment_status_idx on public.purchases (user_id, payment_status);

create table if not exists public.purchase_items (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  purchase_id text not null,
  product_id text,
  name text not null,
  category text,
  sku text,
  hsn_code text,
  batch_no text,
  quantity numeric(14,3) default 0,
  quantity_unit text default 'pcs',
  rate numeric(14,2) default 0,
  price numeric(14,2) default 0,
  purchase_price numeric(14,2) default 0,
  gst_rate numeric(7,2) default 0,
  taxable_amount numeric(14,2) default 0,
  cgst_amount numeric(14,2) default 0,
  sgst_amount numeric(14,2) default 0,
  igst_amount numeric(14,2) default 0,
  line_total numeric(14,2) default 0,
  total_amount numeric(14,2) default 0,
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.purchase_items add column if not exists user_id text;
alter table public.purchase_items add column if not exists purchase_id text;
alter table public.purchase_items add column if not exists product_id text;
alter table public.purchase_items add column if not exists name text;
alter table public.purchase_items add column if not exists category text;
alter table public.purchase_items add column if not exists sku text;
alter table public.purchase_items add column if not exists hsn_code text;
alter table public.purchase_items add column if not exists batch_no text;
alter table public.purchase_items add column if not exists quantity numeric(14,3) default 0;
alter table public.purchase_items add column if not exists quantity_unit text default 'pcs';
alter table public.purchase_items add column if not exists rate numeric(14,2) default 0;
alter table public.purchase_items add column if not exists price numeric(14,2) default 0;
alter table public.purchase_items add column if not exists purchase_price numeric(14,2) default 0;
alter table public.purchase_items add column if not exists gst_rate numeric(7,2) default 0;
alter table public.purchase_items add column if not exists taxable_amount numeric(14,2) default 0;
alter table public.purchase_items add column if not exists cgst_amount numeric(14,2) default 0;
alter table public.purchase_items add column if not exists sgst_amount numeric(14,2) default 0;
alter table public.purchase_items add column if not exists igst_amount numeric(14,2) default 0;
alter table public.purchase_items add column if not exists line_total numeric(14,2) default 0;
alter table public.purchase_items add column if not exists total_amount numeric(14,2) default 0;
alter table public.purchase_items add column if not exists note text;
alter table public.purchase_items add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.purchase_items add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.purchase_items add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists purchase_items_user_purchase_idx on public.purchase_items (user_id, purchase_id);
create index if not exists purchase_items_product_idx on public.purchase_items (product_id);

create table if not exists public.gst_invoices (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  sale_id text,
  customer_id text,
  party_id text,
  business_profile_id text,
  invoice_no text,
  invoice_date date,
  due_date date,
  buyer_name text,
  buyer_gstin text,
  copy_mode text default 'customer',
  status text default 'draft',
  place_of_supply text,
  seller_state text,
  buyer_state text,
  is_interstate boolean default false,
  taxable_amount numeric(14,2) default 0,
  cgst_total numeric(14,2) default 0,
  sgst_total numeric(14,2) default 0,
  igst_total numeric(14,2) default 0,
  total_gst numeric(14,2) default 0,
  grand_total numeric(14,2) default 0,
  amount_paid numeric(14,2) default 0,
  due_amount numeric(14,2) default 0,
  notes text,
  terms text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.gst_invoices add column if not exists user_id text;
alter table public.gst_invoices add column if not exists sale_id text;
alter table public.gst_invoices add column if not exists customer_id text;
alter table public.gst_invoices add column if not exists party_id text;
alter table public.gst_invoices add column if not exists business_profile_id text;
alter table public.gst_invoices add column if not exists invoice_no text;
alter table public.gst_invoices add column if not exists invoice_date date;
alter table public.gst_invoices add column if not exists due_date date;
alter table public.gst_invoices add column if not exists buyer_name text;
alter table public.gst_invoices add column if not exists buyer_gstin text;
alter table public.gst_invoices add column if not exists copy_mode text default 'customer';
alter table public.gst_invoices add column if not exists status text default 'draft';
alter table public.gst_invoices add column if not exists place_of_supply text;
alter table public.gst_invoices add column if not exists seller_state text;
alter table public.gst_invoices add column if not exists buyer_state text;
alter table public.gst_invoices add column if not exists is_interstate boolean default false;
alter table public.gst_invoices add column if not exists taxable_amount numeric(14,2) default 0;
alter table public.gst_invoices add column if not exists cgst_total numeric(14,2) default 0;
alter table public.gst_invoices add column if not exists sgst_total numeric(14,2) default 0;
alter table public.gst_invoices add column if not exists igst_total numeric(14,2) default 0;
alter table public.gst_invoices add column if not exists total_gst numeric(14,2) default 0;
alter table public.gst_invoices add column if not exists grand_total numeric(14,2) default 0;
alter table public.gst_invoices add column if not exists amount_paid numeric(14,2) default 0;
alter table public.gst_invoices add column if not exists due_amount numeric(14,2) default 0;
alter table public.gst_invoices add column if not exists notes text;
alter table public.gst_invoices add column if not exists terms text;
alter table public.gst_invoices add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.gst_invoices add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.gst_invoices add column if not exists updated_at timestamptz not null default timezone('utc', now());
create unique index if not exists gst_invoices_user_invoice_no_key on public.gst_invoices (user_id, invoice_no);
create index if not exists gst_invoices_user_invoice_date_idx on public.gst_invoices (user_id, invoice_date desc);

create table if not exists public.gst_invoice_items (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  gst_invoice_id text not null,
  product_id text,
  name text not null,
  description text,
  hsn_code text,
  quantity numeric(14,3) default 0,
  unit text default 'pcs',
  rate numeric(14,2) default 0,
  discount numeric(14,2) default 0,
  gst_rate numeric(7,2) default 0,
  taxable_amount numeric(14,2) default 0,
  cgst_amount numeric(14,2) default 0,
  sgst_amount numeric(14,2) default 0,
  igst_amount numeric(14,2) default 0,
  total_amount numeric(14,2) default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.gst_invoice_items add column if not exists user_id text;
alter table public.gst_invoice_items add column if not exists gst_invoice_id text;
alter table public.gst_invoice_items add column if not exists product_id text;
alter table public.gst_invoice_items add column if not exists name text;
alter table public.gst_invoice_items add column if not exists description text;
alter table public.gst_invoice_items add column if not exists hsn_code text;
alter table public.gst_invoice_items add column if not exists quantity numeric(14,3) default 0;
alter table public.gst_invoice_items add column if not exists unit text default 'pcs';
alter table public.gst_invoice_items add column if not exists rate numeric(14,2) default 0;
alter table public.gst_invoice_items add column if not exists discount numeric(14,2) default 0;
alter table public.gst_invoice_items add column if not exists gst_rate numeric(7,2) default 0;
alter table public.gst_invoice_items add column if not exists taxable_amount numeric(14,2) default 0;
alter table public.gst_invoice_items add column if not exists cgst_amount numeric(14,2) default 0;
alter table public.gst_invoice_items add column if not exists sgst_amount numeric(14,2) default 0;
alter table public.gst_invoice_items add column if not exists igst_amount numeric(14,2) default 0;
alter table public.gst_invoice_items add column if not exists total_amount numeric(14,2) default 0;
alter table public.gst_invoice_items add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.gst_invoice_items add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.gst_invoice_items add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists gst_invoice_items_user_invoice_idx on public.gst_invoice_items (user_id, gst_invoice_id);

create table if not exists public.estimates (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  estimate_no text,
  estimate_date date,
  estimate_date_time timestamptz default timezone('utc', now()),
  expiry_date date,
  party_id text,
  customer jsonb,
  taxable_amount numeric(14,2) default 0,
  gst_amount numeric(14,2) default 0,
  total_amount numeric(14,2) default 0,
  status text default 'draft',
  gst_enabled boolean default false,
  note text,
  terms text,
  reference text,
  converted_sale_id text,
  converted_at timestamptz,
  converted_invoice_draft_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.estimates add column if not exists user_id text;
alter table public.estimates add column if not exists estimate_no text;
alter table public.estimates add column if not exists estimate_date date;
alter table public.estimates add column if not exists estimate_date_time timestamptz default timezone('utc', now());
alter table public.estimates add column if not exists expiry_date date;
alter table public.estimates add column if not exists party_id text;
alter table public.estimates add column if not exists customer jsonb;
alter table public.estimates add column if not exists taxable_amount numeric(14,2) default 0;
alter table public.estimates add column if not exists gst_amount numeric(14,2) default 0;
alter table public.estimates add column if not exists total_amount numeric(14,2) default 0;
alter table public.estimates add column if not exists status text default 'draft';
alter table public.estimates add column if not exists gst_enabled boolean default false;
alter table public.estimates add column if not exists note text;
alter table public.estimates add column if not exists terms text;
alter table public.estimates add column if not exists reference text;
alter table public.estimates add column if not exists converted_sale_id text;
alter table public.estimates add column if not exists converted_at timestamptz;
alter table public.estimates add column if not exists converted_invoice_draft_at timestamptz;
alter table public.estimates add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.estimates add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.estimates add column if not exists updated_at timestamptz not null default timezone('utc', now());
create unique index if not exists estimates_user_estimate_no_key on public.estimates (user_id, estimate_no);
create index if not exists estimates_user_date_idx on public.estimates (user_id, estimate_date desc);

create table if not exists public.return_documents (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  document_no text,
  kind text,
  status text default 'completed',
  document_date date,
  linked_sale_id text,
  linked_purchase_id text,
  linked_invoice_id text,
  party_id text,
  customer jsonb,
  supplier jsonb,
  stock_impact text,
  taxable_amount numeric(14,2) default 0,
  gst_amount numeric(14,2) default 0,
  total_amount numeric(14,2) default 0,
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.return_documents add column if not exists user_id text;
alter table public.return_documents add column if not exists document_no text;
alter table public.return_documents add column if not exists kind text;
alter table public.return_documents add column if not exists status text default 'completed';
alter table public.return_documents add column if not exists document_date date;
alter table public.return_documents add column if not exists linked_sale_id text;
alter table public.return_documents add column if not exists linked_purchase_id text;
alter table public.return_documents add column if not exists linked_invoice_id text;
alter table public.return_documents add column if not exists party_id text;
alter table public.return_documents add column if not exists customer jsonb;
alter table public.return_documents add column if not exists supplier jsonb;
alter table public.return_documents add column if not exists stock_impact text;
alter table public.return_documents add column if not exists taxable_amount numeric(14,2) default 0;
alter table public.return_documents add column if not exists gst_amount numeric(14,2) default 0;
alter table public.return_documents add column if not exists total_amount numeric(14,2) default 0;
alter table public.return_documents add column if not exists note text;
alter table public.return_documents add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.return_documents add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.return_documents add column if not exists updated_at timestamptz not null default timezone('utc', now());
create unique index if not exists return_documents_user_document_no_key on public.return_documents (user_id, document_no);
create index if not exists return_documents_user_date_idx on public.return_documents (user_id, document_date desc);

create table if not exists public.expenses (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  expense_no text,
  category text,
  amount numeric(14,2) not null default 0,
  expense_date date,
  payment_mode text,
  party_id text,
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.expenses add column if not exists user_id text;
alter table public.expenses add column if not exists expense_no text;
alter table public.expenses add column if not exists category text;
alter table public.expenses add column if not exists amount numeric(14,2) default 0;
alter table public.expenses add column if not exists expense_date date;
alter table public.expenses add column if not exists payment_mode text;
alter table public.expenses add column if not exists party_id text;
alter table public.expenses add column if not exists note text;
alter table public.expenses add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.expenses add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.expenses add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists expenses_user_date_idx on public.expenses (user_id, expense_date desc);

create table if not exists public.cashbook_entries (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  entry_no text,
  entry_date date,
  type text,
  account text,
  source text,
  amount numeric(14,2) not null default 0,
  payment_mode text,
  reference text,
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.cashbook_entries add column if not exists user_id text;
alter table public.cashbook_entries add column if not exists entry_no text;
alter table public.cashbook_entries add column if not exists entry_date date;
alter table public.cashbook_entries add column if not exists type text;
alter table public.cashbook_entries add column if not exists account text;
alter table public.cashbook_entries add column if not exists source text;
alter table public.cashbook_entries add column if not exists amount numeric(14,2) default 0;
alter table public.cashbook_entries add column if not exists payment_mode text;
alter table public.cashbook_entries add column if not exists reference text;
alter table public.cashbook_entries add column if not exists note text;
alter table public.cashbook_entries add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.cashbook_entries add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.cashbook_entries add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists cashbook_entries_user_date_idx on public.cashbook_entries (user_id, entry_date desc);

-- -----------------------------------------------------------------------------
-- Subscription/usage and sync metadata
-- -----------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  plan text not null default 'free',
  status text not null default 'active',
  trial_ends_at timestamptz,
  subscription_ends_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.subscriptions add column if not exists user_id text;
alter table public.subscriptions add column if not exists plan text default 'free';
alter table public.subscriptions add column if not exists status text default 'active';
alter table public.subscriptions add column if not exists trial_ends_at timestamptz;
alter table public.subscriptions add column if not exists subscription_ends_at timestamptz;
alter table public.subscriptions add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.subscriptions add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.subscriptions add column if not exists updated_at timestamptz not null default timezone('utc', now());
create unique index if not exists subscriptions_user_id_key on public.subscriptions (user_id);

create table if not exists public.usage_tracking (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  feature text not null,
  period_key text not null,
  used_count integer not null default 0,
  limit_count integer,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.usage_tracking add column if not exists user_id text;
alter table public.usage_tracking add column if not exists feature text;
alter table public.usage_tracking add column if not exists period_key text;
alter table public.usage_tracking add column if not exists used_count integer default 0;
alter table public.usage_tracking add column if not exists limit_count integer;
alter table public.usage_tracking add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.usage_tracking add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.usage_tracking add column if not exists updated_at timestamptz not null default timezone('utc', now());
create unique index if not exists usage_tracking_user_feature_period_key on public.usage_tracking (user_id, feature, period_key);

create table if not exists public.sync_metadata (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  module text not null,
  last_synced_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.sync_metadata add column if not exists user_id text;
alter table public.sync_metadata add column if not exists module text;
alter table public.sync_metadata add column if not exists last_synced_at timestamptz;
alter table public.sync_metadata add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.sync_metadata add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.sync_metadata add column if not exists updated_at timestamptz not null default timezone('utc', now());
create unique index if not exists sync_metadata_user_module_key on public.sync_metadata (user_id, module);

-- -----------------------------------------------------------------------------
-- Updated-at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  v_table_name text;
  trigger_name text;
begin
  foreach v_table_name in array array[
    'profiles','business_profiles','product_categories','products','product_logs',
    'inventory_locations','product_location_stocks','inventory_batches','stock_transfers',
    'parties','customers','suppliers','party_ledger','sales','sale_items','purchases',
    'purchase_items','gst_invoices','gst_invoice_items','estimates','return_documents',
    'expenses','cashbook_entries','subscriptions','usage_tracking','sync_metadata'
  ] loop
    trigger_name := 'mdmg_set_updated_at_' || v_table_name;
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = v_table_name and column_name = 'updated_at'
    ) and not exists (
      select 1 from pg_trigger where tgname = trigger_name
    ) then
      execute format(
        'create trigger %I before update on public.%I for each row execute function public.mdmg_set_updated_at()',
        trigger_name,
        v_table_name
      );
    end if;
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security: safe owner policies for future direct Supabase Auth use.
-- API routes that use service_role continue to bypass RLS.
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','business_profiles','product_categories','products','product_logs',
    'inventory_locations','product_location_stocks','inventory_batches','stock_transfers',
    'parties','customers','suppliers','party_ledger','sales','sale_items','purchases',
    'purchase_items','gst_invoices','gst_invoice_items','estimates','return_documents',
    'expenses','cashbook_entries','subscriptions','usage_tracking','sync_metadata'
  ] loop
    if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = t and c.relkind = 'r') then
      execute format('alter table public.%I enable row level security', t);

      if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'mdmg_owner_select') then
        execute format('create policy mdmg_owner_select on public.%I for select using (user_id = auth.uid()::text)', t);
      end if;
      if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'mdmg_owner_insert') then
        execute format('create policy mdmg_owner_insert on public.%I for insert with check (user_id = auth.uid()::text)', t);
      end if;
      if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'mdmg_owner_update') then
        execute format('create policy mdmg_owner_update on public.%I for update using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text)', t);
      end if;
      if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'mdmg_owner_delete') then
        execute format('create policy mdmg_owner_delete on public.%I for delete using (user_id = auth.uid()::text)', t);
      end if;
    end if;
  end loop;
end;
$$;

notify pgrst, 'reload schema';
