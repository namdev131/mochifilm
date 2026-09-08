alter table public.watch_parties
  add column if not exists scheduled_at timestamptz not null default now();

create index if not exists watch_parties_scheduled_at_idx
  on public.watch_parties(scheduled_at) where closed=false;