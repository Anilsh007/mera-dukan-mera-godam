create table if not exists public.purchases (
  id text primary key,
  user_id text not null,
  bill_no text not null,
  supplier_name text not null,
  purchase_date date not null,
  payment_status text not null check (payment_status in ('paid', 'partial', 'unpaid')),
  payment_mode text,
  total_amount numeric not null default 0,
  amount_paid numeric not null default 0,
  due_amount numeric not null default 0,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  payload jsonb not null,
  unique (user_id, bill_no)
);

create index if not exists purchases_user_id_idx on public.purchases (user_id);
create index if not exists purchases_user_purchase_date_idx on public.purchases (user_id, purchase_date desc);
create index if not exists purchases_user_supplier_idx on public.purchases (user_id, supplier_name);
create index if not exists purchases_user_payment_status_idx on public.purchases (user_id, payment_status);
