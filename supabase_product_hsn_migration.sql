alter table public.products
  add column if not exists hsn_code text;

notify pgrst, 'reload schema';
