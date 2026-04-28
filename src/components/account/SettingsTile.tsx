"use client";

import type { ReactNode } from "react";

interface SettingsTileProps {
  height?: number;
  borderColor?: string;
  onClick?: () => void;
  children: ReactNode;
}

export default function SettingsTile({
  height = 52,
  borderColor,
  onClick,
  children,
}: SettingsTileProps) {
  // Sign-out tile passes a red border via prop; everything else uses the
  // new lit translucent-white treatment.
  const border = borderColor
    ? `1px solid ${borderColor}`
    : "1px solid rgba(255,255,255,0.06)";

  return (
    <div
      onClick={onClick}
      style={{
        height,
        backgroundColor: "var(--bg-surface)",
        border,
        borderRadius: "4px 14px 14px 14px",
        boxShadow:
          "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.4)",
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
