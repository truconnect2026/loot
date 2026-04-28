"use client";

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
}: NotificationTogglesProps) {
  const subs = [
    { label: "Deal alerts", on: deals, toggle: onToggleDeals },
    { label: "BOLO matches", on: bolo, toggle: onToggleBolo },
    { label: "Penny drops", on: pennies, toggle: onTogglePennies },
  ];

  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)",
        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04)",
        borderRadius: "4px 14px 14px 14px",
        overflow: "hidden",
      }}
    >
      {/* Main toggle row */}
      <div
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
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

      {/* Sub-toggles — fade in when enabled */}
      {enabled && (
        <div
          style={{
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 12,
          }}
        >
          {subs.map((sub, i) => (
            <div
              key={sub.label}
              style={{
                display: "flex",
                alignItems: "center",
                paddingLeft: 16,
                height: 36,
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

      <style>{`
        @keyframes ntFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
