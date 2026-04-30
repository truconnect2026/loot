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
}

export default function BottomSheet({
  open,
  onClose,
  borderColor,
  children,
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
      `}</style>

      {/* Backdrop — heavy blur + saturate so the mesh stays faintly visible */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          backgroundColor: "rgba(10, 8, 14, 0.85)",
          backdropFilter: "blur(20px) saturate(150%)",
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
          animation: open
            ? "bsBackdropIn 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
            : "bsBackdropOut 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Sheet — lit-from-above panel sliding up from below */}
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
          backgroundColor: "var(--bg-surface)",
          borderTop: `2px solid ${borderColor}`,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          // Inset highlight on the top edge + outer shadow ABOVE the sheet
          // (negative Y offset because the sheet rises from the bottom).
          boxShadow:
            "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 -8px 40px -4px rgba(0,0,0,0.5)",
          animation: open
            ? "bsSlideUp 400ms cubic-bezier(0.32, 0.72, 0, 1) forwards"
            : "bsSlideDown 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
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

        {/* Drag handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 10,
            paddingBottom: 4,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 2,
            }}
          />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </div>
    </>
  );
}
