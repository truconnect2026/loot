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

  return (
    <div
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{
        position: "relative",
        height,
        backgroundColor: baseBg,
        border: baseBorder,
        boxShadow: isDanger
          ? undefined
          : "inset 0 1px 0 0 rgba(255,255,255,0.04)",
        borderRadius: "4px 14px 14px 14px",
        display: "flex",
        alignItems: "center",
        // 12px horizontal padding per spec; the icon + dot sit in this space.
        paddingLeft: 12,
        paddingRight: 12,
        cursor: onClick ? "pointer" : "default",
        transition:
          "background-color 150ms cubic-bezier(0.16, 1, 0.3, 1), border-color 150ms cubic-bezier(0.16, 1, 0.3, 1)",
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
  );
}
