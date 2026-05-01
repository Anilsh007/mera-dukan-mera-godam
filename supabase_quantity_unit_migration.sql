alter table public.products
  add column if not exists quantity_unit text not null default 'pcs';

alter table public.product_logs
  add column if not exists quantity_unit text not null default 'pcs';

notify pgrst, 'reload schema';
