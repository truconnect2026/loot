"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useScanTrigger } from "@/lib/scan-trigger";
import DotGridBackground from "@/components/shared/DotGridBackground";
import ToolSheet, { type ToolSheetTool } from "@/components/dashboard/ToolSheet";
import ConditionGradeSheet from "@/components/dashboard/ConditionGradeSheet";
import FlipCoachSheet from "@/components/dashboard/FlipCoachSheet";
import PaywallSheet from "@/components/dashboard/PaywallSheet";
import { FlipTip } from "@/components/shared/FlipTip";

/**
 * TOOLS — the arsenal, theater pass. Every flagship DEMONSTRATES its
 * own job in a whisper-quiet loop (the Home principle: don't describe
 * the tool, pantomime it):
 *   · SHELF SCANNER — a micro-shelf of item silhouettes; a mint
 *     scan-line sweeps (5.2s), price pills pop above each item as it
 *     crosses, hold, fade. Plus a faint holo-foil kiss (FoS family).
 *   · PRICE CHECK — three ghost comp rows ("sold $––") type
 *     themselves in sequence (6s), settle, fade.
 *   · AUTHENTICATE — a verdict cycle: tick, tick, red ✗, then a
 *     rep-caught red edge flash (6.4s).
 * Scene discipline: transform/opacity only, one timeline per scene,
 * staggered phase offsets (0.8s / 1.5s / 2.2s) + distinct durations so
 * no two loops sync-fire; scenes start only after the entrance lands;
 * ONE IntersectionObserver pauses all of it off-screen; reduced motion
 * removes every scene and keeps the full brightness upgrade.
 *
 * Routes, gating, and the Shelf Scanner's canonical-trigger call are
 * byte-identical to the previous revision. Visuals/motion only.
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

// ── Flagship scenes — each card pantomimes its own job ─────────────────────

/** Micro-shelf: five item silhouettes on a shelf line, a mint scan-line
    sweeps across, price pills pop above each item as it passes. */
function ShelfScene() {
  return (
    <span className="ts ts-shelf" aria-hidden="true" style={{ "--sd": "800ms" } as React.CSSProperties}>
      {/* holo-foil kiss — the FoS recipe at whisper intensity */}
      <span className="ts-foil ts-a" />
      <svg width={280} height={54} viewBox="0 0 280 54" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.2} strokeLinejoin="round" strokeLinecap="round">
        {/* shelf line */}
        <line x1={2} y1={48} x2={278} y2={48} stroke="rgba(92,224,184,0.35)" />
        {/* book spine */}
        <rect x={10} y={16} width={9} height={32} />
        {/* box */}
        <rect x={58} y={26} width={20} height={22} />
        <line x1={58} y1={33} x2={78} y2={33} />
        {/* vase */}
        <path d="M126 22 h8 v5 q5 3 5 10 q0 11 -9 11 q-9 0 -9 -11 q0 -7 5 -10 z" />
        {/* cup */}
        <path d="M186 34 h14 v14 h-14 z M200 37 q6 0 6 5 q0 4 -6 4" />
        {/* record */}
        <circle cx={252} cy={38} r={10} />
        <circle cx={252} cy={38} r={2} />
      </svg>
      <span className="ts-scanline ts-a" />
      <span className="ts-pill ts-pill--1 ts-a">$––</span>
      <span className="ts-pill ts-pill--2 ts-a">$––</span>
      <span className="ts-pill ts-pill--3 ts-a">$––</span>
      <span className="ts-pill ts-pill--4 ts-a">$––</span>
      <span className="ts-pill ts-pill--5 ts-a">$––</span>
    </span>
  );
}

/** Comp readout: three ghost "sold $––" rows type themselves in
    sequence, settle, fade. */
function CompsScene() {
  return (
    <span className="ts ts-comps ts-a" aria-hidden="true" style={{ "--sd": "1500ms" } as React.CSSProperties}>
      {[1, 2, 3].map((i) => (
        <span key={i} className="ts-row">
          <span className={`ts-row-in ts-row-in--${i} ts-a`}>
            sold&nbsp;&nbsp;<span style={{ color: "rgba(92,224,184,0.9)" }}>$––</span>
          </span>
        </span>
      ))}
    </span>
  );
}

/** Verdict cycle: tick, tick, red flag — then the card's edge flashes
    rep-caught red. The flash overlay is rendered by the card itself. */
