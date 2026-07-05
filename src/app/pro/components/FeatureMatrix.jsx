"use client";

import { useEffect, useRef, useState } from "react";
import { C } from "../lib/colors.js";
import {
  Eyebrow,
  FadeUp,
  SECTION_BODY_SIZE,
  SECTION_HEADLINE_SIZE,
  SECTION_PADDING,
  SectionShell,
} from "./atoms.jsx";
import { usePrefersReducedMotion } from "../hooks/usePageHooks.jsx";

/**
 * Feature proof grid — replaces the old spec-sheet table. Each card is a
 * tiny self-evident visual of a real, shipped feature working (micro
 * verdict card, SOLD comp rows, fake-check marks, shelf tags, haul
 * pipeline, crate flip), not an icon next to a label. All values
 * illustrative.
 *
 * FREE tier honesty: free is the daily FLIP OR SKIP game only — zero
 * scans (FREE_SCAN_LIMIT = 0 in src/lib/limits.ts; non-Pro hits to
 * /api/scan and /api/shelf-scan 403). The copy under the headline says
 * exactly that, and every card in the grid is Pro. Gold appears ONLY as
 * the Pro marker.
 *
 * Motion: one shared ticker rotates a single "beat" across the six
 * cards (one card accents at a time, ~1.1s each), so the grid feels
 * alive but never busy. Transform/opacity only; the ticker is gated on
 * in-view + reduced-motion, so off-screen and reduced-motion mean zero
 * timers and static complete end-states.
 */

const RED = "#ff6b6b";
const EASE = "cubic-bezier(0.16,1,0.3,1)";
const POP = "cubic-bezier(0.2,1.3,0.4,1)";
const TICK_MS = 1100;
const CARD_COUNT = 6;

const GRID_STYLES = `
.fpg-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
@media (min-width: 768px) { .fpg-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; } }
`;

/* Local live visibility tracker — same pattern as the demo sections. */
function useLiveInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.15,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

const mono = { fontFamily: "var(--font-mono), monospace" };

function Card({ label, copy, children }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(92,224,184,0.15)",
        borderRadius: 14,
        padding: "14px 12px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minWidth: 0,
      }}
    >
      <div
        style={{
          height: 96,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      <div>
        <div
          style={{
            ...mono,
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.mint,
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "var(--font-manrope), sans-serif",
            fontSize: 12,
            lineHeight: 1.45,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          {copy}
        </div>
      </div>
    </div>
  );
}

/* 1 — micro verdict card: shrunken echo of the hero. Beat: pill pop. */
function VerdictMicro({ beat, reduced }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: 13, color: "#fff", letterSpacing: "0.03em" }}>
        PYREX BUTTERPRINT 403
      </div>
      <div
        style={{
          ...mono,
          display: "inline-block",
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: "#070510",
          background: C.mint,
          borderRadius: 999,
          padding: "2px 8px",
          margin: "5px 0",
          transform: beat ? "scale(1.12)" : "scale(1)",
          transition: reduced ? "none" : `transform 300ms ${POP}`,
        }}
      >
        EXCELLENT
      </div>
      <div style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: 22, lineHeight: 1, color: C.mint }}>
        $75&ndash;$95
      </div>
    </div>
  );
}

/* 2 — sold comps: rows labeled SOLD, not listed. Beat: top tag pops. */
function CompsMicro({ beat, reduced }) {
  const rows = [
    ["$85", "3d ago"],
    ["$78", "1w ago"],
    ["$92", "2w ago"],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%", maxWidth: 130 }}>
      {rows.map(([price, when], i) => (
        <div key={when} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <span
            style={{
              ...mono,
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: C.mint,
              border: `1px solid ${C.mint}`,
              borderRadius: 3,
              padding: "1px 4px",
              transform: beat && i === 0 ? "scale(1.18)" : "scale(1)",
              transition: reduced ? "none" : `transform 300ms ${POP}`,
              display: "inline-block",
            }}
          >
            SOLD
          </span>
          <span style={{ ...mono, fontSize: 11, color: "rgba(255,255,255,0.75)" }}>{price}</span>
          <span style={{ ...mono, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{when}</span>
        </div>
      ))}
    </div>
  );
}

/* 3 — fake check: ✓ ✓ ✗ echo of the authenticate demo. Beat: ✗ lands. */
function FakeCheckMicro({ beat, reduced }) {
  const rows = [
    { label: "stitch density", pass: true },
    { label: "tag print", pass: true },
    { label: "label font", pass: false },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ ...mono, fontSize: 11, color: r.pass ? "rgba(255,255,255,0.7)" : RED }}>{r.label}</span>
          <span
            style={{
              ...mono,
              fontWeight: 700,
              fontSize: 12,
              lineHeight: 1,
              color: r.pass ? C.mint : RED,
              display: "inline-block",
              transform: !r.pass && beat ? "scale(1.35)" : "scale(1)",
              transition: reduced ? "none" : `transform 300ms ${POP}`,
            }}
          >
            {r.pass ? "✓" : "✗"}
          </span>
        </div>
      ))}
    </div>
  );
}

