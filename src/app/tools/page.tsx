"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useScanTrigger } from "@/lib/scan-trigger";
import DotGridBackground from "@/components/shared/DotGridBackground";
import ToolSheet, { type ToolSheetTool } from "@/components/dashboard/ToolSheet";
import ConditionGradeSheet from "@/components/dashboard/ConditionGradeSheet";
import FlipCoachSheet from "@/components/dashboard/FlipCoachSheet";
import PaywallSheet from "@/components/dashboard/PaywallSheet";

/**
 * TOOLS — the arsenal. Hierarchy replaces the old SOURCE/SCAN/SELL
 * filing cabinet: three FLAGSHIP instruments lead (Shelf Scanner
 * full-width, Price Check + Authenticate 2-up — the in-store,
 * mid-hunt workhorses), THE KIT follows as a tight 2-col grid, and
 * Sourcing Intel closes as a slim cross-link (it fronts a whole tab
 * that already lives in the nav — it doesn't compete for flagship).
 *
 * Identity: every tool keeps its accent (mint/gold/periwinkle/red
 * inventory preserved from the old rows) — icon tint, soft under-glow,
 * hairline edge kiss. Same card anatomy, different soul.
 *
 * Motion: Home's entrance stagger (45ms), house press via CSS :active
 * (scale + accent edge flash — reduced-motion kills it), and ONE
 * whisper idle per flagship (shelf cell shimmer / $ pulse / shield
 * breathe), IntersectionObserver-paused off-screen. The kit stays
 * static — hierarchy through motion too.
 *
 * Routes, gating, and the Shelf Scanner's canonical-trigger call are
 * byte-identical to the previous revision. Layout and visuals only.
 */

// Light haptic helper
function haptic(ms?: number | number[]) {
  try { navigator?.vibrate?.(ms ?? 10); } catch { /* iOS no-op */ }
}

// ── Icons ──────────────────────────────────────────────────────────────────

function ShelfIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={3} width={7} height={7} /><rect x={14} y={3} width={7} height={7} />
      <rect x={3} y={14} width={7} height={7} /><rect x={14} y={14} width={7} height={7} />
    </svg>
  );
}
function DollarIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <line x1={12} y1={1} x2={12} y2={23} /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}
function ShieldIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function CheckBoxIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}
function TagIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1={7} y1={7} x2="7.01" y2={7} />
    </svg>
  );
}
function PackageIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <line x1={16.5} y1={9.4} x2={7.5} y2={4.21} />
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1={12} y1={22.08} x2={12} y2={12} />
    </svg>
  );
}
function RecycleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
    </svg>
  );
}
function SaturnIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={12} r={5} />
      <ellipse cx={12} cy={12} rx={10} ry={3.5} transform="rotate(-20 12 12)" />
    </svg>
  );
}
function ClipboardIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x={8} y={2} width={8} height={4} rx={1} ry={1} />
    </svg>
  );
}
function CompassIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
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

// ── Cards ──────────────────────────────────────────────────────────────────

interface FlagshipProps {
  icon: React.ReactNode;
  motif: React.ReactNode;
  idle?: React.ReactNode;
  accent: string;
  name: string;
  desc: string;
  wide?: boolean;
  onTap: () => void;
}

/** Large feature card — icon with accent glow, display-type name, a
    ghost motif in the corner, and (optionally) one whisper idle layer. */
function FlagshipCard({ icon, motif, idle, accent, name, desc, wide, onTap }: FlagshipProps) {
  return (
    <button
      onClick={onTap}
      className="tl-card"
      style={
        {
          "--acc": accent,
          position: "relative",
          display: "flex",
          flexDirection: wide ? "row" : "column",
          alignItems: wide ? "center" : "flex-start",
          gap: wide ? 14 : 10,
          padding: wide ? "18px 16px" : "16px 14px",
          minHeight: wide ? 0 : 148,
          background: `linear-gradient(135deg, ${accent}14 0%, rgba(255,255,255,0.02) 55%)`,
          border: `1px solid ${accent}2E`,
          borderRadius: 18,
          boxShadow: `0 12px 28px -16px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.06)`,
          cursor: "pointer",
          textAlign: "left",
          overflow: "hidden",
        } as React.CSSProperties
      }
    >
      {/* ghost motif — the tool's glyph, oversized, whisper-faint */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          right: -14,
          bottom: -18,
          color: accent,
          opacity: 0.09,
          pointerEvents: "none",
        }}
      >
        {motif}
      </span>
      {idle}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 46,
          height: 46,
          borderRadius: 13,
          background: `${accent}1C`,
          color: accent,
          flexShrink: 0,
          filter: `drop-shadow(0 0 9px ${accent}55)`,
        }}
      >
        {icon}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 4, position: "relative" }}>
        <span
          style={{
            fontFamily: "var(--font-bebas-neue, sans-serif)",
            fontSize: 21,
            letterSpacing: "0.05em",
            color: "#EDE7F8",
            lineHeight: 1,
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: "var(--font-manrope, sans-serif)",
            fontSize: 11.5,
            color: "#9A92B3",
            lineHeight: 1.45,
          }}
        >
          {desc}
        </span>
      </span>
    </button>
  );
}

