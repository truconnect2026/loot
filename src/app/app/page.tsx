"use client";

import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import DotGridBackground from "@/components/shared/DotGridBackground";
import CoinMark from "@/components/shared/CoinMark";
import CoinRain from "@/components/shared/CoinRain";
import SplashScreen from "@/components/shared/SplashScreen";
import HeroProfit from "@/components/dashboard/HeroProfit";
import EmptyHero from "@/components/dashboard/EmptyHero";
import { ONBOARDING_SKIPPED_KEY } from "@/app/onboarding/page";
import { readPendingPlan } from "@/lib/pending-plan";
import ContextCard from "@/components/dashboard/ContextCard";
import ScanButtons from "@/components/dashboard/ScanButtons";
import DealCarousel from "@/components/dashboard/DealCarousel";
import DealDetailSheet from "@/components/dashboard/DealDetailSheet";
import type { Deal } from "@/components/dashboard/DealCard";
import ToolTile from "@/components/dashboard/ToolTile";
import ScanOverlay from "@/components/dashboard/ScanOverlay";
import { registerScanHandler, useScanTrigger } from "@/lib/scan-trigger";
import VerdictSheet from "@/components/dashboard/VerdictSheet";
import SourcingCarousel, {
  type SourcingFeed,
} from "@/components/dashboard/SourcingCarousel";
// WinsTicker removed — it contained hardcoded "near you" claims that
// contradicted the honest empty-state copy when no real deals existed.
import ToolSheet, {
  type ToolKind,
  type ToolSheetTool,
} from "@/components/dashboard/ToolSheet";
import ShelfScanSheet from "@/components/dashboard/ShelfScanSheet";
import PaywallSheet from "@/components/dashboard/PaywallSheet";
import PennyDropsSheet from "@/components/dashboard/PennyDropsSheet";
import YardSalesSheet from "@/components/dashboard/YardSalesSheet";
import GoodwillColorSheet from "@/components/dashboard/GoodwillColorSheet";
import TargetMarkdownsSheet from "@/components/dashboard/TargetMarkdownsSheet";
import ComingSoonSheet from "@/components/dashboard/ComingSoonSheet";
import ConditionGradeSheet from "@/components/dashboard/ConditionGradeSheet";
import AppMarketingPreview from "@/components/app/AppMarketingPreview";
import FlipDailyCard from "@/components/dashboard/FlipDailyCard";
import FeedsEmptyCard from "@/components/dashboard/FeedsEmptyCard";
import { createClient } from "@/lib/supabase";
import type { VerdictPayload } from "@/components/dashboard/ScanOverlay";
import type { ScanCountResponse } from "@/app/api/scan-count/route";

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
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={3} width={7} height={7} />
      <rect x={14} y={3} width={7} height={7} />
      <rect x={3} y={14} width={7} height={7} />
      <rect x={14} y={14} width={7} height={7} />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1={12} y1={1} x2={12} y2={23} />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x={8} y={2} width={8} height={4} rx={1} />
    </svg>
  );
}

// Authenticate — checkmark inside a circle. Replaces the old shield Fake Checker.
function CheckCircleIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={12} r={10} />
      <polyline points="8 12.5 11 15.5 16 9" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1={16.5} y1={9.4} x2={7.5} y2={4.21} />
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1={12} y1={22.08} x2={12} y2={12} />
    </svg>
  );
}

function RecycleIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

// Condition Grade — checkbox-style check distinct from the
// CheckCircleIcon Authenticate uses, so the two tools don't read as
// duplicates in the MORE TOOLS grid.
function CheckBoxIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

// Flip Coach — Saturn (planet with ring) per the spec; reads as the
// coach's "brand" mark across the FAB and tile.
function SaturnIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={12} r={5} />
      <ellipse cx={12} cy={12} rx={10} ry={3.5} transform="rotate(-20 12 12)" />
    </svg>
  );
}

interface Tool {
  name: string;
  icon: React.ReactNode;
  /** Accent color for the tile's bottom hairline + the icon color
   * inside the wrapper. Same hex passed to ToolIcon below. */
  accent: string;
  /** Internal route — used by Haul Log, which opens the haul page. */
  href?: string;
  /** Tool sheet to open. Mutually exclusive with `href`. Tiles
   * with neither (Estate Sales, currently unwired) just log on tap. */
  toolKind?: ToolKind;
}

// Per-tool icon color so the four tiles read as four distinct
// utilities at a glance instead of an undifferentiated gray grid.
// Each color encodes a role: mint = AI/premium, camel = pricing/
// money-related, blue-purple = data/tracking, red = trust/auth.
// All wrapped at 0.6 opacity so the colors are present without
// shouting — the tile chrome stays the dominant visual element.
function ToolIcon({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        color,
        opacity: 0.6,
      }}
    >
      {children}
    </span>
  );
}

