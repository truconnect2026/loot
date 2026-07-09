"use client";

import { useEffect, useRef, useState } from "react";
import { C } from "../lib/colors.js";
import {
  CheckIcon,
  Eyebrow,
  FadeUp,
  SECTION_BODY_SIZE,
  SECTION_HEADLINE_STYLE,
  SECTION_PADDING,
  SectionShell,
} from "./atoms.jsx";
import { usePrefersReducedMotion } from "../hooks/usePageHooks.jsx";

/**
 * "The whole shelf" — tap-to-price on a thrift-aisle scene: five
 * line-art items standing on ONE continuous shelf rail (two floating
 * rows contradicted the "whole shelf" claim). Slight size variance
 * between items for rhythm; all bottom-aligned on the rail. Tap an item
 * and its detection box draws, its tag pops beneath it, and the running
 * total eases up. Price all five: the total row pulses once, the
 * completion line lands, and a quiet micro-CTA to #pricing fades into a
 * pre-reserved slot (anchor scroll only, zero checkout interaction).
 * The completed shelf HOLDS (no auto-reset) with a "price again" pill;
 * tapping the panel replays. Values illustrative.
 *
 * Attract (the classic full choreography) still arms after 6s idle on a
 * pristine shelf and cancels on tap. A NEW idle-presence loop makes one
 * item at a time take a gentle scale breath; it runs ONLY while idle:
 * paused off-screen (same IntersectionObserver), suspended during
 * attract and from the first tap onward, and never under reduced
 * motion.
 *
 * Reduced motion: full static end-state (boxes, tags, $420, completion
 * line, micro-CTA), zero timers, taps disabled. Items are plain tap
 * targets, so vertical swipes scroll the page normally.
 */

const ATTRACT_PHASES = ["settle", "detect", "value", "total", "hold", "reset"];
const ATTRACT_DURATIONS = { settle: 800, detect: 1800, value: 1600, total: 1200, hold: 1400, reset: 600 };
const EASE = "cubic-bezier(0.16,1,0.3,1)";

const ITEMS = [
  // size: icon px on the shared rail — slight variance for shelf rhythm,
  // all ≥44 so every silhouette stays readable in a ~62px slot.
  { key: "oven", label: "dutch oven", value: 85, size: 52 },
  { key: "vinyl", label: "vinyl record", value: 40, size: 46 },
  { key: "jacket", label: "denim jacket", value: 140, size: 58 },
  { key: "camera", label: "film camera", value: 95, size: 48 },
  { key: "bag", label: "leather bag", value: 60, size: 50 },
];
const SHELF_TOTAL = ITEMS.reduce((sum, i) => sum + i.value, 0); // 420

const STYLES = `
@keyframes ssdBracketPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.ssd-bracket { opacity: 0.5; transition: opacity 0.3s ease; }
.ssd-bracket.ssd-active { animation: ssdBracketPulse 0.6s ease-in-out 3; }
@keyframes ssdTotalPulse {
  0% { transform: scale(1); }
  40% { transform: scale(1.04); }
  100% { transform: scale(1); }
}
.ssd-total-pulse { animation: ssdTotalPulse 500ms cubic-bezier(0.2,1.3,0.4,1) 1; }
@keyframes ssdGlow { 0% { opacity: 0; } 40% { opacity: 1; } 100% { opacity: 0; } }
.ssd-glow-pulse { animation: ssdGlow 700ms ease-out 1; }
/* idle prompt pulse — same 2.2s opacity language as the scan demo's
   "tap to scan"; class-gated on in-view + pristine + motion-ok */
@keyframes ssdTapPulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
.ssd-tap-pulse { animation: ssdTapPulse 2.2s ease-in-out infinite; }
`;

/* Local, continuously-updating visibility tracker — same pattern as the
   other live demos. */
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

