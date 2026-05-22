"use client";

import { useMemo } from "react";
import { C } from "../lib/colors.js";

/**
 * Full-page atmosphere — stars, Saturn ring, dust blobs, mint dot grid,
 * film grain. Pure CSS animations driven by keyframes in pro.module.css.
 */
export default function CosmicBackground() {
  const stars = useMemo(() => {
    const out = [];
    for (let i = 0; i < 82; i++) {
      const r = Math.random();
      out.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: 0.5 + Math.random() * 2,
        c: r > 0.88 ? C.gold : r > 0.78 ? C.blue : "#fff",
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
    ],
    [],
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
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

      {/* Saturn ring */}
      <div
        style={{
          position: "absolute",
          inset: 0,
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

      {/* Mint dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(92,224,184,0.45) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.08,
        }}
      />

      {/* Film grain */}
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
