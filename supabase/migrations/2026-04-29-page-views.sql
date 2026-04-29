-- Visitor analytics — append-only page view event log.
-- visitor_id is a long-lived opaque cookie ID (no PII) used to dedupe uniques.
-- Writes happen fire-and-forget from the root loader; reads power /admin/analytics.

create table if not exists page_views (
  id            bigint generated always as identity primary key,
  visitor_id    text not null,
  path          text not null,
  referrer      text,
  user_agent    text,
  viewed_at     timestamptz not null default now()
);

create index if not exists idx_page_views_viewed_at
  on page_views (viewed_at desc);

create index if not exists idx_page_views_visitor_viewed
  on page_views (visitor_id, viewed_at desc);

alter table page_views enable row level security;

create policy "Allow all on page_views"
  on page_views for all using (true) with check (true);
