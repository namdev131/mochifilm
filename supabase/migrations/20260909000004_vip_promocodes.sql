create table if not exists public.vip_promocodes (
  id uuid primary key default gen_random_uuid(),
  code_hash text unique not null,
  vip_expires_at timestamptz not null check (vip_expires_at > created_at),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id),
  check ((redeemed_at is null) = (redeemed_by is null))
);

create index if not exists vip_promocodes_available_idx
  on public.vip_promocodes(vip_expires_at) where redeemed_by is null;

alter table public.vip_promocodes enable row level security;
revoke all on public.vip_promocodes from anon, authenticated;
grant all on public.vip_promocodes to service_role;