const TOP_TOOLS: Tool[] = [
  {
    name: "Flip Coach",
    icon: <ToolIcon color="#5CE0B8"><SaturnIcon /></ToolIcon>,
    accent: "#5CE0B8",
    toolKind: "flip-coach",
  },
  {
    name: "Shelf Scanner",
    icon: <ToolIcon color="#5CE0B8"><ShelfIcon /></ToolIcon>,
    accent: "#5CE0B8",
    toolKind: "shelf-scan",
  },
  {
    name: "Price Check",
    icon: <ToolIcon color="#D4A574"><DollarIcon /></ToolIcon>,
    accent: "#D4A574",
    toolKind: "price-check",
  },
  {
    name: "Haul Log",
    icon: <ToolIcon color="#7B8FFF"><ClipboardIcon /></ToolIcon>,
    accent: "#7B8FFF",
    href: "/app/haul",
  },
  {
    name: "Authenticate",
    icon: <ToolIcon color="#E8636B"><CheckCircleIcon /></ToolIcon>,
    accent: "#E8636B",
    toolKind: "fake-check",
  },
  {
    name: "Condition Grade",
    icon: <ToolIcon color="#D4A574"><CheckBoxIcon /></ToolIcon>,
    accent: "#D4A574",
    toolKind: "condition-grade",
  },
];

const EXTRA_TOOLS: Tool[] = [
  {
    name: "Tag Decoder",
    icon: <ToolIcon color="#D4A574"><HomeIcon /></ToolIcon>,
    accent: "#D4A574",
    toolKind: "tag-decode",
  },
  {
    name: "Liquidation Analyzer",
    icon: <ToolIcon color="#5CE0B8"><PackageIcon /></ToolIcon>,
    accent: "#5CE0B8",
    toolKind: "liquidation",
  },
  {
    name: "Scrap Finder",
    icon: <ToolIcon color="#7B8FFF"><RecycleIcon /></ToolIcon>,
    accent: "#7B8FFF",
    toolKind: "scrap-id",
  },
];

// Reverse-stagger exit timing for the tools drawer.
const TOOL_EXIT_STEP_MS = 30;
const TOOL_EXIT_FADE_MS = 150;
const TOOL_EXIT_TOTAL_MS =
  (EXTRA_TOOLS.length - 1) * TOOL_EXIT_STEP_MS + TOOL_EXIT_FADE_MS;
const TOOL_COLLAPSE_MS = 200;

// Deal data is fetched live from /api/feeds/{deals,free} on mount
// (see useEffect in DashboardPage). Cached server-side for 4 hours
// per (zip, feed_type) so this only burns Claude tokens once per
// zip per ~quarter-day.

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
        // Pill shape with a slightly stronger border and a wider tap
        // target. Centered horizontally below the tools grid; 16px
        // gap from the last tool tile per the spacing spec.
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        margin: "16px auto 0",
        padding: "10px 20px",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20,
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
  // Uppercase category header (SOURCING / MORE TOOLS) — stays in
  // JetBrains Mono per the font role system. The directional gradient
  // underline (paints via background-image rather than borderBottom)
  // sweeps from a hairline rgba(255,255,255,0.07) on the left into
  // transparent at 70%, anchoring the section without the heaviness
  // of a flat full-width divider.
  fontFamily: "var(--font-label)",
  fontSize: 10,
  fontWeight: 700,
  color: "#6F678E",
  letterSpacing: "0.12em",
  paddingBottom: 6,
  marginBottom: 10,
  display: "flex",
  alignItems: "center",
  // Faint mint accent at the rule's origin gives each section header a
  // deliberate anchor without a heavy divider.
  backgroundImage:
    "linear-gradient(to right, rgba(92,224,184,0.22) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "0 100%",
  backgroundSize: "100% 1px",
};


/**
 * StatsBorderWrap — 1px animated gradient border around the stats
 * card. The gradient drifts slowly (8s alternate) through mint and
 * periwinkle so the scoreboard feels alive even when the user is at
 * $0. Padding-1px wrapper technique mirrors UpgradeCard's gradient
 * border but at much lower saturation so it registers as ambient
 * energy, not an attention grab.
 */
function StatsBorderWrap({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: 1,
        borderRadius: 21,
        backgroundImage:
          "linear-gradient(135deg, rgba(92,224,184,0.08) 0%, rgba(123,143,255,0.06) 50%, rgba(92,224,184,0.08) 100%)",
        backgroundSize: "300% 300%",
        animation: "statsBorderDrift 8s ease-in-out infinite alternate",
      }}
    >
      {children}
    </div>
  );
}

