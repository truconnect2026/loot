"use client";

type VerdictTier = "BUY" | "MAYBE" | "PASS" | "VERIFY";

interface VerdictBadgeProps {
  tier: VerdictTier;
  size?: "sm" | "md";
}

const tierConfig: Record<VerdictTier, { color: string; bg: string; border: string }> = {
  BUY: {
    color: "#5CE0B8",
    bg: "rgba(92,224,184,0.10)",
    border: "rgba(92,224,184,0.22)",
  },
  MAYBE: {
    color: "#D4A574",
    bg: "rgba(212,165,116,0.10)",
    border: "rgba(212,165,116,0.22)",
  },
  PASS: {
    color: "#E8636B",
    bg: "rgba(232,99,107,0.10)",
    border: "rgba(232,99,107,0.22)",
  },
  VERIFY: {
    color: "#7B8FFF",
    bg: "rgba(123,143,255,0.10)",
    border: "rgba(123,143,255,0.22)",
  },
};

export function VerdictBadge({ tier, size = "md" }: VerdictBadgeProps) {
  const { color, bg, border } = tierConfig[tier];
  const isSmall = size === "sm";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: isSmall ? 7 : 10,
        paddingRight: isSmall ? 7 : 10,
        paddingTop: isSmall ? 3 : 4,
        paddingBottom: isSmall ? 3 : 4,
        borderRadius: isSmall ? 6 : 8,
        backgroundColor: bg,
        border: `1px solid ${border}`,
        fontFamily: "var(--font-label)",
        fontSize: isSmall ? 8 : 9,
        fontWeight: 700,
        letterSpacing: "0.12em",
        color,
        lineHeight: 1,
        whiteSpace: "nowrap" as const,
      }}
    >
      {tier}
    </div>
  );
}
