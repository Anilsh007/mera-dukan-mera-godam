-- Final security and scalability helpers for Mera Dukan Mera Godam
-- Run in Supabase SQL editor after checking table names match your project.

alter table if exists products enable row level security;
alter table if exists product_logs enable row level security;
alter table if exists purchases enable row level security;
alter table if exists gst_invoices enable row level security;
alter table if exists profiles enable row level security;

create index if not exists idx_products_user_name_category on products (user_id, name, category);
create index if not exists idx_products_user_quantity on products (user_id, quantity);
create index if not exists idx_product_logs_product_date on product_logs (product_id, date desc);
create index if not exists idx_purchases_user_date on purchases (user_id, purchase_date desc);
create index if not exists idx_purchases_user_supplier on purchases (user_id, supplier_name);
create index if not exists idx_gst_invoices_user_invoice_no on gst_invoices (user_id, invoice_no);
create unique index if not exists ux_gst_invoices_user_invoice_no on gst_invoices (user_id, invoice_no);
create index if not exists idx_gst_invoices_user_date on gst_invoices (user_id, invoice_date desc);
create unique index if not exists ux_profiles_user on profiles (user_id);

-- Recommended RLS policy pattern when Supabase Auth user id/email is aligned with user_id.
-- The app currently verifies Firebase tokens in Next API routes and uses server-side Supabase service role.
-- Keep direct browser access restricted unless you intentionally map Firebase users into Supabase Auth.