/**
 * ScrollReveal — IntersectionObserver-driven entry animation. Wraps
 * a section so it fades + lifts in when it enters the viewport, but
 * only once. Sections above the fold (hero, scan buttons) render
 * normally; this is for the lower carousels and tool grids that
 * users scroll into.
 */
function ScrollReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const seen = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !seen.current) {
            seen.current = true;
            setRevealed(true);
            obs.disconnect();
          }
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(16px)",
        transition:
          "opacity 400ms ease-out, transform 400ms ease-out",
        willChange: revealed ? "auto" : "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Per-section identity glyph rendered before the label text. 12px,
 * 6px right margin, color encoded as the section's role:
 *   🔥 deals    soft red — hot finds
 *   🎁 free     mint     — pure profit
 *   📍 sourcing camel    — where to hunt
 *   🔧 tools    plum     — utility
 * Renders inside the SECTION_LABEL flex row so it sits inline with
 * the uppercase text, not floating above. Color targets glyph color
 * via `color`, but emoji ignore color — the SVG variants below take
 * stroke="currentColor" instead so the role color actually paints.
 */
function SectionIcon({
  kind,
}: {
  kind: "deals" | "free" | "sourcing" | "tools";
}) {
  const color =
    kind === "deals"
      ? "rgba(232, 99, 107, 0.6)"
      : kind === "free"
        ? "#5CE0B8"
        : kind === "sourcing"
          ? "#D4A574"
          : "#5A4E70";
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 12,
        height: 12,
        marginRight: 6,
        color,
        flexShrink: 0,
      }}
    >
      {kind === "deals" && (
        <svg
          viewBox="0 0 24 24"
          width={12}
          height={12}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Flame — hot finds */}
          <path d="M12 2c1 4 4 5 4 9a4 4 0 11-8 0c0-2 1-3 2-4-2 4-4 5-4 9a6 6 0 1012 0c0-7-4-10-6-14z" />
        </svg>
      )}
      {kind === "free" && (
        <svg
          viewBox="0 0 24 24"
          width={12}
          height={12}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Gift — free / pure profit */}
          <rect x={3} y={8} width={18} height={4} rx={1} />
          <path d="M5 12v9h14v-9" />
          <path d="M12 8v13" />
          <path d="M12 8c-2-3-5-3-5-1 0 2 2 3 5 1zM12 8c2-3 5-3 5-1 0 2-2 3-5 1z" />
        </svg>
      )}
      {kind === "sourcing" && (
        <svg
          viewBox="0 0 24 24"
          width={12}
          height={12}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Map pin — where to hunt */}
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx={12} cy={10} r={3} />
        </svg>
      )}
      {kind === "tools" && (
        <svg
          viewBox="0 0 24 24"
          width={12}
          height={12}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Wrench — utility */}
          <path d="M14.7 6.3a4 4 0 105.7 5.7l-9.4 9.4a2.8 2.8 0 11-4-4l9.4-9.4-1.7-1.7z" />
        </svg>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Session-gated wrapper. Middleware lets unauth visitors hit /app (exact path
// only — /app/haul, /app/scan etc. still redirect). This wrapper does the
// client-side getUser() check and routes to either the marketing preview or
// the real dashboard. The dashboard itself (DashboardPage) is unchanged.
// ─────────────────────────────────────────────────────────────────────────
export default function Page() {
  const [authState, setAuthState] = useState<"loading" | "auth" | "unauth">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setAuthState(data.user ? "auth" : "unauth");
    }).catch(() => {
      if (!cancelled) setAuthState("unauth");
    });
    return () => { cancelled = true; };
  }, []);

  // Loading shell — same page bg as both branches, no flash. Tiny mint dot
  // tells the user something is loading without being a full splash.
  if (authState === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "radial-gradient(ellipse at top, #0a1612 0%, #000 60%)",
        }}
        aria-hidden="true"
      />
    );
  }

  if (authState === "unauth") return <AppMarketingPreview />;
  return <DashboardPage />;
}

