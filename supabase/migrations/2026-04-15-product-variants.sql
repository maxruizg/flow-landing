-- Split products into base products + product_variants.
-- Legacy products table is preserved as products_legacy during the transition.

alter table products rename to products_legacy;

drop policy if exists "Allow all on products" on products_legacy;
create policy "Allow all on products_legacy" on products_legacy for all using (true) with check (true);

-- IMMUTABLE helper so it can be used in a generated column expression.
create or replace function sum_jsonb_int(obj jsonb)
returns integer
language sql
immutable
as $$
  select coalesce(sum(nullif(value, '')::int), 0)::int
  from jsonb_each_text(obj)
$$;

create table products (
  id                 text primary key,
  slug               text unique not null,
  name               text not null,
  description        text not null default '',
  category           text not null,
  gender             text not null check (gender in ('men','women','unisex')),
  material           text not null default '',
  origin             text not null default '',
  fit                text,
  sizes              text[] not null default '{}',
  tags               text[] not null default '{}',
  brand              text,
  default_variant_id text,
  position           integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table product_variants (
  id               text primary key,
  product_id       text not null references products(id) on delete cascade,
  slug             text unique not null,
  color_name       text not null,
  color_hex        text,
  sku              text unique not null,
  price            numeric not null,
  price_mxn        numeric not null default 0,
  compare_at_price numeric,
  size_stock       jsonb not null default '{}'::jsonb,
  stock            integer generated always as (sum_jsonb_int(size_stock)) stored,
  status           text not null default 'active' check (status in ('active','draft','archived')),
  image            text not null,
  image_hover      text not null default '',
  images           text[] not null default '{}',
  badge            text,
  is_new           boolean not null default false,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table products
  add constraint products_default_variant_fk
  foreign key (default_variant_id) references product_variants(id) on delete set null;

create index product_variants_product_id_idx on product_variants(product_id);
create index product_variants_status_idx     on product_variants(status);
create index products_gender_idx             on products(gender);

alter table products         enable row level security;
alter table product_variants enable row level security;
create policy "Allow all on products"         on products         for all using (true) with check (true);
create policy "Allow all on product_variants" on product_variants for all using (true) with check (true);
