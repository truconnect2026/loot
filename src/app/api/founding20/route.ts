import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

// supabase-js v2 without a generated Database<T> types upsert() args as
// `never`; untype the from() builder once so the call site stays clean.
// Same pattern as the Stripe + Digistore webhook routes.
type AdminTable = ReturnType<
  ReturnType<typeof getSupabaseAdmin>["from"]
> & {
  upsert: (
    values: Record<string, unknown>,
    options?: { onConflict?: string },
  ) => Promise<{ error: { message: string } | null }>;
};

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_HANDLE = 60;
const MAX_URL = 500;
const MAX_NOTES = 250;

const PLATFORMS = new Set(["TikTok", "YouTube", "Instagram", "Podcast", "Other"]);
const FOLLOWER_BUCKETS = new Set(["<10k", "10k – 50k", "50k – 250k", "250k+"]);

interface FoundingBody {
  name?: string;
  email?: string;
  primary_platform?: string;
  follower_count?: string;
  handle?: string;
  channel_url?: string;
  notes?: string;
}

interface FoundingRow {
  name: string;
  email: string;
  primary_platform: string | null;
  follower_count: string | null;
  handle: string | null;
  channel_url: string | null;
  notes: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  status: "pending";
  submitted_at: string;
}

// In-memory rate limit by IP — five submissions per ten-minute window is
// plenty for a legit applicant retrying once or twice; anything beyond
// that is almost certainly automated. Survives only until the next cold
// start, which is fine for a sub-100/day form.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const recentSubmissions = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const window = recentSubmissions.get(ip) ?? [];
  const fresh = window.filter((t) => now - t < RATE_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT) {
    recentSubmissions.set(ip, fresh);
    return true;
  }
  fresh.push(now);
  recentSubmissions.set(ip, fresh);
  return false;
}

function hashIp(ip: string): string {
  const salt = process.env.FOUNDING20_IP_SALT ?? "loot-founding20";
  return createHash("sha256").update(ip + salt).digest("hex");
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(
  req: NextRequest,
): Promise<NextResponse<{ ok: true } | { error: string }>> {
  let body: FoundingBody;
  try {
    body = (await req.json()) as FoundingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body.name ?? "").trim().slice(0, MAX_NAME);
  const email = (body.email ?? "").trim().toLowerCase().slice(0, MAX_EMAIL);
  const platform = (body.primary_platform ?? "").trim();
  const followers = (body.follower_count ?? "").trim();
  const handle = (body.handle ?? "").trim().slice(0, MAX_HANDLE);
  const channelUrl = (body.channel_url ?? "").trim().slice(0, MAX_URL);
  const notes = (body.notes ?? "").trim().slice(0, MAX_NOTES);

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (platform && !PLATFORMS.has(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }
  if (followers && !FOLLOWER_BUCKETS.has(followers)) {
    return NextResponse.json({ error: "Invalid follower bucket" }, { status: 400 });
  }
  if (channelUrl && !/^https?:\/\//i.test(channelUrl)) {
    return NextResponse.json({ error: "channel_url must be http(s)" }, { status: 400 });
  }

  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many submissions. Try again in a few minutes." },
      { status: 429 },
    );
  }

  const row: FoundingRow = {
    name,
    email,
    primary_platform: platform || null,
    follower_count: followers || null,
    handle: handle || null,
    channel_url: channelUrl || null,
    notes: notes || null,
    ip_hash: ip !== "unknown" ? hashIp(ip) : null,
    user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
    status: "pending",
    submitted_at: new Date().toISOString(),
  };

  try {
    const admin = getSupabaseAdmin();
    const table = admin.from("founding20_applications") as unknown as AdminTable;
    const { error } = await table.upsert(
      row as unknown as Record<string, unknown>,
      { onConflict: "email" },
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
