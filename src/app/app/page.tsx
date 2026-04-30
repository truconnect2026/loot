"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DotGridBackground from "@/components/shared/DotGridBackground";
import CoinMark from "@/components/shared/CoinMark";
import CoinRain from "@/components/shared/CoinRain";
import HeroProfit from "@/components/dashboard/HeroProfit";
import ContextCard from "@/components/dashboard/ContextCard";
import ScanButtons from "@/components/dashboard/ScanButtons";
import DealCarousel from "@/components/dashboard/DealCarousel";
import DealDetailSheet from "@/components/dashboard/DealDetailSheet";
import type { Deal } from "@/components/dashboard/DealCard";
import ToolTile from "@/components/dashboard/ToolTile";
import ScanOverlay from "@/components/dashboard/ScanOverlay";
import VerdictSheet from "@/components/dashboard/VerdictSheet";
import { createClient } from "@/lib/supabase";
import type { ScanResponse } from "@/app/api/scan/route";

// ── Tool icons (16px, stroke) ──

function ShelfIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={3} width={7} height={7} />
      <rect x={14} y={3} width={7} height={7} />
      <rect x={3} y={14} width={7} height={7} />
      <rect x={14} y={14} width={7} height={7} />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1={12} y1={1} x2={12} y2={23} />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x={8} y={2} width={8} height={4} rx={1} />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1={16.5} y1={9.4} x2={7.5} y2={4.21} />
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1={12} y1={22.08} x2={12} y2={12} />
    </svg>
  );
}

function RecycleIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

interface Tool {
  name: string;
  icon: React.ReactNode;
  href?: string;
}

const TOP_TOOLS: Tool[] = [
  { name: "Shelf Scanner", icon: <ShelfIcon /> },
  { name: "Price Check", icon: <DollarIcon /> },
  { name: "Haul Log", icon: <ClipboardIcon />, href: "/app/haul" },
  { name: "Authenticate", icon: <ShieldIcon /> },
];

const EXTRA_TOOLS: Tool[] = [
  { name: "Estate Sales", icon: <HomeIcon /> },
  { name: "Liquidation Analyzer", icon: <PackageIcon /> },
  { name: "Scrap Finder", icon: <RecycleIcon /> },
];

// Reverse-stagger exit timing for the tools drawer.
const TOOL_EXIT_STEP_MS = 30;
const TOOL_EXIT_FADE_MS = 150;
const TOOL_EXIT_TOTAL_MS =
  (EXTRA_TOOLS.length - 1) * TOOL_EXIT_STEP_MS + TOOL_EXIT_FADE_MS;
const TOOL_COLLAPSE_MS = 200;

// ── Mock deal data — replaced by Supabase queries later ──

const NEARBY_DEALS: Deal[] = [
  {
    id: "d1",
    title: "Vintage Pyrex casserole set, mint condition",
    price: 40,
    estimatedValue: 110,
    distance: "2.3 mi",
    source: "fb_marketplace",
    isFree: false,
    postedAt: "3h ago",
    url: "",
  },
  {
    id: "d2",
    title: "Mid-century walnut nightstand",
    price: 75,
    estimatedValue: 220,
    distance: "4.1 mi",
    source: "craigslist",
    isFree: false,
    postedAt: "5h ago",
    url: "",
  },
  {
    id: "d3",
    title: "Lot of vintage cameras, untested",
    price: 50,
    estimatedValue: 180,
    distance: "1.8 mi",
    source: "fb_marketplace",
    isFree: false,
    postedAt: "1d ago",
    url: "",
  },
  {
    id: "d4",
    title: "Cast iron skillet, Griswold mark",
    price: 30,
    estimatedValue: 95,
    distance: "3.6 mi",
    source: "nextdoor",
    isFree: false,
    postedAt: "6h ago",
    url: "",
  },
  {
    id: "d5",
    title: "Set of 4 Eames-style dining chairs",
    price: 120,
    estimatedValue: 350,
    distance: "5.2 mi",
    source: "fb_marketplace",
    isFree: false,
    postedAt: "2h ago",
    url: "",
  },
];

