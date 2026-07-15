"use client";

import { usePathname, useRouter } from "next/navigation";
import { useScanTrigger } from "@/lib/scan-trigger";
import ScanModeLauncher from "@/components/nav/ScanModeLauncher";
import { useState, useEffect } from "react";

// Routes where the tab bar is rendered.
const TABBED_ROUTES = ["/app", "/sourcing", "/tools", "/account"];

// One real badge signal: a BUY result was recorded and the haul log
// hasn't been opened yet. Set by app/page.tsx handleScanResult;
// cleared by app/haul/page.tsx on mount. Reads localStorage so the
// value survives navigation without global state.
function useScanBadge(): boolean {
  const [has, setHas] = useState(false);
  useEffect(() => {
    const check = () =>
      setHas(localStorage.getItem("loot_haul_pending") === "1");
    check();
    window.addEventListener("storage", check);
    window.addEventListener("focus", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("focus", check);
    };
  }, []);
  return has;
}

// Mirrors the OS reduced-motion setting; gates shrink-on-scroll entirely
// (the pill stays full size under reduced motion).
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduced(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

// ── Shrink-on-scroll ───────────────────────────────────────────────────────
// Minimal scroll-direction tracker: PASSIVE window listener (tabbed pages
// scroll the document), rAF-batched — state is only touched inside the
// animation frame, never raw per scroll event. Hysteresis so it can't
// flicker: shrink after 8px cumulative downward travel, expand after 5px
// upward, direction changes reset the accumulator, and the pill is ALWAYS
// expanded within 40px of the top.
function useShrinkOnScroll(enabled: boolean): boolean {
  const [shrunk, setShrunk] = useState(false);
  useEffect(() => {
    if (!enabled) {
      setShrunk(false);
      return;
    }
    let lastY = window.scrollY;
    let acc = 0;
    let raf = 0;
    let ticking = false;
    const apply = () => {
      ticking = false;
      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;
      if (y < 40) {
        acc = 0;
        setShrunk(false);
        return;
      }
      if ((delta > 0 && acc < 0) || (delta < 0 && acc > 0)) acc = 0;
      acc += delta;
      if (acc > 8) {
        setShrunk(true);
        acc = 0;
      } else if (acc < -5) {
        setShrunk(false);
        acc = 0;
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        raf = requestAnimationFrame(apply);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);
  return shrunk;
}

// ── Tab icons (20px stroke) ────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={12} r={10} />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx={12} cy={7} r={4} />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#070510" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx={12} cy={13} r={4} />
    </svg>
  );
}

// ── Tab config ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "home",     label: "Home",     route: "/app"      },
  { id: "sourcing", label: "Sourcing", route: "/sourcing" },
  { id: "scan",     label: "SCAN",     route: null        },
  { id: "tools",    label: "Tools",    route: "/tools"    },
  { id: "account",  label: "Me",       route: "/account"  },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── TabBarMount ────────────────────────────────────────────────────────────
// Placed in root layout; renders nothing outside the tabbed routes.

export function TabBarMount() {
  const pathname = usePathname();
  const show = TABBED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );
  if (!show) return null;
  return <TabBar />;
}

// ── TabBar ─────────────────────────────────────────────────────────────────
// Floating Liquid-Glass pill. It floats ABOVE the home indicator on a
// bottom offset of env(safe-area-inset-bottom) + 8px (viewport-fit=cover
// in app/layout.tsx makes env() resolve — do not remove either half).
// Because the pill has margins on all sides and page content scrolls
// behind and around it, there is NO edge-to-edge surface over the
// safe-area strip — the translucent-bar-reads-as-a-hole failure mode
// (357b3e1) cannot occur by construction.
//
// FAB clip safety: the glass div deliberately has NO overflow:hidden —
// the rounded surface is just background + radius, so nothing creates a
// clipping context and the FAB overhangs the pill's top edge freely.

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const hasBuyBadge = useScanBadge();
  const reduced = usePrefersReducedMotion();
  const shrunk = useShrinkOnScroll(!reduced);
  // FAB fires through the canonical trigger (src/lib/scan-trigger.ts) —
  // NEVER through a URL param. On /app it fires the dashboard handler
  // directly; elsewhere it stashes the mode and navigates. ringKey
  // re-keys the one-shot quick-draw pulse per tap.
  const triggerScan = useScanTrigger();
  const [ringKey, setRingKey] = useState(0);
  // FAB is now a two-stage quick-draw: first tap unfolds the mode
  // launcher, mode tap fires the trigger. Route changes close it.
  const [launcherOpen, setLauncherOpen] = useState(false);
  useEffect(() => {
    setLauncherOpen(false);
  }, [pathname]);

  function activeId(): TabId | null {
    for (const tab of TABS) {
      if (!tab.route) continue;
      if (pathname === tab.route || pathname.startsWith(tab.route + "/")) {
        return tab.id as TabId;
      }
    }
    return null;
  }
  const active = activeId();

  return (
    <nav
      role="navigation"
      aria-label="App navigation"
      className={`tb-nav${shrunk ? " tb-shrunk" : ""}`}
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
        // Z CONTRACT: the pill is persistent chrome at 50. Bottom
        // sheets (shared/BottomSheet.tsx) stack ABOVE it at 60/61 —
        // iOS-standard: the nav dims behind the sheet scrim, and no
        // sheet CTA ever lands behind the pill. Keep this below 60.
        zIndex: 50,
        // The wrapper spans the margins too — keep it transparent to
        // input; the pill re-enables pointer events for itself.
        pointerEvents: "none",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
.tb-nav { --tb-dur: 260ms; --tb-ease: cubic-bezier(0.22, 1, 0.36, 1); }
.tb-pill {
  pointer-events: auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border-radius: 32px;
  /* Liquid glass, alpha 0.82 + a soft inner scrim (transparent at the
     specular top edge, darkening through the glyph band) so icons and
     labels keep contrast even over bright mint content — the glass read
     survives at the top, the legibility lives where the glyphs sit.
     Blur stays at the house 13px. */
  background:
    linear-gradient(180deg, rgba(7, 5, 16, 0) 0%, rgba(7, 5, 16, 0.30) 45%, rgba(7, 5, 16, 0.42) 100%),
    rgba(7, 5, 16, 0.82);
  -webkit-backdrop-filter: blur(13px) saturate(150%);
  backdrop-filter: blur(13px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 1px 0 rgba(92, 224, 184, 0.10), 0 8px 24px rgba(0, 0, 0, 0.38);
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .tb-pill { background: rgba(7, 5, 16, 0.97); }
}
.tb-btn {
  -webkit-tap-highlight-color: transparent;
  /* CONSTANT box in both states: the outer pill footprint never moves
     (clearance pages depend on it), min-height never animates (it was
     the clunk — a layout animation fighting a mismatched transform),
     and the tap target is 52px in BOTH states. */
  min-height: 52px;
  padding: 9px 0 6px;
  transition: color var(--tb-dur) var(--tb-ease), transform var(--tb-dur) var(--tb-ease);
}
/* Press feedback (was missing) — a compositor-only scale on tap. transform
   does NOT affect the 52px layout box, so the nav footprint / clearance
   contract is untouched. Gated to no-preference so reduced-motion gets NO
   scale (the immediate active-color/nav change signals the press instead). */
@media (prefers-reduced-motion: no-preference) {
  .tb-btn:active { transform: scale(0.96); }
}
/* Shrink = compositor-only: icon + label scale down on ONE duration and
   ONE easing. No layout properties animate, so it's a single glide. */
.tb-ico { display: flex; transition: transform var(--tb-dur) var(--tb-ease); }
.tb-lbl { display: block; transition: transform var(--tb-dur) var(--tb-ease); }
.tb-btn[aria-current="page"] .tb-ico { transform: translateY(-1px); }
.tb-shrunk .tb-ico { transform: scale(0.92); }
.tb-shrunk .tb-btn[aria-current="page"] .tb-ico { transform: translateY(-1px) scale(0.92); }
.tb-shrunk .tb-lbl { transform: scale(0.92); }
.tb-dot {
  position: absolute; bottom: 2px; left: 50%; margin-left: -2px;
  width: 4px; height: 4px; border-radius: 50%; background: #5CE0B8;
  opacity: 0; transform: scale(0.4);
  transition: opacity 160ms ease, transform 160ms cubic-bezier(0.2,1.3,0.4,1);
}
.tb-btn[aria-current="page"] .tb-dot { opacity: 1; transform: scale(1); }
.tb-fab { transition: transform 120ms ease, filter 120ms ease; }
.tb-fab:active { transform: scale(0.94); filter: brightness(0.94); }
/* One-shot quick-draw ring: a fresh keyed span per tap, 240ms out and
   done — transform/opacity only, forwards keeps it invisible after. */
.tb-fab-ring {
  position: absolute; inset: -3px; border-radius: 50%;
  border: 2px solid rgba(92, 224, 184, 0.85);
  pointer-events: none;
  animation: tbRing 240ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@keyframes tbRing {
  from { transform: scale(1); opacity: 0.9; }
  to { transform: scale(1.6); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .tb-btn, .tb-ico, .tb-lbl, .tb-dot, .tb-fab, .tb-pill { transition: none !important; }
  .tb-fab-ring { display: none; }
  .tb-shrunk .tb-ico, .tb-shrunk .tb-lbl { transform: none; }
}
`,
        }}
      />
      <ScanModeLauncher
        open={launcherOpen}
        onClose={() => setLauncherOpen(false)}
        onSelect={(mode) => {
          setLauncherOpen(false);
          triggerScan(mode);
        }}
      />
      <div className="tb-pill">
        {TABS.map((tab) => {
          // ── Center SCAN button — elevated circular mint ──────────────
          if (tab.id === "scan") {
            return (
              <div
                key="scan"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: 6,
                  paddingBottom: 6,
                }}
              >
                <button
                  className="tb-fab"
                  onClick={() => {
                    // Quick-draw: fire immediately (no delay — the ring
                    // plays over the transition, it never blocks it).
                    if (!launcherOpen && !reduced) setRingKey((k) => k + 1);
                    setLauncherOpen((o) => !o);
                  }}
                  aria-label="Scan"
                  aria-expanded={launcherOpen}
                  aria-controls="scan-mode-launcher"
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: "50%",
                    // Same gradient language as the app's primary CTAs; the
                    // bg-colored ring lifts it crisply off page content, and
                    // the tight+soft dual glow reads charged, not blown out.
                    background: "linear-gradient(180deg, #6FE5C0 0%, #4FD1A5 100%)",
                    border: "3px solid #070510",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow:
                      "0 2px 8px rgba(92,224,184,0.35), 0 8px 26px rgba(92,224,184,0.22), inset 0 1px 0 rgba(255,255,255,0.25)",
                    marginTop: -18,
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  {hasBuyBadge && (
                    <span
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#E8636B",
                        border: "2px solid #070510",
                      }}
                    />
                  )}
                  {ringKey > 0 && (
                    <span key={ringKey} className="tb-fab-ring" aria-hidden="true" />
                  )}
                  <span style={{ display: "flex", marginTop: -1 }}>
                    <CameraIcon />
                  </span>
                </button>
              </div>
            );
          }

          // ── Standard tab button ─────────────────────────────────────
          const isActive = active === tab.id;
          // Inactive is a calm, legible muted violet; active is
          // unmistakable mint.
          const color = isActive ? "#5CE0B8" : "#756D8C";

          return (
            <button
              key={tab.id}
              className="tb-btn"
              onClick={() => tab.route && router.push(tab.route)}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                background: "none",
                border: "none",
                cursor: "pointer",
                touchAction: "manipulation",
                color,
              }}
            >
              <span className="tb-ico">
                {tab.id === "home"     && <HomeIcon />}
                {tab.id === "sourcing" && <CompassIcon />}
                {tab.id === "tools"    && <WrenchIcon />}
                {tab.id === "account"  && <UserIcon />}
              </span>
              <span
                className="tb-lbl"
                style={{
                  fontFamily: "var(--font-space-mono, monospace)",
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                {tab.label}
              </span>
              <span className="tb-dot" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
