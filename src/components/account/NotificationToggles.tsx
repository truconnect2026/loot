"use client";

import type { ReactNode } from "react";

interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  size?: "normal" | "small";
  /** Stop the click from bubbling so a wrapping row handler doesn't double-toggle. */
  stopBubble?: boolean;
}

function Toggle({ on, onToggle, size = "normal", stopBubble }: ToggleProps) {
  const isSmall = size === "small";
  const trackW = isSmall ? 28 : 36;
  const trackH = isSmall ? 16 : 20;
  const thumbSize = isSmall ? 12 : 16;
  const thumbOffset = 2;

  // Track: dark trough when off, glowing mint wash when on.
  const trackBg = on ? "rgba(92,224,184,0.20)" : "rgba(255,255,255,0.06)";
  const trackShadow = on
    ? "0 0 12px -2px rgba(92,224,184,0.40)"
    : "inset 0 1px 2px 0 rgba(0,0,0,0.4)";

  return (
    <div
      onClick={(e) => {
        if (stopBubble) e.stopPropagation();
        onToggle();
      }}
      style={{
        width: trackW,
        height: trackH,
        borderRadius: 9999,
        backgroundColor: trackBg,
        boxShadow: trackShadow,
        position: "relative",
        cursor: "pointer",
        transition:
          "background-color 200ms cubic-bezier(0.32, 0.72, 0, 1), box-shadow 200ms cubic-bezier(0.32, 0.72, 0, 1)",
        flexShrink: 0,
      }}
    >
      {/* Thumb — solid white pill with subtle inner shadow for 3D */}
      <div
        style={{
          width: thumbSize,
          height: thumbSize,
          borderRadius: "50%",
          backgroundColor: "#FFFFFF",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(0,0,0,0.1)",
          position: "absolute",
          top: thumbOffset,
          left: on ? trackW - thumbSize - thumbOffset : thumbOffset,
          transition: "left 200ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      />
    </div>
  );
}

interface NotificationTogglesProps {
  enabled: boolean;
  onToggleEnabled: () => void;
  deals: boolean;
  onToggleDeals: () => void;
  bolo: boolean;
  onToggleBolo: () => void;
  pennies: boolean;
  onTogglePennies: () => void;
  /** Optional left-edge accent dot color + icon, matching the other tiles. */
  icon?: ReactNode;
  accentColor?: string;
}

export default function NotificationToggles({
  enabled,
  onToggleEnabled,
  deals,
  onToggleDeals,
  bolo,
  onToggleBolo,
  pennies,
  onTogglePennies,
  icon,
  accentColor,
}: NotificationTogglesProps) {
  const subs = [
    { label: "Deal alerts", on: deals, toggle: onToggleDeals },
    { label: "BOLO matches", on: bolo, toggle: onToggleBolo },
    { label: "Penny drops", on: pennies, toggle: onTogglePennies },
  ];

  // Sub-toggle area max-height for the smooth collapse. 36 + 1 (height) +
  // hairline gap baked into each row, times three rows; using 160 as a safe
  // ceiling so the transition runs smoothly without measuring.
  const SUB_MAX = 160;

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)",
        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04)",
        borderRadius: "4px 14px 14px 14px",
        overflow: "hidden",
      }}
    >
      {/* Left-edge accent dot — same signature as other tiles */}
      {accentColor && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: -2,
            top: 26,
            width: 4,
            height: 4,
            borderRadius: "50%",
            backgroundColor: accentColor,
            opacity: 0.4,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Main toggle row */}
      <div
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        {icon && (
          <span
            aria-hidden="true"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 16,
              height: 16,
              marginRight: 10,
              color: accentColor,
              opacity: 0.6,
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
        )}
        <span
          style={{
            flex: 1,
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 600,
            fontSize: 13,
            color: "var(--text-primary)",
          }}
        >
          Push notifications
        </span>
        <Toggle on={enabled} onToggle={onToggleEnabled} />
      </div>

      {/* Sub-toggles — collapse smoothly when the main toggle goes off.
          Slightly darker bg + hairline divider on top + 24px indentation
          create the "nested inside the parent" hierarchy. */}
      <div
        style={{
          maxHeight: enabled ? SUB_MAX : 0,
          opacity: enabled ? 1 : 0,
          overflow: "hidden",
          backgroundColor: "rgba(0,0,0,0.15)",
          borderTop: enabled
            ? "1px solid #1E1835"
            : "1px solid transparent",
          transition:
            "max-height 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {subs.map((sub) => (
          <div
            key={sub.label}
            onClick={sub.toggle}
            style={{
              display: "flex",
              alignItems: "center",
              paddingLeft: 24,
              paddingRight: 12,
              height: 36,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                flex: 1,
                fontFamily: "var(--font-outfit), sans-serif",
                fontWeight: 400,
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              {sub.label}
            </span>
            <Toggle
              on={sub.on}
              onToggle={sub.toggle}
              size="small"
              stopBubble
            />
          </div>
        ))}
      </div>
    </div>
  );
}
