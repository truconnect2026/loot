"use client";

import { useEffect, useRef, useState } from "react";
import { C } from "../lib/colors.js";
import {
  Eyebrow,
  ExampleTag,
  FadeUp,
  InlineClaim,
  SECTION_HEADLINE_SIZE,
  SECTION_HEADLINE_STYLE,
  SECTION_PADDING,
  SectionShell,
} from "./atoms.jsx";
import { usePrefersReducedMotion } from "../hooks/usePageHooks.jsx";

/**
 * "The math" — a two-pan balance the visitor loads. One bad buy on the
 * left, one month of pro on the right; the beam always tips toward the
 * bad buy because one mistake costs more than the month of the thing
 * that prevents it. Comparison only: no multiplication, no monthly-loss
 * math, no earnings framing. All values illustrative.
 *
 * (Filename is legacy — this replaced the old ROI calculator; keeping
 * the name keeps page.jsx's import untouched.)
 *
 * Interaction: three chips load different bad buys onto the left pan
 * (drop settle + weighted re-tip; heavier hits with more overshoot).
 * Idle attract cycles the chips every 3s after 6s untouched on-screen;
 * any tap cancels it. Attract never runs off-screen, and reduced
 * motion means a static tipped end-state with zero timers (chips still
 * work, switching instantly).
 */

const RED = "#ff6b6b";
const EASE = "cubic-bezier(0.16,1,0.3,1)";
const PRO_PRICE = "$14.99";

const BUYS = [
  { key: "fake", chip: "$40 fake", price: "$40", caption: "the fake you almost bought", tip: -7, curve: EASE },
  { key: "dead", chip: "$60 dead stock", price: "$60", caption: "the dead stock you almost bought", tip: -10, curve: "cubic-bezier(0.25,1.3,0.45,1)" },
  { key: "rep", chip: "$200 rep", price: "$200", caption: "the rep you almost bought", tip: -14, curve: "cubic-bezier(0.25,1.5,0.4,1)" },
];
const DEFAULT_BUY = 2; // $200 rep — consistent with the authenticate demo's "keep your $200"

const STYLES = `
@keyframes tmDrop {
  from { opacity: 0; transform: translateY(-16px) scale(0.9); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.tm-drop { animation: tmDrop var(--motion-medium) var(--ease-spring) both; will-change: transform, opacity; }
.tm-drop-static { animation: none; opacity: 1; transform: none; }
/* Rise pulse — a one-shot mint bloom behind the $14.99 PRO side as it
   settles UP (the light side winning). Opacity+transform only; base
   opacity 0 declared on the element so it rests invisible regardless of
   fill-mode, and it is class-gated on entered && !reduced so a reduced
   user (static tipped still) never sees it. */
@keyframes tmRisePulse {
  0%   { opacity: 0; transform: scale(0.75); }
  45%  { opacity: 0.85; transform: scale(1.15); }
  100% { opacity: 0; transform: scale(1); }
}
.tm-rise-pulse { animation: tmRisePulse 900ms var(--ease-out) 1 both; will-change: transform, opacity; }
`;

/* Local live visibility tracker — same pattern as the other demos. */
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

/* Tiny mint-line silhouettes for the three bad buys. The rep is a mini
   hoodie, echoing the authenticate demo. */
function BuyIcon({ kind }) {
  if (kind === "fake") {
    // generic handbag
    return (
      <svg viewBox="0 0 48 48" width="38" height="38" style={{ display: "block" }}>
        <path d="M10 20 L38 20 L42 42 L6 42 Z" fill="none" stroke={C.mint} strokeWidth="2" strokeLinejoin="round" />
        <path d="M17 20 Q17 8 24 8 Q31 8 31 20" fill="none" stroke={C.mint} strokeWidth="2" />
        <circle cx="24" cy="30" r="3" fill="none" stroke={C.mint} strokeWidth="1.4" opacity="0.7" />
      </svg>
    );
  }
  if (kind === "dead") {
    // shoebox with a stripe
    return (
      <svg viewBox="0 0 48 48" width="38" height="38" style={{ display: "block" }}>
        <rect x="5" y="18" width="38" height="20" rx="2" fill="none" stroke={C.mint} strokeWidth="2" />
        <path d="M5 26 L43 26" stroke={C.mint} strokeWidth="1.2" opacity="0.5" />
        <path d="M9 18 L12 10 L36 10 L39 18" fill="none" stroke={C.mint} strokeWidth="1.6" opacity="0.7" />
      </svg>
    );
  }
  // mini hoodie (rep)
  return (
    <svg viewBox="0 0 48 48" width="38" height="38" style={{ display: "block" }}>
      <path d="M17 12 Q24 5 31 12 L36 15 L34 44 Q24 47 14 44 L12 15 Z" fill="none" stroke={C.mint} strokeWidth="2" strokeLinejoin="round" />
      <path d="M19 14 Q24 8 29 14" fill="none" stroke={C.mint} strokeWidth="1.2" opacity="0.5" />
      <path d="M17 32 L20 40 L28 40 L31 32" fill="none" stroke={C.mint} strokeWidth="1.2" opacity="0.6" />
    </svg>
  );
}

