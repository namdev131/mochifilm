alter table public.watch_parties add column if not exists password_hash text;

-- Password hashes are server-only; authenticated clients retain existing safe columns.
revoke select on public.watch_parties from anon, authenticated;
grant select(id,code,host_id,slug,source,name,poster,ep_index,srv_index,position_seconds,is_playing,closed,join_locked,chat_mode,created_at,updated_at)
  on public.watch_parties to authenticated;