"use client";

import { useEffect, useRef, useState } from "react";
import type { ScanTriggerMode } from "@/lib/scan-trigger";

/**
 * FAB MODE LAUNCHER — a radial quarter-fan of the four scanner modes
 * (BARCODE · ITEM · SHELF · CRATE) that unfolds from the camera FAB.
 * Pure UI: selection is reported to TabBar, which fires the canonical
 * scan trigger (src/lib/scan-trigger.ts) — this component never wires
 * into the overlays itself.
 *
 * Renders inside .tb-nav BEFORE the pill: the fixed scrim escapes to
 * the viewport (nav has no transform), the pill paints above the scrim
 * so the instrument stays crisp while page content dims, and the chips
 * never geometrically overlap the pill (lowest chip bottom sits ~5px
 * above the pill's top edge).
 *
 * Motion: chips spring OUT of the FAB's center to their fan positions
 * (--motion-fast each with a tuned overshoot, 30ms stagger), retract
 * together in --motion-fast on close. transform/opacity only. Reduced
 * motion: scrim + chips appear/disappear instantly at final positions,
 * fully functional.
 *
 * The labels mirror ScanOverlay's own mode toggle (BARCODE · ITEM ·
 * SHELF · CRATE) so the launcher teaches the destination.
 */

// True circular fan: all four chips share one radius (106px about the
// FAB center) at mirrored angles — outer pair ±65°, inner pair ±25°.
// (The prior offsets put the outer pair on r≈112 and the inner on
// r≈106, so the arc read lopsided.) tx = R·sinθ, ty = −R·cosθ.
const MODES: {
  mode: ScanTriggerMode;
  label: string;
  tx: number;
  ty: number;
  icon: React.ReactNode;
}[] = [
  {
    mode: "barcode",
    label: "BARCODE",
    tx: -96, // −65°
    ty: -45,
    icon: (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
        <path d="M3 5v-2h4" /><path d="M17 3h4v2" /><path d="M21 19v2h-4" /><path d="M7 21H3v-2" />
        <line x1={7} y1={8} x2={7} y2={16} /><line x1={10} y1={8} x2={10} y2={16} />
        <line x1={13} y1={8} x2={13} y2={16} strokeWidth={2.2} /><line x1={17} y1={8} x2={17} y2={16} />
      </svg>
    ),
  },
  {
    mode: "vision",
    label: "ITEM",
    tx: -45, // −25°
    ty: -96,
    icon: (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
        <circle cx={12} cy={13} r={4} />
      </svg>
    ),
  },
  {
    mode: "shelf",
    label: "SHELF",
    tx: 45, // +25°
    ty: -96,
    icon: (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <line x1={3} y1={9} x2={21} y2={9} /><line x1={3} y1={17} x2={21} y2={17} />
        <rect x={6} y={4.5} width={4} height={4.5} /><rect x={13} y={5.5} width={3} height={3.5} />
        <rect x={8} y={13} width={3.5} height={4} /><rect x={15} y={12.5} width={4} height={4.5} />
      </svg>
    ),
  },
  {
    mode: "crate",
    label: "CRATE",
    tx: 96, // +65°
    ty: -45,
    icon: (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9l8-4 8 4v10l-8 4-8-4z" /><path d="M4 9l8 4 8-4" /><path d="M12 13v10" />
      </svg>
    ),
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: ScanTriggerMode) => void;
}

const prefersReduced = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

