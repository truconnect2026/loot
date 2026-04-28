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
  onClick?: () => void;
  children: ReactNode;
}

export default function SettingsTile({
  height = 52,
  variant = "default",
  borderColor,
  onClick,
  children,
}: SettingsTileProps) {
  const [hovered, setHovered] = useState(false);

  if (variant === "danger" || borderColor) {
    // Sign-out / danger style — subtle red rim that warms on hover.
    return (
      <div
        onClick={onClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        style={{
          height,
          backgroundColor: hovered
            ? "rgba(232,99,107,0.05)"
            : "transparent",
          border: hovered
            ? "1px solid rgba(232,99,107,0.15)"
            : "1px solid rgba(232,99,107,0.08)",
          borderRadius: "4px 14px 14px 14px",
          display: "flex",
          alignItems: "center",
          paddingLeft: 16,
          paddingRight: 16,
          cursor: onClick ? "pointer" : "default",
          transition:
            "background-color 150ms cubic-bezier(0.16, 1, 0.3, 1), border-color 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {children}
      </div>
    );
  }

  // Quiet utility treatment — these are background, not hero.
  return (
    <div
      onClick={onClick}
      style={{
        height,
        backgroundColor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)",
        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04)",
        borderRadius: "4px 14px 14px 14px",
        display: "flex",
        alignItems: "center",
        paddingLeft: 16,
        paddingRight: 16,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {children}
    </div>
  );
}
