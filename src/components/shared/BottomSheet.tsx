"use client";

import { useEffect, useRef, useCallback, type ReactNode } from "react";

/**
 * Slide-up panel with backdrop blur, drag handle, swipe-to-dismiss.
 * Spring animation via cubic-bezier(0.32, 0.72, 0, 1) — the iOS drawer curve.
 *
 * ── Z CONTRACT ──────────────────────────────────────────────────
 * Sheets stack ABOVE the floating tab pill (TabBar zIndex: 50):
 * backdrop 60, panel 61. Standard iOS sheet behavior — the nav is
 * persistent chrome that dims behind the scrim while a sheet is up;
 * no sheet content, CTA, or tappable row may ever sit behind the
 * pill. The panel extends to the true screen bottom and owns
 * env(safe-area-inset-bottom) clearance for flow content; sticky
 * footers inside sheets (FlipCoach input bar, ShelfScan action bar)
 * carry their OWN env() padding because sticky bottom:0 pins to the
 * scrollport edge, past this panel padding, while mid-scroll.
 */

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  borderColor: string;
  children: ReactNode;
  /**
   * When this value changes, the sheet's scroll container is reset to
   * scrollTop = 0. Use it to bring fresh content into view — e.g.
   * shelf-scan results landing into the sheet when the user is still
   * scrolled to the bottom of an old empty state. The value itself is
   * opaque (number / string / boolean); only its identity matters.
   */
  scrollResetKey?: unknown;
  /**
   * Minimum visible height for the content wrapper. Defaults to
   * `auto` (the sheet hugs its content). Sheets with sparse idle
   * content — a header + a single input + lots of empty space —
   * pass a viewport height (e.g. "45vh") so the body sits centered
   * on screen instead of clinging to the bottom edge.
   */
  minHeight?: string;
  /**
   * Drag-handle background color. Defaults to rgba(255,255,255,0.15),
   * the standard quiet-pill treatment used by every sheet in the app.
   * Override for character-led sheets that want to tie the handle
   * into their identity color — e.g. mint for Flip Coach.
   */
  handleColor?: string;
  /**
   * Drag-handle width in px. Defaults to 36, the standard size.
   * Pair with handleColor for sheets that lean into the handle as
   * a brand accent rather than a quiet affordance.
   */
  handleWidth?: number;
}

