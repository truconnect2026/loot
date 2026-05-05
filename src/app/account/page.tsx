"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import DotGridBackground from "@/components/shared/DotGridBackground";
import { CoinMarkSpinner } from "@/components/shared/CoinMark";
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
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
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
// Reassigned per the account-page polish spec: zip is now a warm
// location red (pin color, not alarm), watch list takes mint as the
// active engagement feature, push notifications take the alert
// blue-purple. Mint earning a slot here is the deliberate exception
// to the "mint = money only" rule — watch list IS the money-finding
// feature, so mint signals "this is what fills your wallet."
const ACCENT_ZIP = "#E8636B"; // pin red — location
const ACCENT_RADIUS = "#D4A574"; // camel — distance
const ACCENT_BOLO = "#5CE0B8"; // mint — active engagement (money finder)
const ACCENT_NOTIF = "#7B8FFF"; // blue-purple — alerts
const ACCENT_EXPORT = "#5A4E70"; // muted — utility action
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
          "id, zip_code, search_radius_miles, is_pro, subscription_renews_at, plan_type",
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
  }, []);

  // Subscribe — POSTs to /api/stripe/checkout with the chosen
  // priceId, then redirects in-tab to the Stripe-hosted checkout
  // page. (No new tab here — checkout is the primary action; the
  // user comes back via success_url after paying.)
  const handleSubscribe = useCallback(
    async (priceId: string) => {
      if (typeof window === "undefined") return;
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId }),
        });
        if (!res.ok) {
          console.error(
            "[account] Checkout session failed:",
            await res.text(),
          );
          return;
        }
        const { url } = (await res.json()) as { url?: string };
        if (url) window.location.href = url;
      } catch (err) {
        console.error("[account] Checkout session error:", err);
      }
    },
    [],
  );

  // Loading state — show the branded spinner until session + profile are ready.
  if (loading || !profile) {
    return (
      <>
        <DotGridBackground variant="grid" />
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <CoinMarkSpinner />
        </div>
      </>
    );
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
          // Vault arrival — single scale+fade on mount. Different motion
          // personality from the dashboard's fadeInUp.
          animation: "vaultReveal 280ms cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      >
        {/* Page header — back arrow + "Account" title. The title anchors the
            page so a returning user lands and instantly knows where they are. */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
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
              padding: 4,
              display: "flex",
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
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: "0.05em",
              color: "#5A4E70",
            }}
          >
            Account
          </span>
        </div>

        {/* Profile Card — vaultReveal cascade, the page's arrival motion */}
        <div
          style={{
            opacity: 0,
            animation:
              "vaultReveal 280ms cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards",
          }}
        >
          {profile.isPro ? (
            <ProfileCard
              name={profile.name ?? profile.email.split("@")[0]}
              email={profile.email}
              initials={profile.initials}
              isPro={true}
              price={profile.planType === "annual" ? "$89.99" : "$9.99"}
              period={profile.planType === "annual" ? "/yr" : "/mo"}
              renewsDate={formatRenewsDate(profile.subscriptionRenewsAt)}
              scansLabel="unlimited"
              onCancel={handleManagePlan}
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
            />
          )}
        </div>

        {/* ── Settings ── */}
        {/* SETTINGS section label — slightly brighter blue-purple than the
            dimmest annotations (RENEWS / SCANS at #1E1A30) so this section
            header reads on device. Still cold (no red, no green). */}
        <div
          style={{
            marginTop: 20,
            marginBottom: 8,
            // Uppercase section header — stays mono per the font role system.
            fontFamily: "var(--font-label)",
            fontSize: 9,
            color: "#2D2845",
            letterSpacing: "0.10em",
            textTransform: "uppercase",
          }}
        >
          SETTINGS
        </div>

        {/* Group 1: Location settings (6px gap) */}
        <div style={{ marginTop: 0, display: "flex", flexDirection: "column", gap: 6 }}>
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
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 8,
                padding: "4px 12px",
                marginRight: 6,
                transition: "background-color 120ms ease-out",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontWeight: 500,
                  fontSize: 12,
                  color: "#C8C0D8",
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
            {/* Watch list count — same chip treatment as zip and
                radius so the right column reads as a consistent
                ladder of badges. */}
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 8,
                padding: "4px 12px",
                marginRight: 6,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontWeight: 500,
                  fontSize: 12,
                  color: "#C8C0D8",
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {watchRows.length} keywords
              </span>
            </div>
            <ChevronRight />
          </SettingsTile>
        </div>

        {/* Group 2: Notifications — 18px gap below the location group.
            The master toggle subscribes via the browser Push API and
            stores the endpoint in push_subscriptions. The sub-toggles
            persist to notification_prefs. notifError surfaces the
            most common failure (denied permission) inline. */}
        <div style={{ marginTop: 18 }}>
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
        <div
          style={{
            marginTop: 24,
            marginBottom: 8,
            fontFamily: "var(--font-label)",
            fontSize: 9,
            color: "#2D2845",
            letterSpacing: "0.10em",
            textTransform: "uppercase",
          }}
        >
          DATA
        </div>
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
                  color: "var(--text-muted)",
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

        {/* Bottom padding — 48px so the sign-out has air below it */}
        <div style={{ paddingBottom: 48 }} />
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
        marginTop: 16,
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
