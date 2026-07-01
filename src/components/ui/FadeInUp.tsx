"use client";

import type { ReactNode, CSSProperties } from "react";

interface FadeInUpProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  style?: CSSProperties;
}

export function FadeInUp({
  children,
  delay = 0,
  duration = 350,
  style,
}: FadeInUpProps) {
  return (
    <div
      style={{
        animation: `fadeInUp ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
