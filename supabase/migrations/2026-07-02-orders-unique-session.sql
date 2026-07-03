-- 2026-07-02 — Unique index on orders(stripe_session_id)
--
-- WHY: the webhook (payment_intent.succeeded) and the checkout success loader
-- both call ensureOrderFromPaymentIntent concurrently. The code treats the
-- uniqueness of stripe_session_id as the atomic gate that decides which caller
-- creates the order and runs side effects (stock decrement, customer stats,
-- confirmation email). Without a DB-level unique constraint, both inserts
-- succeed (order ids are ORD-${Date.now()}-based, so no PK collision) and the
-- customer gets duplicate orders, double stock decrements and two emails.
--
-- Safe + idempotent: dedup first, then create the index only if missing.
-- Run this in the Supabase SQL editor (or via supabase db push).

begin;

-- 1) Dedup any existing duplicates before the index can be created.
--    Strategy: for each stripe_session_id keep the FIRST order (earliest
--    created_at, tie-broken by id) — that is the writer that "won" the race
--    and ran the side effects. Later rows are pure duplicates of the same
--    Stripe payment, so deleting them loses no money data (same total,
--    same items). NULL session ids (manual/legacy orders) are untouched.
delete from orders o
using (
  select
    id,
    row_number() over (
      partition by stripe_session_id
      order by created_at asc, id asc
    ) as rn
  from orders
  where stripe_session_id is not null
) d
where o.id = d.id
  and d.rn > 1;

-- 2) Unique index. Postgres treats NULLs as distinct, so orders without a
--    Stripe session (manual/legacy) remain unaffected.
create unique index if not exists orders_stripe_session_id_key
  on orders (stripe_session_id);

commit;
