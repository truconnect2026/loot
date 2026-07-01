"use client";

import type { ReactNode } from "react";

interface SectionHeaderProps {
  children: ReactNode;
  marginTop?: number;
  marginBottom?: number;
}

export function SectionHeader({
  children,
  marginTop = 0,
  marginBottom = 8,
}: SectionHeaderProps) {
  return (
    <div
      style={{
        marginTop,
        marginBottom,
        display: "flex",
        alignItems: "center",
        gap: 7,
      }}
    >
      <div
        style={{
          width: 2,
          height: 8,
          borderRadius: 1,
          backgroundColor: "rgba(92,224,184,0.28)",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-label)",
          fontSize: 9,
          color: "rgba(200,192,216,0.40)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
    </div>
  );
}