function VerdictScene() {
  return (
    <span className="ts ts-verd" aria-hidden="true" style={{ "--sd": "2200ms" } as React.CSSProperties}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`ts-vrow ts-vrow--${i} ts-a`}>
          {i === 3 ? (
            <svg width={9} height={9} viewBox="0 0 24 24" stroke="#E8636B" strokeWidth={3.4} strokeLinecap="round">
              <line x1={5} y1={5} x2={19} y2={19} /><line x1={19} y1={5} x2={5} y2={19} />
            </svg>
          ) : (
            <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#5CE0B8" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          <span className="ts-vbar" style={i === 3 ? { background: "rgba(232,99,107,0.4)" } : undefined} />
        </span>
      ))}
    </span>
  );
}

// ── Cards ──────────────────────────────────────────────────────────────────

interface FlagshipProps {
  icon: React.ReactNode;
  scene?: React.ReactNode;
  /** Authenticate's rep-caught edge flash rides the card border. */
  edgeFlash?: boolean;
  accent: string;
  name: string;
  desc: string;
  wide?: boolean;
  onTap: () => void;
}

/** Large feature card — bright accent presence + a living scene that
    demonstrates the tool's job. Brightness floor (theater pass):
    face gradient 14→22, border 2E→47, under-glow 55→77, icon tile
    1C→2B, icon glow 55→88. */
function FlagshipCard({ icon, scene, edgeFlash, accent, name, desc, wide, onTap }: FlagshipProps) {
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
          // Reserved scene zone as a padding-box guarantee: the bottom
          // padding is ≥ the absolutely-positioned scene's full footprint
          // (bottom offset + height), so the scene ALWAYS sits inside the
          // reserved band and the flow text (icon/name/desc) can never
          // reach it — no overlap possible at any viewport, any desc
          // length. wide = shelf strip (68); 2-up = comps/verdict (66).
          padding: wide ? "16px 16px 68px" : "16px 14px 66px",
          minHeight: wide ? 0 : 200,
          background: `linear-gradient(135deg, ${accent}22 0%, rgba(255,255,255,0.03) 60%)`,
          border: `1px solid ${accent}47`,
          borderRadius: 18,
          boxShadow: `0 14px 30px -14px ${accent}77, inset 0 1px 0 rgba(255,255,255,0.08)`,
          cursor: "pointer",
          textAlign: "left",
          overflow: "hidden",
        } as React.CSSProperties
      }
    >
      {scene}
      {edgeFlash && <span className="ts-flash ts-a" aria-hidden="true" />}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 46,
          height: 46,
          borderRadius: 13,
          background: `${accent}2B`,
          color: accent,
          flexShrink: 0,
          filter: `drop-shadow(0 0 10px ${accent}88)`,
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
            color: "#F2EDFA",
            lineHeight: 1,
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: "var(--font-manrope, sans-serif)",
            fontSize: 11.5,
            color: "rgba(255,255,255,0.62)",
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

