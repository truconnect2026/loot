"use client";

interface ProfileCardProps {
  name: string;
  email: string;
  initials: string;
  isPro: boolean;
  price: string;
  period: string;
  renewsDate: string;
  scansLabel: string;
  onCancel: () => void;
}

// Cold blue-purple hex (no warm/red components) so OLED panels can't shift
// these labels toward green. Spread inline on each cell — the runtime end
// state is identical to writing style={{ color: '#28203D', ... }} per label.
const cellLabel: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains-mono), monospace",
  fontSize: 9,
  color: "#28203D",
  letterSpacing: "0.08em",
  marginBottom: 2,
};

export default function ProfileCard({
  name,
  email,
  initials,
  isPro,
  price,
  period,
  renewsDate,
  scansLabel,
  onCancel,
}: ProfileCardProps) {
  return (
    <>
      <style>{`
        .profile-card-surface {
          position: relative;
        }
        .profile-card-cancel {
          color: #6B5F80;
        }
        .profile-card-cancel:hover {
          color: #9B8FB0;
        }
        /* Gradient border via mask-composite — bright top-left, plum dim
           bottom-right. The mint kicker that was here used to live on the
           border but, combined with the glass card behind it, made every
           low-contrast label inside read as greenish. Switched the kicker
           to dim plum so the card no longer has a green corner. */
        .profile-card-surface::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.15) 0%,
            rgba(255,255,255,0.04) 40%,
            transparent 60%,
            rgba(90,78,112,0.20) 100%
          );
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>
      <div
        className="profile-card-surface"
        style={{
          marginTop: 16,
          position: "relative",
          // Solid surface — was rgba(255,255,255,0.03) + backdrop-blur(12px).
          // The glass was sampling DotGridBackground's mint blob behind it,
          // tinting every low-contrast label on the card. #1A1530 reads a
          // touch lighter than #120e18 page bg so the card still feels
          // elevated, but nothing behind the card can bleed through.
          backgroundColor: "#1A1530",
          // Asymmetric corners — sharp top-left (the crown anchor), generous
          // 16px elsewhere. The ::before gradient uses border-radius: inherit
          // so it clips to these same corners automatically.
          borderRadius: "4px 16px 16px 16px",
          boxShadow:
            "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 8px 32px -8px rgba(0,0,0,0.4)",
          padding: 20,
          overflow: "hidden",
        }}
      >
      {/* Crown — 2px gradient line flush at the top edge. Mint left fades to
          transparent right. Clips to the asymmetric top corners (4px TL,
          16px TR). The card surface is solid below it so the crown is the
          only mint pigment in the card and can't bleed into label text. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(to right, #5CE0B8, transparent)",
          borderTopLeftRadius: 4,
          borderTopRightRadius: 16,
          pointerEvents: "none",
        }}
      />

      {/* Profile row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* Avatar — 1px plum inner border, 1.5px mint outline 4px outside */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "1px solid rgba(90, 78, 112, 0.3)",
            outline: "1.5px solid #5CE0B8",
            outlineOffset: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 500,
              fontSize: 16,
              color: "var(--text-muted)",
            }}
          >
            {initials}
          </span>
        </div>

        {/* Name + email */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 600,
              fontSize: 17,
              color: "var(--text-primary)",
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 11,
              color: "var(--text-muted)",
              marginTop: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {email}
          </div>
        </div>

        {/* PRO pill — filled bg only, no border / outline / shadow edge */}
        {isPro && (
          <div
            style={{
              marginLeft: "auto",
              backgroundColor: "rgba(92,224,184,0.08)",
              border: "none",
              boxShadow: "none",
              borderRadius: 4,
              paddingLeft: 10,
              paddingRight: 10,
              paddingTop: 4,
              paddingBottom: 4,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: 8,
                // Desaturated mint — the saturated #5CE0B8 reads too bright
                // on the low-alpha mint pill bg. #4DBFA0 keeps the mint
                // identity but sits at a quieter saturation level.
                color: "#4DBFA0",
              }}
            >
              PRO
            </span>
          </div>
        )}
      </div>

      {/* Dashed separator — repeating linear gradient on a 1px tall row.
          #3D2E55 dashes against the #1A1530 card surface read on device. */}
      <div
        style={{
          height: 1,
          width: "100%",
          background:
            "repeating-linear-gradient(to right, #3D2E55 0px, #3D2E55 5px, transparent 5px, transparent 10px)",
          margin: "14px 0 12px 0",
        }}
      />

      {/* Subscription */}
      <div>
        {/* Plan label — cool lavender-gray hex literal. Warmer plums shift
            warm/green-gray on OLED, this one stays neutral cool. */}
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            color: "#6B5F80",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}
        >
          Your plan
        </div>
        {/* Price — Outfit thin reads as luxury at 28px */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 300,
              fontSize: 28,
              color: "var(--text-primary)",
              fontFeatureSettings: '"tnum"',
              lineHeight: 1,
            }}
          >
            {price}
          </span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontWeight: 400,
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            {period}
          </span>
        </div>

        {/* Recessed stat cells */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 10,
          }}
        >
          <div
            style={{
              flex: 1,
              backgroundColor: "var(--bg-recessed)",
              borderRadius: 8,
              padding: 10,
              boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
            }}
          >
            <div style={cellLabel}>RENEWS</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 12,
                color: "var(--text-primary)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              {renewsDate}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: "var(--bg-recessed)",
              borderRadius: 8,
              padding: 10,
              boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
            }}
          >
            <div style={cellLabel}>SCANS</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 12,
                color: "var(--accent-mint)",
              }}
            >
              {scansLabel}
            </div>
          </div>
        </div>

        {/* Cancel — muted plum, brightens to primary text on hover */}
        <div
          onClick={onCancel}
          className="profile-card-cancel"
          style={{
            marginTop: 10,
            textAlign: "center",
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 400,
            fontSize: 12,
            cursor: "pointer",
            transition: "color 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          cancel anytime
        </div>
      </div>
      </div>
    </>
  );
}
