"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DotGridBackground from "@/components/shared/DotGridBackground";
import CoinMark from "@/components/shared/CoinMark";
import CoinRain from "@/components/shared/CoinRain";
import StatsBar from "@/components/dashboard/StatsBar";
import ScanButtons from "@/components/dashboard/ScanButtons";
// Kept for the upcoming carousel-card refactor — its glass styling will be
// reused once the deal/clearance feeds are wired up.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import FeedCard from "@/components/dashboard/FeedCard";
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

const CAROUSEL_SCROLL: React.CSSProperties = {
  display: "flex",
  overflowX: "auto",
  scrollSnapType: "x mandatory",
  gap: 10,
  paddingRight: 18,
  WebkitOverflowScrolling: "touch",
};

const CAROUSEL_CARD: React.CSSProperties = {
  width: 280,
  flexShrink: 0,
  height: 140,
  backgroundColor: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  scrollSnapAlign: "start",
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
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Tools drawer state
  const [showAllTools, setShowAllTools] = useState(false);

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

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Watch the scroll sentinel — when it leaves the viewport the header
  // gains a solid background and hairline.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

        {/* 2. Sticky header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            height: 56,
            padding: "0 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: scrolled ? "rgba(18,14,24,0.95)" : "transparent",
            backdropFilter: scrolled ? "blur(12px)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
            boxShadow: scrolled ? "0 1px 0 rgba(255,255,255,0.04)" : "none",
            transition:
              "background-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)",
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

        {/* 3. Safe-area inset top */}
        <div style={{ paddingTop: "env(safe-area-inset-top, 0px)" }} />

        {/* 4. Smart context card slot — built in prompt 3 */}
        <div
          id="context-card"
          style={{
            minHeight: 0,
            marginTop: 12,
            padding: "0 18px",
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "0ms",
          }}
        />

        {/* 5. Hero profit card slot — built in prompt 2; placeholder = StatsBar */}
        <div
          id="hero-profit"
          style={{
            padding: "0 18px",
            marginTop: 16,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "60ms",
          }}
        >
          <StatsBar
            scans={stats.scans}
            buys={stats.buys}
            spent={stats.spent}
            profit={stats.profit}
          />
        </div>

        {/* 6. Scan zone — ScanButtons renders its own full-bleed hairlines */}
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

        {/* 7. Deals near you — bleeds to right edge */}
        <div
          style={{
            paddingLeft: 18,
            marginTop: 24,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "180ms",
          }}
        >
          <div style={SECTION_LABEL}>DEALS NEAR YOU</div>
          <div className="loot-carousel" style={CAROUSEL_SCROLL}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={CAROUSEL_CARD} />
            ))}
          </div>
        </div>

        {/* 8. Free & clearance — same shape */}
        <div
          style={{
            paddingLeft: 18,
            marginTop: 20,
            animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "240ms",
          }}
        >
          <div style={SECTION_LABEL}>FREE &amp; CLEARANCE</div>
          <div className="loot-carousel" style={CAROUSEL_SCROLL}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={CAROUSEL_CARD} />
            ))}
          </div>
        </div>

        {/* 9. Sourcing intel */}
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
            <div
              style={{
                flex: 1,
                height: 90,
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 12,
                display: "flex",
                alignItems: "flex-end",
                fontFamily: "var(--font-outfit), sans-serif",
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            >
              Penny Drops
            </div>
            <div
              style={{
                flex: 1,
                height: 90,
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 12,
                display: "flex",
                alignItems: "flex-end",
                fontFamily: "var(--font-outfit), sans-serif",
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            >
              Yard Sale Map
            </div>
          </div>
        </div>

        {/* 10. Tools drawer */}
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

          {/* Hidden extras — animated max-height reveal */}
          <div
            style={{
              overflow: "hidden",
              maxHeight: showAllTools ? 400 : 0,
              transition: "max-height 300ms cubic-bezier(0.16, 1, 0.3, 1)",
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
              {EXTRA_TOOLS.map((tool) => (
                <ToolTile
                  key={tool.name}
                  name={tool.name}
                  icon={tool.icon}
                  onTap={() => handleToolTap(tool)}
                />
              ))}
            </div>
          </div>

          {/* Show all toggle */}
          <button
            type="button"
            onClick={() => setShowAllTools((v) => !v)}
            style={{
              width: "100%",
              padding: 12,
              background: "transparent",
              border: "none",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 10,
              color: "#5A4E70",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            {showAllTools ? "Show fewer tools" : "Show all tools"}
          </button>
        </div>

        {/* 11. Flip tip */}
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

        {/* 12. Bottom pad */}
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
    </>
  );
}
