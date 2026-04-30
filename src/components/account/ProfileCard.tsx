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
  // RENEWS / SCANS context annotations — barely-there muted plum so the
  // values dominate the cells, not the labels.
  fontFamily: "var(--font-outfit), sans-serif",
  fontWeight: 600,
  fontSize: 9,
  color: "#3D2E55",
  letterSpacing: "0.08em",
  marginBottom: 4,
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
          borderRadius: "4px 16px 16px 16px",
          // Foreground-plane shadow — lifts the profile card above the
          // settings tiles below.
          boxShadow:
            "0 4px 24px -4px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.2)",
          padding: "20px 20px 16px 20px",
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
        {/* Avatar — outline ring sits 2.5px outside the avatar edge. Static,
            quiet, confident — the page's visual anchor. */}
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

        {/* PRO badge — register on second glance. Reduced bg + dimmer mint
            text so the user's name reads first. */}
        {isPro && (
          <div
            style={{
              marginLeft: "auto",
              backgroundColor: "rgba(92,224,184,0.08)",
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
                color: "#4DBFA0",
              }}
            >
              PRO
            </span>
          </div>
        )}
      </div>

      {/* Dashed separator — divides identity (above) from billing (below).
          Uses a repeating-linear-gradient instead of `border: dashed` so the
          dash size stays consistent across browsers (Safari renders dashed
          borders as small dots otherwise). */}
      <div
        aria-hidden="true"
        style={{
          marginTop: 16,
          marginBottom: 14,
          height: 1,
          backgroundImage:
            "repeating-linear-gradient(to right, #2A2240 0px, #2A2240 6px, transparent 6px, transparent 12px)",
        }}
      />

      {/* Subscription — left-aligned reading order: label → price → cells →
          cancel. Nothing in this section is centered. */}
      <div>
        {/* Tiny context label so the price doesn't float without anchor */}
        <div
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 500,
            fontSize: 11,
            color: "#5A4E70",
            letterSpacing: "0.04em",
            marginBottom: 2,
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

        {/* Recessed stat cells — tighter padding so they read as precision
            slots, not empty rooms. "unlimited" gets a subtle mint glow as a
            micro-reward for the pro user. */}
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
              borderRadius: "3px 8px 8px 8px",
              padding: "8px 10px",
              boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
            }}
          >
            <div style={cellLabel}>RENEWS</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 12,
                color: "#C8C0D8",
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
              borderRadius: "3px 8px 8px 8px",
              padding: "8px 10px",
              boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
            }}
          >
            <div style={cellLabel}>SCANS</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 12,
                color: "#5CE0B8",
                textShadow: "0 0 12px rgba(92,224,184,0.15)",
              }}
            >
              {scansLabel}
            </div>
          </div>
        </div>

        {/* Cancel anytime — legal reassurance, not a CTA. Muted plum, left-
            aligned, smallest text on the card. Tighter top margin so the
            billing block reads as one compact group. */}
        <div
          onClick={onCancel}
          style={{
            marginTop: 4,
            textAlign: "left",
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 500,
            fontSize: 11,
            color: "#5A4E70",
            cursor: "default",
          }}
        >
          cancel anytime
        </div>
      </div>
      </div>
    </>
  );
}