/** Compact kit card — static by design, but a distinct little
    instrument: bright icon tile, visible accent edge-kiss, legible
    copy, full house lift. */
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
          background: `linear-gradient(150deg, ${accent}12 0%, rgba(255,255,255,0.03) 55%)`,
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 14,
          boxShadow: `inset 0 -2px 0 ${accent}40, inset 0 1px 0 rgba(255,255,255,0.05), 0 6px 16px -8px rgba(0,0,0,0.5)`,
          cursor: "pointer",
          textAlign: "left",
        } as React.CSSProperties
      }
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 7,
          borderRadius: 9,
          background: `${accent}26`,
          color: accent,
          flexShrink: 0,
          filter: `drop-shadow(0 0 6px ${accent}55)`,
        }}
      >
        {/* B3: the 18px glyphs read slightly high-left in their 24-viewBoxes;
            a uniform 0.5px down-right shift re-centers the ink mass in the
            rounded tile (the container itself already centers geometrically). */}
        <span style={{ display: "inline-flex", transform: "translate(0.5px, 0.5px)" }}>{icon}</span>
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span
          style={{
            fontFamily: "var(--font-space-mono, monospace)",
            fontSize: 10.5,
            fontWeight: 700,
            color: "#E9E3F6",
            letterSpacing: "0.05em",
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: "var(--font-manrope, sans-serif)",
            fontSize: 10.5,
            color: "rgba(255,255,255,0.58)",
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
          background: `linear-gradient(150deg, ${accent}12 0%, rgba(255,255,255,0.03) 55%)`,
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 14,
          boxShadow: `inset 0 -2px 0 ${accent}40, inset 0 1px 0 rgba(255,255,255,0.05), 0 6px 16px -8px rgba(0,0,0,0.5)`,
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
          background: `${accent}26`,
          color: accent,
          flexShrink: 0,
          filter: `drop-shadow(0 0 6px ${accent}55)`,
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
            color: "#E9E3F6",
            letterSpacing: "0.05em",
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: "var(--font-manrope, sans-serif)",
            fontSize: 10.5,
            color: "rgba(255,255,255,0.58)",
            lineHeight: 1.4,
          }}
        >
          {desc}
        </span>
      </span>
      <span style={{ color: "#5A5272", flexShrink: 0 }}>
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

  // Flagship scenes pause off-screen (single observer).
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
      // Anon reached the price buttons (checkout requires an account) —
      // route to login instead of the silent dead button. Close the
      // sheet first so it doesn't orphan over the login page.
      if (res.status === 401) {
        setPaywallOpen(false);
        router.push("/");
        return;
      }
      if (!res.ok) return;
      const { url } = (await res.json()) as { url?: string };
      if (url) window.location.href = url;
    } catch { /* swallow */ }
  }, [router]);

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
          padding: "56px 18px 18px",
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
            color: "rgba(255,255,255,0.58)",
            marginTop: 5,
          }}
        >
          every job in the flip, one tap away.
        </div>
        {/* truthful stat — derivable from this page alone: 3 flagships
            + 6 kit cards + the sourcing cross-link. Update if tiles
            change. */}
        <div
          style={{
            fontFamily: "var(--font-space-mono, monospace)",
            fontSize: 8.5,
            letterSpacing: "0.16em",
            color: "rgba(92,224,184,0.5)",
            marginTop: 7,
          }}
        >
          10 TOOLS · ONE TAP EACH
        </div>
      </div>

      {/* First-run callout — one line teaching the mental model (each
          tile does one job). Outside .tl-stagger so it isn't a stagger
          child and doesn't inherit tlRise; shows once per device. */}
      <div style={{ padding: "0 18px", position: "relative", zIndex: 1 }}>
        <FlipTip id="tools" text="every tool's one job. tap one, go to work." />
      </div>

      <div
        className={"tl-stagger" + (flagsInView ? "" : " tl--paused")}
        style={{ padding: "0 18px", position: "relative", zIndex: 1 }}
      >
        {/* ── FLAGSHIPS — each one demonstrates itself ────────────── */}
        <div ref={flagsRef} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <FlagshipCard
            wide
            icon={<ShelfIcon size={26} />}
            scene={<ShelfScene />}
            accent="#5CE0B8"
            name="SHELF SCANNER"
            desc="point at a shelf — every item valued at once"
            onTap={() => { haptic(); triggerScan("shelf"); }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 10 }}>
            <FlagshipCard
              icon={<DollarIcon size={24} />}
              scene={<CompsScene />}
              accent="#D4A574"
              name="PRICE CHECK"
              desc="paste a name or photo to get instant resale comps"
              onTap={() => { haptic(); setActiveTool("price-check"); }}
            />
            <FlagshipCard
              icon={<ShieldIcon size={24} />}
              scene={<VerdictScene />}
              edgeFlash
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
            name="Kronos Coach"
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
      <div style={{ paddingBottom: "var(--content-bottom-clearance)" }} />

      <ConditionGradeSheet
        open={conditionOpen}
        onClose={() => setConditionOpen(false)}
        onPaywall={() => {
          // One continuous cross-motion: close this sheet and raise the
          // paywall in the SAME tick so the first leaves exactly as the
          // second arrives (matches the /app dashboard handoff). No
          // double-scrim — two identical dark scrims crossfading never
          // sum above a single steady scrim (0.5+0.5 alpha-composites to
          // 0.75, below the 1.0 max). The prior 150ms setTimeout read as
          // two beats AND, being wall-clock, left a blank-scrim gap under
          // reduced motion (both sheets snap instantly, then 150ms of
          // nothing). Removing it fixes both.
          setConditionOpen(false);
          setPaywallOpen(true);
        }}
        onSignup={() => {
          setConditionOpen(false);
          router.push("/");
        }}
      />

      <FlipCoachSheet
        open={coachOpen}
        onClose={() => setCoachOpen(false)}
        onPaywall={() => {
          // Simultaneous cross-motion — see ConditionGrade above. Close
          // the chat sheet and raise the paywall in one tick so the
          // handoff reads as a single continuous replacement with no
          // double-scrim and no reduced-motion blank gap.
          setCoachOpen(false);
          setPaywallOpen(true);
        }}
        onSignup={() => {
          // Logged-out visitor — close the sheet and route to the
          // login page (root renders LoginPage; middleware sends
          // unauth users to "/"). No return-path plumbing exists, so
          // plain navigation per the app's existing auth routing.
          setCoachOpen(false);
          router.push("/");
        }}
      />

      {/* Shared by both Pro-only tools on this page (Flip Coach +
          Condition Grade), neither of which has a free tier
          (FREE_SCAN_LIMIT = 0). limit={0} selects PaywallSheet's
          "GO PRO / Unlock unlimited scans" framing instead of the
          "X/Y free scans used today" quota framing, which never
          applied here. */}
      <PaywallSheet
        open={paywallOpen}
        used={0}
        limit={0}
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
.tl-stagger > * { animation: tlRise var(--motion-medium) var(--ease-out) both; }
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

