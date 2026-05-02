"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DotGridBackground from "@/components/shared/DotGridBackground";
import CoinMark from "@/components/shared/CoinMark";
import CoinRain from "@/components/shared/CoinRain";
import HeroProfit from "@/components/dashboard/HeroProfit";
import EmptyHero from "@/components/dashboard/EmptyHero";
import WinsTicker from "@/components/dashboard/WinsTicker";
import { ONBOARDING_SKIPPED_KEY } from "@/app/onboarding/page";
import ContextCard from "@/components/dashboard/ContextCard";
import ScanButtons from "@/components/dashboard/ScanButtons";
import DealCarousel from "@/components/dashboard/DealCarousel";
import DealDetailSheet from "@/components/dashboard/DealDetailSheet";
import type { Deal } from "@/components/dashboard/DealCard";
import ToolTile from "@/components/dashboard/ToolTile";
import ScanOverlay from "@/components/dashboard/ScanOverlay";
import VerdictSheet from "@/components/dashboard/VerdictSheet";
import SourcingCards from "@/components/dashboard/SourcingCards";
import { createClient } from "@/lib/supabase";
import type { ScanResponse } from "@/app/api/scan/route";

// Light haptic helper — Android Chrome only, iOS silently fails. Defaults to
// a 10ms tick when no pattern is passed.
function haptic(ms?: number | number[]) {
  try {
    navigator?.vibrate?.(ms ?? 10);
  } catch {
    /* iOS silently fails, that's fine */
  }
}

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

// Authenticate — checkmark inside a circle. Replaces the old shield Fake Checker.
function CheckCircleIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={12} r={10} />
      <polyline points="8 12.5 11 15.5 16 9" />
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
  { name: "Authenticate", icon: <CheckCircleIcon /> },
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
    title: "vintage Pyrex casserole set, mint condition",
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
    title: "mid-century walnut nightstand",
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
    title: "lot of vintage cameras, untested",
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
    title: "cast iron skillet, Griswold mark",
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
    title: "set of 4 Eames-style dining chairs",
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
    title: "old leather camera bag, curbside",
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
    title: "wooden bookshelf, free to good home",
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
    title: "boxes of vintage National Geographic",
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
    title: "brass lamp, needs rewiring",
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
    title: "antique wooden picture frame",
    price: 0,
    estimatedValue: 50,
    distance: "4.0 mi",
    source: "craigslist_free",
    isFree: true,
    postedAt: "7h ago",
    url: "",
  },
];

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
        fontFamily: "var(--font-body)",
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

interface ScanRow {
  cost: number | null;
  // `profit` is the scan-time potential — what the model thinks this flip
  // is worth right now. Drives the "FOUND" headline numbers.
  profit: number | null;
  verdict: string | null;
  created_at: string | null;
  // `sold` + `sold_price` come from the haul-log mark-as-sold flow.
  // (sold_price - cost) per row sums into the realized-profit secondary
  // metric. Both columns can be null on rows that haven't been marked
  // sold yet, which is the common case.
  sold: boolean | null;
  sold_price: number | null;
}