/* ONE-SHOT attract runner — unchanged semantics. */
function useAttractRun(active, onDone) {
  const [phase, setPhase] = useState("settle");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let idx = 0;
    let timer = null;
    setPhase("settle");
    const tick = () => {
      if (cancelled) return;
      setPhase(ATTRACT_PHASES[idx]);
      timer = setTimeout(() => {
        idx += 1;
        if (idx >= ATTRACT_PHASES.length) {
          if (!cancelled) onDoneRef.current();
          return;
        }
        tick();
      }, ATTRACT_DURATIONS[ATTRACT_PHASES[idx]]);
    };
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      setPhase("settle");
    };
  }, [active]);
  return active ? phase : "settle";
}

/* Eased running total. `instantFromZero`: the FIRST user tap must land
   on the same frame as its tag — an eased 0→$85 catch-up reads as a
   $0-vs-$85 contradiction in any screenshot. Ease stays for every
   subsequent step (and for the attract choreography, which passes
   false). */
function useEasedNumber(target, reduced, instantFromZero = false) {
  const [value, setValue] = useState(target);
  const shownRef = useRef(target);
  useEffect(() => {
    if (reduced) {
      shownRef.current = target;
      setValue(target);
      return;
    }
    const from = shownRef.current;
    if (from === target) return;
    if (instantFromZero && from === 0 && target > 0) {
      shownRef.current = target;
      setValue(target);
      return;
    }
    let raf;
    let start = null;
    const dur = 600;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (target - from) * eased);
      shownRef.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => raf && cancelAnimationFrame(raf);
  }, [target, reduced]);
  return value;
}

/* Viewfinder corner brackets framing the whole aisle. */
function Bracket({ corner, pulse }) {
  const size = 20;
  const stroke = 2;
  const inset = 10;
  const pos = {
    tl: { top: inset, left: inset, borderTop: `${stroke}px solid ${C.mint}`, borderLeft: `${stroke}px solid ${C.mint}` },
    tr: { top: inset, right: inset, borderTop: `${stroke}px solid ${C.mint}`, borderRight: `${stroke}px solid ${C.mint}` },
    bl: { bottom: inset, left: inset, borderBottom: `${stroke}px solid ${C.mint}`, borderLeft: `${stroke}px solid ${C.mint}` },
    br: { bottom: inset, right: inset, borderBottom: `${stroke}px solid ${C.mint}`, borderRight: `${stroke}px solid ${C.mint}` },
  }[corner];
  return (
    <div
      aria-hidden="true"
      className={`ssd-bracket${pulse ? " ssd-active" : ""}`}
      style={{ position: "absolute", width: size, height: size, ...pos }}
    />
  );
}

/* ── Item silhouettes ─────────────────────────────────────────────────
   One consistent style, matched to the authenticate demo's hoodie: 2.2
   line weight, mint strokes, selective rgba-mint fills, one micro-
   detail each. 60×60 viewBoxes; each reads at 60px. */
const FILL = "rgba(92,224,184,0.12)";

