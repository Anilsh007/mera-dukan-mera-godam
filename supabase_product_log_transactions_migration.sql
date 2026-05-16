-- Phase 5: enrich product_logs with transaction/audit metadata.
-- Safe to run more than once.

alter table public.product_logs
  add column if not exists product_name text,
  add column if not exists product_category text,
  add column if not exists product_sku text,
  add column if not exists product_hsn_code text,
  add column if not exists quantity numeric,
  add column if not exists old_stock numeric,
  add column if not exists new_stock numeric,
  add column if not exists amount numeric,
  add column if not exists taxable_amount numeric,
  add column if not exists gst_rate numeric,
  add column if not exists cgst_amount numeric,
  add column if not exists sgst_amount numeric,
  add column if not exists igst_amount numeric,
  add column if not exists gst_amount numeric,
  add column if not exists transaction_id text,
  add column if not exists transaction_type text,
  add column if not exists invoice_receipt_no text,
  add column if not exists payment_mode text,
  add column if not exists payment_status text,
  add column if not exists products jsonb,
  add column if not exists notes text,
  add column if not exists corrected_at timestamptz,
  add column if not exists correction_label text;

update public.product_logs
set quantity = abs(quantity_added)
where quantity is null;

create index if not exists product_logs_transaction_id_idx
  on public.product_logs (transaction_id);

create index if not exists product_logs_invoice_receipt_no_idx
  on public.product_logs (invoice_receipt_no);