export default function ScanModeLauncher({ open, onClose, onSelect }: Props) {
  // Lifecycle: visible persists through the 150ms retract so the close
  // animation can play; reduced motion skips straight to unmount.
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchY = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setVisible(true);
      return;
    }
    if (!visible) return;
    if (prefersReduced()) {
      setVisible(false);
      return;
    }
    setClosing(true);
    // 190ms ≥ the 180ms (--motion-fast) retract so the collapse plays to
    // completion before unmount — the prior 160ms clipped the last frames
    // and the chips blinked out just before fully retracting.
    const t = window.setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 190);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Focus the first chip on open; Escape / back dismisses.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => chipRefs.current[0]?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPop = () => onClose();
    document.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
  }, [open, onClose]);

  if (!visible) return null;

  // Focus trap: Tab cycles the four chips while open.
  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const idx = chipRefs.current.findIndex((el) => el === document.activeElement);
    const next = e.shiftKey
      ? (idx - 1 + MODES.length) % MODES.length
      : (idx + 1) % MODES.length;
    chipRefs.current[next]?.focus();
  };

  // Swipe down anywhere on the launcher = dismiss.
  const onTouchStart = (e: React.TouchEvent) => {
    touchY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchY.current !== null && e.touches[0].clientY - touchY.current > 24) {
      touchY.current = null;
      onClose();
    }
  };

  return (
    <div
      id="scan-mode-launcher"
      className={closing ? "sml sml--closing" : "sml"}
      onKeyDown={trapTab}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      <style>{STYLES}</style>
      <div className="sml-scrim" onClick={onClose} aria-hidden="true" />
      <div className="sml-anchor" role="menu" aria-label="Scanner modes">
        {MODES.map(({ mode, label, tx, ty, icon }, i) => (
          <button
            key={mode}
            ref={(el) => {
              chipRefs.current[i] = el;
            }}
            type="button"
            role="menuitem"
            className="sml-chip"
            style={
              {
                "--tx": `${tx}px`,
                "--ty": `${ty}px`,
                "--d": `${i * 30}ms`,
              } as React.CSSProperties
            }
            onClick={() => onSelect(mode)}
            aria-label={`Scan ${label.toLowerCase()}`}
          >
            <span className="sml-in">
              {icon}
              <span className="sml-lbl">{label}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

const STYLES = `
.sml-scrim {
  position: fixed; inset: 0;
  background: rgba(4, 3, 10, 0.55);
  pointer-events: auto;
  animation: smlFade var(--motion-fast) var(--ease-out) both;
}
.sml--closing .sml-scrim { animation: smlFadeOut var(--motion-fast) var(--ease-in) both; }
@keyframes smlFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes smlFadeOut { from { opacity: 1; } to { opacity: 0; } }

/* Anchor = the FAB's center: nav top == pill top, FAB center sits 18px
   below it (54px circle, 9px overhang). Chips fan out from here. */
.sml-anchor {
  position: absolute; left: 50%; top: 18px;
  width: 0; height: 0; pointer-events: none;
}
.sml-chip {
  position: absolute; left: -31px; top: -29px;
  width: 62px; height: 58px;
  padding: 0; border: none; background: none; cursor: pointer;
  pointer-events: auto;
  -webkit-tap-highlight-color: transparent;
  transform: translate(var(--tx), var(--ty));
  /* Tuned overshoot on the fan-out (--ease-spring): a radial FAB burst is
     the idiomatic place for a tasteful pop-and-settle, and it's ONE shared
     spring curve (same family as the tab dot / verdict pill), so it reads
     premium without clashing. Exit stays clean (--ease-in, no overshoot). */
  animation: smlSpring var(--motion-fast) var(--ease-spring) both;
  animation-delay: var(--d);
}
.sml--closing .sml-chip {
  animation: smlRetract var(--motion-fast) var(--ease-in) both;
  animation-delay: 0ms;
}
@keyframes smlSpring {
  from { transform: translate(0, 0) scale(0.3); opacity: 0; }
  to { transform: translate(var(--tx), var(--ty)) scale(1); opacity: 1; }
}
@keyframes smlRetract {
  from { transform: translate(var(--tx), var(--ty)) scale(1); opacity: 1; }
  to { transform: translate(0, 0) scale(0.35); opacity: 0; }
}
/* Visual card is the inner span so press feedback never fights the
   fan animation's transform fill. Same Liquid Glass recipe as the pill. */
.sml-in {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 4px;
  width: 100%; height: 100%;
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(7, 5, 16, 0) 0%, rgba(7, 5, 16, 0.30) 45%, rgba(7, 5, 16, 0.42) 100%),
    rgba(7, 5, 16, 0.82);
  -webkit-backdrop-filter: blur(13px) saturate(150%);
  backdrop-filter: blur(13px) saturate(150%);
  border: 1px solid rgba(92, 224, 184, 0.28);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(92, 224, 184, 0.10);
  color: #5CE0B8;
  transition: transform 110ms ease, background-color 110ms ease, border-color 110ms ease;
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .sml-in { background: rgba(7, 5, 16, 0.97); }
}
.sml-chip:active .sml-in {
  transform: scale(0.92);
  background-color: rgba(92, 224, 184, 0.18);
  border-color: rgba(92, 224, 184, 0.65);
}
.sml-chip:focus-visible .sml-in { border-color: rgba(92, 224, 184, 0.8); }
.sml-chip:focus { outline: none; }
.sml-lbl {
  font-family: var(--font-label), monospace;
  font-size: 8px; font-weight: 700; letter-spacing: 0.10em;
  color: rgba(255, 255, 255, 0.78);
}
@media (prefers-reduced-motion: reduce) {
  /* Instant in/out, zero fan: chips sit at their final positions
     (the base transform) and stay fully functional. */
  .sml-scrim, .sml-chip { animation: none !important; }
  .sml-in { transition: none; }
  .sml-chip:active .sml-in { transform: none; }
}
`;