export default function BottomSheet({
  open,
  onClose,
  borderColor,
  children,
  scrollResetKey,
  minHeight,
  handleColor = "rgba(255,255,255,0.15)",
  handleWidth = 36,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);
  // Flick physics — velocity sampled per move event (px/ms) so a
  // fast downward throw dismisses before the distance threshold,
  // the way a physically tossed sheet would keep going.
  const lastY = useRef(0);
  const lastT = useRef(0);
  const velocity = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    currentTranslateY.current = 0;
    isDragging.current = true;
    lastY.current = e.touches[0].clientY;
    lastT.current = performance.now();
    velocity.current = 0;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const y = e.touches[0].clientY;
    const deltaY = y - touchStartY.current;
    const now = performance.now();
    const dt = now - lastT.current;
    if (dt > 0) velocity.current = (y - lastY.current) / dt;
    lastY.current = y;
    lastT.current = now;
    // Only allow dragging down
    currentTranslateY.current = Math.max(0, deltaY);
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${currentTranslateY.current}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (sheetRef.current) {
      sheetRef.current.style.transition =
        "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)";
    }
    // Dismiss on distance OR on a committed flick (fast downward
    // release past a small dead zone) — momentum closes a thrown
    // sheet even when the finger hasn't crossed 100px yet.
    if (
      currentTranslateY.current > 100 ||
      (currentTranslateY.current > 24 && velocity.current > 0.5)
    ) {
      // Hand off to onClose; the open-sync useEffect below picks up
      // the false transition and pins the inline transform to
      // translateY(100%) so the closed-state cascade can't fall
      // back to translateY(0) (the visible position).
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "translateY(0)";
    }
    currentTranslateY.current = 0;
  }, [onClose]);

  // Sync inline transform + transition to whichever terminal state
  // the open prop demands, so the inline value never disagrees with
  // the bsSlideUp/bsSlideDown keyframe's `to` value. Eliminates the
  // cascade collision where inline said translateY(0) but the
  // animation said translateY(100%) — under any re-render that
  // perturbed the cascade, the inline would briefly win and the
  // sheet's header strip would surface above viewport bottom as a
  // persistent visible stub.
  //
  //   open=true  → translateY(0)    + transition: transform 320ms
  //                (transition lets the drag snap-back ease smoothly
  //                 back to 0 after a sub-threshold pulldown)
  //   open=false → translateY(100%) + transition: none
  //                (no smoothing on close — the bsSlideDown keyframe
  //                 owns the visible motion; the inline just locks
  //                 the post-animation terminal state)
  useEffect(() => {
    if (!sheetRef.current) return;
    if (open) {
      sheetRef.current.style.transform = "translateY(0)";
      sheetRef.current.style.transition =
        "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)";
    } else {
      sheetRef.current.style.transform = "translateY(100%)";
      sheetRef.current.style.transition = "none";
    }
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Scroll-reset hook — when consumers bump scrollResetKey, snap the
  // panel's scroll to the top so freshly-rendered content is visible
  // without the user having to scroll up manually. Skipped while the
  // sheet is closed (no point) and on the very first render (the
  // initial position is already 0).
  useEffect(() => {
    if (!open) return;
    if (sheetRef.current) sheetRef.current.scrollTop = 0;
  }, [open, scrollResetKey]);

  return (
    <>
      <style>{`
        @keyframes bsBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        /* Panel materializes as it rises: a subtle opacity floor (0.6→1)
           on the same curve as the slide + scrim, so the glass solidifies
           into place with weight rather than sliding in flat. Opacity (not
           scale) because the drag handler owns the panel's inline transform
           — a scale keyframe would fight it. Only the open keyframe carries
           opacity; drag + close leave the panel fully opaque. */
        @keyframes bsSlideUp {
          from { transform: translateY(100%); opacity: 0.6; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes bsBackdropOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes bsSlideDown {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
        /* Sheet content fade-in — body fades in 150ms after the sheet
           starts opening, so the slide-up reveal feels like a physical
           panel arriving with its content. The header and drag handle
           render immediately (outside this animation). */
        @keyframes bsContentFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        /* Desktop layout — at ≥768px the sheet caps at 540px wide and
           centers horizontally with auto margins, instead of stretching
           edge-to-edge. Corners tighten from 24px (full-width feel) to
           16px (card feel). The auto margins work alongside the
           position: fixed + left:0/right:0 base because max-width caps
           how wide the box grows before the auto margins distribute the
           remainder evenly — no transform conflict with the slide-up
           animation. */
        @media (min-width: 768px) {
          .loot-bottom-sheet-panel {
            max-width: 540px;
            margin-left: auto;
            margin-right: auto;
            border-top-left-radius: 16px !important;
            border-top-right-radius: 16px !important;
          }
        }
        /* Reduced motion — instant swaps. The keyframes keep their
           forwards fill so terminal states (open/closed positions,
           backdrop opacity) still land; only the travel disappears. */
        @media (prefers-reduced-motion: reduce) {
          .loot-bottom-sheet-backdrop,
          .loot-bottom-sheet-panel,
          .loot-bottom-sheet-body {
            animation-duration: 0.01ms !important;
            animation-delay: 0ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Backdrop — radial vignette over the existing blur fill so the
          corners darken more than the center, focusing the eye on the
          rising sheet panel. */}
      <div
        className="loot-bottom-sheet-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)",
          backdropFilter: "blur(20px) saturate(150%)",
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
          animation: open
            ? "bsBackdropIn var(--motion-medium) var(--ease-out) forwards"
            : "bsBackdropOut var(--motion-medium) var(--ease-in) forwards",
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Sheet — glass-morphism panel: 0.92-alpha base + heavy backdrop
          blur so the dashboard bleeds through faintly behind it. The
          mint border + inset-top highlight still anchor the top edge. */}
      <div
        ref={sheetRef}
        className="loot-bottom-sheet-panel"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 61,
          backgroundColor: "rgba(18, 14, 24, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: `2px solid ${borderColor}`,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          // Elevated-card stack: outer drop shadow above the sheet
          // (negative Y because it rises from the bottom) + inner
          // highlight on the top edge + a faint hairline inset.
          boxShadow:
            "0 -8px 40px -4px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.04) inset, inset 0 1px 0 0 rgba(255,255,255,0.08)",
          animation: open
            ? "bsSlideUp var(--motion-medium) var(--ease-out) forwards"
            : "bsSlideDown var(--motion-medium) var(--ease-in) forwards",
          pointerEvents: open ? "auto" : "none",
          maxHeight: "85vh",
          overflowY: "auto",
          // Same-class hardening as the global html/body fix: this fixed sheet
          // is an independent scroller, so a pull past its top edge could chain
          // to the browser's pull-to-refresh. `contain` stops the chain (no PWA
          // reload) while keeping the sheet's own momentum + rubber-band.
          overscrollBehavior: "contain",
          // The panel reaches the true screen bottom; this shared
          // padding lifts every sheet's flow content clear of the
          // iPhone home indicator (0px everywhere else). Sticky
          // footers pin past it and carry their own env() padding —
          // see the Z CONTRACT note above.
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Lit-from-above gradient wash — top 40% of the sheet only */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "40%",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)",
            pointerEvents: "none",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        />

        {/* Drag handle hit area — ~40px tall full-width strip at the
            top of the sheet. The visual pill (handleWidth × 4 mint
            by default) sits centered horizontally and top-aligned to
            the strip so it looks identical to the prior 30px-tall
            wrapper. What changed is that the touch listeners now
            live HERE rather than on the sheet root — content area
            below scrolls natively without firing the dismiss path.
            touchAction: none opts this strip out of the browser's
            default scroll-on-touch so our handlers get clean control;
            cursor: grab gives desktop users the same affordance.

            Default handle remains 36×4 white/15 across the app;
            consumers can override via handleColor + handleWidth
            props to lean into the handle as a brand accent (e.g.
            Flip Coach uses 40×4 mint). */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            paddingTop: 10,
            paddingBottom: 26,
            position: "relative",
            zIndex: 2,
            touchAction: "none",
            cursor: "grab",
          }}
        >
          <div
            style={{
              width: handleWidth,
              height: 4,
              backgroundColor: handleColor,
              borderRadius: 2,
            }}
          />
        </div>

        {/* Content fade-in wrapper — opacity 0 → 1 over 200ms with
            150ms delay so children animate in slightly after the
            slide-up starts. Keyed on `open` so the animation replays
            every open. */}
        <div
          key={open ? "open" : "closed"}
          className="loot-bottom-sheet-body"
          style={{
            position: "relative",
            zIndex: 1,
            minHeight,
            animation: open
              ? "bsContentFade 200ms ease-out 150ms both"
              : "none",
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