/* ════ FLAGSHIP SCENES ════════════════════════════════════════════
   Shared: every animated element carries .ts-a; each scene root sets
   --sd (phase offset) so no two loops sync-fire; scenes begin after
   the entrance lands (offsets 0.8 / 1.5 / 2.2s); the flagships'
   IntersectionObserver pauses everything via .tl--paused. */
.ts { position: absolute; pointer-events: none; }
.tl--paused .ts-a { animation-play-state: paused !important; }

/* ── SHELF: micro-shelf + sweeping scan-line + price pills ── */
.ts-shelf { right: 10px; bottom: 8px; width: 280px; height: 54px; }
.ts-foil {
  position: absolute; inset: -220% -30% -10% -30%;
  background: linear-gradient(115deg,
    transparent 30%, rgba(92,224,184,0.07) 42%,
    rgba(123,143,255,0.07) 50%, rgba(212,165,116,0.06) 58%,
    transparent 70%);
  animation: tsFoil 8s ease-in-out var(--sd) infinite alternate;
}
@keyframes tsFoil {
  from { transform: translate3d(-18%, 0, 0); }
  to { transform: translate3d(18%, 0, 0); }
}
.ts-scanline {
  position: absolute; top: 0; bottom: 4px; left: 0; width: 1.5px;
  background: linear-gradient(180deg, transparent, rgba(92,224,184,0.9), transparent);
  box-shadow: 3px 0 8px rgba(92,224,184,0.4);
  opacity: 0;
  animation: tsScan 5.2s linear var(--sd) infinite;
}
@keyframes tsScan {
  0% { transform: translateX(0); opacity: 0; }
  6% { opacity: 1; transform: translateX(0); }
  42% { transform: translateX(278px); opacity: 1; }
  48%, 100% { transform: translateX(278px); opacity: 0; }
}
.ts-pill {
  position: absolute; top: 0;
  font-family: var(--font-space-mono, monospace);
  font-size: 6.5px; font-weight: 700; letter-spacing: 0.04em;
  color: #071310; background: rgba(92, 224, 184, 0.85);
  border-radius: 999px; padding: 1px 4px; line-height: 1.3;
  /* B2: pills are SEATED above each object at rest (opacity 0.85); the
     scan-line pass only brightens them briefly — they never fade to empty,
     so the shelf always reads populated in every state. */
  opacity: 0.85;
  animation-duration: 5.2s;
  animation-timing-function: linear;
  animation-delay: var(--sd);
  animation-iteration-count: infinite;
}
.ts-pill--1 { left: 4px; animation-name: tsPill1; }
.ts-pill--2 { left: 58px; animation-name: tsPill2; }
.ts-pill--3 { left: 120px; animation-name: tsPill3; }
.ts-pill--4 { left: 183px; animation-name: tsPill4; }
.ts-pill--5 { left: 242px; animation-name: tsPill5; }
/* pop as the scan-line crosses each item (6%→42% sweep, staggered),
   hold, fade together */
/* seated at 0.85; the scan-line pass brightens each pill to 1 in turn
   (staggered), then it settles back — never disappears. */