function OvenIcon() {
  // dutch oven — micro-detail: lid knob + side handles
  return (
    <svg viewBox="0 0 60 60" width="100%" height="100%" style={{ display: "block" }}>
      <path d="M12 26 L48 26 L46 50 Q30 54 14 50 Z" fill={FILL} stroke={C.mint} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M12 26 Q30 21 48 26" fill="none" stroke={C.mint} strokeWidth="2.2" />
      <path d="M15 23 Q30 17 45 23" fill="none" stroke={C.mint} strokeWidth="2" />
      <rect x="27" y="12" width="6" height="4" rx="2" fill="none" stroke={C.mint} strokeWidth="2" />
      <path d="M30 16 L30 19" stroke={C.mint} strokeWidth="1.4" />
      <path d="M8 30 L12 30 M48 30 L52 30" stroke={C.mint} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function VinylIcon() {
  // vinyl record beside its sleeve edge — micro-detail: groove ring +
  // label dot. No overlap, so no dark occlusion fill breaking the
  // shared line-art language.
  return (
    <svg viewBox="0 0 60 60" width="100%" height="100%" style={{ display: "block" }}>
      <rect x="6" y="12" width="10" height="40" rx="2" fill={FILL} stroke={C.mint} strokeWidth="2.2" />
      <path d="M9 18 L13 18" stroke={C.mint} strokeWidth="1.2" opacity="0.5" />
      <circle cx="37" cy="32" r="17" fill="none" stroke={C.mint} strokeWidth="2.2" />
      <circle cx="37" cy="32" r="11" fill="none" stroke={C.mint} strokeWidth="0.9" opacity="0.45" />
      <circle cx="37" cy="32" r="5" fill={FILL} stroke={C.mint} strokeWidth="1.4" />
      <circle cx="37" cy="32" r="1.2" fill={C.mint} />
    </svg>
  );
}

function JacketIcon() {
  // denim jacket on a hanger — micro-detail: chest pocket stitches
  return (
    <svg viewBox="0 0 60 60" width="100%" height="100%" style={{ display: "block" }}>
      <path d="M30 4 Q34 4 34 8 Q34 10 31 11 L30 14" fill="none" stroke={C.mint} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M30 14 L14 22 L10 34 L16 36 L18 30 L18 52 L42 52 L42 30 L44 36 L50 34 L46 22 Z" fill={FILL} stroke={C.mint} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M30 14 L30 52" stroke={C.mint} strokeWidth="1.2" opacity="0.5" />
      <rect x="22" y="30" width="6" height="6" rx="1" fill="none" stroke={C.mint} strokeWidth="1.2" opacity="0.7" />
      <rect x="33" y="30" width="6" height="6" rx="1" fill="none" stroke={C.mint} strokeWidth="1.2" opacity="0.7" />
    </svg>
  );
}

function CameraIcon() {
  // film camera — micro-detail: concentric lens rings + advance knob
  return (
    <svg viewBox="0 0 60 60" width="100%" height="100%" style={{ display: "block" }}>
      <rect x="8" y="20" width="44" height="28" rx="4" fill={FILL} stroke={C.mint} strokeWidth="2.2" />
      <rect x="22" y="13" width="14" height="7" rx="2" fill="none" stroke={C.mint} strokeWidth="2" />
      <circle cx="30" cy="34" r="11" fill="none" stroke={C.mint} strokeWidth="2.2" />
      <circle cx="30" cy="34" r="7" fill="none" stroke={C.mint} strokeWidth="1.2" opacity="0.6" />
      <circle cx="30" cy="34" r="3.5" fill="none" stroke={C.mint} strokeWidth="1.2" />
      <rect x="44" y="15" width="5" height="5" rx="1" fill="none" stroke={C.mint} strokeWidth="1.6" />
      <circle cx="14" cy="26" r="1.6" fill={C.mint} />
    </svg>
  );
}

function BagIcon() {
  // leather bag — micro-detail: flap buckle + long strap
  return (
    <svg viewBox="0 0 60 60" width="100%" height="100%" style={{ display: "block" }}>
      <path d="M14 10 Q30 2 46 10" fill="none" stroke={C.mint} strokeWidth="1.8" />
      <path d="M12 26 L48 26 L46 52 L14 52 Z" fill={FILL} stroke={C.mint} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M12 26 L48 26 L46 38 L14 38 Z" fill="none" stroke={C.mint} strokeWidth="2" />
      <rect x="27" y="34" width="6" height="7" rx="1" fill="none" stroke={C.mint} strokeWidth="1.6" />
      <circle cx="30" cy="38" r="1" fill={C.mint} />
    </svg>
  );
}

function ItemIcon({ itemKey }) {
  if (itemKey === "oven") return <OvenIcon />;
  if (itemKey === "vinyl") return <VinylIcon />;
  if (itemKey === "jacket") return <JacketIcon />;
  if (itemKey === "camera") return <CameraIcon />;
  return <BagIcon />;
}

/* One tappable item standing on the shared rail: size-varied icon,
   bottom-aligned, detection box hugging the icon itself, tag slot
   beneath the rail. Breath = gentle idle scale on the icon only.
   No per-item rail — the continuous shelf line is drawn once by the
   parent across all five. */
function ShelfItem({ item, delayBase, boxOn, tagOn, breathing, reduced, onTap }) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`price the ${item.label}`}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        margin: 0,
        cursor: reduced ? "default" : "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: "1 1 0",
        maxWidth: 68,
        minWidth: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 64,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: item.size,
            height: item.size,
            transform: breathing ? "scale(1.02)" : "scale(1)",
            transition: reduced ? "none" : `transform 900ms ${EASE}`,
            willChange: "transform",
          }}
        >
          <ItemIcon itemKey={item.key} />
          {/* detection box hugs the icon, not the slot */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: 10,
              border: `1.5px solid ${C.mint}`,
              opacity: boxOn ? 1 : 0,
              transform: boxOn ? "scale(1)" : "scale(0.82)",
              transition: reduced ? "none" : `opacity 360ms ${EASE} ${delayBase}ms, transform 360ms ${EASE} ${delayBase}ms`,
              willChange: "transform, opacity",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: C.mint,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: boxOn ? 1 : 0,
                transform: boxOn ? "scale(1)" : "scale(0.4)",
                transition: reduced ? "none" : `opacity 300ms ${EASE} ${delayBase + 150}ms, transform 300ms ${EASE} ${delayBase + 150}ms`,
              }}
            >
              <CheckIcon size={9} color="#070510" />
            </div>
          </div>
        </div>
      </div>
      {/* tag slot — height reserved so a popping tag never shifts the row;
          sits just below the shared rail like a hanging price sticker */}
      <div style={{ height: 26, marginTop: 2, display: "flex", alignItems: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontWeight: 700,
            fontSize: "clamp(10px,2.8vw,13px)",
            fontVariantNumeric: "tabular-nums",
            color: "#070510",
            background: C.mint,
            borderRadius: 999,
            padding: "3px 8px",
            opacity: tagOn ? 1 : 0,
            transform: tagOn ? "translateY(0) scale(1)" : "translateY(-6px) scale(0.85)",
            transition: reduced ? "none" : `opacity 320ms ${EASE} ${delayBase}ms, transform 320ms ${EASE} ${delayBase}ms`,
            whiteSpace: "nowrap",
          }}
        >
          ${item.value}
        </div>
      </div>
    </button>
  );
}

