-- 011_hauls.sql
-- Persistent haul tracking, separate from the ephemeral scans table.
-- scans = scan history (what Claude said). hauls = what the user decided
-- to actively track through the saved → bought → listed → sold pipeline.

create table hauls (
  id              uuid          primary key default gen_random_uuid(),
  user_id         uuid          not null references auth.users(id) on delete cascade,
  created_at      timestamptz   not null default now(),
  name            text          not null,
  image_url       text,
  buy_price       numeric(10,2),
  est_resale_low  numeric(10,2),
  est_resale_high numeric(10,2),
  verdict         text          check (verdict in ('buy', 'maybe', 'pass')),
  status          text          not null default 'saved'
                                check (status in ('saved', 'bought', 'listed', 'sold')),
  sold_price      numeric(10,2),
  sold_at         timestamptz,
  source          text          not null default 'manual'
                                check (source in ('scan_single', 'scan_shelf', 'scan_crate', 'manual')),
  notes           text
);

alter table hauls enable row level security;

create policy "hauls: users read own rows"
  on hauls for select
  using (auth.uid() = user_id);

create policy "hauls: users insert own rows"
  on hauls for insert
  with check (auth.uid() = user_id);

create policy "hauls: users update own rows"
  on hauls for update
  using (auth.uid() = user_id);

create policy "hauls: users delete own rows"
  on hauls for delete
  using (auth.uid() = user_id);

-- Common query pattern: all hauls for a user, newest first.
create index hauls_user_created on hauls(user_id, created_at desc);
