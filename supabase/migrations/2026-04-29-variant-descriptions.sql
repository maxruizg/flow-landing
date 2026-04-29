-- Move product description from product → variant.
-- Each color now carries its own description.

alter table product_variants
  add column if not exists description text not null default '';

-- Backfill: copy the existing product-level description into every variant.
update product_variants v
set description = coalesce(p.description, '')
from products p
where v.product_id = p.id
  and (v.description is null or v.description = '');

alter table products drop column if exists description;
