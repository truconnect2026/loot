-- Digistore24 Pro state on the profiles table.
--
-- The repo already uses public.profiles (not public.users) as the
-- auth.users mirror, and is_pro / plan_type were added by the earlier
-- Stripe migration (003_stripe.sql). This migration adds Digistore-
-- specific columns next to them so a single profile row carries the
-- subscription state regardless of which processor is the source of
-- truth on a given account.
--
-- Existing columns we reuse: is_pro, plan_type.
-- New columns:
--   pro_status            'active' | 'suspended' | 'cancelled' | 'refunded'
--   digistore_order_id    Digistore order id (one per subscription)
--   digistore_buyer_email email Digistore knows the customer by
--   pro_expires_at        end of paid period + small grace buffer
--   pro_updated_at        last webhook write timestamp

alter table public.profiles
  add column if not exists pro_status text check (pro_status in ('active','suspended','cancelled','refunded') or pro_status is null),
  add column if not exists digistore_order_id text,
  add column if not exists digistore_buyer_email text,
  add column if not exists pro_expires_at timestamptz,
  add column if not exists pro_updated_at timestamptz;

create index if not exists profiles_digistore_buyer_email_idx
  on public.profiles (digistore_buyer_email);
create index if not exists profiles_digistore_order_id_idx
  on public.profiles (digistore_order_id);

-- Idempotent event log + audit. The webhook upserts on
-- (order_id, event_type, transaction_id) so Digistore's 10-day
-- retry storm collapses to a single row. raw_payload is the full
-- POST body for replay/debugging.
create table if not exists public.digistore_events (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  transaction_id text,
  event_type text not null,
  pay_sequence_no integer,
  buyer_email text,
  product_id text,
  amount_brutto numeric(10,2),
  currency text,
  mode text,
  user_id uuid references auth.users(id) on delete set null,
  raw_payload jsonb not null,
  signature_valid boolean not null,
  processed_at timestamptz not null default now(),
  constraint digistore_events_idempotency_key unique (order_id, event_type, transaction_id)
);

create index if not exists digistore_events_order_idx
  on public.digistore_events (order_id);
create index if not exists digistore_events_user_idx
  on public.digistore_events (user_id);

-- service_role bypasses RLS, so no public policies. Only the webhook
-- (running with the service-role key) ever reads or writes this table.
alter table public.digistore_events enable row level security;
