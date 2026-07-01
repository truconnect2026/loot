"use client";

import type { ReactNode } from "react";

interface StaggerListProps {
  children: ReactNode[];
  baseDelay?: number;
  staggerStep?: number;
  duration?: number;
  gap?: number;
}

export function StaggerList({
  children,
  baseDelay = 0,
  staggerStep = 40,
  duration = 350,
  gap = 8,
}: StaggerListProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {children.map((child, i) => (
        <div
          key={i}
          style={{
            animation: `fadeInUp ${duration}ms cubic-bezier(0.16,1,0.3,1) ${baseDelay + i * staggerStep}ms both`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
