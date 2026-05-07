-- Dual-rail payment source tag.
--
-- payment_source records which processor owns the user's current Pro
-- subscription. The two webhooks (Stripe + Digistore) use this column
-- to short-circuit whenever they see a user already paid through the
-- other rail — avoids one webhook trampling state owned by the other
-- and prevents double-charges turning into broken state.
--
-- Backfill: every existing Pro user came through Stripe (Digistore
-- went live with migration 007), so any active is_pro row with a
-- stripe_customer_id is tagged 'stripe'. Anything else stays NULL
-- and gets tagged when the next webhook fires.

alter table public.profiles
  add column if not exists payment_source text
    check (payment_source in ('stripe','digistore') or payment_source is null);

create index if not exists profiles_payment_source_idx
  on public.profiles (payment_source);

update public.profiles
   set payment_source = 'stripe'
 where is_pro = true
   and payment_source is null
   and stripe_customer_id is not null;
