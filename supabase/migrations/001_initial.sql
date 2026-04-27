-- Users (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  zip_code text,
  search_radius_miles int default 15,
  has_scanned boolean default false,
  created_at timestamptz default now()
);

-- BOLO keywords
create table bolo_keywords (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  keyword text not null,
  created_at timestamptz default now()
);

-- Scan history / haul log
create table scans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  method text check (method in ('barcode', 'vision')),
  item_name text,
  upc text,
  cost numeric(10,2),
  sell_price numeric(10,2),
  profit numeric(10,2),
  verdict text check (verdict in ('BUY', 'PASS', 'MAYBE')),
  platform text,
  fee numeric(10,2),
  comps_data jsonb,
  image_url text,
  sold boolean default false,
  sold_price numeric(10,2),
  sold_at timestamptz,
  created_at timestamptz default now()
);

-- Scraped listings (deals, free stuff, clearance)
create table listings (
  id uuid default gen_random_uuid() primary key,
  source text check (source in ('fb_marketplace', 'craigslist', 'craigslist_free', 'nextdoor', 'yard_sale', 'estate_sale')),
  title text,
  price numeric(10,2),
  estimated_value numeric(10,2),
  profit_estimate numeric(10,2),
  url text,
  image_url text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  zip_code text,
  category text,
  is_free boolean default false,
  posted_at timestamptz,
  scraped_at timestamptz default now(),
  listing_hash text unique
);

-- Penny list items
create table penny_items (
  id uuid default gen_random_uuid() primary key,
  store text check (store in ('dollar_general', 'dollar_tree')),
  item_name text,
  upc text,
  source_url text,
  week_of date,
  created_at timestamptz default now()
);

-- Notification preferences
create table notification_prefs (
  user_id uuid references profiles(id) primary key,
  deals boolean default true,
  bolo boolean default true,
  pennies boolean default true
);

-- RLS: users can only read/write their own data
-- listings and penny_items are readable by all authed users
