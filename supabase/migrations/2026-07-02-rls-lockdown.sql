-- =============================================================================
-- RLS LOCKDOWN — remove anon/authenticated access to everything except the
-- public catalog (read-only).
-- =============================================================================
--
-- *** APPLY ONLY AFTER deploying the service-role server changes ***
--
-- Why: until the deploy that makes app/lib/supabase.server.ts use
-- SUPABASE_SERVICE_ROLE_KEY (and SUPABASE_SERVICE_ROLE_KEY is set in the
-- production environment), the server talks to the database with the ANON
-- key. Running this migration against an anon-key server would break admin,
-- orders, checkout, analytics and email features, because this migration
-- revokes almost all anon access. The service_role key BYPASSES RLS, so once
-- the server runs on it, everything keeps working while the browser-exposed
-- anon key is locked down.
--
-- Background: the original schema created "Allow all" policies
-- (for all using (true) with check (true)) on EVERY table — including
-- admins (password hashes), orders and customers — and the anon key is
-- injected into the browser via window.ENV. That meant anyone could read and
-- write the entire database from devtools. This migration:
--
--   1. Drops every "Allow all" policy.
--   2. Grants anon/authenticated SELECT only on public catalog tables:
--      products, product_variants, collections, editorial_images, banners.
--   3. Leaves all other tables with RLS enabled and NO policies
--      (= deny-by-default for anon/authenticated; service_role bypasses RLS):
--      admins, orders, customers, notifications, subscribers, page_views,
--      email_templates, email_campaigns, campaign_content, campaign_images,
--      campaign_logs, products_legacy (if still present).
--   4. Storage: removes anon/authenticated write access to the "images"
--      bucket (uploads now go through the authenticated server route
--      /api/admin-upload using the service role) while keeping public read.
--
-- Idempotent: safe to run more than once.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Drop all "Allow all" policies
-- ---------------------------------------------------------------------------
drop policy if exists "Allow all on products"          on products;
drop policy if exists "Allow all on product_variants"  on product_variants;
drop policy if exists "Allow all on collections"       on collections;
drop policy if exists "Allow all on editorial_images"  on editorial_images;
drop policy if exists "Allow all on banners"           on banners;
drop policy if exists "Allow all on customers"         on customers;
drop policy if exists "Allow all on orders"            on orders;
drop policy if exists "Allow all on notifications"     on notifications;
drop policy if exists "Allow all on subscribers"       on subscribers;
drop policy if exists "Allow all on admins"            on admins;
drop policy if exists "Allow all on page_views"        on page_views;
drop policy if exists "Allow all on email_templates"   on email_templates;
drop policy if exists "Allow all on email_campaigns"   on email_campaigns;
drop policy if exists "Allow all on campaign_content"  on campaign_content;
drop policy if exists "Allow all on campaign_images"   on campaign_images;
drop policy if exists "Allow all on campaign_logs"     on campaign_logs;

-- products_legacy may already have been dropped (2026-04-15-drop-products-legacy.sql)
do $$
begin
  if to_regclass('public.products_legacy') is not null then
    execute 'drop policy if exists "Allow all on products_legacy" on products_legacy';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Make sure RLS is enabled everywhere (deny-by-default without policies)
-- ---------------------------------------------------------------------------
alter table products          enable row level security;
alter table product_variants  enable row level security;
alter table collections       enable row level security;
alter table editorial_images  enable row level security;
alter table banners           enable row level security;
alter table customers         enable row level security;
alter table orders            enable row level security;
alter table notifications     enable row level security;
alter table subscribers       enable row level security;
alter table admins            enable row level security;
alter table page_views        enable row level security;
alter table email_templates   enable row level security;
alter table email_campaigns   enable row level security;
alter table campaign_content  enable row level security;
alter table campaign_images   enable row level security;
alter table campaign_logs     enable row level security;

do $$
begin
  if to_regclass('public.products_legacy') is not null then
    execute 'alter table products_legacy enable row level security';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Public catalog: read-only for anon / authenticated
-- ---------------------------------------------------------------------------
drop policy if exists "Public read products"         on products;
drop policy if exists "Public read product_variants" on product_variants;
drop policy if exists "Public read collections"      on collections;
drop policy if exists "Public read editorial_images" on editorial_images;
drop policy if exists "Public read banners"          on banners;

create policy "Public read products"
  on products for select
  to anon, authenticated
  using (true);

create policy "Public read product_variants"
  on product_variants for select
  to anon, authenticated
  using (true);

create policy "Public read collections"
  on collections for select
  to anon, authenticated
  using (true);

create policy "Public read editorial_images"
  on editorial_images for select
  to anon, authenticated
  using (true);

create policy "Public read banners"
  on banners for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 4. Storage: images bucket — public read, NO anon/authenticated writes
-- ---------------------------------------------------------------------------
-- Storage policies live on storage.objects. Bucket/policy names created via
-- the dashboard vary, so drop every write-capable (INSERT/UPDATE/DELETE/ALL)
-- policy on storage.objects and recreate only a public-read policy for the
-- "images" bucket. The server uploads with the service role, which bypasses
-- these policies entirely.
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end $$;

drop policy if exists "Public read images bucket" on storage.objects;

create policy "Public read images bucket"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'images');
