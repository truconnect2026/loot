"use client";

import type { CSSProperties, ReactNode } from "react";
import DotGridBackground from "@/components/shared/DotGridBackground";

/**
 * Route skeletons — held structure, not spinners. Each tab's loading
 * state renders a lightweight ghost of its real layout (header, cards
 * at true positions/sizes) so navigation feels instant: the page
 * arrives already shaped and content fades in over it.
 *
 * Primitive: <Skel> (block | line | circle) with a soft opacity pulse.
 * Screen wrapper: <SkeletonScreen> reveals the whole thing only after
 * ~120ms so fast loads never flash it — content that lands sooner
 * unmounts the skeleton while it is still invisible.
 *
 * Reduced motion (global rule in globals.css): the pulse + reveal-delay
 * collapse to 0.01ms, so the skeleton shows immediately as a STATIC dim
 * ghost (base opacity 1) with no motion. Cited: no pulse, no delay.
 */

const STYLES = `
.skel { animation: skelPulse 1.4s var(--ease-out, ease-in-out) infinite; }
@keyframes skelPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
/* Reveal only after 120ms: invisible during the delay (backwards fill),
   so a fast load never flashes the skeleton. */
.skel-screen { animation: skelReveal 1ms linear 120ms both; }
@keyframes skelReveal { from { opacity: 0; } to { opacity: 1; } }
`;

type Variant = "block" | "line" | "circle";

export function Skel({
  variant = "block",
  w,
  h,
  r,
  style,
}: {
  variant?: Variant;
  w?: number | string;
  h?: number | string;
  r?: number;
  style?: CSSProperties;
}) {
  const dims: CSSProperties =
    variant === "circle"
      ? { width: w ?? h ?? 40, height: h ?? w ?? 40, borderRadius: "50%" }
      : variant === "line"
        ? { width: w ?? "100%", height: h ?? 12, borderRadius: r ?? 6 }
        : { width: w ?? "100%", height: h ?? 60, borderRadius: r ?? 12 };
  return (
    <div
      className="skel"
      aria-hidden="true"
      style={{ background: "rgba(255,255,255,0.07)", ...dims, ...style }}
    />
  );
}

export function SkeletonScreen({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{STYLES}</style>
      <DotGridBackground variant="grid" />
      <div
        className="skel-screen"
        aria-hidden="true"
        style={{ position: "relative", zIndex: 1 }}
      >
        {children}
      </div>
    </>
  );
}

// ── Per-tab skeletons ──────────────────────────────────────────────────

/** Home / dashboard: sticky header, hero card, stats row, deal sections. */
export function HomeSkeleton() {
  return (
    <SkeletonScreen>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 18px" }}>
        {/* header row */}
        <div
          style={{
            height: "calc(56px + env(safe-area-inset-top, 0px))",
            paddingTop: "env(safe-area-inset-top, 0px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Skel variant="line" w={96} h={16} />
          <Skel variant="circle" w={30} h={30} />
        </div>
        {/* hero card */}
        <Skel variant="block" h={176} r={20} style={{ marginTop: 6 }} />
        {/* stats row */}
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <Skel variant="block" h={72} r={14} style={{ flex: 1 }} />
          <Skel variant="block" h={72} r={14} style={{ flex: 1 }} />
          <Skel variant="block" h={72} r={14} style={{ flex: 1 }} />
        </div>
        {/* section label + deal cards */}
        <Skel variant="line" w={140} h={10} style={{ marginTop: 26 }} />
        <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
          <Skel variant="block" h={132} r={16} style={{ flex: 1 }} />
          <Skel variant="block" h={132} r={16} style={{ flex: 1 }} />
        </div>
        <Skel variant="line" w={120} h={10} style={{ marginTop: 26 }} />
        <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
          <Skel variant="block" h={132} r={16} style={{ flex: 1 }} />
          <Skel variant="block" h={132} r={16} style={{ flex: 1 }} />
        </div>
      </div>
    </SkeletonScreen>
  );
}

/** Account / Me: header, profile card, upgrade card, settings tiles. */
export function AccountSkeleton() {
  return (
    <SkeletonScreen>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 18px" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Skel variant="circle" w={24} h={24} />
          <Skel variant="line" w={80} h={22} />
        </div>
        {/* profile card */}
        <Skel variant="block" h={92} r={16} style={{ marginTop: 20 }} />
        {/* upgrade card */}
        <Skel variant="block" h={240} r={18} style={{ marginTop: 16 }} />
        {/* settings tiles */}
        {[0, 1, 2, 3].map((i) => (
          <Skel key={i} variant="block" h={56} r={14} style={{ marginTop: 10 }} />
        ))}
      </div>
    </SkeletonScreen>
  );
}

/** Sourcing: header label, best-stop headline, week strip, store cards. */
export function SourcingSkeleton() {
  return (
    <SkeletonScreen>
      <div style={{ padding: "20px 20px 0" }}>
        <Skel variant="line" w={110} h={9} />
        <Skel variant="line" w={200} h={34} style={{ marginTop: 12 }} />
        <Skel variant="line" w={150} h={13} style={{ marginTop: 12 }} />
        {/* week strip */}
        <div style={{ display: "flex", gap: 6, marginTop: 22 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Skel key={i} variant="block" w={46} h={58} r={12} />
          ))}
        </div>
        {/* store cards */}
        {[0, 1].map((i) => (
          <Skel key={i} variant="block" h={96} r={14} style={{ marginTop: 14 }} />
        ))}
      </div>
    </SkeletonScreen>
  );
}
