"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import DotGridBackground from "@/components/shared/DotGridBackground";
import { CoinMarkSpinner } from "@/components/shared/CoinMark";
import { AccountSkeleton } from "@/components/shared/PageSkeleton";
import ProfileCard from "@/components/account/ProfileCard";
import UpgradeCard from "@/components/account/UpgradeCard";
import SettingsTile from "@/components/account/SettingsTile";
import ZipInput from "@/components/account/ZipInput";
import RadiusSheet from "@/components/account/RadiusSheet";
import BoloList from "@/components/account/BoloList";
import NotificationToggles from "@/components/account/NotificationToggles";
import {
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";
import { DIGISTORE_FIND_ORDER_URL } from "@/lib/digistore-affiliate";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { clearPendingPlan, readPendingPlan } from "@/lib/pending-plan";
import { withUTM } from "@/lib/utm";

// Digistore product page — same URL the /pro CTAs fall back to when
// the Stripe POST fails. Centralised here so a future product-ID
// change touches one spot.
const DIGISTORE_CHECKOUT_BASE = "https://checkout-ds24.com/product/691098";

// Default UTM payload for /account-originated checkouts. Matches the
// scheme in docs/utm-tracking.md. Auto-launch callers (pending-plan
// from /pro) supply their own utms and override this entirely.
const ACCOUNT_DEFAULT_UTMS = {
  utm_source: "loot_works",
  utm_medium: "internal",
  utm_campaign: "pro_purchase",
  utm_content: "account_upgrade",
};

function deriveInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0]) {
      return parts[0][0].toUpperCase();
    }
  }
  return (email[0] || "?").toUpperCase();
}

// Renewal date — formats "Mon DD" if same year, else "Mon DD, YYYY".
// Falls back to em-dash on null/invalid input so the cell never
// crashes on a fresh row that hasn't received a webhook yet.
function formatRenewsDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const monthDay = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  if (d.getFullYear() === new Date().getFullYear()) return monthDay;
  return `${monthDay}, ${d.getFullYear()}`;
}

// ── Icons ──
// Tile icons use stroke="currentColor" so the SettingsTile chassis can tint
// them via `color: accentColor` + `opacity: 0.6`. All identity icons share
// the same shape weight: 18px, strokeWidth 1.75.

function ChevronLeft() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ marginTop: -1 }}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--text-dim)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx={12} cy={10} r={3} />
    </svg>
  );
}

function RadarIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx={12} cy={12} r={10} />
      <circle cx={12} cy={12} r={6} />
      <circle cx={12} cy={12} r={2} />
    </svg>
  );
}

function CrosshairsIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx={12} cy={12} r={9} />
      <line x1={12} y1={1} x2={12} y2={6} />
      <line x1={12} y1={18} x2={12} y2={23} />
      <line x1={1} y1={12} x2={6} y2={12} />
      <line x1={18} y1={12} x2={23} y2={12} />
    </svg>
  );
}

function DownloadArrowIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1={12} y1={15} x2={12} y2={3} />
    </svg>
  );
}

function DoorIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1={21} y1={12} x2={9} y2={12} />
    </svg>
  );
}

// Tile accent colors — each drives the icon tint inside SettingsTile.
// E2: tightened from a 5-hue rainbow (which included the off-brand
// periwinkle #7B8FFF and a red #E8636B that duplicated the destructive
// sign-out) to the three-token brand palette. Nothing here carries a
// load-bearing semantic state, so the colors now follow brand meaning:
// camel = neutral settings, gold = attention/alerts, mint = the ONE
// money-finder row (watch list), the deliberate "mint = money" exception.
// Red is reserved strictly for destructive sign-out.
const ACCENT_ZIP = "#D4A574"; // camel — location (a static field, not an alarm)
const ACCENT_RADIUS = "#D4A574"; // camel — distance
const ACCENT_BOLO = "#5CE0B8"; // mint — the money-finder row (intentional exception)
const ACCENT_NOTIF = "#F5C518"; // gold — attention/alerts (brand emphasis color)
const ACCENT_EXPORT = "#D4A574"; // camel — reserve mint strictly for the watch-list row
// Sign-out no longer uses SettingsTile (it's a centered link, not a
// settings row), so ACCENT_SIGNOUT was retired with that change.

