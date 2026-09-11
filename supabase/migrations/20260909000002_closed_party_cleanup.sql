create or replace function public.delete_closed_watch_parties()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.watch_parties where closed = true;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.delete_closed_watch_parties() from public, anon, authenticated;
grant execute on function public.delete_closed_watch_parties() to service_role;

do $$
begin
  create extension if not exists pg_cron with schema extensions;
  if not exists (select 1 from cron.job where jobname = 'delete-closed-watch-parties') then
    perform cron.schedule(
      'delete-closed-watch-parties',
      '*/1 * * * *',
      $job$select public.delete_closed_watch_parties()$job$
    );
  end if;
end $$;
