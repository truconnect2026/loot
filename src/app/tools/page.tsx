"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DotGridBackground from "@/components/shared/DotGridBackground";
import ToolSheet, { type ToolSheetTool } from "@/components/dashboard/ToolSheet";
import ConditionGradeSheet from "@/components/dashboard/ConditionGradeSheet";
import FlipCoachSheet from "@/components/dashboard/FlipCoachSheet";
import PaywallSheet from "@/components/dashboard/PaywallSheet";

// Light haptic helper
function haptic(ms?: number | number[]) {
  try { navigator?.vibrate?.(ms ?? 10); } catch { /* iOS no-op */ }
}

// ── Icons ──────────────────────────────────────────────────────────────────

function ShelfIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={3} width={7} height={7} /><rect x={14} y={3} width={7} height={7} />
      <rect x={3} y={14} width={7} height={7} /><rect x={14} y={14} width={7} height={7} />
    </svg>
  );
}
function DollarIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <line x1={12} y1={1} x2={12} y2={23} /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function CheckBoxIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1={7} y1={7} x2="7.01" y2={7} />
    </svg>
  );
}
function PackageIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <line x1={16.5} y1={9.4} x2={7.5} y2={4.21} />
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1={12} y1={22.08} x2={12} y2={12} />
    </svg>
  );
}
function RecycleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
    </svg>
  );
}
function SaturnIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={12} r={5} />
      <ellipse cx={12} cy={12} rx={10} ry={3.5} transform="rotate(-20 12 12)" />
    </svg>
  );
}
function ClipboardIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x={8} y={2} width={8} height={4} rx={1} ry={1} />
    </svg>
  );
}
function CompassIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={12} r={10} />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── Shared components ──────────────────────────────────────────────────────

const SECTION_LABEL: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains-mono, monospace)",
  fontSize: 9,
  color: "#3D2E55",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  paddingBottom: 6,
  marginBottom: 10,
  backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.07) 0%, transparent 70%)",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "0 100%",
  backgroundSize: "100% 1px",
};

interface ToolTileProps {
  icon: React.ReactNode;
  accent: string;
  name: string;
  desc: string;
  onTap: () => void;
}

function ToolTile({ icon, accent, name, desc, onTap }: ToolTileProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onTap}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 14px",
        background: pressed ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        cursor: "pointer",
        textAlign: "left",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 100ms ease, background 100ms ease",
        borderBottom: `2px solid ${accent}22`,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          padding: 8,
          borderRadius: 8,
          background: `${accent}18`,
          color: accent,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {icon}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono, monospace)",
            fontSize: 11,
            fontWeight: 700,
            color: "#e2d9f3",
            letterSpacing: "0.04em",
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: "var(--font-outfit, sans-serif)",
            fontSize: 11,
            color: "#5A4E70",
            lineHeight: 1.4,
          }}
        >
          {desc}
        </span>
      </span>
    </button>
  );
}

interface SectionLinkProps {
  icon: React.ReactNode;
  accent: string;
  name: string;
  desc: string;
  onTap: () => void;
}