/* One hanger: stem + dish + whatever sits on the dish. Counter-rotated
   against the beam so the pan stays level while riding the beam end. */
function Pan({ counterRotate, curve, reduced, children }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transformOrigin: "top center",
        transform: `rotate(${counterRotate}deg)`,
        // House weighted physics — one spring curve for beam + both pans so
        // they move as ONE object (was per-buy one-off curves that desynced
        // the pans). The overshoot/settle reads as real weight dropping.
        transition: reduced ? "none" : `transform var(--motion-settle) var(--ease-spring)`,
        willChange: "transform",
      }}
    >
      <div style={{ width: 2, height: 22, background: "rgba(92,224,184,0.5)" }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -2 }}>
        {children}
        <svg viewBox="0 0 100 16" width="96" height="16" style={{ display: "block", marginTop: -3 }}>
          <path d="M4 2 Q50 22 96 2" fill="none" stroke={C.mint} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export default function ROICalculator() {
  const reduced = usePrefersReducedMotion();
  const [rootRef, inView] = useLiveInView();
  const [sel, setSel] = useState(DEFAULT_BUY);
  const [attract, setAttract] = useState(false);
  const [lastTouch, setLastTouch] = useState(0);
  // Entrance beat: the beam arrives LEVEL and settles into its tip with
  // the weighted ease as the section lands — the argument happens in
  // front of the visitor instead of being pre-baked. One-shot per entry.
  // Reduced motion never sees this: it arrives already tipped (below,
  // `tip` ignores `entered` when reduced).
  const [entered, setEntered] = useState(false);
  // Beat cooldown + attract cap (shared contract with the other demos):
  // the settle replays at most once per 10s; attract arms at most twice
  // per entry, one full chip pass each.
  const lastSettleAtRef = useRef(0);
  const attractRunsRef = useRef(0);
  const attractSwitchesRef = useRef(0);

  const buy = BUYS[sel];

  useEffect(() => {
    if (!inView) {
      setEntered(false);
      attractRunsRef.current = 0;
      return;
    }
    if (reduced || entered) return;
    if (Date.now() - lastSettleAtRef.current < 10000) {
      setEntered(true); // cooldown: arrive settled, no replay
      return;
    }
    lastSettleAtRef.current = Date.now();
    const t1 = setTimeout(() => setEntered(true), 350);
    // attract's 6s idle clock counts from settle END — no beat→attract stack
    const t2 = setTimeout(() => setLastTouch(Date.now()), 1100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [inView, reduced, entered]);

  /* Idle watcher — arm attract after 6s untouched, on-screen only;
     waits for the entrance settle. */
  useEffect(() => {
    if (reduced || !inView || attract || !entered) return;
    if (attractRunsRef.current >= 2) return; // capped until re-entry
    const t = setTimeout(() => {
      attractRunsRef.current += 1;
      attractSwitchesRef.current = 0;
      setAttract(true);
    }, 6000);
    return () => clearTimeout(t);
  }, [reduced, inView, attract, lastTouch, entered]);

  /* Attract — cycle chips every 3s for ONE full pass (3 switches), then
     rest; fully stops off-screen. */
  useEffect(() => {
    if (!attract || !inView || reduced) return;
    const t = setInterval(() => {
      setSel((s) => (s + 1) % BUYS.length);
      attractSwitchesRef.current += 1;
      if (attractSwitchesRef.current >= BUYS.length) setAttract(false);
    }, 3000);
    return () => clearInterval(t);
  }, [attract, inView, reduced]);

  const pick = (i) => {
    setAttract(false);
    setEntered(true); // interaction owns the beam — never fight the settle
    setLastTouch(Date.now());
    setSel(i);
  };

  // Beam angle; negative = left (bad buy) side down. Reduced motion is
  // pinned to the tipped end-state exactly as before; otherwise the beam
  // holds level until the entrance settle fires.
  const tip = reduced ? buy.tip : entered ? buy.tip : 0;

  return (
    <section
      className="pro-snap-section"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: SECTION_PADDING,
        position: "relative",
        zIndex: 1,
        background: "linear-gradient(180deg, rgba(92,224,184,0.025) 0%, transparent 100%)",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <SectionShell>
        <FadeUp>
          <Eyebrow text="— the math" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              ...SECTION_HEADLINE_STYLE,
              margin: "0 0 24px",
              padding: 0,
              color: "#fff",
            }}
          >
            cheaper than one bad buy.
          </h2>
        </FadeUp>

        <FadeUp delay={0.3}>
          <div ref={rootRef}>
            {/* Chips — load a bad buy onto the left pan */}
            {/* Phase 1.2: the $40/$60/$200 buys are illustrative examples of
                a bad buy, not real or typical losses. */}
            <div style={{ marginBottom: 8 }}>
              <ExampleTag label="EXAMPLE" />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
              {BUYS.map((b, i) => {
                const active = i === sel;
                return (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => pick(i)}
                    style={{
                      ...mono,
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      padding: "7px 12px",
                      borderRadius: 999,
                      cursor: "pointer",
                      // 6g: the selected chip is the bad buy currently on the
                      // scale — the PAIN, not a desirable pick. Fill it
                      // danger-red (matching the red price pill) instead of the
                      // positive mint it wore before (which read as "chosen/good").
                      color: active ? "#fff" : "rgba(255,255,255,0.55)",
                      background: active ? RED : "transparent",
                      border: `1px solid ${active ? RED : "rgba(255,255,255,0.2)"}`,
                      transition: reduced ? "none" : `background 200ms ${EASE}, color 200ms ${EASE}`,
                    }}
                  >
                    {b.chip}
                  </button>
                );
              })}
            </div>

            {/* Balance */}
            <div style={{ position: "relative", height: 216, maxWidth: 420, margin: "0 auto" }}>
              {/* pillar + base (static) */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 0,
                  transform: "translateX(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {/* stem runs from the base all the way up to the beam
                    pivot (beam sits at top: 46 in a 216px-tall wrap) so
                    the balance reads as one connected object. */}
                <div style={{ width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderBottom: `14px solid rgba(92,224,184,0.6)` }} />
                <div style={{ width: 4, height: 146, background: "rgba(92,224,184,0.45)", borderRadius: 2 }} />
                <div style={{ width: 84, height: 3, background: "rgba(92,224,184,0.75)", borderRadius: 2, marginTop: 2 }} />
              </div>

              {/* beam group — rotates around center; pans counter-rotate */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 46,
                  width: "min(100%, 340px)",
                  transform: `translateX(-50%) rotate(${tip}deg)`,
                  transformOrigin: "center top",
                  // Same weighted spring as the pans — the whole balance tips
                  // as one object; the $200 side sinks, the $14.99 side rises,
                  // and the price is watched winning the argument.
                  transition: reduced ? "none" : `transform var(--motion-settle) var(--ease-spring)`,
                  willChange: "transform",
                }}
              >
                {/* beam bar */}
                <div style={{ height: 3, background: C.mint, borderRadius: 2, opacity: 0.85 }} />
                {/* center cap */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: -4,
                    transform: "translateX(-50%)",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: C.mint,
                  }}
                />

                {/* left pan — the bad buy */}
                <div style={{ position: "absolute", left: -14, top: 1, width: 120, display: "flex", justifyContent: "center" }}>
                  <Pan counterRotate={-tip} curve={buy.curve} reduced={reduced}>
                    {/* key remounts on selection so the drop replays */}
                    <div
                      key={buy.key}
                      className={reduced ? "tm-drop-static" : "tm-drop"}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}
                    >
                      <BuyIcon kind={buy.key} />
                      <span
                        style={{
                          ...mono,
                          fontSize: 11,
                          fontWeight: 700,
                          color: RED,
                          border: `1px solid ${RED}`,
                          borderRadius: 999,
                          padding: "1px 8px",
                          background: "rgba(255,107,107,0.08)",
                        }}
                      >
                        {buy.price}
                      </span>
                    </div>
                  </Pan>
                </div>

                {/* right pan — one month of pro */}
                <div style={{ position: "absolute", right: -14, top: 1, width: 120, display: "flex", justifyContent: "center" }}>
                  <Pan counterRotate={-tip} curve={buy.curve} reduced={reduced}>
                    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, paddingBottom: 2 }}>
                      {/* settle bloom behind the price — fires once as the
                          PRO side rises. Base opacity 0 (rests invisible);
                          keyed on `entered` so it replays on re-entry and
                          never runs under reduced motion. */}
                      <div
                        aria-hidden="true"
                        key={entered ? "risen" : "level"}
                        className={entered && !reduced ? "tm-rise-pulse" : ""}
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          width: 88,
                          height: 88,
                          marginLeft: -44,
                          marginTop: -44,
                          borderRadius: "50%",
                          background: "radial-gradient(circle, rgba(92,224,184,0.4) 0%, transparent 68%)",
                          opacity: 0,
                          pointerEvents: "none",
                        }}
                      />
                      <span style={{ position: "relative", fontFamily: "var(--font-bebas), sans-serif", fontSize: 24, lineHeight: 1, letterSpacing: "0.03em", fontVariantNumeric: "tabular-nums", color: C.mint }}>
                        {PRO_PRICE}
                      </span>
                      <span style={{ position: "relative", ...mono, fontSize: 8, letterSpacing: "0.12em", color: "rgba(92,224,184,0.6)" }}>
                        PRO / MO
                      </span>
                    </div>
                  </Pan>
                </div>
              </div>
            </div>

            {/* captions under each pan */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
              <div style={{ ...mono, fontSize: 10, lineHeight: 1.5, letterSpacing: "0.06em", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
                {buy.caption}
              </div>
              <div style={{ ...mono, fontSize: 10, lineHeight: 1.5, letterSpacing: "0.06em", color: "rgba(92,224,184,0.65)", textAlign: "center" }}>
                every scan. every comp. every fake check.
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Phase 1: the GAIN frame beside the loss. The balance above proves
            "cheaper than one bad buy" (loss); this proves "one good flip pays
            the year" (gain). Two directions, one conclusion: the price is a
            rounding error next to a single decision. The $100 flip is a
            conservative, illustrative example (EXAMPLE-tagged) — a modest flip
            covers the full $99.99 annual; not a hype number. Entrance is the
            shared FadeUp (reduced-motion renders the end-state). */}
        <FadeUp delay={0.42}>
          <div
            style={{
              maxWidth: 420,
              margin: "26px auto 0",
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                ...mono,
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(245,197,24,0.8)",
                marginBottom: 8,
              }}
            >
              &uarr; and the other direction
            </div>
            <div
              style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "clamp(26px,7vw,36px)",
                lineHeight: 1.05,
                letterSpacing: "0.02em",
                color: "#fff",
                marginBottom: 12,
              }}
            >
              one good flip pays for the <span style={{ color: C.mint }}>whole year.</span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
              <ExampleTag label="EXAMPLE" />
              <span style={{ ...mono, fontSize: 13, letterSpacing: "0.04em", color: "rgba(255,255,255,0.8)" }}>
                one $100 flip <span style={{ color: C.mint, fontWeight: 700 }}>&rsaquo;</span> $99.99 / year
              </span>
            </div>
          </div>
        </FadeUp>

        {/* Phase 4b: peak-intent CLAIM #2 — right after the loss+gain proof,
            at maximum logical conviction. Routes to the pricing card. */}
        <FadeUp delay={0.5}>
          <InlineClaim label="CLAIM PRO" location="the_math" />
        </FadeUp>
      </SectionShell>
    </section>
  );
}
