create table if not exists public.vip_plan_prices (
  plan_id text primary key check (plan_id in ('monthly','quarterly','yearly')),
  original_price integer not null check (original_price > 0),
  price integer not null check (price > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.vip_plan_prices(plan_id,original_price,price)
values ('monthly',39000,39000),('quarterly',99000,99000),('yearly',299000,299000)
on conflict(plan_id) do nothing;

alter table public.vip_plan_prices enable row level security;
drop policy if exists "vip prices public read" on public.vip_plan_prices;
create policy "vip prices public read" on public.vip_plan_prices for select using (true);
revoke insert,update,delete on public.vip_plan_prices from anon,authenticated;
grant select on public.vip_plan_prices to anon,authenticated;
grant all on public.vip_plan_prices to service_role;
