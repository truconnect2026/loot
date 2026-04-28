"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import DotGridBackground from "@/components/shared/DotGridBackground";
import CoinMark from "@/components/shared/CoinMark";
import CoinRain from "@/components/shared/CoinRain";
import StatsBar from "@/components/dashboard/StatsBar";
import ScanButtons from "@/components/dashboard/ScanButtons";
import FeedCard from "@/components/dashboard/FeedCard";
import ToolTile from "@/components/dashboard/ToolTile";
import ScanOverlay from "@/components/dashboard/ScanOverlay";
import VerdictSheet, { type VerdictData } from "@/components/dashboard/VerdictSheet";

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

function MapIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1={8} y1={2} x2={8} y2={18} />
      <line x1={16} y1={6} x2={16} y2={22} />
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

// ── Mock data ──

const MOCK_STATS = { scans: 47, buys: 12, spent: 284, profit: 631 };

const MOCK_VERDICT: VerdictData = {
  method: "barcode",
  name: "KitchenAid Artisan 5qt Stand Mixer",
  verdict: "BUY",
  cost: 35,
  sell: 189,
  profit: 154,
  roi: 440,
  platform: "FB Local",
  fee: 0,
  comps: 8,
};

const FEED_CARDS = [
  { name: "Deals Near You", subtitle: "FB + Craigslist flips", icon: "map-pin" as const, accent: "mint" as const, count: 14 },
  { name: "Penny Drops", subtitle: "weekly Dollar General list", icon: "tag" as const, accent: "camel" as const, count: 23 },
  { name: "Free Finds", subtitle: "free stuff worth reselling", icon: "gift" as const, accent: "mint" as const, count: 7 },
  { name: "Store Clearance", subtitle: "markdowns below resale", icon: "shopping-bag" as const, accent: "camel" as const, count: 31 },
];

const TOOLS = [
  { name: "Shelf Scanner", icon: <ShelfIcon /> },
  { name: "Price Check", icon: <DollarIcon /> },
  { name: "Yard Sale Map", icon: <MapIcon /> },
  { name: "Estate Sales", icon: <HomeIcon /> },
  { name: "Haul Log", icon: <ClipboardIcon /> },
  { name: "Fake Checker", icon: <ShieldIcon /> },
  { name: "Liquidation Analyzer", icon: <PackageIcon /> },
  { name: "Scrap Finder", icon: <RecycleIcon /> },
];

export default function DashboardPage() {
  const router = useRouter();

  // Scan overlay state
  const [scanOpen, setScanOpen] = useState(false);
  const [scanMode, setScanMode] = useState<"barcode" | "vision">("barcode");
  const [scanProgress, setScanProgress] = useState(0);

  // Verdict sheet state
  const [verdictOpen, setVerdictOpen] = useState(false);
  const [verdictData, setVerdictData] = useState<VerdictData | null>(null);

  // CoinRain state
  const [coinRainActive, setCoinRainActive] = useState(false);

  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
    };
  }, []);

  const startScan = useCallback((mode: "barcode" | "vision") => {
    setScanMode(mode);
    setScanProgress(0);
    setScanOpen(true);

    // Simulate progress
    let p = 0;
    progressInterval.current = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) p = 100;
      setScanProgress(p);
      if (p >= 100 && progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }, 200);

    // After ~2s, close overlay and show verdict
    scanTimeout.current = setTimeout(() => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      setScanOpen(false);
      setScanProgress(0);

      const data = { ...MOCK_VERDICT, method: mode } as VerdictData;
      setVerdictData(data);
      setVerdictOpen(true);

      // BUY verdict triggers CoinRain
      if (data.verdict === "BUY") {
        setCoinRainActive(false);
        // Small delay to ensure rising edge
        requestAnimationFrame(() => setCoinRainActive(true));
      }
    }, 2000);
  }, []);

  const cancelScan = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (scanTimeout.current) clearTimeout(scanTimeout.current);
    setScanOpen(false);
    setScanProgress(0);
  }, []);

  return (
    <>
      <DotGridBackground />
      <CoinRain active={coinRainActive} />

      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "0 18px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 16,
          }}
        >
          {/* Left: logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CoinMark size={20} />
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: 20,
                color: "var(--accent-mint)",
                letterSpacing: "0.06em",
                lineHeight: 1,
              }}
            >
              LOOT
            </span>
            <div
              style={{
                width: 40,
                height: 1,
                backgroundColor: "var(--accent-mint)",
                opacity: 0.15,
                flexShrink: 0,
              }}
            />
          </div>

          {/* Right: avatar */}
          <button
            onClick={() => router.push("/account")}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
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

        {/* ── Stats Bar ── */}
        <StatsBar
          scans={MOCK_STATS.scans}
          buys={MOCK_STATS.buys}
          spent={MOCK_STATS.spent}
          profit={MOCK_STATS.profit}
        />

        {/* ── Scan Buttons ── */}
        <ScanButtons
          onScanUpc={() => startScan("barcode")}
          onAiVision={() => startScan("vision")}
          hasScanned={MOCK_STATS.scans > 0}
        />

        {/* ── Feed Grid ── */}
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          {FEED_CARDS.map((card) => (
            <FeedCard
              key={card.name}
              name={card.name}
              subtitle={card.subtitle}
              icon={card.icon}
              accent={card.accent}
              count={card.count}
              isRecent={card.name === "Deals Near You"}
              onTap={() => console.log(`Feed: ${card.name}`)}
            />
          ))}
        </div>

        {/* ── Tool Grid ── */}
        <div style={{ marginTop: 24 }}>
          {/* "MORE TOOLS" label with full-bleed hairlines on each side */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 12,
              marginLeft: -18,
              marginRight: -18,
            }}
          >
            <div style={{ flex: 1, height: 0.5, backgroundColor: "var(--border-default)" }} />
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
            <div style={{ flex: 1, height: 0.5, backgroundColor: "var(--border-default)" }} />
          </div>

          {/* 2-col grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {TOOLS.map((tool) => (
              <ToolTile
                key={tool.name}
                name={tool.name}
                icon={tool.icon}
                onTap={() => console.log(`Tool: ${tool.name}`)}
              />
            ))}
          </div>
        </div>

        {/* Bottom padding */}
        <div style={{ paddingBottom: 40 }} />
      </div>

      {/* ── Overlays ── */}
      <ScanOverlay
        open={scanOpen}
        mode={scanMode}
        progress={scanProgress}
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
