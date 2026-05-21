-- MDMG Phase 6: idempotent Supabase/PostgreSQL relationships
-- Safe to run multiple times. It does not drop tables, delete data, or rewrite existing rows.
-- Important for this project: the app currently appears local-first/Dexie + Firebase-user-id driven.
-- The SQL therefore stores owner ids as TEXT in user_id instead of forcing UUID auth.users ids.
-- RLS policies allow rows only when user_id = auth.uid()::text, or when a trusted service_role is used.
-- If the production sync still writes from a Firebase-only browser client without Supabase Auth/custom JWT,
-- run this on staging first and move cloud sync writes through a trusted server/service-role path before enabling it in production.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.mdmg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- Core owner/profile tables
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  display_name text,
  email text,
  phone text,
  photo_url text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.business_profiles (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
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
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS profile_id text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS owner_name text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS gstin text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS business_type text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS pincode text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS upi_id text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS account_holder_name text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS account_number text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS ifsc_code text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS invoice_prefix text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS terms text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

-- -----------------------------------------------------------------------------
-- Inventory/catalog
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_categories (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  category_id text,
  name text NOT NULL,
  category text,
  sku text,
  barcode text,
  hsn_code text,
  gst_rate numeric(7,2) DEFAULT 0,
  quantity numeric(14,3) NOT NULL DEFAULT 0,
  quantity_unit text,
  price numeric(14,2) NOT NULL DEFAULT 0,
  purchase_price numeric(14,2) DEFAULT 0,
  sale_price numeric(14,2) DEFAULT 0,
  low_stock_threshold numeric(14,3),
  critical_stock_threshold numeric(14,3),
  supplier text,
  expiry date,
  note text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hsn_code text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gst_rate numeric(7,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quantity numeric(14,3) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quantity_unit text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price numeric(14,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS purchase_price numeric(14,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price numeric(14,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold numeric(14,3);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS critical_stock_threshold numeric(14,3);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS expiry date;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  product_id text,
  party_id text,
  type text NOT NULL,
  quantity_change numeric(14,3) NOT NULL DEFAULT 0,
  quantity_after numeric(14,3),
  quantity_unit text,
  price numeric(14,2) DEFAULT 0,
  expiry date,
  reason text,
  note text,
  source_type text,
  source_id text,
  transaction_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS product_id text;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS party_id text;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS quantity_change numeric(14,3) DEFAULT 0;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS quantity_after numeric(14,3);
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS quantity_unit text;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS price numeric(14,2) DEFAULT 0;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS expiry date;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS reason text;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS source_type text;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS source_id text;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS transaction_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

-- -----------------------------------------------------------------------------
-- People / parties
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parties (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  type text NOT NULL DEFAULT 'customer',
  name text NOT NULL,
  mobile text,
  phone text,
  email text,
  gstin text,
  address text,
  city text,
  district text,
  state text,
  pincode text,
  receivable numeric(14,2) NOT NULL DEFAULT 0,
  payable numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS type text DEFAULT 'customer';
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS mobile text;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS gstin text;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS pincode text;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS receivable numeric(14,2) DEFAULT 0;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS payable numeric(14,2) DEFAULT 0;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.customers (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  party_id text,
  name text NOT NULL,
  mobile text,
  phone text,
  email text,
  gstin text,
  address text,
  city text,
  state text,
  pincode text,
  balance_due numeric(14,2) NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS party_id text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS mobile text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS gstin text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS pincode text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS balance_due numeric(14,2) DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.suppliers (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  party_id text,
  name text NOT NULL,
  mobile text,
  phone text,
  email text,
  gstin text,
  address text,
  city text,
  state text,
  pincode text,
  balance_due numeric(14,2) NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS party_id text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS mobile text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS gstin text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS pincode text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS balance_due numeric(14,2) DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.party_ledger (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  party_id text,
  direction text NOT NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  due_amount numeric(14,2) DEFAULT 0,
  reference text,
  source_type text,
  source_id text,
  note text,
  entry_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.party_ledger ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.party_ledger ADD COLUMN IF NOT EXISTS party_id text;
ALTER TABLE public.party_ledger ADD COLUMN IF NOT EXISTS direction text;
ALTER TABLE public.party_ledger ADD COLUMN IF NOT EXISTS amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.party_ledger ADD COLUMN IF NOT EXISTS due_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.party_ledger ADD COLUMN IF NOT EXISTS reference text;
ALTER TABLE public.party_ledger ADD COLUMN IF NOT EXISTS source_type text;
ALTER TABLE public.party_ledger ADD COLUMN IF NOT EXISTS source_id text;
ALTER TABLE public.party_ledger ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.party_ledger ADD COLUMN IF NOT EXISTS entry_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.party_ledger ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.party_ledger ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.party_ledger ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

-- -----------------------------------------------------------------------------
-- Sales / purchase / GST documents
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  customer_id text,
  party_id text,
  receipt_no text,
  sale_date date,
  sale_date_time timestamptz NOT NULL DEFAULT timezone('utc', now()),
  payment_status text,
  payment_mode text,
  taxable_amount numeric(14,2) DEFAULT 0,
  cgst_total numeric(14,2) DEFAULT 0,
  sgst_total numeric(14,2) DEFAULT 0,
  igst_total numeric(14,2) DEFAULT 0,
  gst_amount numeric(14,2) DEFAULT 0,
  discount_amount numeric(14,2) DEFAULT 0,
  total_amount numeric(14,2) DEFAULT 0,
  amount_paid numeric(14,2) DEFAULT 0,
  due_amount numeric(14,2) DEFAULT 0,
  note text,
  status text DEFAULT 'active',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_id text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS party_id text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS receipt_no text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS sale_date date;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS sale_date_time timestamptz DEFAULT timezone('utc', now());
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_status text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_mode text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS taxable_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS cgst_total numeric(14,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS sgst_total numeric(14,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS igst_total numeric(14,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS gst_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS discount_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS total_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS amount_paid numeric(14,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS due_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.sale_items (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  sale_id text NOT NULL,
  product_id text,
  name text NOT NULL,
  hsn_code text,
  quantity numeric(14,3) NOT NULL DEFAULT 0,
  quantity_unit text,
  rate numeric(14,2) DEFAULT 0,
  sale_price numeric(14,2) DEFAULT 0,
  discount numeric(14,2) DEFAULT 0,
  gst_rate numeric(7,2) DEFAULT 0,
  taxable_amount numeric(14,2) DEFAULT 0,
  cgst_amount numeric(14,2) DEFAULT 0,
  sgst_amount numeric(14,2) DEFAULT 0,
  igst_amount numeric(14,2) DEFAULT 0,
  total_amount numeric(14,2) DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS sale_id text;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS product_id text;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS hsn_code text;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS quantity numeric(14,3) DEFAULT 0;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS quantity_unit text;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS rate numeric(14,2) DEFAULT 0;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS sale_price numeric(14,2) DEFAULT 0;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS discount numeric(14,2) DEFAULT 0;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS gst_rate numeric(7,2) DEFAULT 0;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS taxable_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS cgst_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS sgst_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS igst_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS total_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.purchases (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  supplier_id text,
  party_id text,
  bill_no text,
  purchase_date date,
  purchase_date_time timestamptz NOT NULL DEFAULT timezone('utc', now()),
  payment_status text,
  payment_mode text,
  entry_mode text,
  details_status text,
  taxable_amount numeric(14,2) DEFAULT 0,
  cgst_total numeric(14,2) DEFAULT 0,
  sgst_total numeric(14,2) DEFAULT 0,
  igst_total numeric(14,2) DEFAULT 0,
  gst_amount numeric(14,2) DEFAULT 0,
  total_amount numeric(14,2) DEFAULT 0,
  amount_paid numeric(14,2) DEFAULT 0,
  due_amount numeric(14,2) DEFAULT 0,
  note text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS supplier_id text;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS party_id text;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS bill_no text;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS purchase_date date;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS purchase_date_time timestamptz DEFAULT timezone('utc', now());
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS payment_status text;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS payment_mode text;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS entry_mode text;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS details_status text;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS taxable_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS cgst_total numeric(14,2) DEFAULT 0;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS sgst_total numeric(14,2) DEFAULT 0;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS igst_total numeric(14,2) DEFAULT 0;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS gst_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS total_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS amount_paid numeric(14,2) DEFAULT 0;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS due_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.purchase_items (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  purchase_id text NOT NULL,
  product_id text,
  name text NOT NULL,
  hsn_code text,
  quantity numeric(14,3) NOT NULL DEFAULT 0,
  quantity_unit text,
  rate numeric(14,2) DEFAULT 0,
  purchase_price numeric(14,2) DEFAULT 0,
  gst_rate numeric(7,2) DEFAULT 0,
  taxable_amount numeric(14,2) DEFAULT 0,
  cgst_amount numeric(14,2) DEFAULT 0,
  sgst_amount numeric(14,2) DEFAULT 0,
  igst_amount numeric(14,2) DEFAULT 0,
  total_amount numeric(14,2) DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS purchase_id text;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS product_id text;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS hsn_code text;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS quantity numeric(14,3) DEFAULT 0;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS quantity_unit text;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS rate numeric(14,2) DEFAULT 0;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS purchase_price numeric(14,2) DEFAULT 0;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS gst_rate numeric(7,2) DEFAULT 0;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS taxable_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS cgst_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS sgst_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS igst_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS total_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.gst_invoices (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  sale_id text,
  customer_id text,
  party_id text,
  business_profile_id text,
  invoice_no text,
  invoice_date date,
  due_date date,
  copy_mode text DEFAULT 'customer',
  status text DEFAULT 'draft',
  place_of_supply text,
  seller_state text,
  buyer_state text,
  is_interstate boolean DEFAULT false,
  taxable_amount numeric(14,2) DEFAULT 0,
  cgst_total numeric(14,2) DEFAULT 0,
  sgst_total numeric(14,2) DEFAULT 0,
  igst_total numeric(14,2) DEFAULT 0,
  total_gst numeric(14,2) DEFAULT 0,
  grand_total numeric(14,2) DEFAULT 0,
  amount_paid numeric(14,2) DEFAULT 0,
  due_amount numeric(14,2) DEFAULT 0,
  notes text,
  terms text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS sale_id text;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS customer_id text;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS party_id text;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS business_profile_id text;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS invoice_no text;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS invoice_date date;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS copy_mode text DEFAULT 'customer';
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS place_of_supply text;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS seller_state text;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS buyer_state text;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS is_interstate boolean DEFAULT false;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS taxable_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS cgst_total numeric(14,2) DEFAULT 0;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS sgst_total numeric(14,2) DEFAULT 0;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS igst_total numeric(14,2) DEFAULT 0;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS total_gst numeric(14,2) DEFAULT 0;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS grand_total numeric(14,2) DEFAULT 0;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS amount_paid numeric(14,2) DEFAULT 0;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS due_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS terms text;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.gst_invoices ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.gst_invoice_items (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  gst_invoice_id text NOT NULL,
  product_id text,
  name text NOT NULL,
  description text,
  hsn_code text,
  quantity numeric(14,3) NOT NULL DEFAULT 0,
  unit text,
  rate numeric(14,2) DEFAULT 0,
  discount numeric(14,2) DEFAULT 0,
  gst_rate numeric(7,2) DEFAULT 0,
  taxable_amount numeric(14,2) DEFAULT 0,
  cgst_amount numeric(14,2) DEFAULT 0,
  sgst_amount numeric(14,2) DEFAULT 0,
  igst_amount numeric(14,2) DEFAULT 0,
  total_amount numeric(14,2) DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS gst_invoice_id text;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS product_id text;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS hsn_code text;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS quantity numeric(14,3) DEFAULT 0;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS unit text;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS rate numeric(14,2) DEFAULT 0;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS discount numeric(14,2) DEFAULT 0;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS gst_rate numeric(7,2) DEFAULT 0;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS taxable_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS cgst_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS sgst_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS igst_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS total_amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.gst_invoice_items ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

-- -----------------------------------------------------------------------------
-- Money/accounting
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  party_id text,
  customer_id text,
  supplier_id text,
  sale_id text,
  purchase_id text,
  gst_invoice_id text,
  direction text NOT NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  payment_mode text,
  payment_status text,
  reference text,
  note text,
  paid_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS party_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS customer_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS supplier_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS sale_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS purchase_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gst_invoice_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS direction text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_mode text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_status text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS reference text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.expenses (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  expense_no text,
  category text,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  expense_date date,
  expense_date_time timestamptz NOT NULL DEFAULT timezone('utc', now()),
  payment_mode text,
  reference text,
  note text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS expense_no text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS expense_date date;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS expense_date_time timestamptz DEFAULT timezone('utc', now());
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payment_mode text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS reference text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.cashbook_entries (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  entry_no text,
  type text NOT NULL,
  account text,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  entry_date date,
  entry_date_time timestamptz NOT NULL DEFAULT timezone('utc', now()),
  source_type text DEFAULT 'manual',
  source_id text,
  reference text,
  note text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.cashbook_entries ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.cashbook_entries ADD COLUMN IF NOT EXISTS entry_no text;
ALTER TABLE public.cashbook_entries ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.cashbook_entries ADD COLUMN IF NOT EXISTS account text;
ALTER TABLE public.cashbook_entries ADD COLUMN IF NOT EXISTS amount numeric(14,2) DEFAULT 0;
ALTER TABLE public.cashbook_entries ADD COLUMN IF NOT EXISTS entry_date date;
ALTER TABLE public.cashbook_entries ADD COLUMN IF NOT EXISTS entry_date_time timestamptz DEFAULT timezone('utc', now());
ALTER TABLE public.cashbook_entries ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual';
ALTER TABLE public.cashbook_entries ADD COLUMN IF NOT EXISTS source_id text;
ALTER TABLE public.cashbook_entries ADD COLUMN IF NOT EXISTS reference text;
ALTER TABLE public.cashbook_entries ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.cashbook_entries ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.cashbook_entries ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.cashbook_entries ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

-- -----------------------------------------------------------------------------
-- Optional local-first sync metadata / export audit
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sync_metadata (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  collection_name text NOT NULL,
  last_pulled_at timestamptz,
  last_pushed_at timestamptz,
  last_error text,
  device_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.sync_metadata ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.sync_metadata ADD COLUMN IF NOT EXISTS collection_name text;
ALTER TABLE public.sync_metadata ADD COLUMN IF NOT EXISTS last_pulled_at timestamptz;
ALTER TABLE public.sync_metadata ADD COLUMN IF NOT EXISTS last_pushed_at timestamptz;
ALTER TABLE public.sync_metadata ADD COLUMN IF NOT EXISTS last_error text;
ALTER TABLE public.sync_metadata ADD COLUMN IF NOT EXISTS device_id text;
ALTER TABLE public.sync_metadata ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.sync_metadata ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.sync_metadata ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

-- -----------------------------------------------------------------------------
-- Idempotent indexes
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS business_profiles_user_id_idx ON public.business_profiles(user_id);
CREATE INDEX IF NOT EXISTS business_profiles_profile_id_idx ON public.business_profiles(profile_id);
CREATE INDEX IF NOT EXISTS product_categories_user_name_idx ON public.product_categories(user_id, lower(coalesce(name, '')));
CREATE INDEX IF NOT EXISTS products_user_id_idx ON public.products(user_id);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products(category_id);
CREATE INDEX IF NOT EXISTS products_user_name_idx ON public.products(user_id, name);
CREATE INDEX IF NOT EXISTS products_user_sku_idx ON public.products(user_id, sku);
CREATE INDEX IF NOT EXISTS inventory_transactions_user_id_idx ON public.inventory_transactions(user_id);
CREATE INDEX IF NOT EXISTS inventory_transactions_product_id_idx ON public.inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS inventory_transactions_party_id_idx ON public.inventory_transactions(party_id);
CREATE INDEX IF NOT EXISTS inventory_transactions_source_idx ON public.inventory_transactions(source_type, source_id);
CREATE INDEX IF NOT EXISTS inventory_transactions_at_idx ON public.inventory_transactions(transaction_at);
CREATE INDEX IF NOT EXISTS parties_user_id_idx ON public.parties(user_id);
CREATE INDEX IF NOT EXISTS parties_user_type_idx ON public.parties(user_id, type);
CREATE INDEX IF NOT EXISTS parties_user_name_idx ON public.parties(user_id, name);
CREATE INDEX IF NOT EXISTS customers_party_id_idx ON public.customers(party_id);
CREATE INDEX IF NOT EXISTS customers_user_id_idx ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS suppliers_party_id_idx ON public.suppliers(party_id);
CREATE INDEX IF NOT EXISTS suppliers_user_id_idx ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS party_ledger_party_id_idx ON public.party_ledger(party_id);
CREATE INDEX IF NOT EXISTS party_ledger_user_id_idx ON public.party_ledger(user_id);
CREATE INDEX IF NOT EXISTS sales_user_id_idx ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS sales_customer_id_idx ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS sales_party_id_idx ON public.sales(party_id);
CREATE INDEX IF NOT EXISTS sales_date_idx ON public.sales(sale_date_time);
CREATE INDEX IF NOT EXISTS sale_items_sale_id_idx ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS sale_items_product_id_idx ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS purchases_user_id_idx ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS purchases_supplier_id_idx ON public.purchases(supplier_id);
CREATE INDEX IF NOT EXISTS purchases_party_id_idx ON public.purchases(party_id);
CREATE INDEX IF NOT EXISTS purchases_date_idx ON public.purchases(purchase_date_time);
CREATE INDEX IF NOT EXISTS purchase_items_purchase_id_idx ON public.purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS purchase_items_product_id_idx ON public.purchase_items(product_id);
CREATE INDEX IF NOT EXISTS gst_invoices_user_id_idx ON public.gst_invoices(user_id);
CREATE INDEX IF NOT EXISTS gst_invoices_sale_id_idx ON public.gst_invoices(sale_id);
CREATE INDEX IF NOT EXISTS gst_invoices_customer_id_idx ON public.gst_invoices(customer_id);
CREATE INDEX IF NOT EXISTS gst_invoices_party_id_idx ON public.gst_invoices(party_id);
CREATE INDEX IF NOT EXISTS gst_invoices_date_idx ON public.gst_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS gst_invoice_items_invoice_id_idx ON public.gst_invoice_items(gst_invoice_id);
CREATE INDEX IF NOT EXISTS gst_invoice_items_product_id_idx ON public.gst_invoice_items(product_id);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_party_id_idx ON public.payments(party_id);
CREATE INDEX IF NOT EXISTS payments_sale_id_idx ON public.payments(sale_id);
CREATE INDEX IF NOT EXISTS payments_purchase_id_idx ON public.payments(purchase_id);
CREATE INDEX IF NOT EXISTS payments_gst_invoice_id_idx ON public.payments(gst_invoice_id);
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON public.expenses(expense_date_time);
CREATE INDEX IF NOT EXISTS cashbook_entries_user_id_idx ON public.cashbook_entries(user_id);
CREATE INDEX IF NOT EXISTS cashbook_entries_date_idx ON public.cashbook_entries(entry_date_time);
CREATE INDEX IF NOT EXISTS cashbook_entries_source_idx ON public.cashbook_entries(source_type, source_id);
CREATE INDEX IF NOT EXISTS sync_metadata_user_collection_device_idx ON public.sync_metadata(user_id, collection_name, coalesce(device_id, 'default'));

-- -----------------------------------------------------------------------------
-- Idempotent foreign keys. Existing orphan data causes that FK to be skipped with a NOTICE.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.mdmg_add_fk_if_clean(
  p_child regclass,
  p_constraint text,
  p_child_col text,
  p_parent regclass,
  p_parent_col text DEFAULT 'id',
  p_on_delete text DEFAULT 'SET NULL'
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_orphans bigint;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = p_child AND conname = p_constraint
  ) THEN
    RETURN;
  END IF;

  EXECUTE format(
    'SELECT count(*) FROM %s c WHERE c.%I IS NOT NULL AND NOT EXISTS (SELECT 1 FROM %s p WHERE p.%I = c.%I)',
    p_child,
    p_child_col,
    p_parent,
    p_parent_col,
    p_child_col
  ) INTO v_orphans;

  IF v_orphans = 0 THEN
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s(%I) ON DELETE %s',
      p_child,
      p_constraint,
      p_child_col,
      p_parent,
      p_parent_col,
      p_on_delete
    );
  ELSE
    RAISE NOTICE 'Skipped FK % because % orphan row(s) exist in %.', p_constraint, v_orphans, p_child;
  END IF;
END;
$$;

SELECT pg_temp.mdmg_add_fk_if_clean('public.business_profiles', 'business_profiles_profile_id_fkey', 'profile_id', 'public.profiles', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.products', 'products_category_id_fkey', 'category_id', 'public.product_categories', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.inventory_transactions', 'inventory_transactions_product_id_fkey', 'product_id', 'public.products', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.inventory_transactions', 'inventory_transactions_party_id_fkey', 'party_id', 'public.parties', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.customers', 'customers_party_id_fkey', 'party_id', 'public.parties', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.suppliers', 'suppliers_party_id_fkey', 'party_id', 'public.parties', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.party_ledger', 'party_ledger_party_id_fkey', 'party_id', 'public.parties', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.sales', 'sales_customer_id_fkey', 'customer_id', 'public.customers', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.sales', 'sales_party_id_fkey', 'party_id', 'public.parties', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.sale_items', 'sale_items_sale_id_fkey', 'sale_id', 'public.sales', 'id', 'CASCADE');
SELECT pg_temp.mdmg_add_fk_if_clean('public.sale_items', 'sale_items_product_id_fkey', 'product_id', 'public.products', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.purchases', 'purchases_supplier_id_fkey', 'supplier_id', 'public.suppliers', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.purchases', 'purchases_party_id_fkey', 'party_id', 'public.parties', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.purchase_items', 'purchase_items_purchase_id_fkey', 'purchase_id', 'public.purchases', 'id', 'CASCADE');
SELECT pg_temp.mdmg_add_fk_if_clean('public.purchase_items', 'purchase_items_product_id_fkey', 'product_id', 'public.products', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.gst_invoices', 'gst_invoices_sale_id_fkey', 'sale_id', 'public.sales', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.gst_invoices', 'gst_invoices_customer_id_fkey', 'customer_id', 'public.customers', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.gst_invoices', 'gst_invoices_party_id_fkey', 'party_id', 'public.parties', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.gst_invoices', 'gst_invoices_business_profile_id_fkey', 'business_profile_id', 'public.business_profiles', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.gst_invoice_items', 'gst_invoice_items_invoice_id_fkey', 'gst_invoice_id', 'public.gst_invoices', 'id', 'CASCADE');
SELECT pg_temp.mdmg_add_fk_if_clean('public.gst_invoice_items', 'gst_invoice_items_product_id_fkey', 'product_id', 'public.products', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.payments', 'payments_party_id_fkey', 'party_id', 'public.parties', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.payments', 'payments_customer_id_fkey', 'customer_id', 'public.customers', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.payments', 'payments_supplier_id_fkey', 'supplier_id', 'public.suppliers', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.payments', 'payments_sale_id_fkey', 'sale_id', 'public.sales', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.payments', 'payments_purchase_id_fkey', 'purchase_id', 'public.purchases', 'id', 'SET NULL');
SELECT pg_temp.mdmg_add_fk_if_clean('public.payments', 'payments_gst_invoice_id_fkey', 'gst_invoice_id', 'public.gst_invoices', 'id', 'SET NULL');

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.mdmg_add_updated_at_trigger(p_table regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_schema text;
  v_table text;
  v_trigger_name text;
BEGIN
  SELECT n.nspname, c.relname INTO v_schema, v_table
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.oid = p_table;

  v_trigger_name := v_table || '_set_updated_at';

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgrelid = p_table AND tgname = v_trigger_name AND NOT tgisinternal
  ) THEN
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION public.mdmg_set_updated_at()',
      v_trigger_name,
      v_schema,
      v_table
    );
  END IF;
END;
$$;

SELECT pg_temp.mdmg_add_updated_at_trigger('public.profiles');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.business_profiles');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.product_categories');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.products');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.inventory_transactions');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.parties');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.customers');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.suppliers');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.party_ledger');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.sales');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.sale_items');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.purchases');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.purchase_items');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.gst_invoices');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.gst_invoice_items');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.payments');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.expenses');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.cashbook_entries');
SELECT pg_temp.mdmg_add_updated_at_trigger('public.sync_metadata');

-- -----------------------------------------------------------------------------
-- RLS and owner policies
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.mdmg_enable_owner_rls(p_table regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_schema text;
  v_table text;
BEGIN
  SELECT n.nspname, c.relname INTO v_schema, v_table
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.oid = p_table;

  EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', v_schema, v_table);

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = v_schema AND tablename = v_table AND policyname = 'owner_select') THEN
    EXECUTE format(
      'CREATE POLICY owner_select ON %I.%I FOR SELECT USING (user_id = auth.uid()::text OR auth.role() = ''service_role'')',
      v_schema,
      v_table
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = v_schema AND tablename = v_table AND policyname = 'owner_insert') THEN
    EXECUTE format(
      'CREATE POLICY owner_insert ON %I.%I FOR INSERT WITH CHECK (user_id = auth.uid()::text OR auth.role() = ''service_role'')',
      v_schema,
      v_table
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = v_schema AND tablename = v_table AND policyname = 'owner_update') THEN
    EXECUTE format(
      'CREATE POLICY owner_update ON %I.%I FOR UPDATE USING (user_id = auth.uid()::text OR auth.role() = ''service_role'') WITH CHECK (user_id = auth.uid()::text OR auth.role() = ''service_role'')',
      v_schema,
      v_table
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = v_schema AND tablename = v_table AND policyname = 'owner_delete') THEN
    EXECUTE format(
      'CREATE POLICY owner_delete ON %I.%I FOR DELETE USING (user_id = auth.uid()::text OR auth.role() = ''service_role'')',
      v_schema,
      v_table
    );
  END IF;
END;
$$;

SELECT pg_temp.mdmg_enable_owner_rls('public.profiles');
SELECT pg_temp.mdmg_enable_owner_rls('public.business_profiles');
SELECT pg_temp.mdmg_enable_owner_rls('public.product_categories');
SELECT pg_temp.mdmg_enable_owner_rls('public.products');
SELECT pg_temp.mdmg_enable_owner_rls('public.inventory_transactions');
SELECT pg_temp.mdmg_enable_owner_rls('public.parties');
SELECT pg_temp.mdmg_enable_owner_rls('public.customers');
SELECT pg_temp.mdmg_enable_owner_rls('public.suppliers');
SELECT pg_temp.mdmg_enable_owner_rls('public.party_ledger');
SELECT pg_temp.mdmg_enable_owner_rls('public.sales');
SELECT pg_temp.mdmg_enable_owner_rls('public.sale_items');
SELECT pg_temp.mdmg_enable_owner_rls('public.purchases');
SELECT pg_temp.mdmg_enable_owner_rls('public.purchase_items');
SELECT pg_temp.mdmg_enable_owner_rls('public.gst_invoices');
SELECT pg_temp.mdmg_enable_owner_rls('public.gst_invoice_items');
SELECT pg_temp.mdmg_enable_owner_rls('public.payments');
SELECT pg_temp.mdmg_enable_owner_rls('public.expenses');
SELECT pg_temp.mdmg_enable_owner_rls('public.cashbook_entries');
SELECT pg_temp.mdmg_enable_owner_rls('public.sync_metadata');

-- -----------------------------------------------------------------------------
-- Lightweight compatibility views for local-first/Dexie collection naming.
-- These views are read-oriented helpers and do not replace app services.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'stock_history'
  ) THEN
    EXECUTE 'CREATE VIEW public.stock_history WITH (security_invoker = true) AS SELECT * FROM public.inventory_transactions';
  ELSE
    RAISE NOTICE 'Skipped compatibility view public.stock_history because a relation with that name already exists.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'invoices'
  ) THEN
    EXECUTE 'CREATE VIEW public.invoices WITH (security_invoker = true) AS SELECT * FROM public.gst_invoices';
  ELSE
    RAISE NOTICE 'Skipped compatibility view public.invoices because a relation with that name already exists.';
  END IF;
END;
$$;
