-- Sold comps — crowdsourced pricing database. Every time a user
-- marks a haul-log row as sold we insert one row here so future
-- scans can ground their estimates on real sold prices instead of
-- pure model imagination. user_id is a plain uuid (no FK to
-- profiles) so this migration succeeds even if the FK target ever
-- shifts. RLS lets every authed user READ all comps (the whole
-- point — pricing intel improves with corpus) but only INSERT
-- their own.

create table sold_comps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  item_name text not null,
  item_category text,
  platform text,
  sold_price numeric(10,2) not null,
  days_to_sell integer,
  condition_grade text,
  zip_code text,
  created_at timestamptz default now()
);

alter table sold_comps enable row level security;

create policy "Users can insert own comps"
  on sold_comps
  for insert
  with check (auth.uid() = user_id);

create policy "All authed users can read comps"
  on sold_comps
  for select
  using (true);

create index idx_sold_comps_category on sold_comps(item_category);
create index idx_sold_comps_name on sold_comps using gin(to_tsvector('english', item_name));
