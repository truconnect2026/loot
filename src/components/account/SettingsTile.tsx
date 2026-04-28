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
  borderColor = "var(--border-subtle)",
  onClick,
  children,
}: SettingsTileProps) {
  return (
    <div
      onClick={onClick}
      style={{
        height,
        backgroundColor: "var(--bg-surface)",
        border: `1px solid ${borderColor}`,
        borderRadius: 14,
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
