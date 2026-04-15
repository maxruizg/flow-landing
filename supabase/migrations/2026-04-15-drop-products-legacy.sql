-- PR 4 cleanup: drop the pre-variants snapshot once admin + storefront + cart
-- are verified against the new products + product_variants schema.
drop table if exists products_legacy cascade;
