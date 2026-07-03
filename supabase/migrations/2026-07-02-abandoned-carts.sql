-- =============================================================================
-- ABANDONED CARTS — one live cart per email, captured at checkout, used by the
-- hourly cron to send a single Spanish recovery email ~3h after abandonment.
-- =============================================================================
--
-- Lifecycle:
--   * Upserted (by email) whenever a shopper reaches the payment step of
--     checkout with a valid email (see app/lib/abandoned-carts.server.ts).
--   * updated_at refreshes on every touch; reminder_sent_at resets only when
--     the cart contents change meaningfully (new abandonment = new reminder).
--   * recovered_at is stamped when an order is created for that email —
--     recovered carts are never emailed.
--   * reminder_sent_at is claimed with a compare-and-set (… where
--     reminder_sent_at is null) BEFORE sending, so overlapping cron runs
--     cannot double-send.
--
-- Access: RLS enabled with NO policies — deny-by-default for anon and
-- authenticated (matches 2026-07-02-rls-lockdown.sql). Only the server's
-- service_role key (which bypasses RLS) touches this table.
--
-- Idempotent: safe to run more than once.
-- =============================================================================

create table if not exists abandoned_carts (
  id               uuid        primary key default gen_random_uuid(),
  email            text        not null,
  customer_name    text,
  items            jsonb       not null,
  total            numeric,
  currency         text,
  locale           text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  reminder_sent_at timestamptz,
  recovered_at     timestamptz,
  constraint abandoned_carts_email_unique unique (email)
);

-- The cron scans for due carts on (updated_at, reminder_sent_at, recovered_at).
create index if not exists abandoned_carts_due_idx
  on abandoned_carts (updated_at)
  where reminder_sent_at is null and recovered_at is null;

-- RLS on, no policies: anon/authenticated get nothing; service_role bypasses.
alter table abandoned_carts enable row level security;

-- Defensive: if an "Allow all" policy ever gets created by a template, drop it.
drop policy if exists "Allow all on abandoned_carts" on abandoned_carts;
