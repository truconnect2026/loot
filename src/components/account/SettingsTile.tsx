"use client";

import { useState, type ReactNode } from "react";

interface SettingsTileProps {
  height?: number;
  /**
   * Pass for the special sign-out variant ("danger") to get a red-tinted
   * border + warm hover. Otherwise the tile uses the quiet utility treatment.
   */
  variant?: "default" | "danger";
  borderColor?: string;
  /**
   * Drives the left-edge accent dot (40% opacity) and the icon tint
   * (60% opacity, applied via `color`/`opacity` so SVGs using
   * `stroke="currentColor"` pick it up automatically).
   */
  accentColor?: string;
  /** 16px stroke icon, rendered between the dot and the label. */
  icon?: ReactNode;
  onClick?: () => void;
  children: ReactNode;
}

export default function SettingsTile({
  height = 52,
  variant = "default",
  borderColor: _borderColor,
  accentColor,
  icon,
  onClick,
  children,
}: SettingsTileProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const isDanger = variant === "danger";

  // Sign-out / danger style — subtle red tint on border + bg so the eye
  // catches it without it being alarming.
  const baseBg = isDanger
    ? hovered
      ? "rgba(232,99,107,0.06)"
      : "rgba(232,99,107,0.03)"
    : "rgba(255,255,255,0.02)";
  const baseBorder = isDanger
    ? hovered
      ? "1px solid rgba(232,99,107,0.18)"
      : "1px solid rgba(232,99,107,0.12)"
    : "1px solid rgba(255,255,255,0.04)";

  // Press state — bg shifts to --press-bg, tile drops 1px. Children with
  // data-cell-flash also flash via the global rule below.
  const bg = pressed ? "var(--press-bg)" : baseBg;
  const transform = pressed ? "translateY(1px)" : "translateY(0)";
  const transition = pressed
    ? "background-color 80ms ease-in, transform 80ms ease-in, border-color 80ms ease-in"
    : "background-color 150ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1), border-color 150ms cubic-bezier(0.16, 1, 0.3, 1)";

  return (
    <>
      {/* Global flash rule — descendant cells marked data-cell-flash brighten
          while their parent tile is pressed. Inline styles can't be reliably
          overridden by descendant CSS, so the cells use a transparent default
          background and pick up their resting color from this rule too. */}
      <style>{`
        [data-tile-pressed="true"] [data-cell-flash] {
          background-color: #1F1835 !important;
        }
      `}</style>
      <div
        onClick={onClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => {
          setHovered(false);
          setPressed(false);
        }}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        data-tile-pressed={pressed ? "true" : undefined}
        style={{
          position: "relative",
          height,
          backgroundColor: bg,
          border: baseBorder,
          boxShadow: isDanger
            ? undefined
            : "inset 0 1px 0 0 rgba(255,255,255,0.04)",
          borderRadius: "4px 16px 16px 16px",
          display: "flex",
          alignItems: "center",
          // 12px horizontal padding per spec; the icon + dot sit in this space.
          paddingLeft: 12,
          paddingRight: 12,
          cursor: onClick ? "pointer" : "default",
          userSelect: "none",
          transform,
          transition,
        }}
      >
        {/* Left-edge accent dot — color-coded signature, half outside the
            tile so it reads as a marker on the rim. */}
        {accentColor && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: -2,
              top: "50%",
              transform: "translateY(-50%)",
              width: 4,
              height: 4,
              borderRadius: "50%",
              backgroundColor: accentColor,
              opacity: 0.4,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Icon — color: accentColor at 0.6 opacity. SVGs should use
            stroke="currentColor" so this `color` flows through. */}
        {icon && (
          <span
            aria-hidden="true"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 16,
              height: 16,
              marginRight: 10,
              color: accentColor,
              opacity: 0.6,
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
        )}

        {children}
      </div>
    </>
  );
}
