-- Feed cache — shared across all users in the same zip. Each row holds
-- the JSON payload for one (zip, feed_type) combo. Repeated requests
-- inside the 4-hour TTL window read from here instead of burning Claude
-- API tokens.
--
-- zip_code uses '' (empty string) for non-location feeds (pennies and
-- clearance are national). The PK is (zip_code, feed_type) and PK
-- columns must be NOT NULL — hence the default.
create table feed_cache (
  zip_code text not null default '',
  feed_type text not null check (feed_type in ('deals', 'free', 'pennies', 'clearance')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  primary key (zip_code, feed_type)
);

-- Cache contents are non-sensitive: every authed user in the same zip
-- sees the same generated feed. Authed-read + authed-write is fine;
-- the route handlers handle TTL enforcement.
alter table feed_cache enable row level security;

create policy "feed_cache_read" on feed_cache
  for select to authenticated
  using (true);

create policy "feed_cache_insert" on feed_cache
  for insert to authenticated
  with check (true);

create policy "feed_cache_update" on feed_cache
  for update to authenticated
  using (true)
  with check (true);
