"use client";

import type { ReactNode } from "react";

/**
 * Section header — the app-wide cadence: 10px Space Mono label over a
 * mint-origin fade rule (mint at the origin, dissolving rightward),
 * matching SECTION_LABEL on Home and the kit header on Tools.
 */
interface SectionHeaderProps {
  children: ReactNode;
  marginTop?: number;
  marginBottom?: number;
}

export function SectionHeader({
  children,
  marginTop = 0,
  marginBottom = 10,
}: SectionHeaderProps) {
  return (
    <div
      style={{
        marginTop,
        marginBottom,
        paddingBottom: 6,
        fontFamily: "var(--font-label)",
        fontSize: 10,
        fontWeight: 700,
        color: "#6F678E",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        backgroundImage:
          "linear-gradient(to right, rgba(92,224,184,0.22) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "0 100%",
        backgroundSize: "100% 1px",
      }}
    >
      {children}
    </div>
  );
}
