"use client";

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import DotGridBackground from "@/components/shared/DotGridBackground";
import CoinMark from "@/components/shared/CoinMark";
import CoinRain from "@/components/shared/CoinRain";
import HeroProfit from "@/components/dashboard/HeroProfit";
import ContextCard from "@/components/dashboard/ContextCard";
import ScanButtons from "@/components/dashboard/ScanButtons";
import ToolTile from "@/components/dashboard/ToolTile";
import ScanOverlay from "@/components/dashboard/ScanOverlay";
import VerdictSheet from "@/components/dashboard/VerdictSheet";
import DealCarousel from "@/components/dashboard/DealCarousel";
import type { DealItem } from "@/components/dashboard/DealCard";
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

function HomeIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
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

const PRIMARY_TOOLS: Tool[] = [
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

// Mock deal data — realistic thrift / clearance finds. Replaced with real
// Supabase rows once /api/feeds/* is wired.
const MOCK_DEALS_NEAR_YOU: DealItem[] = [
  {
    id: "d1",
    title: "Vintage Griswold cast iron skillet, no.8",
    listedPrice: 18,
    estimatedValue: 95,
    profit: 77,
    distance: "1.4 mi",
    timeAgo: "4m ago",
    source: "FB Marketplace",
    isFree: false,
  },
  {
    id: "d2",
    title: "KitchenAid pasta roller attachment",
    listedPrice: 25,
    estimatedValue: 110,
    profit: 85,
    distance: "3.2 mi",
    timeAgo: "12m ago",
    source: "Craigslist",
    isFree: false,
  },
  {
    id: "d3",
    title: "Pyrex 4-piece spring blossom set",
    listedPrice: 12,
    estimatedValue: 60,
    profit: 48,
    distance: "0.9 mi",
    timeAgo: "21m ago",
    source: "FB Marketplace",
    isFree: false,
  },
  {
    id: "d4",
    title: "Milwaukee M18 5Ah battery (used)",
    listedPrice: 30,
    estimatedValue: 95,
    profit: 65,
    distance: "5.1 mi",
    timeAgo: "32m ago",
    source: "Craigslist",
    isFree: false,
  },
  {
    id: "d5",
    title: "Le Creuset 4qt dutch oven, cherry",
    listedPrice: 60,
    estimatedValue: 220,
    profit: 160,
    distance: "2.8 mi",
    timeAgo: "44m ago",
    source: "FB Marketplace",
    isFree: false,
  },
  {
    id: "d6",
    title: "Patagonia retro pile fleece, men's L",
    listedPrice: 15,
    estimatedValue: 85,
    profit: 70,
    distance: "4.0 mi",
    timeAgo: "58m ago",
    source: "FB Marketplace",
    isFree: false,
  },
];

const MOCK_FREE_AND_CLEARANCE: DealItem[] = [
  {
    id: "f1",
    title: "Free riding lawnmower, runs but needs blade",
    listedPrice: 0,
    estimatedValue: 350,
    profit: 350,
    distance: "6.3 mi",
    timeAgo: "8m ago",
    source: "Craigslist",
    isFree: true,
  },
  {
    id: "f2",
    title: "Target KitchenAid stand mixer 70% off clearance",
    listedPrice: 90,
    estimatedValue: 220,
    profit: 130,
    distance: "1.1 mi",
    timeAgo: "16m ago",
    source: "Target",
    isFree: false,
  },
  {
    id: "f3",
    title: "Free leather sectional, neutral, very clean",
    listedPrice: 0,
    estimatedValue: 280,
    profit: 280,
    distance: "3.7 mi",
    timeAgo: "26m ago",
    source: "Nextdoor",
    isFree: true,
  },
  {
    id: "f4",
    title: "CVS clearance 75% off — beauty endcap",
    listedPrice: 18,
    estimatedValue: 90,
    profit: 72,
    distance: "0.6 mi",
    timeAgo: "39m ago",
    source: "CVS",
    isFree: false,
  },
];

interface ScanRow {
  cost: number | null;
  profit: number | null;
  verdict: string | null;
  created_at: string | null;
}

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

  // Real stats from Supabase + loading state for skeletons
  const [todayScans, setTodayScans] = useState(0);
  const [todayBuys, setTodayBuys] = useState(0);
  const [todaySpent, setTodaySpent] = useState(0);
  const [todayProfit, setTodayProfit] = useState(0);
  const [yesterdayProfit, setYesterdayProfit] = useState(0);
  const [weekProfit, setWeekProfit] = useState(0);
  const [monthProfit, setMonthProfit] = useState(0);
  const [allTimeProfit, setAllTimeProfit] = useState(0);
  // Lifetime scan count drives the first-time-user branch — a user with zero
  // rows ever gets the simplified onboarding view.
  const [lifetimeScans, setLifetimeScans] = useState(0);
  const [profitHistory, setProfitHistory] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Last scan preview strip
  const [lastScan, setLastScan] = useState<ScanResponse | null>(null);

  // Header solidifies once the scroll sentinel leaves the viewport.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Tools drawer expansion
  const [showAllTools, setShowAllTools] = useState(false);

  // Press feedback for header avatar + show-all-tools toggle. Inlined here
  // because each is a one-off button — no need for a wrapper component.
  const [avatarPressed, setAvatarPressed] = useState(false);
  const [showAllPressed, setShowAllPressed] = useState(false);

  // Time/day for context card + sourcing cards. Read on the client only so
  // the SSR pass renders a stable null and the day-of-week never mismatches.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
  }, []);
  const dayOfWeek = now ? now.getDay() : 0;
  const hour = now ? now.getHours() : 0;

  // Carousel scroll target — context card "View deals" jumps here.
  const dealsCarouselRef = useRef<HTMLDivElement>(null);

  const refreshStats = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setStatsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("scans")
      .select("cost, profit, verdict, created_at")
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

    // 7-day daily profit bucket — index 0 is 6 days ago, index 6 is today.
    const daily = [0, 0, 0, 0, 0, 0, 0];

    for (const row of rows) {
      const ts = row.created_at ? new Date(row.created_at).getTime() : 0;
      const profit = Number(row.profit) || 0;
      const cost = Number(row.cost) || 0;
      const isBuy = row.verdict === "BUY";

      if (ts >= todayMs) {
        todayCount++;
        if (isBuy) {
          todayBuyCount++;
          todaySpentSum += cost;
          todayProfitSum += profit;
        }
      } else if (ts >= yesterdayMs && isBuy) {
        yesterdayProfitSum += profit;
      }

      if (ts >= weekStartMs && isBuy) weekProfitSum += profit;
      if (ts >= monthStartMs && isBuy) monthProfitSum += profit;
      if (isBuy) allTimeProfitSum += profit;

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
    setLifetimeScans(rows.length);
    setProfitHistory(daily.map((v) => Math.round(v)));
    setStatsLoading(false);
  }, [supabase]);

  useEffect(() => {
    // refreshStats fans out into ~10 setState calls; the rule flags this but
    // it's load-once data sync, not render-driven cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshStats();
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
      setLastScan(result);
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

  const handleDealTap = useCallback((deal: DealItem) => {
    haptic();
    console.log(`Deal: ${deal.title}`);
  }, []);

  const handleViewDeals = useCallback(() => {
    dealsCarouselRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const verdictColorDot = useMemo(() => {
    if (!lastScan) return "transparent";
    if (lastScan.verdict === "BUY") return "#5CE0B8";
    if (lastScan.verdict === "PASS") return "#E8636B";
    return "#D4A574";
  }, [lastScan]);

  const reopenLastScan = useCallback(() => {
    if (!lastScan) return;
    haptic();
    setVerdictData(lastScan);
    setVerdictOpen(true);
  }, [lastScan]);

  // First-time-user branch: never scanned today AND never scanned ever. Gated
  // on !statsLoading so we don't flash the onboarding view before stats land.
  // Once they finish their first scan, isNewUser flips to false and the full
  // dashboard fades in via the existing fadeInUp cascade.
  const isNewUser =
    !statsLoading && todayScans === 0 && lifetimeScans === 0;

  return (
    <>
      <style>{`
        .carousel-row::-webkit-scrollbar { display: none; height: 0; width: 0; }
        .carousel-row { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
      <DotGridBackground />
      {/* Fog layer — subtle vignette above the blobs, below content. Centers
          the eye on the dashboard core; edges fade to the page bg. */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 90% 70% at 50% 30%, transparent 0%, rgba(18,14,24,0.4) 60%, rgba(18,14,24,0.7) 100%)",
        }}
      />
      <CoinRain active={coinRainActive} />

      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* 1. Scroll sentinel */}
        <div
          ref={sentinelRef}
          data-scroll-sentinel=""
          style={{ height: 1, width: "100%" }}
          aria-hidden="true"
        />

        {/* 2 + 3. Sticky header — safe-area-aware, transparent → solid on scroll */}
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
            backdropFilter: scrolled ? "blur(12px)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
            boxShadow: scrolled
              ? "0 1px 0 rgba(255,255,255,0.04), 0 4px 12px rgba(0,0,0,0.2)"
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
                fontFamily: "var(--font-outfit), sans-serif",
                fontWeight: 500,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              JD
            </span>
          </button>
        </header>

        {isNewUser ? (
          /* ── First-time user — short, focused onboarding view. Welcome
              line → scan buttons → blurred deal teaser → flip tip. The full
              dashboard appears once they have any scan history. */
          <>
            {/* a. Welcome whisper — single line, no card. The entire value
                proposition. */}
            <div
              style={{
                padding: "24px 18px",
                textAlign: "center",
                animation:
                  "welcomeFadeIn 600ms cubic-bezier(0.19, 1, 0.22, 1) both",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontWeight: 500,
                  fontSize: 16,
                  color: "#C8C0D8",
                  lineHeight: 1.4,
                }}
              >
                scan anything to see what it&rsquo;s worth
              </p>
            </div>

            {/* b. Scan buttons — primary border pulses to invite the first tap. */}
            <div style={{ paddingLeft: 18, paddingRight: 18, marginTop: 16 }}>
              <ScanButtons
                onScanUpc={() => startScan("barcode")}
                onAiVision={() => startScan("vision")}
                todayScans={todayScans}
                pulsePrimary
              />
            </div>

            {/* c. Deal carousel teaser — real DealCarousel underneath, frosted
                overlay on top. Shapes are visible; data is gated behind a zip. */}
            <section
              style={{
                paddingLeft: 18,
                marginTop: 24,
                position: "relative",
              }}
              aria-label="Deals teaser"
            >
              <div style={{ pointerEvents: "none" }} aria-hidden="true">
                <DealCarousel
                  label="DEALS NEAR YOU"
                  deals={MOCK_DEALS_NEAR_YOU}
                  onDealTap={() => {}}
                  emptyMessage="No deals nearby right now."
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 18,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(18,14,24,0.7)",
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 18px",
                  zIndex: 1,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                    textAlign: "center",
                    letterSpacing: "0.04em",
                  }}
                >
                  set your zip to unlock deals near you
                </span>
              </div>
            </section>

            {/* d. Flip tip — slightly louder than the returning-user tip
                because new users still need to discover this content. */}
            <section
              style={{
                paddingLeft: 18,
                paddingRight: 18,
                marginTop: 32,
                marginBottom: 40,
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 0.5,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  margin: "0 auto 16px",
                }}
              />
              <p
                style={{
                  maxWidth: 280,
                  margin: "0 auto",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 9,
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.12)",
                  textAlign: "center",
                }}
              >
                griswold cast iron marked &lsquo;erie pa&rsquo; is worth 5-10×
                more than unmarked. carry a magnet — sterling silver
                won&rsquo;t stick.
              </p>
            </section>

            <div
              style={{
                paddingBottom: "calc(40px + env(safe-area-inset-bottom, 0px))",
              }}
            />
          </>
        ) : (
        <>
        {/* 4. Smart context card — only renders if a condition matches */}
        <div
          id="context-card"
          style={{
            marginTop: 12,
            paddingLeft: 18,
            paddingRight: 18,
            opacity: 0,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "0ms",
          }}
        >
          {now && (
            <ContextCard
              todayScans={todayScans}
              unsoldOldItems={0}
              hotDealsCount={MOCK_DEALS_NEAR_YOU.length}
              userZip={null}
              dayOfWeek={dayOfWeek}
              hour={hour}
              onViewDeals={handleViewDeals}
            />
          )}
        </div>

        {/* 5. Hero profit card */}
        <div
          id="hero-profit"
          style={{
            paddingLeft: 18,
            paddingRight: 18,
            marginTop: 16,
            opacity: 0,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "60ms",
          }}
        >
          <HeroProfit
            todayProfit={todayProfit}
            yesterdayProfit={yesterdayProfit}
            weekProfit={weekProfit}
            monthProfit={monthProfit}
            allTimeProfit={allTimeProfit}
            todayScans={todayScans}
            todayBuys={todayBuys}
            todaySpent={todaySpent}
            dailyProfitHistory={profitHistory}
            loading={statsLoading}
          />
        </div>

        {/* 6. Scan zone — sits 16px under the hero. Tighter coupling than the
            other sections because scanning directly drives profit. */}
        <div
          style={{
            paddingLeft: 18,
            paddingRight: 18,
            marginTop: 16,
            opacity: 0,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "120ms",
          }}
        >
          <ScanButtons
            onScanUpc={() => startScan("barcode")}
            onAiVision={() => startScan("vision")}
            todayScans={todayScans}
          />

          {/* Last-scan preview strip — appears once there's a recent result */}
          {lastScan && (
            <button
              type="button"
              onClick={reopenLastScan}
              style={{
                width: "100%",
                height: 48,
                marginTop: 8,
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "inherit",
                textAlign: "left",
                animation:
                  "fadeInUp 300ms cubic-bezier(0.16, 1, 0.3, 1) both",
                transition:
                  "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onPointerDown={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.03)";
                e.currentTarget.style.transform = "scale(0.98)";
              }}
              onPointerUp={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: verdictColorDot,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-outfit), sans-serif",
                    fontWeight: 500,
                    fontSize: 12,
                    color: "#C8C0D8",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lastScan.name}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: 9,
                    color: "#5A4E70",
                    marginTop: 2,
                  }}
                >
                  +${lastScan.profit} profit · just now
                </div>
              </div>
              <span style={{ color: "#3D2E55", flexShrink: 0 }}>→</span>
            </button>
          )}
        </div>

        {/* 7. Deals Near You carousel */}
        <section
          ref={dealsCarouselRef}
          style={{
            paddingLeft: 18,
            marginTop: 24,
            opacity: 0,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "200ms",
          }}
        >
          <DealCarousel
            label="DEALS NEAR YOU"
            deals={MOCK_DEALS_NEAR_YOU}
            onDealTap={handleDealTap}
            emptyMessage="No deals nearby right now."
          />
        </section>

        {/* 8. Free & Clearance carousel */}
        <section
          style={{
            paddingLeft: 18,
            marginTop: 20,
            opacity: 0,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "280ms",
          }}
        >
          <DealCarousel
            label="FREE & CLEARANCE"
            deals={MOCK_FREE_AND_CLEARANCE}
            onDealTap={handleDealTap}
            emptyMessage="Nothing free or marked down nearby."
          />
        </section>

        {/* 9. Sourcing intel — day-of-week aware */}
        <section
          style={{
            paddingLeft: 18,
            paddingRight: 18,
            marginTop: 24,
            opacity: 0,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "360ms",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 9,
              color: "#3D2E55",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            SOURCING
          </div>
          <SourcingCards
            pennyItemCount={48}
            yardSaleTodayCount={dayOfWeek === 6 ? 6 : 0}
            onPennyTap={() => console.log("Penny Drops")}
            onYardSaleTap={() => console.log("Yard Sales")}
          />
        </section>

        {/* 10. Tools drawer */}
        <section
          style={{
            paddingLeft: 18,
            paddingRight: 18,
            marginTop: 24,
            opacity: 0,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "420ms",
          }}
        >
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
                fontFamily: "var(--font-jetbrains-mono), monospace",
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {PRIMARY_TOOLS.map((tool) => (
              <ToolTile
                key={tool.name}
                name={tool.name}
                icon={tool.icon}
                onTap={() => handleToolTap(tool)}
              />
            ))}
          </div>

          <div
            style={{
              maxHeight: showAllTools ? 200 : 0,
              overflow: "hidden",
              transition:
                "max-height 250ms cubic-bezier(0.16, 1, 0.3, 1)",
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
              {EXTRA_TOOLS.map((tool, i) => (
                <div
                  key={tool.name}
                  style={{
                    opacity: 0,
                    animation: showAllTools
                      ? `fadeInUp 300ms cubic-bezier(0.16, 1, 0.3, 1) both`
                      : "none",
                    animationDelay: showAllTools ? `${i * 50}ms` : "0ms",
                  }}
                >
                  <ToolTile
                    name={tool.name}
                    icon={tool.icon}
                    onTap={() => handleToolTap(tool)}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic();
              setShowAllTools((v) => !v);
            }}
            onPointerDown={() => setShowAllPressed(true)}
            onPointerUp={() => setShowAllPressed(false)}
            onPointerLeave={() => setShowAllPressed(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 16px",
              margin: "8px auto 0",
              background: showAllPressed
                ? "rgba(255,255,255,0.03)"
                : "transparent",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 10,
              color: showAllPressed ? "#C8C0D8" : "#5A4E70",
              textAlign: "center",
              transform: showAllPressed ? "scale(0.98)" : "scale(1)",
              transition:
                "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), color 150ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {showAllTools ? "Show less" : "Show all tools"}
            <svg
              width={10}
              height={10}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5A4E70"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: showAllTools ? "rotate(180deg)" : "rotate(0deg)",
                transition:
                  "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </section>

        {/* 11. Flip tip — hairline above + centered tip. Tip is intentionally
            near-invisible (rgba 0.07): a hidden detail for close readers, not
            a distraction for the rest. */}
        <section
          style={{
            paddingLeft: 18,
            paddingRight: 18,
            marginTop: 32,
            marginBottom: 40,
            opacity: 0,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "500ms",
          }}
        >
          {/* Tiny centered "chapter break" — separates the tip from the
              tools above so it reads as a distinct element. */}
          <div
            style={{
              width: 60,
              height: 0.5,
              backgroundColor: "rgba(255,255,255,0.04)",
              margin: "0 auto 16px",
            }}
          />
          <p
            style={{
              maxWidth: 280,
              margin: "0 auto",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 9,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.07)",
              textAlign: "center",
            }}
          >
            griswold cast iron marked &lsquo;erie pa&rsquo; is worth 5-10× more
            than unmarked. carry a magnet — sterling silver won&rsquo;t stick.
          </p>
        </section>

        {/* 12. Bottom pad — safe-area-aware so the tip never slips under the
            iOS home indicator. */}
        <div
          style={{
            paddingBottom: "calc(40px + env(safe-area-inset-bottom, 0px))",
          }}
        />
        </>
        )}
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
    </>
  );
}
