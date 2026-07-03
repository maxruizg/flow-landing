-- Shipping tracking support for orders.
-- Adds optional tracking metadata persisted when an admin marks an order as
-- shipped: the carrier tracking number, the carrier name (DHL by default),
-- and the timestamp of the processing → shipped transition.
-- Idempotent: safe to run more than once.

alter table orders add column if not exists tracking_number text;
alter table orders add column if not exists carrier text default 'DHL';
alter table orders add column if not exists shipped_at timestamptz;
