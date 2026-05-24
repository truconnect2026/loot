-- Founding 20 affiliate applications.
--
-- Submitted via the form on /kit#founding-20-form. Service-role-only:
-- there's no end-user UX that reads these rows. Admin review happens
-- via the /admin/founding20 page, which also uses the service-role
-- client server-side (auth gate is enforced at the route layer).
--
-- Email is unique so resubmissions UPSERT instead of multiplying.

create table if not exists public.founding20_applications (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null unique,
  primary_platform text,
  follower_count text,
  handle text,
  channel_url text,
  notes text,

  status text not null default 'pending'
    check (status in ('pending', 'reviewing', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by text,
  notes_internal text,

  -- Light spam-trail data: not surfaced to end users, kept for admin
  -- review. ip_hash is the SHA-256 of the client IP + a per-deployment
  -- salt so we can deduplicate spam without storing raw IPs.
  ip_hash text,
  user_agent text,

  submitted_at timestamptz not null default now()
);

create index if not exists founding20_applications_status_idx
  on public.founding20_applications (status, submitted_at desc);

create index if not exists founding20_applications_submitted_at_idx
  on public.founding20_applications (submitted_at desc);

-- ── RLS ─────────────────────────────────────────────────────────────────
-- No anon or authenticated policies on purpose. The service-role client
-- (server-only, used by the API route + admin view) bypasses RLS, so it
-- can read/write freely. Anyone hitting the table from a client session
-- gets nothing — which is the intended posture.
alter table public.founding20_applications enable row level security;
