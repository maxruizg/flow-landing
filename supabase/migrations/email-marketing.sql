-- =============================================================================
-- Email Marketing System — Migration
-- =============================================================================
-- Adds tables for email templates, campaigns, campaign content, campaign images,
-- and campaign logs. Also extends the existing subscribers table with name/tags.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. email_templates — Reusable email template definitions
-- ---------------------------------------------------------------------------
create table if not exists email_templates (
  id              text        primary key,
  name            text        not null,
  description     text        not null default '',
  component_name  text        not null,
  variables_schema jsonb      not null default '[]'::jsonb,
  thumbnail_url   text,
  created_at      timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 2. email_campaigns — Individual email campaigns
-- ---------------------------------------------------------------------------
create table if not exists email_campaigns (
  id            text        primary key,
  name          text        not null,
  subject       text        not null default '',
  preheader     text        not null default '',
  template_id   text        references email_templates(id),
  status        text        not null default 'draft'
                            check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at  timestamptz,
  sent_at       timestamptz,
  target_tags   text[]      default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 3. campaign_content — Variable values for a campaign
-- ---------------------------------------------------------------------------
create table if not exists campaign_content (
  id            text        primary key,
  campaign_id   text        references email_campaigns(id) on delete cascade,
  variables     jsonb       not null default '{}'::jsonb,
  created_at    timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 4. campaign_images — Image slots attached to a campaign
-- ---------------------------------------------------------------------------
create table if not exists campaign_images (
  id            text        primary key,
  campaign_id   text        references email_campaigns(id) on delete cascade,
  slot_name     text        not null,
  storage_url   text        not null,
  alt_text      text        default '',
  sort_order    integer     default 0,
  created_at    timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 5. campaign_logs — Send-run logs for a campaign
-- ---------------------------------------------------------------------------
create table if not exists campaign_logs (
  id              text        primary key,
  campaign_id     text        references email_campaigns(id) on delete cascade,
  total_sent      integer     default 0,
  total_failed    integer     default 0,
  started_at      timestamptz,
  finished_at     timestamptz,
  error_details   text,
  created_at      timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 6. Extend existing subscribers table with name and tags
-- ---------------------------------------------------------------------------
alter table subscribers add column if not exists name text default '';
alter table subscribers add column if not exists tags text[] default '{}';

-- ---------------------------------------------------------------------------
-- 7. Enable RLS on all new tables with "Allow all" policies
-- ---------------------------------------------------------------------------
alter table email_templates  enable row level security;
alter table email_campaigns  enable row level security;
alter table campaign_content enable row level security;
alter table campaign_images  enable row level security;
alter table campaign_logs    enable row level security;

-- Drop policies first (idempotent — ignore errors if they don't exist)
do $$
begin
  drop policy if exists "Allow all on email_templates"  on email_templates;
  drop policy if exists "Allow all on email_campaigns"  on email_campaigns;
  drop policy if exists "Allow all on campaign_content" on campaign_content;
  drop policy if exists "Allow all on campaign_images"  on campaign_images;
  drop policy if exists "Allow all on campaign_logs"    on campaign_logs;
end $$;

create policy "Allow all on email_templates"  on email_templates  for all using (true) with check (true);
create policy "Allow all on email_campaigns"  on email_campaigns  for all using (true) with check (true);
create policy "Allow all on campaign_content" on campaign_content for all using (true) with check (true);
create policy "Allow all on campaign_images"  on campaign_images  for all using (true) with check (true);
create policy "Allow all on campaign_logs"    on campaign_logs    for all using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 8. Seed email templates
-- ---------------------------------------------------------------------------

-- Template 1: New Collection
insert into email_templates (id, name, description, component_name, variables_schema)
values (
  'tmpl_new_collection',
  'New Collection',
  'Announce a new product collection with hero image, featured products, and CTA.',
  'new-collection',
  '[
    {"key": "hero_title",    "type": "text",  "label": "Hero Title",    "default": "",        "group": "hero"},
    {"key": "hero_subtitle", "type": "text",  "label": "Hero Subtitle", "default": "",        "group": "hero"},
    {"key": "hero_image",    "type": "image", "label": "Hero Image",    "default": "",        "group": "hero"},
    {"key": "primary_color", "type": "color", "label": "Primary Color", "default": "#000000", "group": "style"},
    {"key": "cta_text",      "type": "text",  "label": "CTA Text",      "default": "",        "group": "cta"},
    {"key": "cta_url",       "type": "url",   "label": "CTA URL",       "default": "",        "group": "cta"},
    {"key": "products",      "type": "array", "label": "Products",      "default": "[]",      "group": "products",
     "items": {"image": "image", "name": "text", "original_price": "text", "sale_price": "text", "url": "url"}}
  ]'::jsonb
)
on conflict (id) do update set
  name             = excluded.name,
  description      = excluded.description,
  component_name   = excluded.component_name,
  variables_schema = excluded.variables_schema;

-- Template 2: Flash Sale
insert into email_templates (id, name, description, component_name, variables_schema)
values (
  'tmpl_flash_sale',
  'Flash Sale',
  'Time-limited discount campaign with urgency elements and category highlights.',
  'flash-sale',
  '[
    {"key": "discount_percentage", "type": "text",  "label": "Discount Percentage", "default": "",        "group": "offer"},
    {"key": "expiration_text",     "type": "text",  "label": "Expiration Text",     "default": "",        "group": "offer"},
    {"key": "banner_image",        "type": "image", "label": "Banner Image",        "default": "",        "group": "hero"},
    {"key": "urgency_color",       "type": "color", "label": "Urgency Color",       "default": "#ef4444", "group": "style"},
    {"key": "coupon_code",         "type": "text",  "label": "Coupon Code",         "default": "",        "group": "offer"},
    {"key": "categories",          "type": "array", "label": "Categories",          "default": "[]",      "group": "categories",
     "items": {"image": "image", "name": "text", "discount_pct": "text", "url": "url"}}
  ]'::jsonb
)
on conflict (id) do update set
  name             = excluded.name,
  description      = excluded.description,
  component_name   = excluded.component_name,
  variables_schema = excluded.variables_schema;

-- Template 3: Product Launch
insert into email_templates (id, name, description, component_name, variables_schema)
values (
  'tmpl_product_launch',
  'Product Launch',
  'Single-product launch email with hero, gallery, details, and brand story.',
  'product-launch',
  '[
    {"key": "product_name",        "type": "text",        "label": "Product Name",        "default": "",        "group": "product"},
    {"key": "product_description", "type": "textarea",    "label": "Product Description", "default": "",        "group": "product"},
    {"key": "hero_image",          "type": "image",       "label": "Hero Image",          "default": "",        "group": "hero"},
    {"key": "gallery_images",      "type": "image-array", "label": "Gallery Images",      "default": "[]",      "group": "gallery"},
    {"key": "available_sizes",     "type": "text",        "label": "Available Sizes",     "default": "",        "group": "product"},
    {"key": "price",               "type": "text",        "label": "Price",               "default": "",        "group": "product"},
    {"key": "accent_color",        "type": "color",       "label": "Accent Color",        "default": "#8B5CF6", "group": "style"},
    {"key": "brand_story",         "type": "textarea",    "label": "Brand Story",         "default": "",        "group": "story"}
  ]'::jsonb
)
on conflict (id) do update set
  name             = excluded.name,
  description      = excluded.description,
  component_name   = excluded.component_name,
  variables_schema = excluded.variables_schema;
