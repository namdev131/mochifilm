alter table public.watch_parties
  add column if not exists last_host_seen_at timestamptz not null default now();

create index if not exists watch_parties_stale_host_idx
  on public.watch_parties(last_host_seen_at)
  where closed=false;

create or replace function public.delete_stale_watch_parties(_timeout interval default interval '5 minutes')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.watch_parties
  where closed=false and last_host_seen_at < now() - _timeout;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.delete_stale_watch_parties(interval) from public, anon, authenticated;
grant execute on function public.delete_stale_watch_parties(interval) to service_role;

do $$
begin
  create extension if not exists pg_cron with schema extensions;
  if not exists (select 1 from cron.job where jobname='delete-stale-watch-parties') then
    perform cron.schedule(
      'delete-stale-watch-parties',
      '*/1 * * * *',
      $job$select public.delete_stale_watch_parties(interval '5 minutes')$job$
    );
  end if;
end $$;
