-- Atomic per-size stock decrement.
--
-- Replaces the read-modify-write in app/data/queries.server.ts
-- (decrementVariantStock): SELECT size_stock → compute in JS → UPDATE whole
-- JSON loses decrements when two orders for the same variant land
-- concurrently. This function does the whole thing in a single UPDATE, so
-- Postgres row locking serializes concurrent callers.
--
-- Clamps to 0 (never negative) to mirror the app's defensive behavior: the
-- webhook runs after payment, so we accept the sale and log the shortfall.
-- Returns the new stock value for the size, or NULL if the variant row
-- doesn't exist.

create or replace function public.decrement_size_stock(
  p_variant_id text,
  p_size_key   text,
  p_qty        integer
)
returns integer
language sql
security definer
set search_path = public
as $$
  update product_variants
     set size_stock = jsonb_set(
           coalesce(size_stock, '{}'::jsonb),
           array[p_size_key],
           to_jsonb(greatest(0, coalesce((size_stock ->> p_size_key)::integer, 0) - p_qty))
         ),
         updated_at = now()
   where id = p_variant_id
  returning (size_stock ->> p_size_key)::integer;
$$;

-- Service role only — this is called exclusively from the server (webhook
-- fulfillment path). Never expose to anon/authenticated.
revoke all on function public.decrement_size_stock(text, text, integer) from public;
revoke all on function public.decrement_size_stock(text, text, integer) from anon;
revoke all on function public.decrement_size_stock(text, text, integer) from authenticated;
grant execute on function public.decrement_size_stock(text, text, integer) to service_role;