const SECTION_LABEL: React.CSSProperties = {
  // Uppercase category header (SOURCING) — stays in JetBrains Mono per
  // the font role system.
  fontFamily: "var(--font-label)",
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

  // Real stats from Supabase + loading state for skeletons.
  // *Profit fields are POTENTIAL — scan-time estimates ("you found this much
  // worth of flips"). *Realized fields are ACTUAL — sold_price - cost on rows
  // marked sold. The hero shows potential as the big headline number with
  // realized as a quiet secondary line, so users get instant feedback the
  // moment they scan instead of waiting weeks for an actual sale.
  const [todayScans, setTodayScans] = useState(0);
  const [todayBuys, setTodayBuys] = useState(0);
  const [todaySpent, setTodaySpent] = useState(0);
  const [todayProfit, setTodayProfit] = useState(0);
  const [yesterdayProfit, setYesterdayProfit] = useState(0);
  const [weekProfit, setWeekProfit] = useState(0);
  const [monthProfit, setMonthProfit] = useState(0);
  const [allTimeProfit, setAllTimeProfit] = useState(0);
  const [todayRealized, setTodayRealized] = useState(0);
  const [weekRealized, setWeekRealized] = useState(0);
  const [monthRealized, setMonthRealized] = useState(0);
  const [allTimeRealized, setAllTimeRealized] = useState(0);
  const [profitHistory, setProfitHistory] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  // Drives the empty-hero swap: a brand-new user (zero rows ever) sees
  // EmptyHero (demo + CTA + social proof) instead of HeroProfit. Gated on
  // !statsLoading so the empty hero never flashes before data resolves.
  const [lifetimeScans, setLifetimeScans] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  // Header solidifies once the scroll sentinel leaves the viewport.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Tools drawer expansion
  const [showAllTools, setShowAllTools] = useState(false);

  // Press feedback for header avatar — inlined since it's a one-off button.
  const [avatarPressed, setAvatarPressed] = useState(false);

  // Time/day for context card + sourcing cards. Read on the client only so
  // the SSR pass renders a stable null and the day-of-week never mismatches.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
  }, []);
  const dayOfWeek = now ? now.getDay() : 0;
  const hour = now ? now.getHours() : 0;

  // Tools drawer reverse-stagger close.
  const [toolsExiting, setToolsExiting] = useState(false);

  // Deal detail sheet state
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dealSheetOpen, setDealSheetOpen] = useState(false);

  const refreshStats = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setStatsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("scans")
      .select("cost, profit, verdict, created_at, sold, sold_price")
      .eq("user_id", userData.user.id);
    if (error || !data) {
      setStatsLoading(false);
      return;
    }

    const rows = data as ScanRow[];

    // Day buckets — local time. Today / yesterday / this week / this month.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const yesterdayMs = todayMs - 86_400_000;
    const weekStartMs = todayMs - 6 * 86_400_000;
    const monthStartMs = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    ).getTime();

    let todayCount = 0;
    let todayBuyCount = 0;
    let todaySpentSum = 0;
    let todayProfitSum = 0;
    let yesterdayProfitSum = 0;
    let weekProfitSum = 0;
    let monthProfitSum = 0;
    let allTimeProfitSum = 0;
    // Realized buckets — sold_price - cost on rows marked sold. Bucketed by
    // created_at (when the scan happened) so the realized number aligns
    // period-by-period with the potential number above it. If product
    // decides "realized should bucket by sold_at instead," swap the ts
    // source on these four conditionals.
    let todayRealizedSum = 0;
    let weekRealizedSum = 0;
    let monthRealizedSum = 0;
    let allTimeRealizedSum = 0;

    // 7-day daily profit bucket — index 0 is 6 days ago, index 6 is today.
    const daily = [0, 0, 0, 0, 0, 0, 0];

    for (const row of rows) {
      const ts = row.created_at ? new Date(row.created_at).getTime() : 0;
      const profit = Number(row.profit) || 0;
      const cost = Number(row.cost) || 0;
      const isBuy = row.verdict === "BUY";
      const isSold = row.sold === true && row.sold_price != null;
      const realized = isSold
        ? (Number(row.sold_price) || 0) - cost
        : 0;

      if (ts >= todayMs) {
        todayCount++;
        if (isBuy) {
          todayBuyCount++;
          todaySpentSum += cost;
          todayProfitSum += profit;
        }
        if (isSold) todayRealizedSum += realized;
      } else if (ts >= yesterdayMs && isBuy) {
        yesterdayProfitSum += profit;
      }

      if (ts >= weekStartMs && isBuy) weekProfitSum += profit;
      if (ts >= monthStartMs && isBuy) monthProfitSum += profit;
      if (isBuy) allTimeProfitSum += profit;

      if (ts >= weekStartMs && isSold) weekRealizedSum += realized;
      if (ts >= monthStartMs && isSold) monthRealizedSum += realized;
      if (isSold) allTimeRealizedSum += realized;

      if (ts >= weekStartMs && isBuy) {
        const dayIdx = Math.min(
          6,
          Math.max(0, Math.floor((ts - weekStartMs) / 86_400_000))
        );
        daily[dayIdx] += profit;
      }
    }

    setTodayScans(todayCount);
    setTodayBuys(todayBuyCount);
    setTodaySpent(Math.round(todaySpentSum));
    setTodayProfit(Math.round(todayProfitSum));
    setYesterdayProfit(Math.round(yesterdayProfitSum));
    setWeekProfit(Math.round(weekProfitSum));
    setMonthProfit(Math.round(monthProfitSum));
    setAllTimeProfit(Math.round(allTimeProfitSum));
    setTodayRealized(Math.round(todayRealizedSum));
    setWeekRealized(Math.round(weekRealizedSum));
    setMonthRealized(Math.round(monthRealizedSum));
    setAllTimeRealized(Math.round(allTimeRealizedSum));
    setProfitHistory(daily.map((v) => Math.round(v)));
    setLifetimeScans(rows.length);
    setStatsLoading(false);
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

  // Onboarding gate — bounce brand-new users (no zip set) to /onboarding
  // BEFORE they see any dashboard content. Until this resolves we render
  // a full-screen splash matching --bg-page (see below), so the user
  // experiences login → dark screen → onboarding rather than login →
  // dashboard flash → onboarding. This is the fix for the flash.
  //
  // Skip honor: if the user tapped "skip for now" on /onboarding earlier
  // in this tab session, sessionStorage carries that decision and we
  // suppress the redirect (and clear the splash immediately) for the
  // remainder of the session. Next browser session, the gate re-fires
  // (sessionStorage clears on tab close), so onboarding stays encouraged
  // but never permanently disabled.
  const [gateChecked, setGateChecked] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const skipped =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(ONBOARDING_SKIPPED_KEY) === "1";
    if (skipped) {
      queueMicrotask(() => {
        if (!cancelled) setGateChecked(true);
      });
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (cancelled) return;
      // Unauthenticated reaches here only if route protection upstream
      // missed; clear the splash so the page doesn't hang. The auth
      // layer will handle routing them away.
      if (!user) {
        setGateChecked(true);
        return;
      }
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("zip_code")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!profileRow?.zip_code) {
        // Redirect without ever flipping gateChecked — the splash stays
        // up through the navigation, so no dashboard content is ever
        // painted for a user without a zip.
        router.replace("/onboarding");
        return;
      }
      setGateChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

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

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => setScrolled(!entries[0].isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const startScan = useCallback((mode: "barcode" | "vision") => {
    haptic();
    setScanMode(mode);
    setScanOpen(true);
  }, []);

  const handleScanResult = useCallback(
    (result: ScanResponse) => {
      setScanOpen(false);
      setVerdictData(result);
      setVerdictOpen(true);

      if (result.verdict === "BUY") {
        haptic([50, 30, 50]);
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
      haptic();
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
  // First-time user = zero scan rows ever. Drives the EmptyHero swap at
  // the hero slot AND the carousel reorder below (Free first, Deals second
  // for new users; reverse for returning users with scan history).
  // Gated on !statsLoading so the page doesn't flicker between layouts
  // while Supabase is still resolving.
  const isNewUser = !statsLoading && lifetimeScans === 0;

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

  // Splash gate — covers the brief async window between mount and the
  // zip-code check resolving. Same bg as --bg-page so it visually
  // continues from the login page; if the user gets redirected to
  // /onboarding, the next page paints over a screen of identical color.
  // The Saturn icon at 60% alpha gives a "loading" cue without spinning
  // (a spinner would feel like an error state on a 200ms wait).
  if (!gateChecked) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "#120e18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            opacity: 0.6,
          }}
        >
          <CoinMark size={28} color="#5CE0B8" />
          <span
            style={{
              fontFamily: "var(--font-label)",
              fontWeight: 700,
              fontSize: 36,
              color: "#5CE0B8",
              letterSpacing: "0.08em",
              lineHeight: 1,
            }}
          >
            LOOT
          </span>
        </div>
      </div>
    );
  }

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
      {/* Dashboard background — quiet graph-paper grid + centered
          vignette. No blobs, no particles: the dashboard is a
          workspace, not a stage. The grid variant carries its own
          radial vignette so the standalone fog layer is gone. */}
      <DotGridBackground variant="grid" />
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
        <div
          ref={sentinelRef}
          data-scroll-sentinel=""
          style={{ height: 1, width: "100%" }}
          aria-hidden="true"
        />

        {/* 2. Sticky header — safe-area-aware, transparent → solid on scroll */}
        <header
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
                fontFamily: "var(--font-body)",
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
            onPointerDown={() => setAvatarPressed(true)}
            onPointerUp={() => setAvatarPressed(false)}
            onPointerLeave={() => setAvatarPressed(false)}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: avatarPressed
                ? "rgba(255,255,255,0.06)"
                : "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow:
                "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              transform: avatarPressed ? "scale(0.95)" : "scale(1)",
              transition:
                "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              JD
            </span>
          </button>
        </header>

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
            todayScans={todayScans}
            unsoldOldItems={0}
            hotDealsCount={0}
            userZip={null}
            dayOfWeek={dayOfWeek}
            hour={hour}
          />
        </div>

        {/* 4. Hero profit card — mock data for now; real Supabase wiring later.
            10px from ContextCard above: these belong to the same "personal
            status + next action" cluster, so they sit close per the
            8-12px related-elements spacing rule. */}
        <div
          id="hero-profit"
          style={{
            padding: "0 18px",
            marginTop: 10,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "60ms",
          }}
        >
          {/* First-time users (no scan rows ever) see EmptyHero — a demo
              flow + scan CTA + social proof — instead of the dim "$0"
              treatment that read as failure. The slot keeps the same
              outer dimensions so the swap doesn't shift layout. Once any
              scan exists, refreshStats flips lifetimeScans > 0 and the
              real HeroProfit takes over. Gated on !statsLoading so
              EmptyHero never flashes before stats resolve. */}
          {!statsLoading && lifetimeScans === 0 ? (
            <EmptyHero onScanTap={() => startScan("barcode")} />
          ) : (
            <HeroProfit
              todayProfit={todayProfit}
              yesterdayProfit={yesterdayProfit}
              weekProfit={weekProfit}
              monthProfit={monthProfit}
              allTimeProfit={allTimeProfit}
              todayRealized={todayRealized}
              weekRealized={weekRealized}
              monthRealized={monthRealized}
              allTimeRealized={allTimeRealized}
              todayScans={todayScans}
              todayBuys={todayBuys}
              todaySpent={todaySpent}
              dailyProfitHistory={profitHistory}
            />
          )}
        </div>

        {/* 5. Scan zone — ScanButtons renders its own full-bleed hairlines.
            overflow:hidden clips those bleeds at the section box, which
            matches the page wrapper / viewport edge. 10px from the hero
            above: hero shows the "what" (sample/profit), scan is the
            "how" (action) — same cluster, related-elements spacing. */}
        <div
          style={{
            padding: "0 18px",
            marginTop: 10,
            overflow: "hidden",
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "120ms",
          }}
        >
          <ScanButtons
            onScanUpc={() => startScan("barcode")}
            onAiVision={() => startScan("vision")}
            todayScans={todayScans}
          />
        </div>

        {/* WinsTicker is no longer a standalone section — it's nested
            inside the first carousel's header below as a `liveSignal`,
            so the ticker reads as that section's activity feed rather
            than as an orphaned line floating between sections. */}

        {/* 6 + 7. Carousels — order swaps for first-time users.
            New user: Free & Clearance first (lowest-barrier entry point —
              free curbside items don't require purchase), then Deals.
            Returning user: Deals Near You first (the primary feed for
              someone with active sourcing flow), then Free & Clearance.
            Position-based wrappers keep marginTop (24 first, 20 second)
            and the fadeInUp staircase (200ms first, 280ms second) tied
            to slot, not content. The deals-near-you scroll anchor moves
            with the deals carousel so ContextCard's "View deals" still
            scrolls to the right element. overflow:hidden clamps each
            carousel's inner scroll-container so it can't push the page
            sideways. */}
        {isNewUser ? (
          <>
            <div
              style={{
                marginTop: 18,
                overflow: "hidden",
                animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
                animationDelay: "200ms",
              }}
            >
              <DealCarousel
                label="FREE & CLEARANCE"
                deals={FREE_DEALS}
                onDealTap={handleDealTap}
                liveSignal={<WinsTicker />}
              />
            </div>
            <div
              id="deals-near-you"
              style={{
                marginTop: 20,
                overflow: "hidden",
                animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
                animationDelay: "280ms",
              }}
            >
              <DealCarousel
                label="DEALS NEAR YOU"
                deals={NEARBY_DEALS}
                onDealTap={handleDealTap}
              />
            </div>
          </>
        ) : (
          <>
            <div
              id="deals-near-you"
              style={{
                marginTop: 18,
                overflow: "hidden",
                animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
                animationDelay: "200ms",
              }}
            >
              <DealCarousel
                label="DEALS NEAR YOU"
                deals={NEARBY_DEALS}
                onDealTap={handleDealTap}
                liveSignal={<WinsTicker />}
              />
            </div>
            <div
              style={{
                marginTop: 20,
                overflow: "hidden",
                animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
                animationDelay: "280ms",
              }}
            >
              <DealCarousel
                label="FREE & CLEARANCE"
                deals={FREE_DEALS}
                onDealTap={handleDealTap}
              />
            </div>
          </>
        )}

        {/* 8. Sourcing intel — uses the polished SourcingCards component.
            Section break from the deals carousels above. */}
        <div
          style={{
            padding: "0 18px",
            marginTop: 20,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "360ms",
          }}
        >
          <div style={SECTION_LABEL}>SOURCING</div>
          <SourcingCards
            pennyItemCount={48}
            yardSaleTodayCount={0}
            onPennyTap={() => console.log("penny drops tap")}
            onYardSaleTap={() => console.log("yard sale tap")}
          />
        </div>

        {/* 9. Tools drawer — overflow:hidden clips the MORE TOOLS hairline
            bleeds at the section edge. Section break from sourcing. */}
        <div
          style={{
            padding: "0 18px",
            marginTop: 20,
            overflow: "hidden",
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "420ms",
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
            <div
              style={{
                flex: 1,
                height: 0.5,
                backgroundColor: "rgba(255,255,255,0.04)",
              }}
            />
            <span
              style={{
                paddingLeft: 12,
                paddingRight: 12,
                // Uppercase category header — stays mono.
                fontFamily: "var(--font-label)",
                fontSize: 9,
                color: "#3D2E55",
                letterSpacing: "0.10em",
                whiteSpace: "nowrap",
                textTransform: "uppercase",
              }}
            >
              MORE TOOLS
            </span>
            <div
              style={{
                flex: 1,
                height: 0.5,
                backgroundColor: "rgba(255,255,255,0.04)",
              }}
            />
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

        {/* Bottom pad */}
        <div style={{ height: 40 }} />
      </div>

      {/* Overlays */}
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
