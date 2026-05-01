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

// Extremely dark blue-indigo, zero red, zero green warmth — OLED can't
// shift this toward green. Reads as "almost invisible dark blue" which is
// exactly what you want for annotation labels (whispers, not shouts).
const cellLabel: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains-mono), monospace",
  fontSize: 9,
  color: "#1E1A30",
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
          // Hero card surface — slightly lighter than #1A1530 so the card
          // visibly elevates above the settings tiles below. Solid (no
          // backdrop-blur) so DotGridBackground can't bleed mint through.
          backgroundColor: "#1E1838",
          // 6% mint border — won't read green, gives the card edge faint
          // warmth vs. the flat plum borders on tiles below. Combined with
          // the brighter surface this is the VIP-pass treatment.
          border: "1px solid rgba(92,224,184,0.06)",
          // Asymmetric corners — sharp top-left (the crown anchor), generous
          // 16px elsewhere. The ::before gradient uses border-radius: inherit
          // so it clips to these same corners automatically.
          borderRadius: "4px 16px 16px 16px",
          // Stronger drop shadow stack — on dark bg you need more weight to
          // register depth. Inset top highlight kept for the subtle sheen.
          boxShadow:
            "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 4px 24px -4px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)",
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

      {/* Inner glow — barely-perceptible warm spot anchored near the avatar
          for dimensionality. 3% mint at the focal point fades to transparent
          by 70% — won't tint text, just gives the card surface a sense of
          light source. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(92,224,184,0.03), transparent 70%)",
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
          #3D2E55 dashes against the #1E1838 card surface read on device. */}
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
        {/* Price — Outfit thin reads as luxury at 28px. Bright off-white
            with a cool tint so the price is unambiguously the hero figure. */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 300,
              fontSize: 28,
              color: "#E8E0F0",
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
          {/* RENEWS / SCANS pits — solid #120e18 (page bg) hex literal so
              the surface can't pick up ambient color via CSS variable. The
              cell behind the labels is what was tinting on OLED. */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#120e18",
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
              backgroundColor: "#120e18",
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
                // Soft mint halo — the brightest reward in the billing
                // section, so it should glow.
                textShadow: "0 0 16px rgba(92,224,184,0.35)",
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
