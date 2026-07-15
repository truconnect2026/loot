"use client";

import { useEffect, useMemo, useRef } from "react";
import { C } from "../lib/colors.js";
import { usePrefersReducedMotion } from "../hooks/usePageHooks.jsx";

/**
 * Full-page atmosphere — stars, Saturn ring, dust blobs, mint dot grid,
 * film grain. Pure CSS animations driven by keyframes in pro.module.css.
 *
 * PARALLAX DRIFT: everything except the film grain sits in one drift
 * wrapper that translates up a fraction of the scroller's scrollTop
 * (rAF-throttled, direct style write — zero React re-renders, transform
 * only = compositor-only). The field reads as a distant sky: content
 * moves a full viewport per snap, the sky moves ~4% of that. Drift is
 * clamped so the field never runs out of overscan; everything revealed
 * by the drift (extension stars, extra dust, ring/grid bleed) is
 * pre-rendered below the fold and clipped at rest by the outer
 * overflow:hidden box — so the RESTING composition is identical to the
 * pre-parallax page. Reduced motion: the listener is never attached and
 * the transform stays neutral — the same still, composed starscape.
 */

// Sky moves this fraction of the content's scroll distance…
const DRIFT_FACTOR = 0.04;
// …clamped to this fraction of one viewport so the pre-rendered
// overscan band (~45% deep) always covers what the drift reveals.
const DRIFT_MAX_VH = 0.42;