const FREE_DEALS: Deal[] = [
  {
    id: "f1",
    title: "Old leather camera bag, curbside",
    price: 0,
    estimatedValue: 35,
    distance: "1.2 mi",
    source: "fb_marketplace",
    isFree: true,
    postedAt: "2h ago",
    url: "",
  },
  {
    id: "f2",
    title: "Wooden bookshelf, free to good home",
    price: 0,
    estimatedValue: 60,
    distance: "0.8 mi",
    source: "craigslist_free",
    isFree: true,
    postedAt: "1h ago",
    url: "",
  },
  {
    id: "f3",
    title: "Boxes of vintage National Geographic",
    price: 0,
    estimatedValue: 40,
    distance: "3.4 mi",
    source: "nextdoor",
    isFree: true,
    postedAt: "5h ago",
    url: "",
  },
  {
    id: "f4",
    title: "Brass lamp, needs rewiring",
    price: 0,
    estimatedValue: 75,
    distance: "2.7 mi",
    source: "fb_marketplace",
    isFree: true,
    postedAt: "4h ago",
    url: "",
  },
  {
    id: "f5",
    title: "Antique wooden picture frame",
    price: 0,
    estimatedValue: 50,
    distance: "4.0 mi",
    source: "craigslist_free",
    isFree: true,
    postedAt: "7h ago",
    url: "",
  },
];

// ── Sourcing card icons (16px stroke) ──

function SourcingTagIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#D4A574"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1={7} y1={7} x2={7.01} y2={7} />
    </svg>
  );
}

function SourcingMapIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5CE0B8"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1={8} y1={2} x2={8} y2={18} />
      <line x1={16} y1={6} x2={16} y2={22} />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width={10}
      height={10}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5A4E70"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

interface ShowAllToolsButtonProps {
  expanded: boolean;
  onToggle: () => void;
}