/* 4 — shelf scan: three tiny silhouettes with value tags. Beat: middle
   tag pops. Echo of ShelfScannerDemo. */
function ShelfMicro({ beat, reduced }) {
  const items = [
    {
      tag: "$85",
      svg: (
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M4 10 L5.5 18 Q12 20 18.5 18 L20 10 Z" fill="none" stroke={C.mint} strokeWidth="1.6" />
          <ellipse cx="12" cy="10" rx="8" ry="2" fill="none" stroke={C.mint} strokeWidth="1.4" />
        </svg>
      ),
    },
    {
      tag: "$40",
      svg: (
        <svg viewBox="0 0 24 24" width="22" height="22">
          <circle cx="12" cy="12" r="9" fill="none" stroke={C.mint} strokeWidth="1.6" />
          <circle cx="12" cy="12" r="3" fill="rgba(92,224,184,0.2)" stroke={C.mint} strokeWidth="1" />
        </svg>
      ),
    },
    {
      tag: "$95",
      svg: (
        <svg viewBox="0 0 24 24" width="22" height="22">
          <rect x="3" y="8" width="18" height="12" rx="2" fill="none" stroke={C.mint} strokeWidth="1.6" />
          <circle cx="12" cy="14" r="4" fill="none" stroke={C.mint} strokeWidth="1.4" />
          <rect x="8" y="5" width="6" height="3" fill="none" stroke={C.mint} strokeWidth="1.2" />
        </svg>
      ),
    },
  ];
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
      {items.map((it, i) => (
        <div key={it.tag} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          {it.svg}
          <span
            style={{
              ...mono,
              fontSize: 9,
              fontWeight: 700,
              color: "#070510",
              background: C.mint,
              borderRadius: 999,
              padding: "1px 6px",
              display: "inline-block",
              transform: beat && i === 1 ? "scale(1.18)" : "scale(1)",
              transition: reduced ? "none" : `transform 300ms ${POP}`,
            }}
          >
            {it.tag}
          </span>
        </div>
      ))}
    </div>
  );
}

/* 5 — haul tracking: SAVED→BOUGHT→LISTED→SOLD pipeline; the active
   stage advances one step each time this card's beat comes around. */
function HaulMicro({ stage, reduced }) {
  const stages = ["SAVED", "BOUGHT", "LISTED", "SOLD"];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      {/* Wraps to 2×2 inside narrow 2-col cards at 375px — the chips
          must never clip at the card edge. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 4,
          rowGap: 5,
          maxWidth: "100%",
        }}
      >
        {stages.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                ...mono,
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "3px 5px",
                borderRadius: 4,
                color: i === stage ? "#070510" : "rgba(255,255,255,0.45)",
                background: i === stage ? C.mint : "rgba(255,255,255,0.05)",
                transform: i === stage ? "translateY(-1px)" : "translateY(0)",
                transition: reduced ? "none" : `transform 300ms ${EASE}, opacity 300ms ${EASE}`,
              }}
            >
              {s}
            </span>
            {i < stages.length - 1 && (
              <span style={{ ...mono, fontSize: 8, color: "rgba(255,255,255,0.25)" }}>&rsaquo;</span>
            )}
          </div>
        ))}
      </div>
      <div style={{ ...mono, fontSize: 10, color: "rgba(255,255,255,0.55)" }}>
        pyrex 403 &middot; +$71 net
      </div>
    </div>
  );
}

/* 6 — crate mode: record crate; the front sleeve flips forward on beat. */
function CrateMicro({ beat, reduced }) {
  return (
    <div style={{ position: "relative", width: 84, height: 62 }}>
      {/* crate box */}
      <div
        style={{
          position: "absolute",
          inset: "18px 0 0 0",
          border: `1.6px solid ${C.mint}`,
          borderRadius: 4,
          opacity: 0.8,
        }}
      />
      {/* record sleeves */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: 6,
            left: 10 + i * 17,
            width: 13,
            height: 44,
            borderRadius: 2,
            border: `1.4px solid ${C.mint}`,
            background: i === 0 ? "rgba(92,224,184,0.12)" : "rgba(255,255,255,0.03)",
            transformOrigin: "bottom center",
            transform: i === 0 && beat ? "rotate(-14deg) translateY(-3px)" : "rotate(0deg) translateY(0)",
            transition: reduced ? "none" : `transform 340ms ${POP}`,
            opacity: 1 - i * 0.16,
          }}
        />
      ))}
    </div>
  );
}

