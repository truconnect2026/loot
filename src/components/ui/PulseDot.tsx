"use client";

import type { CSSProperties } from "react";

interface PulseDotProps {
  color?: string;
  size?: number;
  style?: CSSProperties;
}

export function PulseDot({
  color = "#5CE0B8",
  size = 8,
  style,
}: PulseDotProps) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        boxShadow: `0 0 ${size * 1.5}px ${color}`,
        animation: "pulseDot 2s cubic-bezier(0.4,0,0.6,1) infinite",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