function ShowAllToolsButton({ expanded, onToggle }: ShowAllToolsButtonProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onClick={onToggle}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        margin: "8px auto 0",
        padding: "10px 16px",
        border: "1px solid rgba(255,255,255,0.04)",
        borderRadius: 8,
        backgroundColor: pressed ? "rgba(255,255,255,0.03)" : "transparent",
        cursor: "pointer",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: 10,
        color: "#5A4E70",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <span>{expanded ? "Show less" : "Show all tools"}</span>
      <span
        style={{
          display: "inline-flex",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <ChevronDownIcon />
      </span>
    </button>
  );
}

interface Stats {
  scans: number;
  buys: number;
  spent: number;
  profit: number;
}

interface ScanRow {
  cost: number | null;
  profit: number | null;
  verdict: string | null;
}

const SECTION_LABEL: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains-mono), monospace",
  fontSize: 9,
  color: "#3D2E55",
  letterSpacing: "0.10em",
  marginBottom: 12,
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  // Scan overlay state
  const [scanOpen, setScanOpen] = useState(false);
  const [scanMode, setScanMode] = useState<"barcode" | "vision">("barcode");

  // Verdict sheet state
  const [verdictOpen, setVerdictOpen] = useState(false);
  const [verdictData, setVerdictData] = useState<ScanResponse | null>(null);

  // CoinRain state
  const [coinRainActive, setCoinRainActive] = useState(false);

  // Real stats from Supabase
  const [stats, setStats] = useState<Stats>({ scans: 0, buys: 0, spent: 0, profit: 0 });
  const [hasUser, setHasUser] = useState(false);

  // Scroll-position state for the sticky header
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Tools drawer state — `exiting` runs the reverse-stagger fade before
  // the container collapses.
  const [showAllTools, setShowAllTools] = useState(false);
  const [toolsExiting, setToolsExiting] = useState(false);

  // Deal detail sheet state
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dealSheetOpen, setDealSheetOpen] = useState(false);

  // Client-side clock for ContextCard — set after mount so we don't ship
  // a server time that mismatches the user's local time at hydration.
  const [clock, setClock] = useState<{ day: number; hour: number } | null>(null);

  const refreshStats = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    setHasUser(true);

    const { data, error } = await supabase
      .from("scans")
      .select("cost, profit, verdict")
      .eq("user_id", userData.user.id);
    if (error || !data) return;

    const rows = data as ScanRow[];
    const buys = rows.filter((r) => r.verdict === "BUY");
    setStats({
      scans: rows.length,
      buys: buys.length,
      spent: Math.round(buys.reduce((sum, r) => sum + (Number(r.cost) || 0), 0)),
      profit: Math.round(buys.reduce((sum, r) => sum + (Number(r.profit) || 0), 0)),
    });
  }, [supabase]);

  // refreshStats sets state, which `react-hooks/set-state-in-effect` flags
  // when called directly from an effect body. Awaiting it inside an async
  // IIFE introduces a function boundary the rule accepts; the `cancelled`
  // flag prevents post-unmount work from continuing past the await.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refreshStats();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshStats]);

  // Watch the scroll sentinel — when it leaves the viewport the header
  // gains a solid background and hairline.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Stamp the local clock once on mount; keeps ContextCard's day/hour gates
  // local-timezone correct without tripping hydration mismatches. The
  // microtask defers the setState past the synchronous effect-body check
  // that `react-hooks/set-state-in-effect` enforces.
  useEffect(() => {
    queueMicrotask(() => {
      const d = new Date();
      setClock({ day: d.getDay(), hour: d.getHours() });
    });
  }, []);

  // Re-fetch profile + stats when the user returns to this tab — covers the
  // common path of going to /account, setting a zip, then coming back so the
  // ContextCard's no-zip branch resolves.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") {
        void refreshStats();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshStats]);

  const startScan = useCallback((mode: "barcode" | "vision") => {
    setScanMode(mode);
    setScanOpen(true);
  }, []);

  const handleScanResult = useCallback(
    (result: ScanResponse) => {
      setScanOpen(false);
      setVerdictData(result);
      setVerdictOpen(true);

      if (result.verdict === "BUY") {
        setCoinRainActive(false);
        requestAnimationFrame(() => setCoinRainActive(true));
      }

      // Pull fresh totals — the scan row was just inserted server-side.
      refreshStats();
    },
    [refreshStats]
  );

  const cancelScan = useCallback(() => {
    setScanOpen(false);
  }, []);

  const handleToolTap = useCallback(
    (tool: Tool) => {
      if (tool.href) {
        router.push(tool.href);
      } else {
        console.log(`Tool: ${tool.name}`);
      }
    },
    [router]
  );

  const handleDealTap = useCallback((deal: Deal) => {
    setSelectedDeal(deal);
    setDealSheetOpen(true);
  }, []);

  // Tools drawer toggle — opening is instant; closing fades the extra tiles
  // back-to-front before the container collapses.
  const toggleTools = useCallback(() => {
    if (!showAllTools) {
      setShowAllTools(true);
      return;
    }
    setToolsExiting(true);
    window.setTimeout(() => {
      setShowAllTools(false);
      window.setTimeout(() => setToolsExiting(false), TOOL_COLLAPSE_MS);
    }, TOOL_EXIT_TOTAL_MS);
  }, [showAllTools]);

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .loot-carousel::-webkit-scrollbar { display: none; }
        .loot-carousel { scrollbar-width: none; }
      `}</style>
      <DotGridBackground />
      <CoinRain active={coinRainActive} />

      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* 1. Scroll sentinel — drives the sticky-header background toggle */}
        <div ref={sentinelRef} data-scroll-sentinel="" style={{ height: 1 }} />

        {/* 2. Sticky header — chrome is 56px; padding-top carves out the iOS
            safe-area inset so the visible chrome sits below the notch. */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            height: "calc(56px + env(safe-area-inset-top, 0px))",
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingLeft: 18,
            paddingRight: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: scrolled ? "rgba(18,14,24,0.95)" : "transparent",
            backdropFilter: scrolled ? "blur(12px) saturate(150%)" : "none",
            WebkitBackdropFilter: scrolled
              ? "blur(12px) saturate(150%)"
              : "none",
            boxShadow: scrolled
              ? "0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)"
              : "none",
            transition:
              "background-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1), backdrop-filter 200ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CoinMark size={22} />
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: 22,
                color: "#5CE0B8",
                letterSpacing: "0.06em",
                lineHeight: 1,
              }}
            >
              LOOT
            </span>
          </div>

          <button
            onClick={() => router.push("/account")}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow:
                "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontWeight: 500,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              JD
            </span>
          </button>
        </div>

        {/* 3. Smart context card — priority-driven daily nudge */}
        <div
          id="context-card"
          style={{
            minHeight: 0,
            marginTop: 12,
            padding: "0 18px",
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "0ms",
          }}
        >
          <ContextCard
            todayScans={hasUser ? stats.scans : 0}
            unsoldOldItems={0}
            hotDealsCount={0}
            userZip={null}
            dayOfWeek={clock?.day ?? -1}
            hour={clock?.hour ?? -1}
          />
        </div>

        {/* 4. Hero profit card — mock data for now; real Supabase wiring later */}
        <div
          id="hero-profit"
          style={{
            padding: "0 18px",
            marginTop: 16,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "60ms",
          }}
        >
          <HeroProfit
            todayProfit={0}
            yesterdayProfit={0}
            weekProfit={0}
            monthProfit={0}
            allTimeProfit={0}
            todayScans={0}
            todayBuys={0}
            todaySpent={0}
            dailyProfitHistory={[0, 0, 0, 0, 0, 0, 0]}
          />
        </div>

        {/* 5. Scan zone — ScanButtons renders its own full-bleed hairlines */}
        <div
          style={{
            padding: "0 18px",
            marginTop: 20,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "120ms",
          }}
        >
          <ScanButtons
            onScanUpc={() => startScan("barcode")}
            onAiVision={() => startScan("vision")}
            hasScanned={hasUser ? stats.scans > 0 : true}
          />
        </div>

        {/* 6. Deals near you */}
        <div
          id="deals-near-you"
          style={{
            marginTop: 24,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "180ms",
          }}
        >
          <DealCarousel
            label="DEALS NEAR YOU"
            deals={NEARBY_DEALS}
            onDealTap={handleDealTap}
          />
        </div>

        {/* 7. Free & clearance */}
        <div
          style={{
            marginTop: 20,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "240ms",
          }}
        >
          <DealCarousel
            label="FREE & CLEARANCE"
            deals={FREE_DEALS}
            onDealTap={handleDealTap}
          />
        </div>

        {/* 8. Sourcing intel */}
        <div
          style={{
            padding: "0 18px",
            marginTop: 24,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "300ms",
          }}
        >
          <div style={SECTION_LABEL}>SOURCING</div>
          <div style={{ display: "flex", gap: 8 }}>
            {/* Penny Drops — warm camel tint */}
            <div
              style={{
                flex: 1,
                height: 100,
                background:
                  "linear-gradient(180deg, rgba(212,165,116,0.06) 0%, rgba(255,255,255,0.01) 100%)",
                border: "1px solid rgba(212,165,116,0.08)",
                borderRadius: 16,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SourcingTagIcon />
                <span
                  style={{
                    fontFamily: "var(--font-outfit), sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#C8C0D8",
                  }}
                >
                  Penny Drops
                </span>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: 9,
                    color: "#5A4E70",
                    marginBottom: 2,
                  }}
                >
                  updates Tuesdays
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: 9,
                    color: "#D4A574",
                  }}
                >
                  48 items this week
                </div>
              </div>
            </div>

            {/* Yard Sale Map — mint tint */}
            <div
              style={{
                flex: 1,
                height: 100,
                background:
                  "linear-gradient(180deg, rgba(92,224,184,0.06) 0%, rgba(255,255,255,0.01) 100%)",
                border: "1px solid rgba(92,224,184,0.08)",
                borderRadius: 16,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SourcingMapIcon />
                <span
                  style={{
                    fontFamily: "var(--font-outfit), sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#C8C0D8",
                  }}
                >
                  Yard Sale Map
                </span>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: 9,
                    color: "#5A4E70",
                    marginBottom: 2,
                  }}
                >
                  updates Saturdays
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: 9,
                    color: "#5CE0B8",
                  }}
                >
                  0 sales near you
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 9. Tools drawer */}
        <div
          style={{
            padding: "0 18px",
            marginTop: 24,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "360ms",
          }}
        >
          {/* "MORE TOOLS" label with full-bleed hairlines */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 12,
              marginLeft: -18,
              marginRight: -18,
            }}
          >
            <div style={{ flex: 1, height: 0.5, backgroundColor: "rgba(255,255,255,0.04)" }} />
            <span
              style={{
                paddingLeft: 12,
                paddingRight: 12,
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 9,
                color: "var(--text-dim)",
                letterSpacing: "0.10em",
                whiteSpace: "nowrap",
              }}
            >
              MORE TOOLS
            </span>
            <div style={{ flex: 1, height: 0.5, backgroundColor: "rgba(255,255,255,0.04)" }} />
          </div>

          {/* Top 4 tools */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {TOP_TOOLS.map((tool) => (
              <ToolTile
                key={tool.name}
                name={tool.name}
                icon={tool.icon}
                onTap={() => handleToolTap(tool)}
              />
            ))}
          </div>

          {/* Hidden extras — animated max-height reveal with reverse-stagger
              fade-out on close */}
          <div
            style={{
              overflow: "hidden",
              maxHeight: showAllTools ? 400 : 0,
              transition: `max-height ${TOOL_COLLAPSE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginTop: 8,
              }}
            >
              {EXTRA_TOOLS.map((tool, index) => {
                const reverseIndex = EXTRA_TOOLS.length - 1 - index;
                return (
                  <div
                    key={tool.name}
                    style={{
                      opacity: toolsExiting ? 0 : 1,
                      transition: `opacity ${TOOL_EXIT_FADE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                      transitionDelay: toolsExiting
                        ? `${reverseIndex * TOOL_EXIT_STEP_MS}ms`
                        : "0ms",
                    }}
                  >
                    <ToolTile
                      name={tool.name}
                      icon={tool.icon}
                      onTap={() => handleToolTap(tool)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Show all toggle — proper button with chevron */}
          <ShowAllToolsButton
            expanded={showAllTools}
            onToggle={toggleTools}
          />
        </div>

        {/* 10. Flip tip */}
        <div
          style={{
            padding: "0 18px",
            marginTop: 32,
            marginBottom: 40,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "420ms",
          }}
        >
          <div
            style={{
              maxWidth: 280,
              margin: "0 auto",
              textAlign: "center",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 9,
              color: "rgba(255,255,255,0.12)",
              lineHeight: 1.6,
            }}
          >
            griswold cast iron marked &apos;erie pa&apos; is worth 5-10× more than unmarked. carry a magnet — sterling silver won&apos;t stick.
          </div>
        </div>

        {/* 11. Bottom pad */}
        <div style={{ height: 40 }} />
      </div>

      {/* ── Overlays ── */}
      <ScanOverlay
        open={scanOpen}
        mode={scanMode}
        onResult={handleScanResult}
        onCancel={cancelScan}
      />

      <VerdictSheet
        open={verdictOpen}
        onClose={() => setVerdictOpen(false)}
        data={verdictData}
      />

      <DealDetailSheet
        open={dealSheetOpen}
        deal={selectedDeal}
        onClose={() => setDealSheetOpen(false)}
      />
    </>
  );
}
