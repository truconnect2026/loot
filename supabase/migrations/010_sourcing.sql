-- Sourcing Game Plan — stores + logs for the per-user deal schedule.
-- sourcing_stores: the thrift/resale stops a user wants to track.
-- sourcing_logs:   one-tap records of whether a deal pattern actually hit.

create table sourcing_stores (
  id             uuid         default gen_random_uuid() primary key,
  user_id        uuid         not null,
  name           text         not null,
  chain          text         not null default 'other',  -- 'Goodwill','Savers','Value Village','other'
  location_label text,                                   -- free text, e.g. "Broad St"
  created_at     timestamptz  default now()
);

alter table sourcing_stores enable row level security;

-- Users own their stores — full CRUD on their rows only.
create policy "Users manage own stores"
  on sourcing_stores
  for all
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_sourcing_stores_user on sourcing_stores(user_id);

-- sourcing_logs: one-tap records of sale hits at user stores.
-- logged_date is a plain date (no time) so weekday grouping is clean.
create table sourcing_logs (
  id           uuid         default gen_random_uuid() primary key,
  user_id      uuid         not null,
  store_id     uuid         not null references sourcing_stores(id) on delete cascade,
  logged_date  date         not null default current_date,
  was_on_sale  boolean      not null default false,
  note         text,
  created_at   timestamptz  default now()
);

alter table sourcing_logs enable row level security;

create policy "Users manage own logs"
  on sourcing_logs
  for all
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_sourcing_logs_user  on sourcing_logs(user_id);
create index idx_sourcing_logs_store on sourcing_logs(store_id);
create index idx_sourcing_logs_date  on sourcing_logs(logged_date);
