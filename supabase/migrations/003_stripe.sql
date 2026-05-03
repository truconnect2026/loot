-- Stripe subscription columns on profiles. The webhook is the single
-- writer for these — the checkout flow doesn't optimistically flip
-- is_pro because Stripe is the source of truth for subscription state.
--
--   is_pro                       — current subscription is active
--   stripe_customer_id           — set on first checkout completion
--   stripe_subscription_status   — 'active' | 'past_due' | 'canceled' | etc.
--   subscription_renews_at       — current_period_end from Stripe
--   plan_type                    — 'monthly' | 'annual'
alter table profiles add column if not exists is_pro boolean default false;
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists stripe_subscription_status text;
alter table profiles add column if not exists subscription_renews_at timestamptz;
alter table profiles add column if not exists plan_type text;

-- Lookup index for the webhook (which only has stripe_customer_id).
create index if not exists profiles_stripe_customer_id_idx
  on profiles (stripe_customer_id);
