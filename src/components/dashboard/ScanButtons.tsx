"use client";

import { useState } from "react";

interface ScanButtonsProps {
  onScanUpc: () => void;
  onAiVision: () => void;
  /** Today's scan count — used for both the gentle hint and the per-button counter. */
  todayScans: number;
  /** First-time-user mode: SCAN UPC border breathes a quiet "tap me" pulse. */
  pulsePrimary?: boolean;
}

function BarcodeIcon() {
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.95)"
      strokeWidth={1.5}
      strokeLinecap="round"
    >
      <path d="M3 5v-2h4" />
      <path d="M17 3h4v2" />
      <path d="M21 19v2h-4" />
      <path d="M7 21H3v-2" />
      <line x1={7} y1={8} x2={7} y2={16} />
      <line x1={10} y1={8} x2={10} y2={16} />
      <line x1={13} y1={8} x2={13} y2={16} strokeWidth={2} />
      <line x1={17} y1={8} x2={17} y2={16} />
    </svg>
  );
}

function CameraIcon() {
  // Crisp white on the white-fill button — matches BarcodeIcon. The
  // primary/secondary variant distinction now lives entirely in the
  // mint glow intensity (radial halo + bottom shadow), so the icon
  // stroke stays the same on both.
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.95)"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx={12} cy={13} r={4} />
    </svg>
  );
}

const hairlineEdgeBleed: React.CSSProperties = {
  marginLeft: -18,
  marginRight: -18,
  height: 1,
  backgroundColor: "rgba(255,255,255,0.04)",
};

interface HeroButtonProps {
  variant: "mint" | "camel";
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  todayScans: number;
  onTap: () => void;
  /** Run the slow border pulse — only used by the primary button in new-user mode. */
  pulse?: boolean;
}

function HeroButton({
  variant,
  icon,
  label,
  subtitle,
  todayScans,
  onTap,
  pulse,
}: HeroButtonProps) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Both variants now use mint (the money color) — primary vs
  // secondary is encoded as glow intensity, not hue. This keeps the
  // color system clean: nothing else in the UI introduces amber, so
  // having amber on AI VISION made it look like a stray accent
  // rather than a deliberate variant.
  const accent = "92,224,184";
  const accentColor = variant === "mint" ? "#5CE0B8" : "rgba(92,224,184,0.72)";
  // Primary glows brighter; secondary is one notch dimmer.
  const borderAlpha = variant === "mint" ? 0.28 : 0.16;
  const haloAlpha = variant === "mint" ? 0.18 : 0.10;
  // Ambient under-glow — stacked box-shadows mimic a radial
  // gradient's soft falloff. Larger spreads (24-48px) and higher
  // alphas than the previous tight 20px halo so the buttons
  // unambiguously read as "lit from below" rather than as
  // rendering artifacts. Primary doubles the alpha of secondary on
  // every layer.
  const glowPrimary = variant === "mint";
  const glowMid = glowPrimary ? 0.40 : 0.20;
  const glowFar = glowPrimary ? 0.20 : 0.10;

  // Foreground-plane shadow — the scan buttons should feel like they're
  // floating above the rest of the dashboard, lit from below.
  const restShadow =
    `inset 0 1px 0 0 rgba(${accent},0.18),` +
    ` 0 2px 4px rgba(0,0,0,0.20),` +
    ` 0 12px 28px -6px rgba(${accent},${glowMid}),` +
    ` 0 24px 48px -12px rgba(${accent},${glowFar})`;
  const hoverShadow =
    `inset 0 1px 0 0 rgba(${accent},0.22),` +
    ` 0 0 0 1px rgba(${accent},${glowPrimary ? 0.22 : 0.14}),` +
    ` 0 12px 32px -4px rgba(${accent},${glowMid + 0.06}),` +
    ` 0 24px 48px -10px rgba(${accent},${glowFar + 0.04})`;

  // Counter is dim when zero, mint-tinted at 0.5 alpha once it's been used.
  const counterColor =
    todayScans > 0 ? `rgba(${accent},0.5)` : "rgba(255,255,255,0.25)";

  return (
    <button
      type="button"
      onClick={onTap}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => {
        setPressed(false);
        setHovered(false);
      }}
      onPointerEnter={() => setHovered(true)}
      style={{
        // Sizing is owned by the grid parent (1fr 1fr). The button just fills
        // its cell — no width/flex/minWidth/maxWidth here, so content size
        // can never push a button out of alignment.
        width: "100%",
        boxSizing: "border-box",
        // 88 (was 80) + gap 6 (was 4) gives icon/label/subtitle a few more
        // pixels of breathing room each. Subtitles now read as headlines
        // of their own row instead of cramming up against the label.
        height: 88,
        borderRadius: 16,
        // Opaque #120e18 base + 15% white tint stacked on top, so the
        // grid pattern from the dashboard background never bleeds
        // through the button. backgroundImage paints over
        // backgroundColor; the result is a solid surface that reads
        // as physical, not as a translucent hole. Mint identity lives
        // entirely in the glow stack below (radial halo, bottom
        // shadow, pulse) — bg stays neutral white-on-dark.
        backgroundColor: "#120e18",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.15), rgba(255,255,255,0.15))",
        border: `1px solid rgba(${accent},${borderAlpha})`,
        boxShadow: hovered ? hoverShadow : restShadow,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        cursor: "pointer",
        padding: 0,
        // First-scan nudge — the keyframe overrides border-color while running.
        animation: pulse ? "scanUpcPulse 2s ease-in-out infinite" : undefined,
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Today's scan count — top-right corner. Hidden until there's
          actually a count to show; a "0" in this position read as an
          unread-notification badge and confused new users. */}
      {todayScans > 0 && (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            fontFamily: "var(--font-body)",
            fontSize: 9,
            fontWeight: 500,
            color: counterColor,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {todayScans}
        </span>
      )}

      {/* Top-edge shine */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -1,
          left: 12,
          right: 12,
          height: 1,
          background:
            "linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)",
          pointerEvents: "none",
        }}
      />
      {/* Soft radial halo behind the icon */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 48,
          height: 48,
          top: 14,
          left: "50%",
          marginLeft: -24,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${accent},${haloAlpha}), transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{icon}</div>
      <span
        style={{
          // SCAN UPC / AI VISION — uppercase category label, stays mono.
          fontFamily: "var(--font-label)",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.12em",
          color: accentColor,
          position: "relative",
          zIndex: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          // Subtitle is functional instruction text ("when to use which"),
          // not decoration. Pulled off the accent tint and onto plain
          // white at 60% so it reads as readable copy regardless of
          // variant. The variant identity comes from the label color
          // above; pushing the subtitle through the accent rgb() bath
          // made the camel one in particular drift toward unreadable.
          fontFamily: "var(--font-body)",
          fontSize: 11,
          fontWeight: 500,
          color: "rgba(255,255,255,0.60)",
          letterSpacing: "0.01em",
          position: "relative",
          zIndex: 1,
        }}
      >
        {subtitle}
      </span>
    </button>
  );
}

