"use client";

import { useEffect, useRef, useCallback, type ReactNode } from "react";

/**
 * Slide-up panel with backdrop blur, drag handle, swipe-to-dismiss.
 * Spring animation via cubic-bezier(0.34, 1.4, 0.64, 1).
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
        "transform 400ms cubic-bezier(0.34, 1.4, 0.64, 1)";
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
        "transform 400ms cubic-bezier(0.34, 1.4, 0.64, 1)";
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

      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          backgroundColor: "rgba(18, 14, 24, 0.85)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          animation: open
            ? "bsBackdropIn 300ms ease-out forwards"
            : "bsBackdropOut 300ms ease-out forwards",
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Sheet */}
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
          borderRadius: "20px 20px 0 0",
          animation: open
            ? "bsSlideUp 400ms cubic-bezier(0.34, 1.4, 0.64, 1) forwards"
            : "bsSlideDown 300ms ease-out forwards",
          pointerEvents: open ? "auto" : "none",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 8,
            paddingBottom: 4,
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              backgroundColor: "var(--border-default)",
              borderRadius: 2,
            }}
          />
        </div>

        {children}
      </div>
    </>
  );
}
