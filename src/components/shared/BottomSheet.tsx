"use client";

import { useEffect, useRef, useCallback, type ReactNode } from "react";

/**
 * Slide-up panel with backdrop blur, drag handle, swipe-to-dismiss.
 * Spring animation via cubic-bezier(0.32, 0.72, 0, 1) — the iOS drawer curve.
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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    currentTranslateY.current = 0;
    isDragging.current = true;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
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
        "transform 400ms cubic-bezier(0.32, 0.72, 0, 1)";
    }
    if (currentTranslateY.current > 100) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "translateY(0)";
    }
    currentTranslateY.current = 0;
  }, [onClose]);

  // Reset sheet position when opening
  useEffect(() => {
    if (open && sheetRef.current) {
      sheetRef.current.style.transform = "translateY(0)";
      sheetRef.current.style.transition =
        "transform 400ms cubic-bezier(0.32, 0.72, 0, 1)";
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
        @keyframes bsSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
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
      `}</style>

      {/* Backdrop — radial vignette over the existing blur fill so the
          corners darken more than the center, focusing the eye on the
          rising sheet panel. */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)",
          backdropFilter: "blur(20px) saturate(150%)",
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
          animation: open
            ? "bsBackdropIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
            : "bsBackdropOut 250ms ease-in forwards",
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Sheet — glass-morphism panel: 0.92-alpha base + heavy backdrop
          blur so the dashboard bleeds through faintly behind it. The
          mint border + inset-top highlight still anchor the top edge. */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 41,
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
            ? "bsSlideUp 350ms cubic-bezier(0.32, 0.72, 0, 1) forwards"
            : "bsSlideDown 250ms ease-in forwards",
          pointerEvents: open ? "auto" : "none",
          maxHeight: "85vh",
          overflowY: "auto",
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

        {/* Drag handle — pill, 16px gap to content. Default 36×4
            white/15 is the standard quiet affordance; consumers can
            override via handleColor + handleWidth props to lean into
            the handle as a brand accent (e.g. Flip Coach uses 40×4
            mint to tie into the character-led identity). */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 10,
            marginBottom: 16,
            position: "relative",
            zIndex: 1,
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