// Watch list rows — paired (id, keyword) so we can delete by primary key
// rather than positional index, which would silently break if the list
// was refetched out of order.
interface WatchRow {
  id: string;
  keyword: string;
}

type View = "main" | "bolo";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  initials: string;
  zipCode: string;
  isPro: boolean;
  subscriptionRenewsAt: string | null;
  planType: "monthly" | "annual" | null;
  paymentSource: "stripe" | "digistore" | null;
}

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();

  // View state
  const [view, setView] = useState<View>("main");

  // Authenticated user + profile
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Settings state
  const [radius, setRadius] = useState(15);
  const [watchRows, setWatchRows] = useState<WatchRow[]>([]);
  const [radiusSheetOpen, setRadiusSheetOpen] = useState(false);
  // Debounce radius writes — the slider's onChange fires on every
  // step-tick (~10 stops between 5 and 50), so without a coalesce
  // we'd post 10 updates during a single drag.
  const radiusSaveTimer = useRef<number | null>(null);

  // Notifications. `notifEnabled` (the master switch) is derived
  // from the existence of a push_subscriptions row, NOT from a
  // separate column. The sub-toggles persist to notification_prefs.
  // Defaults are true on first load — toggling them flips both
  // local state and the DB row.
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [notifDeals, setNotifDeals] = useState(true);
  const [notifBolo, setNotifBolo] = useState(true);
  const [notifPennies, setNotifPennies] = useState(true);

  // Export 3-state machine: idle → loading → done → idle.
  const [exportState, setExportState] = useState<
    "idle" | "loading" | "done"
  >("idle");

  // Real member count for social-proof copy (ProfileCard / UpgradeCard).
  // Fetched once on mount; null while loading.
  const [memberCount, setMemberCount] = useState<number | null>(null);

  // Back arrow state
  const [backPressed, setBackPressed] = useState(false);

  // Load auth user + profiles row on mount, creating the profile if missing.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const rawName =
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.name === "string" && meta.name) ||
        null;
      const email = user.email ?? "";

      const { data: profileRow } = await supabase
        .from("profiles")
        .select(
          "id, zip_code, search_radius_miles, is_pro, subscription_renews_at, plan_type, payment_source",
        )
        .eq("id", user.id)
        .maybeSingle();

      let zipCode = profileRow?.zip_code ?? "";

      if (!profileRow) {
        // First visit — create the row so subsequent updates are simple updates.
        await supabase.from("profiles").insert({ id: user.id });
        zipCode = "";
      }

      // Load notification_prefs + push subscription presence + watch
      // list keywords in parallel. Defaults stay true (matching initial
      // state) when there's no notif row yet — the user-facing semantic
      // is "on by default until you turn something off."
      const [{ data: notifRow }, { data: pushRow }, { data: kwRows }] =
        await Promise.all([
          supabase
            .from("notification_prefs")
            .select("deals, bolo, pennies")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("push_subscriptions")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("bolo_keywords")
            .select("id, keyword")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true }),
        ]);

      if (!cancelled) {
        setProfile({
          id: user.id,
          name: rawName,
          email,
          initials: deriveInitials(rawName, email),
          zipCode,
          isPro: profileRow?.is_pro === true,
          subscriptionRenewsAt: profileRow?.subscription_renews_at ?? null,
          planType:
            profileRow?.plan_type === "monthly" ||
            profileRow?.plan_type === "annual"
              ? profileRow.plan_type
              : null,
          paymentSource:
            profileRow?.payment_source === "stripe" ||
            profileRow?.payment_source === "digistore"
              ? profileRow.payment_source
              : null,
        });
        if (notifRow) {
          setNotifDeals(notifRow.deals !== false);
          setNotifBolo(notifRow.bolo !== false);
          setNotifPennies(notifRow.pennies !== false);
        }
        setNotifEnabled(!!pushRow);
        setRadius(profileRow?.search_radius_miles ?? 15);
        setWatchRows(
          (kwRows ?? []).map((r) => ({
            id: r.id as string,
            keyword: r.keyword as string,
          })),
        );
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const updateZip = useCallback(
    async (next: string) => {
      if (!profile) return;
      setProfile({ ...profile, zipCode: next });
      await supabase
        .from("profiles")
        .update({ zip_code: next })
        .eq("id", profile.id);
    },
    [profile, supabase]
  );

  // Search radius — flips local state immediately (so the slider feels
  // live) then debounces the DB write by 250ms. Without the debounce
  // we'd post one update per slider step during a drag.
  const updateRadius = useCallback(
    (next: number) => {
      setRadius(next);
      if (!profile) return;
      if (radiusSaveTimer.current !== null) {
        window.clearTimeout(radiusSaveTimer.current);
      }
      radiusSaveTimer.current = window.setTimeout(() => {
        radiusSaveTimer.current = null;
        void supabase
          .from("profiles")
          .update({ search_radius_miles: next })
          .eq("id", profile.id);
      }, 250);
    },
    [profile, supabase],
  );

  // Watch list — insert a new keyword, then refetch so the row gets
  // its server-assigned id (used for delete). Trims and short-circuits
  // empty / duplicate inputs so the table doesn't accumulate noise.
  const addKeyword = useCallback(
    async (raw: string) => {
      if (!profile) return;
      const keyword = raw.trim();
      if (!keyword) return;
      if (watchRows.some((r) => r.keyword.toLowerCase() === keyword.toLowerCase())) {
        return;
      }
      const { error } = await supabase
        .from("bolo_keywords")
        .insert({ user_id: profile.id, keyword });
      if (error) return;
      const { data } = await supabase
        .from("bolo_keywords")
        .select("id, keyword")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: true });
      setWatchRows(
        (data ?? []).map((r) => ({
          id: r.id as string,
          keyword: r.keyword as string,
        })),
      );
    },
    [profile, supabase, watchRows],
  );

  const removeKeyword = useCallback(
    async (index: number) => {
      const target = watchRows[index];
      if (!target) return;
      // Optimistic — drop the row immediately so the X feels instant.
      setWatchRows((prev) => prev.filter((_, i) => i !== index));
      await supabase.from("bolo_keywords").delete().eq("id", target.id);
    },
    [supabase, watchRows],
  );

  const handleExport = useCallback(async () => {
    if (exportState !== "idle") return;
    setExportState("loading");
    try {
      const res = await fetch("/api/export", { method: "GET" });
      if (!res.ok) {
        setExportState("idle");
        return;
      }
      const blob = await res.blob();
      // Build a temporary blob URL, programmatically click an anchor
      // to trigger the browser's native download flow, then revoke.
      // The synthetic anchor avoids navigating the current tab.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "loot-haul-log.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportState("done");
      window.setTimeout(() => setExportState("idle"), 1500);
    } catch {
      setExportState("idle");
    }
  }, [exportState]);

  // Master push toggle. Turning ON: register the SW, request
  // Notification permission, subscribe via pushManager, POST the
  // subscription to /api/push/subscribe. Turning OFF: reverse —
  // unsubscribe locally and delete the row server-side. Errors
  // (permission denied, missing VAPID env, etc.) revert the toggle
  // and surface a transient inline message.
  const handleTogglePushEnabled = useCallback(async () => {
    if (notifBusy) return;
    setNotifBusy(true);
    setNotifError(null);
    try {
      if (notifEnabled) {
        await unsubscribeFromPush();
        setNotifEnabled(false);
      } else {
        const result = await subscribeToPush();
        if (result.ok) {
          setNotifEnabled(true);
        } else {
          const msg =
            result.reason === "denied"
              ? "permission denied — enable in browser settings"
              : result.reason === "unsupported"
                ? "your browser doesn't support push"
                : result.reason === "missing-vapid"
                  ? "push isn't configured on this build"
                  : (result.message ?? "couldn't enable push");
          setNotifError(msg);
        }
      }
    } finally {
      setNotifBusy(false);
    }
  }, [notifEnabled, notifBusy]);

  // Per-bucket toggles. Optimistically flip local state, upsert the
  // row, revert on failure. notification_prefs uses user_id as the
  // primary key so upsert with onConflict=user_id replaces cleanly.
  const persistNotifPrefs = useCallback(
    async (next: { deals?: boolean; bolo?: boolean; pennies?: boolean }) => {
      if (!profile) return;
      const row = {
        user_id: profile.id,
        deals: next.deals ?? notifDeals,
        bolo: next.bolo ?? notifBolo,
        pennies: next.pennies ?? notifPennies,
      };
      await supabase
        .from("notification_prefs")
        .upsert(row, { onConflict: "user_id" });
    },
    [profile, supabase, notifDeals, notifBolo, notifPennies],
  );

  const handleToggleDeals = useCallback(() => {
    const next = !notifDeals;
    setNotifDeals(next);
    void persistNotifPrefs({ deals: next });
  }, [notifDeals, persistNotifPrefs]);

  const handleToggleBolo = useCallback(() => {
    const next = !notifBolo;
    setNotifBolo(next);
    void persistNotifPrefs({ bolo: next });
  }, [notifBolo, persistNotifPrefs]);

  const handleTogglePennies = useCallback(() => {
    const next = !notifPennies;
    setNotifPennies(next);
    void persistNotifPrefs({ pennies: next });
  }, [notifPennies, persistNotifPrefs]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/");
  }, [supabase, router]);

  // Manage plan — POSTs to /api/stripe/portal which creates a Stripe
  // Customer Portal session and returns the hosted URL. Open in a
  // NEW tab so the user keeps their place in Loot. The safe-flag set
  // `noopener,noreferrer` prevents the Stripe tab from getting a
  // window.opener handle that could navigate this tab back, and
  // strips the Referer header from the outbound request.
  const handleManagePlan = useCallback(async () => {
    if (typeof window === "undefined") return;
    // Digistore-paid users don't have a Stripe customer to portal
    // into — route them to Digistore's "find my order" page where
    // they can manage / cancel their subscription with their email.
    if (profile?.paymentSource === "digistore") {
      window.open(
        DIGISTORE_FIND_ORDER_URL,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (!res.ok) {
        console.error("[account] Portal session failed:", await res.text());
        return;
      }
      const { url } = (await res.json()) as { url?: string };
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("[account] Portal session error:", err);
    }
  }, [profile?.paymentSource]);

  // Subscribe — POSTs to /api/stripe/checkout with the chosen
  // priceId, then redirects in-tab to the Stripe-hosted checkout
  // page. (No new tab here — checkout is the primary action; the
  // user comes back via success_url after paying.)
  //
  // Accepts optional plan + UTM metadata so the auto-launch effect
  // below can forward attribution from the original /pro click;
  // direct UpgradeCard taps pass just the priceId and fall back to
  // ACCOUNT_DEFAULT_UTMS (utm_content=account_upgrade).
  //
  // Digistore is wired as a failure fallback only: if the Stripe POST
  // throws or returns no URL, we redirect to the Digistore product
  // page carrying the same UTMs so attribution survives the rail
  // switch. This mirrors the /pro fork and keeps a Stripe outage
  // from silently killing conversions.
  const handleSubscribe = useCallback(
    async (
      priceId: string,
      extra?: { plan?: string; utms?: Record<string, string> },
    ) => {
      if (typeof window === "undefined") return;
      const inferredPlan =
        priceId === (process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL ?? "")
          ? "annual"
          : priceId === (process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ?? "")
            ? "monthly"
            : null;
      const plan = extra?.plan ?? inferredPlan ?? "";
      const utms = extra?.utms ?? ACCOUNT_DEFAULT_UTMS;
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            priceId,
            ...(plan ? { plan } : {}),
            ...utms,
          }),
        });
        if (!res.ok) {
          throw new Error(`Checkout failed (${res.status}): ${await res.text()}`);
        }
        const { url } = (await res.json()) as { url?: string };
        if (!url) throw new Error("Stripe did not return a URL");
        window.location.href = url;
        return;
      } catch (err) {
        console.error(
          "[account] Stripe checkout failed, falling back to Digistore",
          err,
        );
      }
      // Fallback: Digistore-hosted checkout with the same UTMs so the
      // ad-source attribution still rolls up correctly on the
      // Digistore reporting side.
      const content =
        typeof utms.utm_content === "string" && utms.utm_content
          ? utms.utm_content
          : "account_upgrade";
      const campaign =
        typeof utms.utm_campaign === "string" && utms.utm_campaign
          ? utms.utm_campaign
          : "pro_purchase";
      window.location.href = withUTM(DIGISTORE_CHECKOUT_BASE, content, campaign);
    },
    [],
  );

  // Fetch the total registered-user count for honest social proof.
  // No auth needed — profiles is public-readable for count.
  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      try {
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true });
        if (typeof count === "number") setMemberCount(count);
      } catch { /* non-fatal */ }
    })();
  }, []);

  // Pending-plan auto-launch: if the visitor clicked a /pro CTA while
  // signed out, we stashed their plan choice + UTMs in sessionStorage.
  // Once they sign in and land here (via /onboarding or /app), fire
  // the Stripe checkout with the original attribution and clear the
  // stash so a stale entry can't ambush a later visit.
  //
  // Guards: profile loaded, not already Pro, and one-shot via the ref.
  // isPro suppresses the launch for existing subscribers who happen to
  // hit /account with a stale pending plan in another tab.
  const pendingHandledRef = useRef(false);
  useEffect(() => {
    if (pendingHandledRef.current) return;
    if (loading || !profile) return;
    if (profile.isPro) {
      clearPendingPlan();
      pendingHandledRef.current = true;
      return;
    }
    const pending = readPendingPlan();
    if (!pending) return;
    pendingHandledRef.current = true;
    clearPendingPlan();
    const priceId =
      pending.plan === "annual"
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL ?? ""
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ?? "";
    if (!priceId) {
      console.error("[account] Stripe price not configured for pending plan");
      return;
    }
    void handleSubscribe(priceId, { plan: pending.plan, utms: pending.utms });
  }, [loading, profile, handleSubscribe]);

  // Loading state — show the branded spinner until session + profile are ready.
  if (loading || !profile) {
    // Held structure, not a spinner — mirrors the loaded Me layout so
    // the client data-fetch gate reads as "arriving", not "empty".
    return <AccountSkeleton />;
  }

  // BOLO list view
  if (view === "bolo") {
    return (
      <>
        <DotGridBackground variant="grid" />
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "16px 18px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <BoloList
            keywords={watchRows.map((r) => r.keyword)}
            onAdd={addKeyword}
            onRemove={removeKeyword}
            onBack={() => setView("main")}
          />
        </div>
      </>
    );
  }

  // Main account view
  return (
    <>
      <DotGridBackground variant="grid" />
      {/* Ambient blue wash — sits between dot grid and content. The vault has
          its own color temperature: a barely-perceptible periwinkle glow
          centered behind the profile card area gives this page a cooler
          temperature than the dashboard's warmer mint/camel palette. */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle 350px at 50% 15%, rgba(123,143,255,0.03) 0%, rgba(123,143,255,0.015) 50%, transparent 75%)",
        }}
      />
      <RadiusSheet
        open={radiusSheetOpen}
        onClose={() => setRadiusSheetOpen(false)}
        value={radius}
        onChange={updateRadius}
      />

      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "0 18px",
          position: "relative",
          zIndex: 1,
        }}
        // House entrance — 45ms stagger, same cadence as Home/Tools
        // (replaces the old vaultReveal-plus-scattered-fadeInUp mix).
        className="ac-stagger"
      >
        <style>{`
          @keyframes acRise {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .ac-stagger > * { animation: acRise var(--motion-medium) var(--ease-out) both; }
          .ac-stagger > *:nth-child(2) { animation-delay: 0ms; }
          .ac-stagger > *:nth-child(3) { animation-delay: 45ms; }
          .ac-stagger > *:nth-child(4) { animation-delay: 90ms; }
          .ac-stagger > *:nth-child(5) { animation-delay: 135ms; }
          .ac-stagger > *:nth-child(6) { animation-delay: 180ms; }
          .ac-stagger > *:nth-child(7) { animation-delay: 225ms; }
          .ac-stagger > *:nth-child(n+8) { animation-delay: 270ms; }
          @media (prefers-reduced-motion: reduce) {
            .ac-stagger > * { animation: none !important; }
          }
        `}</style>
        {/* Page header — back arrow + "Account" title. The title anchors the
            page so a returning user lands and instantly knows where they are. */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <button
            onClick={() => router.push("/app")}
            onPointerDown={() => setBackPressed(true)}
            onPointerUp={() => setBackPressed(false)}
            onPointerLeave={() => setBackPressed(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              // B6: 44px touch target (up from ~26px), pulled left so the
              // enlarged glyph's optical edge lands back on the 18px page
              // margin instead of floating detached from the title.
              width: 44,
              height: 44,
              padding: 0,
              marginLeft: -11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: backPressed
                ? "var(--text-primary)"
                : "var(--text-muted)",
              transition: "color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <ChevronLeft />
          </button>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              letterSpacing: "0.04em",
              color: "var(--text-primary)",
              lineHeight: 1,
            }}
          >
            ACCOUNT
          </span>
        </div>

        {/* Profile / Upgrade card — staggered by the container */}
        <div>
          {profile.isPro ? (
            <ProfileCard
              name={profile.name ?? profile.email.split("@")[0]}
              email={profile.email}
              initials={profile.initials}
              isPro={true}
              price={profile.planType === "annual" ? "$99.99" : "$14.99"}
              period={profile.planType === "annual" ? "/yr" : "/mo"}
              renewsDate={formatRenewsDate(profile.subscriptionRenewsAt)}
              scansLabel="unlimited"
              onCancel={handleManagePlan}
              manageLabel={
                profile.paymentSource === "digistore"
                  ? "Manage via Digistore"
                  : "Manage plan"
              }
              memberCount={memberCount ?? undefined}
            />
          ) : (
            <UpgradeCard
              monthlyPriceId={
                process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ?? ""
              }
              annualPriceId={
                process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL ?? ""
              }
              onSubscribe={handleSubscribe}
              memberCount={memberCount ?? undefined}
            />
          )}
        </div>

        {/* ── Settings ── */}
        {/* SETTINGS section label — 28px gap from the upgrade card
            above per the spacing spec; gives the premium tier its
            own breathing room before the functional settings list. */}
        <SectionHeader marginTop={28}>SETTINGS</SectionHeader>

        {/* Group 1: Location settings — 8px between rows so each
            tile reads as its own card with air around it instead of
            crammed against its neighbors. */}
        <div style={{ marginTop: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Zip code — persists to profiles.zip_code */}
          <ZipInput
            value={profile.zipCode}
            onChange={updateZip}
            icon={<MapPinIcon />}
            accentColor={ACCENT_ZIP}
          />

          {/* Search radius */}
          <SettingsTile
            onClick={() => setRadiusSheetOpen(true)}
            icon={<RadarIcon />}
            accentColor={ACCENT_RADIUS}
          >
            <span
              style={{
                flex: 1,
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            >
              Search radius
            </span>
            {/* Value chip — flat surface, JBMono 12/500. Same chip
                shape used across all three settings rows (zip,
                radius, watch list) so the right column reads as a
                consistent ladder of badges. */}
            <div
              data-cell-flash=""
              style={{
                backgroundColor: "rgba(255,255,255,0.09)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8,
                padding: "4px 12px",
                marginRight: 6,
                transition: "background-color 120ms ease-out",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontWeight: 500,
                  fontSize: 12,
                  color: "#DED8EC",
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {radius} mi
              </span>
            </div>
            <ChevronRight />
          </SettingsTile>

          {/* Watch list — was "BOLO keywords" but BOLO ("Be On the
              LookOut") is reseller jargon mainstream users don't know.
              "Watch list" reads instantly and matches familiar
              marketplace patterns (eBay watch list, Craigslist saved
              searches). Internal model names (`view === "bolo"`, the
              bolo_keywords table) stay so the rename is purely
              user-facing copy. */}
          <SettingsTile
            onClick={() => setView("bolo")}
            icon={<CrosshairsIcon />}
            accentColor={ACCENT_BOLO}
          >
            <span
              style={{
                flex: 1,
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            >
              Watch list
            </span>
            {/* Watch list count chip — when the list is empty we
                swap the "0 keywords" readout for an inviting "+ add
                keywords" prompt (mint plus + muted text). Empty
                state should invite action, not report a zero. */}
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.09)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8,
                padding: "4px 12px",
                marginRight: 6,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {watchRows.length === 0 ? (
                <>
                  <span
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 12,
                      color: "rgba(92, 224, 184, 0.5)",
                      lineHeight: 1,
                    }}
                  >
                    +
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    add keywords
                  </span>
                </>
              ) : (
                <span
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontWeight: 500,
                    fontSize: 12,
                    color: "#DED8EC",
                    fontFeatureSettings: '"tnum"',
                  }}
                >
                  {watchRows.length} keywords
                </span>
              )}
            </div>
            <ChevronRight />
          </SettingsTile>
        </div>

        {/* Group 2: Notifications — 8px gap below the location group
            (matches the gap-8 inside the location flex column above).
            Every row in SETTINGS sits at uniform 8px from its
            neighbor, regardless of which sub-group it belongs to.
            The master toggle subscribes via the browser Push API and
            stores the endpoint in push_subscriptions; the sub-toggles
            persist to notification_prefs. notifError surfaces the
            most common failure (denied permission) inline. */}
        <div style={{ marginTop: 8 }}>
          <NotificationToggles
            enabled={notifEnabled}
            onToggleEnabled={handleTogglePushEnabled}
            deals={notifDeals}
            onToggleDeals={handleToggleDeals}
            bolo={notifBolo}
            onToggleBolo={handleToggleBolo}
            pennies={notifPennies}
            onTogglePennies={handleTogglePennies}
            accentColor={ACCENT_NOTIF}
          />
          {notifError && (
            <div
              role="alert"
              style={{
                marginTop: 8,
                paddingLeft: 14,
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fontWeight: 500,
                color: "rgba(232,99,107,0.85)",
              }}
            >
              {notifError}
            </div>
          )}
        </div>

        {/* DATA section — Export got its own break so the haul-log
            tile reads as a power feature, not a buried row. Section
            label mirrors the SETTINGS header above; subtitle copy
            now explains the actual value ("track your flips for tax
            season") instead of the cryptic "CSV for taxes". */}
        <SectionHeader marginTop={24}>DATA</SectionHeader>
        <div>
          <SettingsTile
            height={64}
            onClick={handleExport}
            icon={<DownloadArrowIcon />}
            accentColor={ACCENT_EXPORT}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: 13,
                  color: "var(--text-primary)",
                }}
              >
                Export haul log
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.55)",
                  marginTop: 2,
                }}
              >
                track your flips for tax season
              </div>
            </div>
            {exportState === "done" ? (
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 10,
                  color: "var(--accent-mint)",
                }}
              >
                exported
              </span>
            ) : exportState === "loading" ? (
              <CoinMarkSpinner />
            ) : null}
          </SettingsTile>
        </div>

        {/* Sign out — deliberately uncarded. Sits on the raw page
            background as a quiet exit, separated from the functional
            settings above by a 16px gap. Centered horizontally and
            colored at 55% red so it reads as "available but not
            urgent." Press state drops to 40% opacity for a clean
            tactile cue without bouncing or scaling. */}
        <SignOutLink onTap={handleSignOut} />

        {/* E3: footer terminus — a dim wordmark so the page reads FINISHED
            below the quiet sign-out instead of running into dead space above
            the tab bar. Neutral dim (no brand hue) so it never competes with
            the settings accents. */}
        <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, letterSpacing: "0.14em", color: "rgba(255,255,255,0.20)" }}>
            loot.works
          </span>
        </div>

        {/* Bottom padding — tab bar + air above sign-out */}
        <div style={{ paddingBottom: "var(--content-bottom-clearance)" }} />
      </div>
    </>
  );
}

interface SignOutLinkProps {
  onTap: () => void;
}

function SignOutLink({ onTap }: SignOutLinkProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      style={{
        // 28px from the DATA section above — quiet exit deserves
        // its own breathing room, not jammed against the export tile.
        marginTop: 28,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <button
        type="button"
        onClick={onTap}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          background: "transparent",
          border: "none",
          padding: "10px 20px",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: 13,
          color: "rgba(232, 99, 107, 0.55)",
          opacity: pressed ? 0.4 : 1,
          cursor: "pointer",
          transition: "opacity 100ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          <DoorIcon />
        </span>
        <span>Sign out</span>
      </button>
    </div>
  );
}
