"use client";

import type { ReactNode } from "react";

// Light haptic — Android Chrome only, silent everywhere else.
function haptic() {
  try {
    navigator?.vibrate?.(10);
  } catch {
    /* iOS silently fails */
  }
}

interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  size?: "normal" | "small";
  /** Stop the click from bubbling so a wrapping row handler doesn't double-toggle. */
  stopBubble?: boolean;
}

function Toggle({ on, onToggle, size = "normal", stopBubble }: ToggleProps) {
  const isSmall = size === "small";
  // Branded sizing: 44×24 main, 36×20 sub. Border-radius 12 for the slab
  // capsule shape (not 9999/full pill — the slight squareness is the brand).
  const trackW = isSmall ? 36 : 44;
  const trackH = isSmall ? 20 : 24;
  const thumbSize = isSmall ? 16 : 20;
  const thumbOffset = 2;
  const radius = isSmall ? 10 : 12;

  // Solid mint when on, recessed dark when off — the brightest brand moment
  // on this page.
  const trackBg = on ? "#5CE0B8" : "#2A2240";

  return (
    <div
      onClick={(e) => {
        if (stopBubble) e.stopPropagation();
        haptic();
        onToggle();
      }}
      style={{
        width: trackW,
        height: trackH,
        borderRadius: radius,
        backgroundColor: trackBg,
        position: "relative",
        cursor: "pointer",
        transition: "background-color 150ms ease",
        flexShrink: 0,
      }}
    >
      {/* Thumb — solid white pill with subtle inner shadow for 3D. Slides
          on a slight overshoot/bounce so the toggle feels physical. */}
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
          transition: "left 200ms cubic-bezier(0.34, 1.2, 0.64, 1)",
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
        borderRadius: "4px 16px 16px 16px",
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