export default function FeatureMatrix() {
  const reduced = usePrefersReducedMotion();
  const [rootRef, inView] = useLiveInView();
  const [tick, setTick] = useState(0);

  // Shared ticker — one interval for the whole grid; cleared the moment
  // the section leaves the viewport or under reduced motion.
  useEffect(() => {
    if (reduced || !inView) return;
    const t = setInterval(() => setTick((x) => x + 1), TICK_MS);
    return () => clearInterval(t);
  }, [reduced, inView]);

  // One card beats at a time, rotating. Off-screen everything rests.
  const beatIdx = inView && !reduced ? tick % CARD_COUNT : -1;
  // Haul pipeline stage advances once per rotation, exactly on its beat
  // (card index 4): count how many times slot 4 has come around.
  const haulStage = (tick >= 4 ? Math.floor((tick - 4) / CARD_COUNT) + 1 : 0) % 4;

  return (
    <section
      className="pro-snap-section"
      style={{
        padding: SECTION_PADDING,
        position: "relative",
        zIndex: 1,
        // Grid exceeds one viewport on small screens — top-align + scroll
        // internally, same treatment as Pricing/FAQ.
        justifyContent: "flex-start",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: GRID_STYLES }} />
      <SectionShell maxWidth={900}>
        <FadeUp>
          <Eyebrow text="the whole arsenal" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: SECTION_HEADLINE_SIZE,
              lineHeight: 1.3,
              paddingBottom: "0.35em",
              marginBottom: 12,
            }}
          >
            FREE VS <span style={{ color: C.gold }}>PRO.</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.25}>
          {/* Free-tier honesty line — free is the game, nothing else. */}
          <p
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: SECTION_BODY_SIZE,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.65)",
              margin: "0 0 24px",
            }}
          >
            free is the daily flip or skip game. zero scans. everything below is{" "}
            <span
              style={{
                ...mono,
                fontSize: "0.72em",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: C.gold,
                border: `1px solid ${C.gold}`,
                borderRadius: 4,
                padding: "2px 6px",
                verticalAlign: "middle",
                whiteSpace: "nowrap",
              }}
            >
              PRO
            </span>
            .
          </p>
        </FadeUp>

        <FadeUp delay={0.35}>
          <div ref={rootRef} className="fpg-grid">
            <Card label="scan verdict" copy="point at it. get the number.">
              <VerdictMicro beat={beatIdx === 0} reduced={reduced} />
            </Card>
            <Card label="sold comps" copy="real sold prices, not asking prices.">
              <CompsMicro beat={beatIdx === 1} reduced={reduced} />
            </Card>
            <Card label="fake check" copy="catch reps before they cost you.">
              <FakeCheckMicro beat={beatIdx === 2} reduced={reduced} />
            </Card>
            <Card label="shelf scan" copy="every item on the shelf, one pass.">
              <ShelfMicro beat={beatIdx === 3} reduced={reduced} />
            </Card>
            <Card label="haul tracking" copy="follow every flip from save to sold.">
              <HaulMicro stage={haulStage} reduced={reduced} />
            </Card>
            <Card label="crate mode" copy="price a crate without pulling every record.">
              <CrateMicro beat={beatIdx === 5} reduced={reduced} />
            </Card>
          </div>
        </FadeUp>
      </SectionShell>
    </section>
  );
}