interface KitCardProps {
  icon: React.ReactNode;
  accent: string;
  name: string;
  desc: string;
  onTap: () => void;
}

/** Compact kit card — 2-col grid citizen. Static by design (hierarchy
    through motion): accent lives in the icon tint + bottom edge kiss. */
function KitCard({ icon, accent, name, desc, onTap }: KitCardProps) {
  return (
    <button
      onClick={onTap}
      className="tl-card"
      style={
        {
          "--acc": accent,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 8,
          padding: "13px 13px 12px",
          background: "rgba(255,255,255,0.028)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          boxShadow: `inset 0 -2px 0 ${accent}26`,
          cursor: "pointer",
          textAlign: "left",
        } as React.CSSProperties
      }
    >
      <span
        style={{
          display: "inline-flex",
          padding: 7,
          borderRadius: 9,
          background: `${accent}18`,
          color: accent,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span
          style={{
            fontFamily: "var(--font-space-mono, monospace)",
            fontSize: 10.5,
            fontWeight: 700,
            color: "#DDD5EE",
            letterSpacing: "0.05em",
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: "var(--font-manrope, sans-serif)",
            fontSize: 10.5,
            color: "#7A7194",
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

/** Slim full-width cross-link row (fronts another tab — chevron says so). */
function SectionLink({ icon, accent, name, desc, onTap }: SectionLinkProps) {
  return (
    <button
      onClick={onTap}
      className="tl-card"
      style={
        {
          "--acc": accent,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "13px 14px",
          background: "rgba(255,255,255,0.028)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          boxShadow: `inset 0 -2px 0 ${accent}26`,
          cursor: "pointer",
          textAlign: "left",
          width: "100%",
        } as React.CSSProperties
      }
    >
      <span
        style={{
          display: "inline-flex",
          padding: 8,
          borderRadius: 9,
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
            fontFamily: "var(--font-space-mono, monospace)",
            fontSize: 10.5,
            fontWeight: 700,
            color: "#DDD5EE",
            letterSpacing: "0.05em",
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: "var(--font-manrope, sans-serif)",
            fontSize: 10.5,
            color: "#7A7194",
            lineHeight: 1.4,
          }}
        >
          {desc}
        </span>
      </span>
      <span style={{ color: "#4A4260", flexShrink: 0 }}>
        <ChevronRightIcon />
      </span>
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  const router = useRouter();
  // Shelf tile goes through the canonical trigger — same contract as
  // the nav FAB (see src/lib/scan-trigger.ts; no ad-hoc URL params).
  const triggerScan = useScanTrigger();

  const [activeTool, setActiveTool] = useState<ToolSheetTool | null>(null);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  // Flagship idle life pauses off-screen (single observer).
  const flagsRef = useRef<HTMLDivElement>(null);
  const [flagsInView, setFlagsInView] = useState(true);
  useEffect(() => {
    const el = flagsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setFlagsInView(entry.isIntersecting),
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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
      <style>{STYLES}</style>
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
            fontFamily: "var(--font-manrope, sans-serif)",
            fontSize: 12.5,
            color: "rgba(255,255,255,0.55)",
            marginTop: 5,
          }}
        >
          every job in the flip, one tap away.
        </div>
      </div>

      <div
        className={"tl-stagger" + (flagsInView ? "" : " tl--paused")}
        style={{ padding: "0 18px", position: "relative", zIndex: 1 }}
      >
        {/* ── FLAGSHIPS — the workhorses lead ─────────────────────── */}
        <div ref={flagsRef} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <FlagshipCard
            wide
            icon={<ShelfIcon size={26} />}
            motif={<ShelfIcon size={96} />}
            idle={<span className="tl-idle-cell" aria-hidden="true" />}
            accent="#5CE0B8"
            name="SHELF SCANNER"
            desc="point at a shelf — every item valued at once"
            onTap={() => { haptic(); triggerScan("shelf"); }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 10 }}>
            <FlagshipCard
              icon={<DollarIcon size={24} />}
              motif={<span className="tl-idle-dollar"><DollarIcon size={92} /></span>}
              accent="#D4A574"
              name="PRICE CHECK"
              desc="paste a name or photo to get instant resale comps"
              onTap={() => { haptic(); setActiveTool("price-check"); }}
            />
            <FlagshipCard
              icon={<ShieldIcon size={24} />}
              motif={<span className="tl-idle-shield"><ShieldIcon size={92} /></span>}
              accent="#E8636B"
              name="AUTHENTICATE"
              desc="spot fakes on sneakers, cards, bags, and more"
              onTap={() => { haptic(); setActiveTool("fake-check"); }}
            />
          </div>
        </div>

        {/* ── THE KIT — one quiet grouping, Home's header cadence ── */}
        <div className="tl-kit-label" style={{ marginTop: 26 }}>THE KIT</div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 8 }}>
          <KitCard
            icon={<TagIcon />}
            accent="#D4A574"
            name="Tag Decoder"
            desc="decode clearance color tags from any store"
            onTap={() => { haptic(); setActiveTool("tag-decode"); }}
          />
          <KitCard
            icon={<PackageIcon />}
            accent="#5CE0B8"
            name="Liquidation"
            desc="paste a manifest URL — get per-unit flip potential"
            onTap={() => { haptic(); setActiveTool("liquidation"); }}
          />
          <KitCard
            icon={<CheckBoxIcon />}
            accent="#D4A574"
            name="Condition Grade"
            desc="letter grade from your photos — MINT to POOR"
            onTap={() => { haptic(); setConditionOpen(true); }}
          />
          <KitCard
            icon={<RecycleIcon />}
            accent="#7B8FFF"
            name="Scrap Finder"
            desc="identify recyclable materials and scrap metal value"
            onTap={() => { haptic(); setActiveTool("scrap-id"); }}
          />
          <KitCard
            icon={<SaturnIcon />}
            accent="#5CE0B8"
            name="Flip Coach"
            desc="your flip advisor — pricing, listing tips, strategy"
            onTap={() => { haptic(); setCoachOpen(true); }}
          />
          <KitCard
            icon={<ClipboardIcon />}
            accent="#7B8FFF"
            name="Haul Log"
            desc="track your finds, mark items sold, watch profit grow"
            onTap={() => { haptic(); router.push("/app/haul"); }}
          />
        </div>

        {/* cross-link — Sourcing has its own tab; this is a doorway, not a tool */}
        <div style={{ marginTop: 8 }}>
          <SectionLink
            icon={<CompassIcon />}
            accent="#7B8FFF"
            name="Sourcing Intel"
            desc="penny drops, Goodwill color schedule, Target markdowns, yard sales"
            onTap={() => { haptic(); router.push("/sourcing"); }}
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

      {/* Static clearance for the floating tab pill (expanded state:
          pill 54 + offset 8 + FAB overhang 18 + breathing = 96). The last
          tool card is interactive and ended flush against the pill. */}
      <div style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom))" }} />

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

const STYLES = `
/* ── entrance — Home's stagger cadence ── */
@keyframes tlRise {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.tl-stagger > * { animation: tlRise 280ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.tl-stagger > *:nth-child(1) { animation-delay: 0ms; }
.tl-stagger > *:nth-child(2) { animation-delay: 45ms; }
.tl-stagger > *:nth-child(3) { animation-delay: 90ms; }
.tl-stagger > *:nth-child(4) { animation-delay: 135ms; }
.tl-stagger > *:nth-child(n+5) { animation-delay: 180ms; }

/* ── house press: scale + accent edge flash (CSS-only, per-card --acc) ── */
.tl-card {
  -webkit-tap-highlight-color: transparent;
  transition: transform 150ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 150ms ease;
}
.tl-card:active {
  transform: scale(0.97);
  box-shadow: 0 0 0 1px var(--acc), 0 0 18px -6px var(--acc);
}
.tl-card:focus-visible { outline: 2px solid rgba(92,224,184,0.75); outline-offset: 2px; }

/* ── kit header — Home's mint-origin fade rule ── */
.tl-kit-label {
  font-family: var(--font-space-mono, monospace);
  font-size: 10px; font-weight: 700;
  color: #6F678E; letter-spacing: 0.12em;
  padding-bottom: 6px; margin-bottom: 10px;
  background-image: linear-gradient(to right, rgba(92,224,184,0.22) 0%, rgba(255,255,255,0.05) 40%, transparent 70%);
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 100% 1px;
}

/* ── flagship idle life — one whisper per card, opacity only ──
   Shelf: one grid cell shimmers (a mint square over the ghost motif's
   top-right cell — motif box is 96px at right:-14/bottom:-18, so the
   cell lands at right 22 / bottom 66). */
.tl-idle-cell {
  position: absolute; right: 42px; bottom: 38px;
  width: 28px; height: 28px; border-radius: 4px;
  background: #5CE0B8;
  opacity: 0;
  animation: tlCell 4.2s ease-in-out infinite;
  pointer-events: none;
}
@keyframes tlCell {
  0%, 62% { opacity: 0; }
  74% { opacity: 0.16; }
  86%, 100% { opacity: 0; }
}
/* Price Check: the ghost $ pulses faintly */
.tl-idle-dollar { display: inline-flex; animation: tlPulse 3.6s ease-in-out infinite; }
@keyframes tlPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
/* Authenticate: slow shield glow breathe */
.tl-idle-shield {
  display: inline-flex;
  animation: tlBreathe 3s ease-in-out infinite;
}
@keyframes tlBreathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

/* ── off-screen pause (single IO drives this class) ── */
.tl--paused .tl-idle-cell,
.tl--paused .tl-idle-dollar,
.tl--paused .tl-idle-shield { animation-play-state: paused !important; }

/* ── reduced motion: static, premium, organized ── */
@media (prefers-reduced-motion: reduce) {
  .tl-stagger > * { animation: none !important; }
  .tl-idle-cell, .tl-idle-dollar, .tl-idle-shield { animation: none !important; }
  .tl-idle-cell { opacity: 0; }
  .tl-card { transition: none; }
  .tl-card:active { transform: none; box-shadow: none; }
}
`;
