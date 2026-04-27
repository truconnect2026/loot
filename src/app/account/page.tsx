"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import DotGridBackground from "@/components/shared/DotGridBackground";
import ProfileCard from "@/components/account/ProfileCard";
import SettingsTile from "@/components/account/SettingsTile";
import ZipInput from "@/components/account/ZipInput";
import RadiusSheet from "@/components/account/RadiusSheet";
import BoloList from "@/components/account/BoloList";
import NotificationToggles from "@/components/account/NotificationToggles";

// ── Icons ──

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

function DownloadIcon({ opacity }: { opacity: number }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent-mint)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity, transition: "opacity 200ms" }}
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
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent-red)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1={21} y1={12} x2={9} y2={12} />
    </svg>
  );
}

// ── Mock data ──
const MOCK_KEYWORDS = ["Nintendo", "KitchenAid", "Pyrex", "Le Creuset", "Dyson", "Vitamix"];

type View = "main" | "bolo";

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();

  // View state
  const [view, setView] = useState<View>("main");

  // Settings state (mock)
  const [zip, setZip] = useState("90210");
  const [radius, setRadius] = useState(15);
  const [keywords, setKeywords] = useState(MOCK_KEYWORDS);
  const [radiusSheetOpen, setRadiusSheetOpen] = useState(false);

  // Notifications
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifDeals, setNotifDeals] = useState(true);
  const [notifBolo, setNotifBolo] = useState(true);
  const [notifPennies, setNotifPennies] = useState(true);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  // Back arrow state
  const [backPressed, setBackPressed] = useState(false);

  const handleExport = useCallback(() => {
    setExporting(true);
    // Simulated export
    setTimeout(() => {
      setExporting(false);
      setExported(true);
      setTimeout(() => setExported(false), 2000);
    }, 800);
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/");
  }, [supabase, router]);

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
        }}
      >
        {/* Back arrow */}
        <button
          onClick={() => router.push("/app")}
          onPointerDown={() => setBackPressed(true)}
          onPointerUp={() => setBackPressed(false)}
          onPointerLeave={() => setBackPressed(false)}
          style={{
            marginTop: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            color: backPressed ? "var(--text-primary)" : "var(--text-muted)",
            transition: "color 80ms",
          }}
        >
          <ChevronLeft />
        </button>

        {/* Profile Card */}
        <ProfileCard
          name="Jane Doe"
          email="jane@example.com"
          initials="JD"
          isPro={true}
          price="$9.99"
          period="/mo"
          renewsDate="May 27"
          scansLabel="unlimited"
          onCancel={() => console.log("Open Stripe portal")}
        />

        {/* ── Settings ── */}

        {/* Group 1: Location settings (6px gap) */}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Zip code */}
          <ZipInput value={zip} onChange={setZip} />

          {/* Search radius */}
          <SettingsTile onClick={() => setRadiusSheetOpen(true)}>
            <span
              style={{
                flex: 1,
                fontFamily: "var(--font-outfit), sans-serif",
                fontWeight: 600,
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            >
              Search radius
            </span>
            <div
              style={{
                backgroundColor: "var(--bg-recessed)",
                borderRadius: 8,
                padding: "6px 12px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--text-primary)",
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {radius} mi
              </span>
            </div>
          </SettingsTile>

          {/* BOLO keywords */}
          <SettingsTile onClick={() => setView("bolo")}>
            <span
              style={{
                flex: 1,
                fontFamily: "var(--font-outfit), sans-serif",
                fontWeight: 600,
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            >
              BOLO keywords
            </span>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 12,
                color: "var(--text-muted)",
                marginRight: 4,
              }}
            >
              {keywords.length} keywords
            </span>
            <ChevronRight />
          </SettingsTile>
        </div>

        {/* Group 2: Notifications (mt-4) */}
        <div style={{ marginTop: 16 }}>
          <NotificationToggles
            enabled={notifEnabled}
            onToggleEnabled={() => setNotifEnabled((v) => !v)}
            deals={notifDeals}
            onToggleDeals={() => setNotifDeals((v) => !v)}
            bolo={notifBolo}
            onToggleBolo={() => setNotifBolo((v) => !v)}
            pennies={notifPennies}
            onTogglePennies={() => setNotifPennies((v) => !v)}
          />
        </div>

        {/* Group 3: Export (mt-4) */}
        <div style={{ marginTop: 16 }}>
          <SettingsTile height={60} onClick={handleExport}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  color: "var(--text-primary)",
                }}
              >
                Export haul log
              </div>
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 9,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                CSV for taxes
              </div>
            </div>
            {exported ? (
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 10,
                  color: "var(--accent-mint)",
                }}
              >
                exported
              </span>
            ) : (
              <DownloadIcon opacity={exporting ? 0.3 : 1} />
            )}
          </SettingsTile>
        </div>

        {/* Group 4: Sign out (mt-6) */}
        <div style={{ marginTop: 24 }}>
          <SettingsTile
            height={52}
            borderColor="rgba(232, 99, 107, 0.15)"
            onClick={handleSignOut}
          >
            <span
              style={{
                flex: 1,
                fontFamily: "var(--font-outfit), sans-serif",
                fontWeight: 600,
                fontSize: 13,
                color: "var(--accent-red)",
              }}
            >
              Sign out
            </span>
            <DoorIcon />
          </SettingsTile>
        </div>

        {/* Bottom padding */}
        <div style={{ paddingBottom: 40 }} />
      </div>
    </>
  );
}