function SectionLink({ icon, accent, name, desc, onTap }: SectionLinkProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onTap}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 14px",
        background: pressed ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 100ms ease, background 100ms ease",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          padding: 8,
          borderRadius: 8,
          background: `${accent}18`,
          color: accent,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono, monospace)",
            fontSize: 11,
            fontWeight: 700,
            color: "#e2d9f3",
            letterSpacing: "0.04em",
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: "var(--font-outfit, sans-serif)",
            fontSize: 11,
            color: "#5A4E70",
          }}
        >
          {desc}
        </span>
      </span>
      <span style={{ color: "#3f3853", flexShrink: 0 }}>
        <ChevronRightIcon />
      </span>
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  const router = useRouter();

  const [activeTool, setActiveTool] = useState<ToolSheetTool | null>(null);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const handleSubscribe = useCallback(async (priceId: string) => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) return;
      const { url } = (await res.json()) as { url?: string };
      if (url) window.location.href = url;
    } catch { /* swallow */ }
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#070510",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <DotGridBackground variant="grid" />

      {/* Header */}
      <div
        style={{
          padding: "56px 18px 20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-bebas-neue, sans-serif)",
            fontSize: 36,
            letterSpacing: "0.06em",
            color: "#e2d9f3",
            lineHeight: 1,
          }}
        >
          TOOLS
        </div>
        <div
          style={{
            fontFamily: "var(--font-outfit, sans-serif)",
            fontSize: 12,
            color: "#5A4E70",
            marginTop: 4,
          }}
        >
          your flip flow: source · scan · sell
        </div>
      </div>

      <div style={{ padding: "0 18px", position: "relative", zIndex: 1 }}>

        {/* ── SOURCE ──────────────────────────────────────────────── */}
        <div style={SECTION_LABEL}>SOURCE</div>
        <SectionLink
          icon={<CompassIcon />}
          accent="#7B8FFF"
          name="Sourcing Intel"
          desc="Penny drops, Goodwill color schedule, Target markdowns, yard sales"
          onTap={() => { haptic(); router.push("/sourcing"); }}
        />

        {/* ── SCAN ────────────────────────────────────────────────── */}
        <div style={{ ...SECTION_LABEL, marginTop: 28 }}>SCAN</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ToolTile
            icon={<ShelfIcon />}
            accent="#5CE0B8"
            name="Shelf Scanner"
            desc="Point at a shelf — AI values every item at once"
            onTap={() => { haptic(); router.push("/app?scan=shelf"); }}
          />
          <ToolTile
            icon={<DollarIcon />}
            accent="#D4A574"
            name="Price Check"
            desc="Paste a name or photo to get instant resale comps"
            onTap={() => { haptic(); setActiveTool("price-check"); }}
          />
          <ToolTile
            icon={<ShieldIcon />}
            accent="#E8636B"
            name="Authenticate"
            desc="Spot fakes on sneakers, cards, bags, and more"
            onTap={() => { haptic(); setActiveTool("fake-check"); }}
          />
          <ToolTile
            icon={<CheckBoxIcon />}
            accent="#D4A574"
            name="Condition Grade"
            desc="AI letter grade from your photos — MINT to POOR"
            onTap={() => { haptic(); setConditionOpen(true); }}
          />
          <ToolTile
            icon={<TagIcon />}
            accent="#D4A574"
            name="Tag Decoder"
            desc="Decode clearance color tags from any store"
            onTap={() => { haptic(); setActiveTool("tag-decode"); }}
          />
          <ToolTile
            icon={<PackageIcon />}
            accent="#5CE0B8"
            name="Liquidation Analyzer"
            desc="Paste a manifest URL — get per-unit flip potential"
            onTap={() => { haptic(); setActiveTool("liquidation"); }}
          />
          <ToolTile
            icon={<RecycleIcon />}
            accent="#7B8FFF"
            name="Scrap Finder"
            desc="Identify recyclable materials and scrap metal value"
            onTap={() => { haptic(); setActiveTool("scrap-id"); }}
          />
        </div>

        {/* ── SELL ────────────────────────────────────────────────── */}
        <div style={{ ...SECTION_LABEL, marginTop: 28 }}>SELL</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ToolTile
            icon={<SaturnIcon />}
            accent="#5CE0B8"
            name="Flip Coach"
            desc="Claude-backed advisor — pricing, listing tips, strategy"
            onTap={() => { haptic(); setCoachOpen(true); }}
          />
          <ToolTile
            icon={<ClipboardIcon />}
            accent="#7B8FFF"
            name="Haul Log"
            desc="Track your finds, mark items sold, watch profit grow"
            onTap={() => { haptic(); router.push("/app/haul"); }}
          />
        </div>

      </div>

      {/* Bottom padding for tab bar */}
      <div style={{ height: 88 }} />

      {/* ── Overlays ───────────────────────────────────────────────── */}
      <ToolSheet
        open={activeTool !== null}
        tool={activeTool}
        onClose={() => setActiveTool(null)}
      />

      <ConditionGradeSheet
        open={conditionOpen}
        onClose={() => setConditionOpen(false)}
        onPaywall={() => {
          setConditionOpen(false);
          setPaywallOpen(true);
        }}
      />

      <FlipCoachSheet
        open={coachOpen}
        onClose={() => setCoachOpen(false)}
      />

      <PaywallSheet
        open={paywallOpen}
        used={0}
        limit={3}
        monthlyPriceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ?? ""}
        annualPriceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL ?? ""}
        onSubscribe={handleSubscribe}
        onClose={() => setPaywallOpen(false)}
      />
    </div>
  );
}
