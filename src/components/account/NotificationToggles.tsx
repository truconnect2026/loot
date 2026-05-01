"use client";

// Light haptic — Android Chrome only, silent everywhere else.
function haptic() {
  try {
    navigator?.vibrate?.(10);
  } catch {
    /* iOS silently fails */
  }
}

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

  // ON: off-white interactive track (--ui-secondary). OFF: recessed dark.
  // Mint moved out of toggles entirely — toggles are interactive UI, not
  // money. Track sits a touch dimmer than the white thumb so the thumb's
  // drop-shadow halo gives clean separation when ON.
  const trackBg = on ? "#E8E5F0" : "#2A2240";

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
        transition:
          "background-color 200ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
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
      {/* Main toggle row — interior layout matches SettingsTile:
          [8 pad] [5 dot] [8 gap] [18 BellIcon] [10 gap] [label]. Label
          starts at x=49, which is what the sub-toggles indent to. */}
      <div
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          paddingLeft: 8,
          paddingRight: 16,
        }}
      >
        {/* Inline lavender dot — same pattern as SettingsTile chassis. */}
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 5,
            height: 5,
            borderRadius: "50%",
            backgroundColor: accentColor,
            opacity: 0.7,
            marginRight: 8,
            flexShrink: 0,
          }}
        />
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
              onClick={sub.toggle}
              style={{
                display: "flex",
                alignItems: "center",
                // 49px aligns with parent label start: pad 8 + dot 5 + gap 8
                // + icon 18 + gap 10 = 49.
                paddingLeft: 49,
                paddingRight: 16,
                height: 40,
                cursor: "pointer",
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
              <Toggle
                on={sub.on}
                onToggle={sub.toggle}
                size="small"
                stopBubble
              />
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
