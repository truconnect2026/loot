-- Two additive changes to unblock existing code paths:
--
-- 1. scans.method: add 'crate' to the allowed set. The crate scanner
--    (src/app/api/scan-multi/detect/route.ts) already inserts
--    method='crate' rows, but the CHECK constraint added in
--    005_shelf_method.sql only allowed ('barcode','vision','shelf'),
--    so those inserts silently failed inside their catch-and-log. This
--    widens the constraint using the same drop+recreate pattern as 005;
--    the existing constraint name is scans_method_check
--    (see 005_shelf_method.sql:9).
--
-- 2. flip_coach_usage: a per-user daily counter table for future Pro
--    metering of Flip Coach. NOTE: it has NO consumer as of this
--    migration — Flip Coach is currently Pro-only with the free tier at
--    zero (FREE_SCAN_LIMIT=0), and Pro is unmetered, so nothing reads or
--    writes this table yet. It exists so a future "N Pro coach messages
--    per day" limit can be added without another migration. RLS is
--    enabled with no policies (service-role only), matching the
--    founding20_applications default-deny posture (009).

-- ── 1. scans.method += 'crate' ──────────────────────────────────────────────
alter table public.scans drop constraint if exists scans_method_check;

alter table public.scans
  add constraint scans_method_check
  check (method in ('barcode', 'vision', 'shelf', 'crate'));

-- ── 2. flip_coach_usage (future Pro metering; no consumer today) ─────────────
create table if not exists public.flip_coach_usage (
  user_id uuid references public.profiles(id) on delete cascade,
  day     date not null,
  count   int  not null default 0,
  primary key (user_id, day)
);

-- Default-deny RLS: no anon or authenticated policies on purpose. The
-- service-role client (server-only) bypasses RLS, so the future
-- metering path can read/write freely while client sessions get
-- nothing. Same posture as public.founding20_applications (009).
alter table public.flip_coach_usage enable row level security;
