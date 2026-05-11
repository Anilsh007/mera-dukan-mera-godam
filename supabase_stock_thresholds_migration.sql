alter table public.products
  add column if not exists low_stock_threshold numeric,
  add column if not exists critical_stock_threshold numeric;

notify pgrst, 'reload schema';
