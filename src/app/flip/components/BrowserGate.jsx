"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function browserSupported() {
  if (typeof window === "undefined") return true; // SSR — trust until mount
  if (!("IntersectionObserver" in window)) return false;
  if (!("ResizeObserver" in window)) return false;
  if (!window.CSS?.supports?.("aspect-ratio", "1")) return false;
  if (!("noModule" in HTMLScriptElement.prototype)) return false;
  return true;
}

/**
 * Gates the game on a baseline set of modern browser features. On a true
 * fail we render the fallback screen rather than the game so it doesn't
 * crash or render half-broken.
 */
export default function BrowserGate({ children }) {
  const [ready, setReady] = useState(true);
  const [ok, setOk] = useState(true);

  useEffect(() => {
    setOk(browserSupported());
    setReady(true);
  }, []);

  if (!ready) return null;
  if (ok) return <>{children}</>;

  return (
    <div className="fos-gate">
      <style>{GATE_STYLES}</style>
      <div className="fos-gate-bg" aria-hidden="true" />
      <div className="fos-gate-inner">
        <svg width="120" height="120" viewBox="0 0 160 160" aria-hidden="true">
          <ellipse cx="80" cy="80" rx="70" ry="20" fill="none" stroke="#5CE0B8" strokeWidth="2" transform="rotate(-23 80 80)" />
          <path d="M 50 50 L 44 22 L 66 42 Z" fill="none" stroke="#5CE0B8" strokeWidth="2" />
          <path d="M 110 50 L 116 22 L 94 42 Z" fill="none" stroke="#5CE0B8" strokeWidth="2" />
          <ellipse cx="80" cy="86" rx="38" ry="36" fill="none" stroke="#5CE0B8" strokeWidth="2" />
          <path d="M 60 80 Q 67 76 74 80" stroke="#5CE0B8" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <ellipse cx="98" cy="80" rx="3.5" ry="3" fill="#5CE0B8" />
          <path d="M 64 104 Q 80 112 96 102" fill="none" stroke="#5CE0B8" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <h1 className="fos-gate-head">your browser needs an update</h1>
        <p className="fos-gate-sub">
          loot.works/flip needs Chrome, Safari, Edge, or Firefox from the last 2 years.
        </p>
        <Link href="/app" className="fos-gate-btn">OPEN LOOT.WORKS →</Link>
        <a href="https://browsehappy.com" target="_blank" rel="noopener noreferrer" className="fos-gate-link">
          or update your browser
        </a>
      </div>
    </div>
  );
}

const GATE_STYLES = `
.fos-gate {
  position: relative; min-height: 100dvh;
  display: flex; align-items: center; justify-content: center;
  padding: 32px; color: #fff;
  font-family: 'Outfit', sans-serif;
  background: #000;
}
.fos-gate-bg {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 60% 40% at 70% 70%, rgba(107,70,193,0.25) 0%, transparent 60%),
    radial-gradient(ellipse 100% 100% at 50% 50%, #0a0a14 0%, #000 70%);
}
.fos-gate-inner {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 12px; max-width: 420px;
}
.fos-gate-head {
  font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 28px;
  color: #5CE0B8; margin: 0;
}
.fos-gate-sub {
  font-family: 'Outfit', sans-serif; font-size: 14px;
  color: rgba(255,255,255,0.75); margin: 0;
}
.fos-gate-btn {
  margin-top: 16px;
  display: inline-flex; align-items: center; justify-content: center;
  width: 100%; max-width: 320px; height: 56px;
  background: #5CE0B8; color: #000; text-decoration: none;
  font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 14px;
  letter-spacing: 0.22em;
}
.fos-gate-link {
  font-family: 'Outfit', sans-serif; font-size: 12px;
  color: #5CE0B8; text-decoration: underline; opacity: 0.7;
}
`;