export default function ShelfScannerDemo() {
  const reduced = usePrefersReducedMotion();
  const [rootRef, inView] = useLiveInView();

  const [tapped, setTapped] = useState(() => new Set());
  const [attract, setAttract] = useState(false);
  const [fading, setFading] = useState(false);
  const [lastTouch, setLastTouch] = useState(0);
  const [breathIdx, setBreathIdx] = useState(-1);
  // Reduced motion: static end-state by default; panel tap toggles the
  // static pristine shelf back in — zero timers, zero motion (matches
  // the scan demo's static-toggle pattern).
  const [reducedShown, setReducedShown] = useState(true);
  // Entrance beat: on arrival the FIRST item's box+tag draw and release —
  // a taste of the mechanic while the swipe is still settling. Does NOT
  // mark the item tapped (totals/attract read `tapped`, which stays
  // pristine). One-shot per entry; re-arms after the section leaves view.
  const [entryBeat, setEntryBeat] = useState(false);
  const beatDoneRef = useRef(false);
  // >=10s cooldown between entrance-beat fires: snap scrolling crosses
  // section boundaries constantly, and a beat on EVERY re-entry reads
  // twitchy. One beat per entry, and only if 10s have passed.
  const lastBeatAtRef = useRef(0);
  // Attract frequency cap: max 2 runs per section entry, then the demo
  // rests until the section is exited and re-entered. Endless 6s
  // re-fires read as glitching, not inviting.
  const attractRunsRef = useRef(0);

  const attractActive = attract && inView && !reduced;
  const phase = useAttractRun(attractActive, () => {
    setAttract(false);
    setLastTouch(Date.now());
  });

  useEffect(() => {
    if (!inView) {
      beatDoneRef.current = false;
      attractRunsRef.current = 0;
      return;
    }
    if (reduced || beatDoneRef.current || attract || tapped.size > 0) return;
    beatDoneRef.current = true;
    if (Date.now() - lastBeatAtRef.current < 10000) return; // cooldown
    lastBeatAtRef.current = Date.now();
    const t1 = setTimeout(() => setEntryBeat(true), 350);
    const t2 = setTimeout(() => {
      setEntryBeat(false);
      // attract's 6s idle clock starts counting from beat END, so the
      // beat can never stack into an immediately-following attract run
      setLastTouch(Date.now());
    }, 1650);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      setEntryBeat(false);
    };
  }, [inView, reduced, attract, tapped]);

  /* Idle attract — pristine shelf only (unchanged semantics); paused
     while the entrance beat plays. */
  useEffect(() => {
    if (reduced || !inView || attract || tapped.size > 0 || entryBeat) return;
    if (attractRunsRef.current >= 2) return; // capped until re-entry
    const t = setTimeout(() => {
      attractRunsRef.current += 1;
      setAttract(true);
    }, 6000);
    return () => clearTimeout(t);
  }, [reduced, inView, attract, tapped, lastTouch, entryBeat]);

  /* Idle PRESENCE breath — one item at a time, rotating. Runs only while
     truly idle: on-screen, not reduced, not attracting, zero taps.
     Interaction state owns the stage the moment any of those flips. */
  useEffect(() => {
    if (reduced || !inView || attract || tapped.size > 0 || fading || entryBeat) {
      setBreathIdx(-1);
      return;
    }
    const t = setInterval(() => setBreathIdx((i) => (i + 1) % ITEMS.length), 2000);
    return () => clearInterval(t);
  }, [reduced, inView, attract, tapped, fading, entryBeat]);

  /* Replay — ONE source of truth for clearing the shelf (the old 4.2s
     auto-reset is gone: the completed shelf HOLDS, same "you did it"
     payoff contract as the scan demo, until the visitor taps the panel
     to run it again). */
  const resetShelf = () => {
    if (fading) return; // debounce: ignore taps during the fade
    setFading(true);
    setTimeout(() => {
      setTapped(new Set());
      setFading(false);
      setLastTouch(Date.now());
    }, 400);
  };

  const tapItem = (key) => {
    if (reduced || fading) return;
    setAttract(false);
    setLastTouch(Date.now());
    setTapped((prev) => {
      if (prev.has(key)) return prev; // re-tap = no-op
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const goPricing = () => {
    // Anchor only — scrollIntoView resolves against the nearest scroll
    // container (.pro-scroll-main), same call the hero CTA already uses.
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  const attractBoxes = attractActive && (phase === "detect" || phase === "value" || phase === "total" || phase === "hold");
  const attractTags = attractActive && (phase === "value" || phase === "total" || phase === "hold");
  const attractTotal = attractActive && (phase === "total" || phase === "hold");
  const sceneShown = reduced || (!fading && !(attractActive && phase === "reset"));

  const staticComplete = reduced && reducedShown;
  const complete = staticComplete || tapped.size === ITEMS.length;
  const userComplete = complete && !attractActive;
  const promptShown = reduced ? !reducedShown : !attractActive && tapped.size === 0;
  const scanningShown = attractActive && (phase === "settle" || phase === "detect" || phase === "value");
  const totalShown = staticComplete || attractTotal || (!attractActive && tapped.size > 0);

  const userSum = ITEMS.reduce((s, it) => s + (tapped.has(it.key) ? it.value : 0), 0);
  const totalTarget = reduced ? (reducedShown ? SHELF_TOTAL : 0) : attractActive ? (attractTotal ? SHELF_TOTAL : 0) : userSum;
  const totalValue = useEasedNumber(totalTarget, reduced, !attractActive);

  const rowState = (item, i) => ({
    boxOn: attractActive ? attractBoxes : staticComplete || tapped.has(item.key) || (entryBeat && i === 0),
    tagOn: attractActive ? attractTags : staticComplete || tapped.has(item.key) || (entryBeat && i === 0),
    delayBase: attractActive ? i * 350 : 0,
    breathing: breathIdx === i,
  });

  return (
    <section className="pro-snap-section" style={{ padding: SECTION_PADDING, position: "relative", zIndex: 1 }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <SectionShell maxWidth={720}>
        <FadeUp>
          <Eyebrow text="— the whole shelf" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              ...SECTION_HEADLINE_STYLE,
              margin: "0 0 20px",
              padding: 0,
              color: "#fff",
            }}
          >
            value the whole shelf. at once.
          </h2>
        </FadeUp>

        <FadeUp delay={0.3}>
          <p
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: SECTION_BODY_SIZE,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.65)",
              margin: 0,
            }}
          >
            point at a shelf and loot values every item in seconds. no scanning one by one.
          </p>
        </FadeUp>

        <FadeUp delay={0.45}>
          {/* Aisle panel — height derives purely from its content (one
              shelf row + prompt + total block), never stretched by the
              section. */}
          <div
            ref={rootRef}
            onClick={() => {
              // Whole-panel replay target (items bubble up): a completed
              // shelf re-runs on tap; reduced motion toggles statically.
              if (reduced) {
                setReducedShown((v) => !v);
                return;
              }
              if (userComplete && !fading) resetShelf();
            }}
            style={{
              position: "relative",
              marginTop: 28,
              cursor: "pointer",
              borderRadius: 20,
              border: "1px solid rgba(92,224,184,0.25)",
              background: "rgba(255,255,255,0.02)",
              boxShadow: "0 20px 60px rgba(92,224,184,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
              padding: "22px 14px 14px",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            {/* Replay affordance — same pill language as the scan demo.
                The TAP TARGET is the whole panel; this is just the cue. */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 10,
                right: 38,
                zIndex: 4,
                fontFamily: "var(--font-mono), monospace",
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: C.mint,
                border: "1px solid rgba(92,224,184,0.4)",
                borderRadius: 999,
                padding: "4px 9px",
                background: "rgba(7,5,16,0.6)",
                opacity: (reduced ? reducedShown : userComplete && !fading) ? 1 : 0,
                transition: reduced ? "none" : `opacity 300ms ${EASE} 250ms`,
                pointerEvents: "none",
              }}
            >
              {reduced ? "tap to reset" : "↻ price again"}
            </div>
            <Bracket corner="tl" pulse={attractActive && phase === "detect"} />
            <Bracket corner="tr" pulse={attractActive && phase === "detect"} />
            <Bracket corner="bl" pulse={attractActive && phase === "detect"} />
            <Bracket corner="br" pulse={attractActive && phase === "detect"} />

            <div
              style={{
                opacity: sceneShown ? 1 : 0,
                transform: sceneShown ? "translateY(0)" : "translateY(8px)",
                transition: reduced ? "none" : `opacity 500ms ${EASE}, transform 500ms ${EASE}`,
                willChange: "opacity, transform",
              }}
            >
              {/* ONE continuous shelf — all five items on a single rail.
                  The rail is drawn once, absolutely, at the icon-zone
                  baseline (64px), so it runs unbroken beneath every item. */}
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "center", gap: 2 }}>
                  {ITEMS.map((item, i) => (
                    <ShelfItem key={item.key} item={item} {...rowState(item, i)} reduced={reduced} onTap={() => tapItem(item.key)} />
                  ))}
                </div>
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 2,
                    right: 2,
                    top: 64,
                    height: 2,
                    background: "rgba(92,224,184,0.28)",
                    borderRadius: 1,
                    pointerEvents: "none",
                  }}
                />
              </div>

              {/* prompt / scanning row, directly under the aisle */}
              <div style={{ position: "relative", marginTop: 10, height: 18, textAlign: "center" }}>
                <div
                  className={promptShown && inView && !reduced ? "ssd-tap-pulse" : ""}
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: promptShown ? 1 : 0,
                    transition: reduced ? "none" : `opacity 300ms ${EASE}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(92,224,184,0.55)",
                    pointerEvents: "none",
                  }}
                >
                  tap an item to price it
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: scanningShown ? 1 : 0,
                    transition: reduced ? "none" : `opacity 300ms ${EASE}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(92,224,184,0.55)",
                    pointerEvents: "none",
                  }}
                >
                  scanning shelf…
                </div>
              </div>

              {/* total block — heights pre-reserved for the completion
                  line AND micro-CTA, so nothing shifts when they land */}
              <div style={{ marginTop: 8, minHeight: 96, textAlign: "center", position: "relative" }}>
                <div
                  className={userComplete && !reduced ? "ssd-total-pulse" : ""}
                  style={{
                    // 0.35, not 0: at rest the total block reads as a quiet
                    // composed "shelf value $0" instead of leaving the lower
                    // half of the stage an empty reserved void (composition
                    // gate). First tap brightens it to full.
                    opacity: totalShown ? 1 : 0.35,
                    transform: totalShown ? "translateY(0)" : "translateY(12px)",
                    transition: reduced ? "none" : `opacity 380ms ${EASE}, transform 380ms ${EASE}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    willChange: "opacity, transform",
                    position: "relative",
                  }}
                >
                  {/* one-shot mint glow behind the total on completion */}
                  <div
                    aria-hidden="true"
                    className={userComplete && !reduced ? "ssd-glow-pulse" : ""}
                    style={{
                      position: "absolute",
                      top: -6,
                      left: "50%",
                      marginLeft: -70,
                      width: 140,
                      height: 64,
                      borderRadius: "50%",
                      background: "radial-gradient(ellipse at center, rgba(92,224,184,0.35) 0%, transparent 70%)",
                      opacity: 0,
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 10,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.4)",
                      marginBottom: 2,
                    }}
                  >
                    shelf value
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-bebas), sans-serif",
                      fontSize: "clamp(28px,6vw,40px)",
                      lineHeight: 1,
                      letterSpacing: "0.02em",
                      color: C.mint,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    ${totalValue}
                  </div>
                </div>
                {/* completion line — reserved slot */}
                <div
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    color: "rgba(92,224,184,0.6)",
                    marginTop: 4,
                    height: 14,
                    opacity: userComplete ? 1 : 0,
                    transform: userComplete ? "translateY(0)" : "translateY(6px)",
                    transition: reduced ? "none" : `opacity 340ms ${EASE} 250ms, transform 340ms ${EASE} 250ms`,
                  }}
                >
                  the whole shelf. one walkthrough.
                </div>
                {/* micro-CTA — reserved slot, anchor only */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goPricing();
                  }}
                  tabIndex={userComplete ? 0 : -1}
                  aria-hidden={!userComplete}
                  style={{
                    background: "none",
                    border: "none",
                    marginTop: 4,
                    height: 20,
                    padding: 0,
                    cursor: userComplete ? "pointer" : "default",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    color: C.mint,
                    opacity: userComplete ? 1 : 0,
                    transform: userComplete ? "translateY(0)" : "translateY(6px)",
                    transition: reduced ? "none" : `opacity 340ms ${EASE} 550ms, transform 340ms ${EASE} 550ms`,
                    pointerEvents: userComplete ? "auto" : "none",
                  }}
                >
                  priced in seconds. every aisle, every day &rarr;
                </button>
              </div>
            </div>
          </div>
        </FadeUp>
      </SectionShell>
    </section>
  );
}
