-- Run this in the Supabase SQL Editor to create all tables

create table if not exists products (
  id text primary key,
  slug text unique not null,
  name text not null,
  price numeric not null,
  price_mxn numeric not null default 0,
  image text not null,
  image_hover text not null,
  images text[] not null default '{}',
  category text not null,
  badge text,
  sizes text[] not null default '{}',
  is_new boolean not null default false,
  description text not null default '',
  material text not null default '',
  origin text not null default '',
  color text not null default '',
  fit text,
  gender text not null check (gender in ('men', 'women', 'unisex')),
  stock integer not null default 0,
  size_stock jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'draft', 'out_of_stock')),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists collections (
  id text primary key,
  name text not null,
  season text not null,
  description text not null default '',
  image text not null,
  video text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists editorial_images (
  id text primary key,
  src text not null,
  alt text not null default '',
  caption text not null default '',
  video text,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id text primary key,
  name text not null,
  email text unique not null,
  total_orders integer not null default 0,
  total_spent numeric not null default 0,
  joined_date text not null,
  last_order_date text not null,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  customer_name text not null,
  customer_email text not null,
  date text not null,
  items jsonb not null default '[]',
  total numeric not null default 0,
  status text not null check (status in ('processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key,
  type text not null check (type in ('order', 'stock', 'customer', 'system')),
  title text not null,
  message text not null default '',
  date text not null,
  read boolean not null default false,
  link_to text,
  created_at timestamptz not null default now()
);

create table if not exists banners (
  id text primary key,
  title text not null,
  description text not null default '',
  active boolean not null default false,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists subscribers (
  id text primary key,
  email text unique not null,
  subscribed_at timestamptz not null default now(),
  active boolean not null default true
);

-- Enable RLS (Row Level Security) but allow anon access for now
alter table products enable row level security;
alter table collections enable row level security;
alter table editorial_images enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table notifications enable row level security;
alter table banners enable row level security;
alter table subscribers enable row level security;

-- Policies: allow full access via anon key (adjust for production)
create policy "Allow all on products" on products for all using (true) with check (true);
create policy "Allow all on collections" on collections for all using (true) with check (true);
create policy "Allow all on editorial_images" on editorial_images for all using (true) with check (true);
create policy "Allow all on customers" on customers for all using (true) with check (true);
create policy "Allow all on orders" on orders for all using (true) with check (true);
create policy "Allow all on notifications" on notifications for all using (true) with check (true);
create policy "Allow all on banners" on banners for all using (true) with check (true);
create policy "Allow all on subscribers" on subscribers for all using (true) with check (true);
