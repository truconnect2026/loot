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

  // ON track tints mint at 0.7 — the active state earns the money
  // color now that the rest of the app uses mint as a directional
  // signal. OFF track sits at a faint white surface so the toggle
  // reads as a recessed switch slot rather than a deep well. Thumb
  // adapts: bright white when on (against mint), dim white when off
  // (against the muted slot).
  const trackBg = on
    ? "rgba(92, 224, 184, 0.7)"
    : "rgba(255, 255, 255, 0.08)";
  const thumbBg = on ? "#FFFFFF" : "rgba(255, 255, 255, 0.3)";

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
        transition: "background-color 200ms ease",
        flexShrink: 0,
      }}
    >
      {/* Thumb — pill that adapts color so it stays readable in both
          states. The slight overshoot easing on the slide keeps the
          tactile "physical switch" feel. */}
      <div
        style={{
          width: thumbSize,
          height: thumbSize,
          borderRadius: "50%",
          backgroundColor: thumbBg,
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(0,0,0,0.1)",
          position: "absolute",
          top: thumbOffset,
          left: on ? trackW - thumbSize - thumbOffset : thumbOffset,
          transition:
            "left 200ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 200ms ease",
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
    // "BOLO matches" → "Watch list matches" — see account/page.tsx for
    // the BOLO rename rationale. Internal `bolo` prop stays so this
    // doesn't ripple into a broader refactor of toggle plumbing.
    { label: "Watch list matches", on: bolo, toggle: onToggleBolo },
    { label: "Penny drops", on: pennies, toggle: onTogglePennies },
  ];

  return (
    <>
      {/* Main "Push notifications" row — its own SettingsTile-shaped
          card. The sub-toggle panel below is a SEPARATE element (no
          longer enclosed in this card) so it can carry its own
          margins and hairline-separated row treatment. */}
      <div
        style={{
          position: "relative",
          backgroundColor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.04)",
          boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04)",
          borderRadius: "4px 16px 16px 16px",
          overflow: "hidden",
          height: 52,
          display: "flex",
          alignItems: "center",
          paddingLeft: 14,
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
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 13,
            color: "var(--text-primary)",
          }}
        >
          Push notifications
        </span>
        <Toggle on={enabled} onToggle={onToggleEnabled} />
      </div>

      {/* Sub-toggle panel — sits 4px below the parent row, indented
          20px on the left so it visibly belongs to "Push notifications"
          above. Light surface (0.02 white) + 10px corners reads as a
          recessed sub-panel; row hairlines at 0.03 give the three
          toggles individual rhythm without doubling up borders. */}
      {enabled && (
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.02)",
            borderRadius: 10,
            marginTop: 4,
            marginLeft: 20,
            marginRight: 0,
            padding: 0,
            overflow: "hidden",
          }}
        >
          {subs.map((sub, i) => (
            <div
              key={sub.label}
              onClick={sub.toggle}
              style={{
                display: "flex",
                alignItems: "center",
                paddingLeft: 14,
                paddingRight: 14,
                height: 40,
                cursor: "pointer",
                // Bottom hairline on every row except the last so
                // the panel reads as a stacked list rather than
                // separate floating rows.
                borderBottom:
                  i === subs.length - 1
                    ? "none"
                    : "1px solid rgba(255,255,255,0.03)",
                animation: `ntFadeIn 250ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 50}ms both`,
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontFamily: "var(--font-body)",
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
    </>
  );
}
