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

const cellLabel: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains-mono), monospace",
  fontSize: 9,
  color: "var(--text-muted)",
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
          color: rgba(232, 99, 107, 0.6);
        }
        .profile-card-cancel:hover {
          color: rgba(232, 99, 107, 0.9);
        }
        /* Gradient border via mask-composite — bright at top-left, mint kicker
           at bottom-right. Sits above the card without affecting layout. */
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
            rgba(92,224,184,0.20) 100%
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
          // Glass tint — gradient border is the rim, no solid border underneath.
          backgroundColor: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: "4px 14px 14px 14px",
          boxShadow:
            "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 8px 32px -8px rgba(0,0,0,0.4)",
          padding: 20,
        }}
      >
      {/* Profile row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "1px solid rgba(90, 78, 112, 0.3)",
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

        {/* PRO pill */}
        {isPro && (
          <div
            style={{
              marginLeft: "auto",
              backgroundColor: "var(--accent-mint-surface)",
              border: "1px solid var(--accent-mint-border)",
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
                color: "var(--accent-mint)",
              }}
            >
              PRO
            </span>
          </div>
        )}
      </div>

      {/* Dashed separator */}
      <div
        style={{
          marginTop: 16,
          marginBottom: 16,
          borderTop: "2px dashed var(--border-default)",
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--border-default) 0, var(--border-default) 2px, transparent 2px, transparent 8px)",
          backgroundSize: "8px 2px",
          backgroundRepeat: "repeat-x",
          height: 0,
          border: "none",
        }}
      />

      {/* Subscription */}
      <div>
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

        {/* Cancel — desaturated red, brightens slightly on hover */}
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