export default function ScanButtons({
  onScanUpc,
  onAiVision,
  todayScans,
  pulsePrimary,
}: ScanButtonsProps) {
  const showHint = todayScans === 0;

  return (
    <>
      {/* Top hairline — full-bleed channel framing the scan zone */}
      <div style={{ ...hairlineEdgeBleed, marginTop: 16 }} />

      <div
        style={{
          // minmax(0, 1fr) — NOT plain 1fr. Plain `1fr` is shorthand for
          // `minmax(auto, 1fr)`, which floors each track at its min-content
          // width. Different label/subtitle widths between SCAN UPC and AI
          // VISION made the auto minimum diverge, leaving the buttons a few
          // pixels apart. minmax(0, 1fr) drops the floor and forces strictly
          // equal columns. This is the canonical Grid idiom for this exact
          // problem — do not change back to `1fr`.
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 8,
          width: "100%",
        }}
      >
        <HeroButton
          variant="mint"
          icon={<BarcodeIcon />}
          label="SCAN UPC"
          subtitle="point at any barcode"
          todayScans={todayScans}
          onTap={onScanUpc}
          pulse={pulsePrimary}
        />
        <HeroButton
          variant="camel"
          icon={<CameraIcon />}
          label="AI VISION"
          subtitle="no barcode? snap a photo"
          todayScans={todayScans}
          onTap={onAiVision}
        />
      </div>

      {/* New-user hint — only while today's scans is still 0. 40% white so
          it reads at a glance without competing with the scan buttons. */}
      {showHint && (
        <div
          style={{
            marginTop: 12,
            fontFamily: "var(--font-body)",
            fontSize: 9,
            color: "rgba(255,255,255,0.40)",
            textAlign: "center",
          }}
        >
          works at thrift stores, yard sales, and retail clearance
        </div>
      )}

      {/* Bottom hairline — full-bleed channel framing the scan zone */}
      <div style={{ ...hairlineEdgeBleed, marginTop: 20 }} />
    </>
  );
}
