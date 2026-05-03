-- Row-Level Security policies for all six tables.
--
-- Per-user tables (profiles / scans / bolo_keywords / notification_prefs):
--   policy = own row only, identified by auth.uid().
--
-- Shared feed tables (listings / penny_items):
--   read = any authenticated user
--   write = service_role only (scrapers run as service_role; no client-side
--           inserts are ever expected from these tables).

-- ── Enable RLS on all tables ────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.scans enable row level security;
alter table public.bolo_keywords enable row level security;
alter table public.listings enable row level security;
alter table public.penny_items enable row level security;
alter table public.notification_prefs enable row level security;

-- ── profiles: own row only ──────────────────────────────────────────────
-- profiles.id is the FK to auth.users, so the row's identity IS the auth uid.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- ── scans: own rows ─────────────────────────────────────────────────────
-- UPDATE is permitted (not just INSERT) so users can mark their own scans
-- as sold (sold / sold_price / sold_at columns).
create policy "scans_select_own" on public.scans
  for select using (auth.uid() = user_id);

create policy "scans_insert_own" on public.scans
  for insert with check (auth.uid() = user_id);

create policy "scans_update_own" on public.scans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── bolo_keywords: own rows ─────────────────────────────────────────────
-- DELETE permitted so users can prune their own keyword list. No UPDATE
-- policy on purpose: users add or remove, they don't edit.
create policy "bolo_keywords_select_own" on public.bolo_keywords
  for select using (auth.uid() = user_id);

create policy "bolo_keywords_insert_own" on public.bolo_keywords
  for insert with check (auth.uid() = user_id);

create policy "bolo_keywords_delete_own" on public.bolo_keywords
  for delete using (auth.uid() = user_id);

-- ── notification_prefs: own row ─────────────────────────────────────────
-- user_id is the PRIMARY KEY here (one row per user).
create policy "notification_prefs_select_own" on public.notification_prefs
  for select using (auth.uid() = user_id);

create policy "notification_prefs_update_own" on public.notification_prefs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notification_prefs_insert_own" on public.notification_prefs
  for insert with check (auth.uid() = user_id);

-- ── listings: shared deal feed ──────────────────────────────────────────
-- Any authenticated user can read; only the scraper (service_role) writes.
create policy "listings_select_authenticated" on public.listings
  for select to authenticated using (true);

create policy "listings_insert_service" on public.listings
  for insert to service_role with check (true);

-- ── penny_items: shared feed ────────────────────────────────────────────
create policy "penny_items_select_authenticated" on public.penny_items
  for select to authenticated using (true);

create policy "penny_items_insert_service" on public.penny_items
  for insert to service_role with check (true);