@keyframes tsPill1 { 0%, 6% { opacity: 0.8; } 10% { opacity: 1; } 18%, 100% { opacity: 0.85; } }
@keyframes tsPill2 { 0%, 15% { opacity: 0.8; } 19% { opacity: 1; } 27%, 100% { opacity: 0.85; } }
@keyframes tsPill3 { 0%, 22% { opacity: 0.8; } 26% { opacity: 1; } 34%, 100% { opacity: 0.85; } }
@keyframes tsPill4 { 0%, 30% { opacity: 0.8; } 34% { opacity: 1; } 42%, 100% { opacity: 0.85; } }
@keyframes tsPill5 { 0%, 38% { opacity: 0.8; } 42% { opacity: 1; } 50%, 100% { opacity: 0.85; } }

/* ── PRICE CHECK: comp rows type themselves ── */
.ts-comps {
  right: 12px; bottom: 12px; width: 104px;
  display: flex; flex-direction: column; gap: 3px;
  /* B1: rows are permanently seated (see .ts-row-in); the container only
     breathes opacity within a floor so it stays alive but never empties —
     the settled 3-row layout is the deterministic resting state, every
     render and under reduced motion. */
  opacity: 0.9;
  animation: tsCompsBreathe 6s ease-in-out var(--sd) infinite;
}
@keyframes tsCompsBreathe {
  0%, 100% { opacity: 0.78; }
  50% { opacity: 0.95; }
}
.ts-row {
  display: block; overflow: hidden;
  font-family: var(--font-space-mono, monospace);
  font-size: 8px; letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.55);
  border-bottom: 1px solid rgba(255,255,255,0.10);
  padding-bottom: 1px;
}
.ts-row-in {
  /* B1: seated at rest (no infinite type-in loop), so all three rows
     always occupy their reserved positions with text present. */
  display: inline-block; white-space: nowrap;
}

/* ── AUTHENTICATE: tick · tick · red flag + rep-caught edge flash ── */
.ts-verd {
  right: 14px; bottom: 12px;
  display: flex; flex-direction: column; gap: 6px;
}
.ts-vrow {
  display: inline-flex; align-items: center; gap: 5px;
  opacity: 0;
  animation-duration: 6.4s;
  animation-timing-function: linear;
  animation-delay: var(--sd);
  animation-iteration-count: infinite;
}
.ts-vbar { width: 34px; height: 3px; border-radius: 2px; background: rgba(255,255,255,0.28); }
.ts-vrow--1 { animation-name: tsV1; }
.ts-vrow--2 { animation-name: tsV2; }
.ts-vrow--3 { animation-name: tsV3; }
@keyframes tsV1 { 0%, 7% { opacity: 0; transform: translateY(3px); } 10%, 64% { opacity: 0.9; transform: translateY(0); } 72%, 100% { opacity: 0; } }
@keyframes tsV2 { 0%, 19% { opacity: 0; transform: translateY(3px); } 22%, 64% { opacity: 0.9; transform: translateY(0); } 72%, 100% { opacity: 0; } }
@keyframes tsV3 { 0%, 32% { opacity: 0; transform: translateY(3px); } 35%, 64% { opacity: 1; transform: translateY(0); } 72%, 100% { opacity: 0; } }
/* the card's edge catches the fake */
.ts-flash {
  position: absolute; inset: 0; border-radius: 18px;
  box-shadow: inset 0 0 0 1.5px rgba(232, 99, 107, 0.75), inset 0 0 20px rgba(232, 99, 107, 0.2);
  opacity: 0; pointer-events: none;
  animation: tsFlash 6.4s linear 2200ms infinite;
}
@keyframes tsFlash {
  0%, 35% { opacity: 0; }
  38% { opacity: 1; }
  41% { opacity: 0.3; }
  44% { opacity: 0.9; }
  52%, 100% { opacity: 0; }
}

/* ── reduced motion: scenes dead, full brightness stays ── */
@media (prefers-reduced-motion: reduce) {
  .tl-stagger > * { animation: none !important; }
  .ts-a { animation: none !important; }
  /* B1/B2: keep the shelf (svg + seated price pills) and the comp rows
     visible and static at their designed resting state; hide only the
     pure-motion layers (scan-line, foil) and the transient verdict scene. */
  .ts-verd, .ts-flash, .ts-scanline, .ts-foil { display: none !important; }
  .tl-card { transition: none; }
  .tl-card:active { transform: none; box-shadow: none; }
}
`;
