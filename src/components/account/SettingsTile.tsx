"use client";

import { useEffect, useState, type ReactNode } from "react";

interface SettingsTileProps {
  height?: number;
  /**
   * "danger" gets a red-tinted border + bg (sign out). Default is the quiet
   * utility surface used everywhere else.
   */
  variant?: "default" | "danger";
  /**
   * Drives the inline accent dot (5px / 70% alpha) and the icon tint
   * (75% alpha, applied via `color` so SVGs using stroke="currentColor"
   * pick it up automatically). The dot now lives inside the tile content
   * row instead of half-clipped on the rim, so it can't be overflow-clipped.
   */
  accentColor?: string;
  /** 18px stroke icon, rendered between the dot and the label. */
  icon?: ReactNode;
  onClick?: () => void;
  children: ReactNode;
}

export default function SettingsTile({
  height = 52,
  variant = "default",
  accentColor,
  icon,
  onClick,
  children,
}: SettingsTileProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  // House press is motion — reduced-motion renders the tile inert.
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    try {
      setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch { /* default: animate */ }
  }, []);

  const isDanger = variant === "danger";

  // Sign-out / danger style — subtle red tint on bg + border, slightly
  // warmer when hovered.
  const baseBg = isDanger
    ? hovered
      ? "rgba(232,99,107,0.06)"
      : "rgba(232,99,107,0.03)"
    : "rgba(255,255,255,0.038)";
  const baseBorder = isDanger
    ? hovered
      ? "1px solid rgba(232,99,107,0.18)"
      : "1px solid rgba(232,99,107,0.12)"
    : "1px solid rgba(255,255,255,0.07)";

  const bg = pressed ? "var(--press-bg)" : baseBg;
  // House press: scale + accent edge flash (was translateY(1px)).
  const flashColor = accentColor ?? "#5CE0B8";
  const transform = pressed && !reduced ? "scale(0.97)" : "scale(1)";
  const transition = reduced
    ? "none"
    : pressed
      ? "background-color 80ms ease-in, transform 80ms ease-in, box-shadow 80ms ease-in"
      : "background-color 150ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 150ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 150ms ease";

  return (
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
      style={{
        position: "relative",
        height,
        backgroundColor: bg,
        border: baseBorder,
        boxShadow:
          pressed && !reduced
            ? `0 0 0 1px ${flashColor}AA, 0 0 14px -4px ${flashColor}88`
            : isDanger
              ? "0 1px 2px rgba(0,0,0,0.20)"
              : "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 1px 3px rgba(0,0,0,0.25), 0 4px 12px -2px rgba(0,0,0,0.30)",
        borderRadius: "4px 16px 16px 16px",
        display: "flex",
        alignItems: "center",
        // Layout: [14px pad] [18px icon] [10px gap] [label] [right accessory] [12px pad].
        // Bumped from 8 → 14 since the accent dot was removed; the icon
        // now sits at a comfortable left margin instead of looking
        // crowded against the tile edge.
        paddingLeft: 14,
        paddingRight: 12,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        transform,
        transition,
      }}
    >
      {/* Accent dots removed — they read as error/incomplete-setup
          indicators with no documented meaning. The icon already carries
          the per-tile color cue, and clarity beats decoration here. */}

      {/* Icon — 18px container, color from accentColor at 75% opacity. SVGs
          should use stroke="currentColor" so this `color` flows through. */}
      {icon && (
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            marginRight: 10,
            color: accentColor,
            opacity: 0.75,
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
