"use client";

import type { ReactNode, CSSProperties } from "react";
import { elevation } from "@/lib/design/tokens";

type CardLevel = 1 | 2 | 3;

interface CardProps {
  level?: CardLevel;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function Card({ level = 1, children, style, className }: CardProps) {
  const backgrounds: Record<CardLevel, string> = {
    1: "rgba(255,255,255,0.032)",
    2: "rgba(23,18,42,0.85)",
    3: "rgba(18,14,24,0.92)",
  };

  const borders: Record<CardLevel, string> = {
    1: "1px solid rgba(255,255,255,0.07)",
    2: "1px solid rgba(255,255,255,0.08)",
    3: "1px solid rgba(255,255,255,0.06)",
  };

  return (
    <div
      className={className}
      style={{
        backgroundColor: backgrounds[level],
        border: borders[level],
        borderRadius: level === 1 ? "4px 16px 16px 16px" : 16,
        boxShadow: elevation[level],
        ...style,
      }}
    >
      {children}
    </div>
  );
}
