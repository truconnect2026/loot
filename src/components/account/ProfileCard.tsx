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

// Smart email split — keep the full domain, truncate only the local part so
// "truconnectmarketingsolutions@gmail.com" reads as "truconnect…@gmail.com"
// instead of "truconnectmarketingsolutions@g…". The domain anchors identity.
function splitEmail(email: string): { local: string; domain: string } {
  const at = email.lastIndexOf("@");
  if (at === -1) return { local: email, domain: "" };
  return { local: email.slice(0, at), domain: email.slice(at) };
}

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
  const { local, domain } = splitEmail(email);

  return (
    <>
      <style>{`
        .profile-card-cancel {
          color: rgba(232, 99, 107, 0.6);
        }
        .profile-card-cancel:hover {
          color: rgba(232, 99, 107, 0.9);
        }
      `}</style>
      <div
        style={{
          position: "relative",
          marginTop: 16,
          // Glass — slightly heavier wash than the previous 0.03 so the card
          // reads as a foreground plane on the periwinkle ambient.
          backgroundColor: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "4px 14px 14px 14px",
          // Foreground-plane shadow — lifts the profile card above the
          // settings tiles below.
          boxShadow:
            "0 4px 24px -4px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.2)",
          padding: 20,
          overflow: "hidden",
        }}
      >
        {/* Crown — 2px gradient line flush at the very top. Mint left → camel
            right. This is the profile card's signature; doesn't appear on any
            other element in the app. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(to right, #5CE0B8 0%, #D4A574 100%)",
            borderTopLeftRadius: 4,
            borderTopRightRadius: 14,
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
        {/* Avatar — outline ring sits 2.5px outside the avatar edge. Static,
            quiet, confident — the page's visual anchor. */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "1px solid rgba(90, 78, 112, 0.3)",
            outline: "1.5px solid #5CE0B8",
            outlineOffset: "2.5px",
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

        {/* Name + email. Email truncates only the local part so the @domain
            stays fully visible — identity comes from the domain, not the
            random middle of the alias. */}
        <div style={{ minWidth: 0, flex: 1 }}>
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
              marginTop: 4,
              display: "flex",
              alignItems: "baseline",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 11,
              color: "var(--text-muted)",
              minWidth: 0,
            }}
          >
            <span
              style={{
                flexShrink: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {local}
            </span>
            {domain && (
              <span style={{ flexShrink: 0 }}>{domain}</span>
            )}
          </div>
        </div>

        {/* PRO badge — quiet status indicator, not a button. Filled mint at
            12% with no border so it doesn't compete with the user's name. */}
        {isPro && (
          <div
            style={{
              marginLeft: "auto",
              backgroundColor: "rgba(92,224,184,0.12)",
              border: "none",
              borderRadius: 4,
              padding: "3px 8px",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: 10,
                color: "#5CE0B8",
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