function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  // Scan overlay state
  const [scanOpen, setScanOpen] = useState(false);
  const [scanMode, setScanMode] = useState<
    "barcode" | "vision" | "shelf" | "crate"
  >("barcode");

  // Verdict sheet state
  const [verdictOpen, setVerdictOpen] = useState(false);
  const [verdictData, setVerdictData] = useState<VerdictPayload | null>(null);

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

  // Live deal feeds — fetched from /api/feeds/{deals,free} once the
  // user's zip is known. Cached server-side for 4 hours per zip.
  const [userZip, setUserZip] = useState<string | null>(null);
  const [userRadius, setUserRadius] = useState<number>(15);
  const [nearbyDeals, setNearbyDeals] = useState<Deal[]>([]);
  const [freeDeals, setFreeDeals] = useState<Deal[]>([]);
  const [feedsLoading, setFeedsLoading] = useState(true);
  // Penny count for SourcingCarousel. Derived from /api/feeds/pennies
  // on mount; the carousel reads the literal number for its callout.
  const [pennyCount, setPennyCount] = useState(0);

  // Subscription / scan-count state — drives the X/N counter under
  // the scan zone for free users and the PaywallSheet on 403.
  const [scanCount, setScanCount] = useState<ScanCountResponse | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallInfo, setPaywallInfo] = useState<{
    used: number;
    limit: number;
  } | null>(null);

  const refreshScanCount = useCallback(async () => {
    try {
      const res = await fetch("/api/scan-count");
      if (!res.ok) return;
      const data = (await res.json()) as ScanCountResponse;
      setScanCount(data);
    } catch {
      /* swallow — counter just stays null */
    }
  }, []);

  // Header solidifies once the scroll sentinel leaves the viewport.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

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

  // Shelf-scan requests land here from the canonical trigger
  // (src/lib/scan-trigger.ts — nav FAB, Tools tile) and from the
  // ?scan=shelf deep link below. STATE, not a ref: the old ref-based
  // version was only re-checked when scanCount changed, so a request
  // arriving AFTER scanCount had resolved (FAB tapped while sitting on
  // Home) was never processed — part of the Jan '26 dead-FAB bug.
  const [shelfRequest, setShelfRequest] = useState(false);
  // Deep-link support only (?scan=shelf bookmarks / external links).
  // In-app surfaces must NOT push this param — they call the trigger.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("scan") === "shelf") {
      window.history.replaceState(null, "", "/app");
      setShelfRequest(true);
    }
  }, []);
  // Gate once both the request and the scan count are in — Pro opens
  // the shelf sheet, non-Pro the paywall. Same branches as before the
  // trigger refactor; the free-scan gate itself is untouched.
  useEffect(() => {
    if (!shelfRequest || scanCount === null) return;
    setShelfRequest(false);
    if (!scanCount.isPro) {
      setPaywallInfo({ used: scanCount.used, limit: scanCount.limit });
      setPaywallOpen(true);
    } else {
      setShelfOpen(true);
    }
  }, [shelfRequest, scanCount]);


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

  // Scan-count — fetched on mount and after every successful scan
  // so the non-Pro nudge under the scan hero reflects live state.
  // Pro users get isPro: true and the nudge hides. Wrapped in an
  // async IIFE for the function-boundary the
  // react-hooks/set-state-in-effect rule wants.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refreshScanCount();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshScanCount]);

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
      // Pending-plan fast-path: if /pro queued a checkout before auth,
      // forward to /account where the auto-launch effect will fire
      // Stripe. Runs before the zip gate so we don't trap a brand-new
      // purchaser in the onboarding capture screen — they can finish
      // zip capture from /account later.
      if (typeof window !== "undefined" && readPendingPlan()) {
        router.replace("/account");
        return;
      }
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("zip_code, search_radius_miles")
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
      // Surface zip + radius into state so the feed effects below
      // can fetch /api/feeds/{deals,free} once the user is gated in.
      setUserZip(profileRow.zip_code);
      if (profileRow.search_radius_miles) {
        setUserRadius(profileRow.search_radius_miles);
      }
      setGateChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  // Live deal feeds — fire once the user's zip resolves. Each feed
  // route returns either fresh Claude-generated listings or a cached
  // payload (4-hour TTL keyed by zip+feed_type). Errors on either
  // feed degrade silently to an empty list, which the carousel
  // renders with the "no deals found" empty state.
  useEffect(() => {
    if (!userZip) return;
    let cancelled = false;
    // The async IIFE below is the function-boundary the
    // react-hooks/set-state-in-effect rule wants to see between the
    // synchronous effect body and any setState call. setFeedsLoading
    // is the only setter that needs to fire before the network
    // round-trip; defer it inside the IIFE alongside the others.
    (async () => {
      setFeedsLoading(true);
      try {
        const [dealsRes, freeRes] = await Promise.all([
          fetch(
            `/api/feeds/deals?zip=${encodeURIComponent(userZip)}&radius=${userRadius}`,
          ),
          fetch(
            `/api/feeds/free?zip=${encodeURIComponent(userZip)}&radius=${userRadius}`,
          ),
        ]);
        if (cancelled) return;
        if (dealsRes.ok) {
          const data = (await dealsRes.json()) as { deals: Deal[] };
          if (!cancelled) setNearbyDeals(data.deals ?? []);
        }
        if (freeRes.ok) {
          const data = (await freeRes.json()) as { deals: Deal[] };
          if (!cancelled) setFreeDeals(data.deals ?? []);
        }
      } catch {
        /* swallow — empty arrays + carousel empty state */
      } finally {
        if (!cancelled) setFeedsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userZip, userRadius]);

  // Penny count — non-location feed, fires once on mount regardless
  // of zip. The cache is shared across all users (national feed) so
  // this typically resolves from cache after the first request.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/feeds/pennies");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          items?: unknown[];
        };
        if (!cancelled) {
          setPennyCount(Array.isArray(data.items) ? data.items.length : 0);
        }
      } catch {
        /* swallow — count stays 0 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  // "shelf" here opens ScanOverlay's branded shelf camera — the
  // ShelfScanSheet's capture button hands off to it (the sheet keeps
  // the library-upload path). The SHELF trigger mode still routes to
  // the sheet via shelfRequest above; gate branches are identical.
  const startScan = useCallback((mode: "barcode" | "vision" | "shelf" | "crate") => {
    haptic();
    // FREE_SCAN_LIMIT = 0 — non-Pro users go straight to the paywall.
    // No scan overlay, no camera, no API call.
    if (scanCount !== null && !scanCount.isPro) {
      setPaywallInfo({ used: scanCount.used, limit: scanCount.limit });
      setPaywallOpen(true);
      return;
    }
    setScanMode(mode);
    setScanOpen(true);
  }, [scanCount]);

  // ── Canonical scan-trigger registration ─────────────────────────────
  // The dashboard is the ONLY consumer: every scan surface (nav FAB,
  // scan hero, Tools tile, deep link) funnels through scan-trigger.ts
  // into this handler, which owns ALL gating. A trigger fired before
  // this page mounted drains immediately on register.
  useEffect(() => {
    return registerScanHandler((mode) => {
      if (mode === "shelf") setShelfRequest(true);
      else startScan(mode);
    });
  }, [startScan]);
  const triggerScan = useScanTrigger();

  const handleScanResult = useCallback(
    (result: VerdictPayload) => {
      setScanOpen(false);
      setVerdictData(result);
      setVerdictOpen(true);

      if (result.verdict === "BUY") {
        haptic([50, 30, 50]);
        setCoinRainActive(false);
        requestAnimationFrame(() => setCoinRainActive(true));
        try { localStorage.setItem("loot_haul_pending", "1"); } catch { /* private mode */ }
      }

      // Pull fresh totals — the scan row was just inserted server-side.
      refreshStats();
      // Re-fetch the daily-scan count too, so the X/N counter ticks
      // immediately for free users instead of waiting for next mount.
      void refreshScanCount();
    },
    [refreshStats, refreshScanCount]
  );

  const cancelScan = useCallback(() => {
    setScanOpen(false);
  }, []);

  // /api/scan returned 403 — close the scanner overlay, open the
  // PaywallSheet with the limit info from the response. Refresh the
  // counter as a side effect so the dashboard tile is in sync.
  const handlePaywall = useCallback(
    (info: { used: number; limit: number }) => {
      setScanOpen(false);
      setPaywallInfo(info);
      setPaywallOpen(true);
      void refreshScanCount();
    },
    [refreshScanCount],
  );

  // PaywallSheet's CTA — POST checkout, then redirect in-tab to
  // Stripe. Same pattern as account/handleSubscribe but lives here
  // because the dashboard owns the paywall state.
  const handleSubscribe = useCallback(async (priceId: string) => {
    if (typeof window === "undefined") return;
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      // Session expired between page load and tapping subscribe —
      // route to login rather than a silent no-op. (This dashboard is
      // auth-gated, so this is the session-expiry case, not an anon
      // one; same routing as the /tools anon path.)
      if (res.status === 401) {
        setPaywallOpen(false);
        router.push("/");
        return;
      }
      if (!res.ok) {
        console.error("[paywall] checkout failed:", await res.text());
        return;
      }
      const { url } = (await res.json()) as { url?: string };
      if (url) window.location.href = url;
    } catch (err) {
      console.error("[paywall] checkout error:", err);
    }
  }, [router]);

  // ToolSheet handles every tool EXCEPT shelf-scan. Its `activeTool`
  // state is typed as ToolSheetTool (which excludes "shelf-scan") so
  // the type system enforces the routing — even if a future bug tries
  // to call setActiveTool("shelf-scan"), tsc would fail the build
  // before it could ship. Shelf Scanner has its own dedicated sheet
  // (thumbnail, filter bar, expand-to-compare).
  const [activeTool, setActiveTool] = useState<ToolSheetTool | null>(null);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [pennyOpen, setPennyOpen] = useState(false);
  const [yardOpen, setYardOpen] = useState(false);
  const [goodwillOpen, setGoodwillOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  // The coming-soon variants share a single sheet component; storing
  // which feed triggered it lets the sheet swap title/description
  // without us mounting one component per placeholder.
  const [comingSoonFeed, setComingSoonFeed] = useState<
    null | "restock-days" | "estate-sales" | "bolo-alerts" | "seasonal-flips"
  >(null);
  const [conditionOpen, setConditionOpen] = useState(false);

  const handleSourcingTap = useCallback((feed: SourcingFeed) => {
    haptic();
    switch (feed) {
      case "penny":
        setPennyOpen(true);
        return;
      case "goodwill-colors":
        setGoodwillOpen(true);
        return;
      case "target-markdowns":
        setTargetOpen(true);
        return;
      case "yard-sales":
        setYardOpen(true);
        return;
      case "restock-days":
      case "estate-sales":
      case "bolo-alerts":
      case "seasonal-flips":
        setComingSoonFeed(feed);
        return;
    }
  }, []);


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

  // Splash gate — covers the brief async window between mount and the
  // zip-code check resolving. Reuses the layout-level SplashScreen so
  // the dashboard auth wait visually continues the brand splash. In
  // the common case (auth resolves in <1.2s), the layout splash is
  // still up and this block never paints. On a slow auth, the layout
  // splash has faded by the time we reach here and SplashScreen mounts
  // with its entrance animations replaying — same identity, just a
  // brief replay rather than the previous dim "broken" treatment.
  if (!gateChecked) {
    return <SplashScreen />;
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
        @keyframes statsBorderDrift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        @keyframes fabFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes fabSonar {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes notifPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
      {/* Dashboard background — quiet graph-paper grid + centered
          vignette. No blobs, no particles: the dashboard is a
          workspace, not a stage. The grid variant carries its own
          radial vignette so the standalone fog layer is gone. */}
      <DotGridBackground variant="grid" />
      <CoinRain active={coinRainActive} />

      <div
        className="hm-root"
        style={{
          maxWidth: 480,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Entrance stagger — cards rise in sequence on mount. Children
            1-3 are the style tag, the scroll sentinel, and the sticky
            header (never animated: transform would break sticky); the
            content blocks stagger 45ms apart from child 4 on. Transform/
            opacity only; reduced motion renders everything instantly. */}
        <style>{`
          @keyframes hmRise {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .hm-root > *:nth-child(n+4) { animation: hmRise 280ms cubic-bezier(0.22,1,0.36,1) both; }
          .hm-root > *:nth-child(4) { animation-delay: 0ms; }
          .hm-root > *:nth-child(5) { animation-delay: 45ms; }
          .hm-root > *:nth-child(6) { animation-delay: 90ms; }
          .hm-root > *:nth-child(7) { animation-delay: 135ms; }
          .hm-root > *:nth-child(8) { animation-delay: 180ms; }
          .hm-root > *:nth-child(9) { animation-delay: 225ms; }
          .hm-root > *:nth-child(n+10) { animation-delay: 270ms; }
          @media (prefers-reduced-motion: reduce) {
            .hm-root > * { animation: none !important; }
          }
        `}</style>
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
            // Always-on hairline below the header so the brand row
            // visually separates from the stats card below, scrolled
            // or not. The scrolled-state shadow stays as the
            // additional depth cue when content sits underneath.
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            boxShadow: scrolled
              ? "0 4px 16px rgba(0,0,0,0.3)"
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
              LOOT.WORKS
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
              // Faint mint hairline so the avatar reads as an
              // intentional brand element instead of a generic gray
              // pill. 20% alpha is the minimum that registers
              // against the dark surface without competing with the
              // LOOT wordmark next to it.
              border: "1px solid rgba(92, 224, 184, 0.20)",
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
            userZip={userZip}
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
            <EmptyHero onScanTap={() => triggerScan("barcode")} />
          ) : (
            <StatsBorderWrap>
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
            </StatsBorderWrap>
          )}
        </div>

        {/* 5. Scan zone — wrapper carries no marginTop. The single
            source of vertical space between the stats card and the
            scan hero is the 14px marginTop on the hero root inside
            ScanButtons (the old two-button grid carried it before the
            single-hero rebuild); the scan zone's old top hairline +
            wrapper margin both got stripped so the two read as one
            connected action cluster instead of two separate
            floating elements. */}
        <div
          style={{
            padding: "0 18px",
            marginTop: 0,
            overflow: "hidden",
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "120ms",
          }}
        >
          {/* ITEM mode — the exact param the old AI VISION button
              passed; ScanOverlay's own toggle covers the rest. */}
          <ScanButtons onScan={() => triggerScan("vision")} />
          {/* Flip-or-skip daily card — surfaces today's round + streak.
              Reads localStorage, no server dependency. */}
          <div style={{ marginTop: 16 }}>
            <FlipDailyCard />
          </div>
          {/* FREE_SCAN_LIMIT = 0 means no free tier. Non-Pro users see a
              FLIP OR SKIP nudge in this slot instead of a quota counter. */}
          {scanCount && !scanCount.isPro && (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <a
                href="/flip"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 16px",
                  borderRadius: 20,
                  backgroundColor: "rgba(92, 224, 184, 0.08)",
                  border: "1px solid rgba(92, 224, 184, 0.12)",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  fontSize: 11,
                  color: "#5CE0B8",
                  letterSpacing: "0.02em",
                  textDecoration: "none",
                }}
              >
                play FLIP OR SKIP free daily →
              </a>
            </div>
          )}
        </div>

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
        {/* When BOTH feeds come back empty (typical for fresh users
            without a zip, or zips with no Claude-generated coverage),
            render a single consolidated empty card instead of two
            stacked compact lines. The two-line stacked variant adds
            ~80px of dead space; one card is ~140px and gives the user
            an actionable CTA. */}
        {!feedsLoading && nearbyDeals.length === 0 && freeDeals.length === 0 ? (
          <FeedsEmptyCard radius={userRadius} />
        ) : isNewUser ? (
          <>
            <div
              style={{
                // 20px from scan-count pill to first carousel header
                // per the spacing spec — tighter than the 24 used
                // for between-section gaps below.
                marginTop: 20,
                overflow: "hidden",
                animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
                animationDelay: "200ms",
              }}
            >
              <DealCarousel
                label="FREE & CLEARANCE"
                icon={<SectionIcon kind="free" />}
                deals={freeDeals}
                onDealTap={handleDealTap}
                loading={feedsLoading}
                emptyMessage="no free finds nearby — try expanding your radius"
              />
            </div>
            <div
              id="deals-near-you"
              style={{
                marginTop: 24,
                overflow: "hidden",
                animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
                animationDelay: "280ms",
              }}
            >
              <DealCarousel
                label="DEALS NEAR YOU"
                icon={<SectionIcon kind="deals" />}
                deals={nearbyDeals}
                onDealTap={handleDealTap}
                loading={feedsLoading}
                emptyMessage="no deals nearby — try expanding your radius"
              />
            </div>
          </>
        ) : (
          <>
            <div
              id="deals-near-you"
              style={{
                // 20px from scan-count pill to first carousel header
                // per the spacing spec — tighter than the 24 used
                // for between-section gaps below.
                marginTop: 20,
                overflow: "hidden",
                animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
                animationDelay: "200ms",
              }}
            >
              <DealCarousel
                label="DEALS NEAR YOU"
                icon={<SectionIcon kind="deals" />}
                deals={nearbyDeals}
                onDealTap={handleDealTap}
                loading={feedsLoading}
                emptyMessage="no deals nearby — try expanding your radius"
              />
            </div>
            <div
              style={{
                marginTop: 24,
                overflow: "hidden",
                animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
                animationDelay: "280ms",
              }}
            >
              <DealCarousel
                label="FREE & CLEARANCE"
                icon={<SectionIcon kind="free" />}
                deals={freeDeals}
                onDealTap={handleDealTap}
                loading={feedsLoading}
                emptyMessage="no free finds nearby — try expanding your radius"
              />
            </div>
          </>
        )}

        {/* 8. Sourcing intel — horizontal carousel of intel feeds.
            Wrapped in ScrollReveal so the section animates in only
            when it enters the viewport (instead of running the
            initial-mount fadeInUp invisibly while user is still up
            top). */}
        <ScrollReveal>
        <div
          style={{
            padding: "0 18px",
            marginTop: 24,
          }}
        >
          <div style={SECTION_LABEL}>
            <SectionIcon kind="sourcing" />
            SOURCING
          </div>
          <SourcingCarousel
            pennyItemCount={pennyCount}
            onTap={handleSourcingTap}
          />
        </div>
        </ScrollReveal>

        {/* 8.5. FLIP OR SKIP daily-drop CTA — removed during /flip rebuild;
            new dashboard card lands in a follow-up prompt. */}

        {/* Bottom tagline — scroll-end bookend mirroring the splash brand signature. */}
        <div
          style={{
            paddingTop: 24,
            paddingBottom: "calc(96px + env(safe-area-inset-bottom))",
            textAlign: "center",
            fontFamily: "var(--font-body)",
            fontSize: 11,
            color: "#3D2E55",
            letterSpacing: "0.10em",
          }}
        >
          scan. price. flip.
        </div>
      </div>

      {/* Overlays */}
      <ScanOverlay
        open={scanOpen}
        mode={scanMode}
        onResult={handleScanResult}
        onCancel={cancelScan}
        onPaywall={handlePaywall}
      />

      <VerdictSheet
        open={verdictOpen}
        onClose={() => setVerdictOpen(false)}
        data={verdictData}
        onGradeCondition={() => {
          setVerdictOpen(false);
          setConditionOpen(true);
        }}
      />

      <DealDetailSheet
        open={dealSheetOpen}
        deal={selectedDeal}
        onClose={() => setDealSheetOpen(false)}
      />

      <ToolSheet
        open={activeTool !== null}
        tool={activeTool}
        onClose={() => setActiveTool(null)}
      />

      <ShelfScanSheet
        open={shelfOpen}
        onClose={() => setShelfOpen(false)}
        onPaywall={handlePaywall}
        onScanned={() => {
          void refreshStats();
          void refreshScanCount();
        }}
        onOpenCamera={() => {
          setShelfOpen(false);
          startScan("shelf");
        }}
      />

      <PaywallSheet
        open={paywallOpen}
        used={paywallInfo?.used ?? 0}
        limit={paywallInfo?.limit ?? 5}
        monthlyPriceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ?? ""}
        annualPriceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL ?? ""}
        onSubscribe={handleSubscribe}
        onClose={() => setPaywallOpen(false)}
      />

      <PennyDropsSheet
        open={pennyOpen}
        onClose={() => setPennyOpen(false)}
      />

      <YardSalesSheet
        open={yardOpen}
        onClose={() => setYardOpen(false)}
      />

      <GoodwillColorSheet
        open={goodwillOpen}
        onClose={() => setGoodwillOpen(false)}
      />

      <TargetMarkdownsSheet
        open={targetOpen}
        onClose={() => setTargetOpen(false)}
      />

      {/* Coming-soon variants share one sheet component; the active
          feed key drives the title + description swap. Mounting a
          single sheet keeps state simple and animations consistent. */}
      <ComingSoonSheet
        open={comingSoonFeed === "restock-days"}
        onClose={() => setComingSoonFeed(null)}
        accent="#5CE0B8"
        title="restock day tracking"
        description="we're mapping when your local thrift stores put out new inventory so you can be first to the racks"
        icon={
          <svg
            width={36}
            height={36}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        }
      />

      <ComingSoonSheet
        open={comingSoonFeed === "estate-sales"}
        onClose={() => setComingSoonFeed(null)}
        accent="#D4A574"
        title="estate sale finder"
        description="AI-ranked estate sales near you with preview photo analysis — see what's worth driving to before you go"
        icon={
          <svg
            width={36}
            height={36}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        }
      />

      <ComingSoonSheet
        open={comingSoonFeed === "bolo-alerts"}
        onClose={() => setComingSoonFeed(null)}
        accent="#E8636B"
        title="BOLO alerts"
        description="community-powered trending items — get notified when something starts spiking in value before everyone else catches on"
        icon={
          <svg
            width={36}
            height={36}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        }
      />

      <ComingSoonSheet
        open={comingSoonFeed === "seasonal-flips"}
        onClose={() => setComingSoonFeed(null)}
        accent="#D4A574"
        title="seasonal flip calendar"
        description="know what to buy NOW to sell later — Christmas decor in January, AC units in October, winter coats in March"
        icon={
          <svg
            width={36}
            height={36}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x={3} y={4} width={18} height={18} rx={2} />
            <line x1={16} y1={2} x2={16} y2={6} />
            <line x1={8} y1={2} x2={8} y2={6} />
            <line x1={3} y1={10} x2={21} y2={10} />
          </svg>
        }
      />

      <ConditionGradeSheet
        open={conditionOpen}
        onClose={() => setConditionOpen(false)}
        onPaywall={() => {
          // Forward 403 from the condition-grade route into the
          // shared PaywallSheet so the user lands in the same upgrade
          // flow they'd see from a daily-limit hit.
          setPaywallInfo({
            used: scanCount?.used ?? 0,
            limit: scanCount?.limit ?? 5,
          });
          setPaywallOpen(true);
        }}
        onSignup={() => {
          setConditionOpen(false);
          router.push("/");
        }}
      />

    </>
  );
}