export default function CosmicBackground() {
  const driftRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  // Quiet star-field, STRATIFIED: pure-random placement clumps (Poisson),
  // which left whole viewport regions star-dead — the grid/math/gutpunch
  // stretches read as near-black voids next to the hero. One jittered
  // star per 6×5 grid cell keeps it quiet everywhere but present
  // everywhere. Same sizes, alphas, and twinkle — no new animation.
  const stars = useMemo(() => {
    const out = [];
    const COLS = 6;
    const ROWS = 5;
    for (let i = 0; i < COLS * ROWS; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const r = Math.random();
      out.push({
        x: ((col + 0.15 + Math.random() * 0.7) / COLS) * 100,
        y: ((row + 0.15 + Math.random() * 0.7) / ROWS) * 100,
        s: 0.4 + Math.random() * 1.2,
        c: r > 0.88 ? "rgba(245,197,24,0.55)" : r > 0.78 ? "rgba(59,130,246,0.55)" : "rgba(255,255,255,0.6)",
        d: Math.random() * 6,
        dur: 2.5 + Math.random() * 5,
      });
    }
    // +5 extra mid-band stars (y 33-67%): the math/difference stretches
    // read a shade sparser than hero/closer, which carry their own
    // decorative rings — this evens the perceived per-viewport count.
    for (let i = 0; i < 5; i++) {
      out.push({
        x: ((i + 0.2 + Math.random() * 0.6) / 5) * 100,
        y: 33 + Math.random() * 34,
        s: 0.4 + Math.random() * 1.2,
        c: "rgba(255,255,255,0.6)",
        d: Math.random() * 6,
        dur: 2.5 + Math.random() * 5,
      });
    }
    // Extension band (y 102–140%): pre-rendered BELOW the fold, clipped at
    // rest, revealed as the parallax drifts the field up — so the bottom
    // of the screen never goes star-dead mid-scroll. Same recipe as above.
    for (let i = 0; i < 12; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      out.push({
        x: ((col + 0.15 + Math.random() * 0.7) / COLS) * 100,
        y: 102 + ((row + 0.15 + Math.random() * 0.7) / 2) * 38,
        s: 0.4 + Math.random() * 1.2,
        c: "rgba(255,255,255,0.6)",
        d: Math.random() * 6,
        dur: 2.5 + Math.random() * 5,
      });
    }
    return out;
  }, []);

  const dust = useMemo(
    () => [
      { x: 15, y: 25, sz: 260, c: C.mint, o: 0.045, d: 0 },
      { x: 72, y: 12, sz: 300, c: C.purple, o: 0.05, d: 4 },
      { x: 38, y: 55, sz: 220, c: C.mint, o: 0.035, d: 8 },
      { x: 82, y: 68, sz: 280, c: C.purple, o: 0.045, d: 12 },
      { x: 8, y: 78, sz: 200, c: C.mint, o: 0.03, d: 16 },
      // Below-fold blob — drifts into the frame as the sky rises, so the
      // deep sections keep their soft glow. Invisible at rest (clipped).
      { x: 55, y: 112, sz: 260, c: C.purple, o: 0.04, d: 20 },
    ],
    [],
  );

  // Scroll-linked drift. Listens to .pro-scroll-main (the page's owned
  // scroll container — html/body never scroll here), throttled to one
  // transform write per frame. Under reduced motion nothing attaches:
  // the field holds its resting composition, a designed still.
  useEffect(() => {
    const el = driftRef.current;
    if (!el) return;
    if (reduced) {
      el.style.transform = "none";
      return;
    }
    const scroller = document.querySelector(".pro-scroll-main");
    if (!scroller) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const drift = Math.min(
        scroller.scrollTop * DRIFT_FACTOR,
        scroller.clientHeight * DRIFT_MAX_VH,
      );
      el.style.transform = `translate3d(0, ${-drift.toFixed(1)}px, 0)`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    scroller.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    apply();
    return () => {
      scroller.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      {/* Drift wrapper — the one shared sky every section inherits. */}
      <div ref={driftRef} style={{ position: "absolute", inset: 0, willChange: "transform" }}>
        {/* Stars */}
        {stars.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.s,
              height: s.s,
              borderRadius: "50%",
              backgroundColor: s.c,
              animation: `twinkle ${s.dur}s ease-in-out ${s.d}s infinite`,
            }}
          />
        ))}

        {/* Saturn ring — clip box extended symmetrically (top AND bottom)
            so the ring's resting center is unchanged, but arcs keep
            rendering into the overscan band the drift reveals instead of
            cutting off at the old viewport-edge clip. */}
        <div
          style={{
            position: "absolute",
            inset: "-45% 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "160vmax",
              height: "160vmax",
              flexShrink: 0,
              opacity: 0.28,
              animation: "saturnRotate 240s linear infinite",
            }}
          >
            <svg viewBox="0 0 800 800" fill="none" style={{ width: "100%", height: "100%" }} aria-hidden="true">
              <ellipse cx="400" cy="400" rx="380" ry="110" stroke={C.mint} strokeWidth="0.6" opacity="0.5" />
              <ellipse cx="400" cy="400" rx="340" ry="95" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" opacity="0.35" />
              <ellipse cx="400" cy="400" rx="300" ry="80" stroke={C.purple} strokeWidth="0.4" opacity="0.25" />
              <ellipse cx="400" cy="400" rx="260" ry="65" stroke={C.gold} strokeWidth="0.3" opacity="0.15" />
            </svg>
          </div>
        </div>

        {/* Drifting dust blobs */}
        {dust.map((d, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: d.sz,
              height: d.sz,
              borderRadius: "50%",
              background: d.c,
              filter: `blur(${d.sz * 0.55}px)`,
              opacity: d.o,
              animation: `dustDrift ${22 + i * 4}s ease-in-out ${d.d}s infinite`,
            }}
          />
        ))}

        {/* Mint dot grid — wider spacing, lower opacity than before so it
            reads as quiet texture, not a dense grid competing with text.
            Extended below the fold so the tiled texture rides the drift
            seamlessly (tiles anchor top-left; the extension is pure bleed). */}
        <div
          style={{
            position: "absolute",
            inset: "0 0 -45%",
            backgroundImage: "radial-gradient(circle, rgba(92,224,184,0.4) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            opacity: 0.035,
          }}
        />
      </div>

      {/* Film grain — full-bleed and OUTSIDE the drift wrapper: it already
          animates its own transform, and grain is texture, not scenery. */}
      <div
        style={{
          position: "absolute",
          inset: "-50%",
          width: "200%",
          height: "200%",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.04,
          animation: "grain 8s steps(10) infinite",
        }}
      />
    </div>
  );
}
