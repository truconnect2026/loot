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

  return (
    <div
      onClick={onToggle}
      style={{
        width: trackW,
        height: trackH,
        borderRadius: 10,
        backgroundColor: on
          ? "rgba(92, 224, 184, 0.15)"
          : "var(--bg-recessed)",
        border: `1px solid ${
          on ? "rgba(92, 224, 184, 0.25)" : "var(--border-default)"
        }`,
        position: "relative",
        cursor: "pointer",
        transition:
          "background-color 200ms cubic-bezier(0.34, 1.4, 0.64, 1), border-color 200ms cubic-bezier(0.34, 1.4, 0.64, 1)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: thumbSize,
          height: thumbSize,
          borderRadius: "50%",
          backgroundColor: on
            ? "var(--accent-mint)"
            : "var(--border-default)",
          position: "absolute",
          top: thumbOffset,
          left: on ? trackW - thumbSize - thumbOffset - 2 : thumbOffset,
          transition:
            "left 200ms cubic-bezier(0.34, 1.4, 0.64, 1), background-color 200ms",
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
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: 14,
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
                animation: `ntFadeIn 200ms ease-out ${i * 50}ms both`,
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
