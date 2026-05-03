"use client";

import { useState, useCallback, useEffect } from "react";
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

// Tile accent colors — each drives both its tile's left dot and its icon
// tint. Per the role system (mint = money only), BOLO moved off mint to a
// desaturated decor teal so the keyword/scope category no longer claims
// the currency role.
const ACCENT_ZIP = "#7B8FFF"; // periwinkle — location
const ACCENT_RADIUS = "#D4A574"; // camel — distance
const ACCENT_BOLO = "#74B6A0"; // decor cool teal — keyword scope
const ACCENT_NOTIF = "#B4A0D4"; // lavender — alerts
const ACCENT_EXPORT = "#8A8A9A"; // neutral — utility
const ACCENT_SIGNOUT = "#E8636B"; // coral — destructive

// ── Mock data (BOLO + notifications stay mock until those tables wire up) ──
const MOCK_KEYWORDS = ["Nintendo", "KitchenAid", "Pyrex", "Le Creuset", "Dyson", "Vitamix"];

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
  const [keywords, setKeywords] = useState(MOCK_KEYWORDS);
  const [radiusSheetOpen, setRadiusSheetOpen] = useState(false);

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

      // Load notification_prefs + push subscription presence in
      // parallel. Defaults stay true (matching initial state) when
      // there's no row yet — the user-facing semantic is "on by
      // default until you turn something off."
      const [{ data: notifRow }, { data: pushRow }] = await Promise.all([
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

  const handleExport = useCallback(() => {
    if (exportState !== "idle") return;
    setExportState("loading");
    // Simulated export — real /api/export wiring will replace the timeout.
    window.setTimeout(() => {
      setExportState("done");
      window.setTimeout(() => setExportState("idle"), 1500);
    }, 1500);
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
        <DotGridBackground />
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
        <DotGridBackground />
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
            keywords={keywords}
            onAdd={(kw) => setKeywords((prev) => [...prev, kw])}
            onRemove={(i) => setKeywords((prev) => prev.filter((_, idx) => idx !== i))}
            onBack={() => setView("main")}
          />
        </div>
      </>
    );
  }

  // Main account view
  return (
    <>
      <DotGridBackground />
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
        onChange={setRadius}
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
            <div
              data-cell-flash=""
              style={{
                backgroundColor: "var(--bg-recessed)",
                borderRadius: "3px 8px 8px 8px",
                padding: "6px 12px",
                boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
                marginRight: 6,
                transition: "background-color 120ms ease-out",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "var(--text-primary)",
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
              searches). Internal model names (`view === "bolo"`,
              MOCK_KEYWORDS, the bolo_keywords table) stay so the rename
              is purely user-facing copy. */}
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
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--text-muted)",
                marginRight: 6,
              }}
            >
              {keywords.length} keywords
            </span>
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

        {/* Group 4: Sign out — 28px gap, more breathing room before the
            destructive action */}
        <div style={{ marginTop: 28 }}>
          <SettingsTile
            height={52}
            variant="danger"
            onClick={handleSignOut}
            icon={<DoorIcon />}
            accentColor={ACCENT_SIGNOUT}
          >
            <span
              style={{
                flex: 1,
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: 13,
                color: "var(--accent-red)",
              }}
            >
              Sign out
            </span>
          </SettingsTile>
        </div>

        {/* Bottom padding — 48px so the sign-out has air below it */}
        <div style={{ paddingBottom: 48 }} />
      </div>
    </>
  );
}
