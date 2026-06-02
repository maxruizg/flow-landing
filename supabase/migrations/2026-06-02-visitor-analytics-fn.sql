-- Visitor analytics aggregation, computed in Postgres.
--
-- Why: the previous admin query fetched page_views rows and aggregated in JS,
-- but PostgREST silently caps responses at 1,000 rows. Ordered oldest-first,
-- it only ever saw the oldest 1,000 rows, so "today / week / month" buckets
-- collapsed to 0 while all-time (a head count) stayed correct — the dashboard
-- looked like nobody was visiting. Counting in SQL is exact and unbounded.
--
-- Day boundaries use America/Mexico_City (the store's locale) so "today" and
-- "yesterday" line up with the admin's wall clock.

create or replace function get_visitor_analytics()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with tz as (
    select 'America/Mexico_City'::text as zone
  ),
  bounds as (
    -- Local "start of today", expressed back in UTC for comparison with viewed_at.
    select
      (date_trunc('day', now() at time zone zone) at time zone zone) as today_start,
      zone
    from tz
  ),
  spans as (
    select
      today_start,
      today_start + interval '1 day'   as today_end,
      today_start - interval '1 day'   as yesterday_start,
      today_start - interval '6 days'  as week_start,
      today_start - interval '13 days' as week_prior_start,
      today_start - interval '6 days'  as week_prior_end,
      today_start - interval '29 days' as month_start,
      today_start - interval '59 days' as month_prior_start,
      today_start - interval '29 days' as month_prior_end
    from bounds
  ),
  agg as (
    select
      -- today
      count(*) filter (where viewed_at >= today_start and viewed_at < today_end) as today_views,
      count(distinct visitor_id) filter (where viewed_at >= today_start and viewed_at < today_end) as today_uniques,
      -- yesterday
      count(*) filter (where viewed_at >= yesterday_start and viewed_at < today_start) as yesterday_views,
      count(distinct visitor_id) filter (where viewed_at >= yesterday_start and viewed_at < today_start) as yesterday_uniques,
      -- last 7 days (incl. today)
      count(*) filter (where viewed_at >= week_start and viewed_at < today_end) as week_views,
      count(distinct visitor_id) filter (where viewed_at >= week_start and viewed_at < today_end) as week_uniques,
      -- prior 7 days
      count(*) filter (where viewed_at >= week_prior_start and viewed_at < week_prior_end) as week_prior_views,
      count(distinct visitor_id) filter (where viewed_at >= week_prior_start and viewed_at < week_prior_end) as week_prior_uniques,
      -- last 30 days (incl. today)
      count(*) filter (where viewed_at >= month_start and viewed_at < today_end) as month_views,
      count(distinct visitor_id) filter (where viewed_at >= month_start and viewed_at < today_end) as month_uniques,
      -- prior 30 days
      count(*) filter (where viewed_at >= month_prior_start and viewed_at < month_prior_end) as month_prior_views,
      count(distinct visitor_id) filter (where viewed_at >= month_prior_start and viewed_at < month_prior_end) as month_prior_uniques,
      -- all time
      count(*) as alltime_views,
      count(distinct visitor_id) as alltime_uniques
    from page_views, spans
  ),
  days as (
    -- 30 calendar days, oldest -> newest, one row each (zero-filled).
    select
      to_char((spans.today_start - (offs || ' days')::interval) at time zone (select zone from tz), 'YYYY-MM-DD') as date,
      (spans.today_start - (offs || ' days')::interval)        as day_start,
      (spans.today_start - (offs || ' days')::interval) + interval '1 day' as day_end
    from spans, generate_series(29, 0, -1) as offs
  ),
  daily as (
    select
      d.date,
      coalesce(count(pv.id), 0) as views,
      count(distinct pv.visitor_id) as uniques
    from days d
    left join page_views pv
      on pv.viewed_at >= d.day_start and pv.viewed_at < d.day_end
    group by d.date, d.day_start
    order by d.day_start asc
  )
  select jsonb_build_object(
    'today_views',          (select today_views from agg),
    'today_uniques',        (select today_uniques from agg),
    'yesterday_views',      (select yesterday_views from agg),
    'yesterday_uniques',    (select yesterday_uniques from agg),
    'week_views',           (select week_views from agg),
    'week_uniques',         (select week_uniques from agg),
    'week_prior_views',     (select week_prior_views from agg),
    'week_prior_uniques',   (select week_prior_uniques from agg),
    'month_views',          (select month_views from agg),
    'month_uniques',        (select month_uniques from agg),
    'month_prior_views',    (select month_prior_views from agg),
    'month_prior_uniques',  (select month_prior_uniques from agg),
    'alltime_views',        (select alltime_views from agg),
    'alltime_uniques',      (select alltime_uniques from agg),
    'daily', coalesce(
      -- date is YYYY-MM-DD, so lexical order == chronological order.
      (select jsonb_agg(jsonb_build_object('date', date, 'views', views, 'uniques', uniques) order by date) from daily),
      '[]'::jsonb
    )
  );
$$;

grant execute on function get_visitor_analytics() to anon, authenticated;
