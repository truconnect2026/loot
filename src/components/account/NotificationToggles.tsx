"use client";

function BellIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  size?: "normal" | "small";
}

function Toggle({ on, onToggle, size = "normal" }: ToggleProps) {
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
      onClick={onToggle}
      style={{
        width: trackW,
        height: trackH,
        borderRadius: 9999,
        backgroundColor: trackBg,
        boxShadow: trackShadow,
        position: "relative",
        cursor: "pointer",
        transition:
          "background-color 200ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
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
          transition: "left 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
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
  /** Drives the left-edge dot + the BellIcon tint. */
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
  accentColor = "#B4A0D4",
}: NotificationTogglesProps) {
  const subs = [
    { label: "Deal alerts", on: deals, toggle: onToggleDeals },
    { label: "BOLO matches", on: bolo, toggle: onToggleBolo },
    { label: "Penny drops", on: pennies, toggle: onTogglePennies },
  ];

  return (
    <div style={{ position: "relative" }}>
      {/* Accent dot — sits half outside the tile rim, matching the
          SettingsTile chassis. Positioned on the OUTER wrapper so the inner
          chassis can keep overflow:hidden for the rounded corners + sub-panel
          bg clip. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: -2.5,
          top: 23.5,
          width: 5,
          height: 5,
          borderRadius: "50%",
          backgroundColor: accentColor,
          opacity: 0.7,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.04)",
          boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04)",
          borderRadius: "4px 14px 14px 14px",
          overflow: "hidden",
        }}
      >
        {/* Main toggle row — 12px paddingLeft + 18px BellIcon + 10px gap so
            the parent label starts at x=40, the same anchor as sub-toggles. */}
        <div
          style={{
            height: 52,
            display: "flex",
            alignItems: "center",
            paddingLeft: 12,
            paddingRight: 16,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 18,
              height: 18,
              marginRight: 10,
              color: accentColor,
              opacity: 0.75,
              flexShrink: 0,
            }}
          >
            <BellIcon />
          </span>
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

      {/* Sub-toggle panel — recessed into a darker surface than the page bg
          (#0D0A14 vs #120e18). Bumped from #100C18 so the contrast between
          the parent row and the sub-toggle pit is obvious at a glance.
          Hairlines #1A1530 between rows. */}
      {enabled && (
        <div
          style={{
            backgroundColor: "#0D0A14",
            boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
          }}
        >
          {subs.map((sub, i) => (
            <div
              key={sub.label}
              style={{
                display: "flex",
                alignItems: "center",
                // 40px aligns sub labels with where parent text would sit if
                // the parent row had a 18px icon at left-pad 12 + gap 10.
                paddingLeft: 40,
                paddingRight: 16,
                height: 40,
                borderTop: i === 0 ? "none" : "1px solid #1A1530",
                animation: `ntFadeIn 250ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 50}ms both`,
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
              <Toggle on={sub.on} onToggle={sub.toggle} size="small" />
            </div>
          ))}
        </div>
      )}
      </div>

      <style>{`
        @keyframes ntFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
