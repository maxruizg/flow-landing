-- Independent ordering for the New Collection (new arrivals) section.
-- Backfills with the existing `position` so the initial section order matches
-- the shop, then diverges as the admin reorders independently.

alter table products
  add column if not exists new_arrivals_position integer not null default 0;

update products
set new_arrivals_position = position
where new_arrivals_position = 0;
