"use client";

import AnimNum from "@/components/shared/AnimNum";
import type { CSSProperties } from "react";

interface CountUpProps {
  value: number;
  prefix?: string;
  duration?: number;
  style?: CSSProperties;
  className?: string;
}

export function CountUp({ value, prefix, duration, style, className }: CountUpProps) {
  return (
    <AnimNum
      value={value}
      prefix={prefix}
      duration={duration}
      style={style}
      className={className}
    />
  );
}
