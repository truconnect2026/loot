-- Push notifications + alert state.
--
-- One subscription per user — we replace on re-subscribe rather than
-- accumulating stale endpoints from old browser sessions. Tokens
-- expire every few months in Chrome anyway; the unsubscribe path
-- handles cleanup of stale endpoints when web-push returns 410 Gone.
create table push_subscriptions (
  user_id uuid references profiles(id) on delete cascade primary key,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Per-user state for the BOLO/deal alert cron. The cron only
-- considers feed_cache rows whose created_at is newer than this
-- timestamp, so a user gets one alert per cache refresh per zip
-- (cache TTL is 4h; cron runs every 30m).
alter table profiles add column if not exists last_alert_check_at timestamptz;

alter table push_subscriptions enable row level security;

-- Users manage their own row (insert/update/delete via the
-- /api/push/{subscribe,unsubscribe} routes). The cron uses the
-- service-role client which bypasses RLS, so it can read all rows.
create policy "users_manage_own_push_subscription"
  on push_subscriptions
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- notification_prefs was created in 001 without RLS or policies.
-- Add them here so the account page can read/write the user's prefs
-- through the anon client. Idempotent — safe to re-run.
do $$
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'notification_prefs' and c.relrowsecurity = true
  ) then
    alter table notification_prefs enable row level security;
  end if;
  if not exists (
    select 1 from pg_policies
    where tablename = 'notification_prefs'
      and policyname = 'users_manage_own_notification_prefs'
  ) then
    create policy "users_manage_own_notification_prefs"
      on notification_prefs
      for all
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;
