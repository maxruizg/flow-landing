-- Fixed-window rate limiting storage + atomic increment RPC.
--
-- Used by app/lib/rate-limit.server.ts to throttle public endpoints
-- (subscribe, create-payment-intent, pageview). One row per key (e.g.
-- "subscribe:1.2.3.4"); the RPC atomically resets the window when it has
-- elapsed, otherwise increments the counter — all in a single upsert, so
-- concurrent requests can't double-count or race the window reset.

create table if not exists public.rate_limits (
  key          text primary key,
  window_start timestamptz not null,
  count        integer not null default 0
);

-- RLS on, NO policies: only service_role (which bypasses RLS) can touch this
-- table. anon/authenticated get nothing.
alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from public;
revoke all on table public.rate_limits from anon;
revoke all on table public.rate_limits from authenticated;

create or replace function public.increment_rate_limit(
  p_key            text,
  p_window_seconds integer
)
returns table (window_start timestamptz, request_count integer)
language sql
security definer
set search_path = public
as $$
  insert into rate_limits as rl (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
     set window_start = case
           when rl.window_start <= now() - make_interval(secs => p_window_seconds)
             then now()
           else rl.window_start
         end,
         count = case
           when rl.window_start <= now() - make_interval(secs => p_window_seconds)
             then 1
           else rl.count + 1
         end
  returning rl.window_start, rl.count;
$$;

revoke all on function public.increment_rate_limit(text, integer) from public;
revoke all on function public.increment_rate_limit(text, integer) from anon;
revoke all on function public.increment_rate_limit(text, integer) from authenticated;
grant execute on function public.increment_rate_limit(text, integer) to service_role;

-- Optional housekeeping (rows are small and reused per key, so growth is
-- bounded by unique client IPs; run occasionally if desired):
--   delete from rate_limits where window_start < now() - interval '1 day';
