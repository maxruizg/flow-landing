-- email_settings — key/value store for admin-editable email configuration.
--
-- This table already exists in production (it was created by hand in the
-- Supabase SQL Editor during go-live). This migration makes it reproducible
-- and idempotent, and seeds the shared brand base (key "email_brand") read by
-- every email template via getEmailBrand() in app/data/queries.server.ts.
--
-- Existing keys in use: "order_confirmation", "newsletter", "showroom_hero".
-- New key: "email_brand" = { accentColor, logoImage, defaultHeroImage,
--                            footerTagline, unsubscribeUrl }.
--
-- Access: RLS enabled with NO policies — deny-by-default for anon and
-- authenticated (matches 2026-07-02-rls-lockdown.sql). Only the server's
-- service_role key (which bypasses RLS) reads/writes this table.

create table if not exists email_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- RLS on, no policies: anon/authenticated get nothing; service_role bypasses.
alter table email_settings enable row level security;

-- Defensive: if an "Allow all" policy ever gets created by a template, drop it.
drop policy if exists "Allow all on email_settings" on email_settings;

-- Seed the brand base with the current in-code FLOW defaults (warm taupe accent),
-- only if it isn't already configured. Safe to re-run.
insert into email_settings (key, value)
values (
  'email_brand',
  jsonb_build_object(
    'accentColor', '#b8a490',
    'logoImage', '',
    -- Site SS26 hero as the default email background band; editable in
    -- /admin/email-design.
    'backgroundImage', 'https://bnqmxddffoxwprwecksu.supabase.co/storage/v1/render/image/public/images/collections/1777409776148-24o6s4b3ta6.jpg?width=1920&quality=80&resize=contain',
    'defaultHeroImage', '',
    'footerTagline', 'Flow Urban Wear — Community-based streetwear from Mexico City.',
    'unsubscribeUrl', 'https://www.flowurbanwear.com/unsubscribe'
  )
)
on conflict (key) do nothing;
