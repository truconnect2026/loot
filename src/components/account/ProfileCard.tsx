"use client";

import { useState } from "react";

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

// Cool blue-purple, zero red, zero green warmth — OLED can't shift this
// toward green. RENEWS / SCANS / SETTINGS all share the same color now;
// they're the same kind of annotation, they should match.
const cellLabel: React.CSSProperties = {
  // RENEWS / SCANS — uppercase category labels, stay in JetBrains Mono per
  // the font role system. Barely-there muted plum so the values dominate
  // the cells, not the labels.
  fontFamily: "var(--font-label)",
  fontWeight: 600,
  fontSize: 9,
  color: "#2D2845",
  letterSpacing: "0.08em",
  marginBottom: 4,
};

// Smart email split — keep the full domain, truncate only the local part.
// JS no longer hard-caps the local; instead the local span carries CSS
// `max-width` in `ch` units (10ch on phones, 20ch on tablet+) so the cut
// is character-aligned and adapts to the screen. The previous flex-only
// truncation produced ugly mid-word cuts at random pixel boundaries
// ("truconnectmarketingso…@gmail.com"); the JS hard cap fixed that on
// phones but stayed at 10 chars even on tablets. CSS-driven max-width
// gives both — clean cut points + responsive width.
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
          // Sweet spot — visibly elevated above tiles without reading gray.
          // #211C3D was a touch too washed out; #1E1838 keeps the dark purple.
          // Solid (no backdrop-blur) so DotGridBackground can't bleed mint.
          backgroundColor: "#1E1838",
          // Solid cool-purple border — was rgba(92,224,184,0.06) which may
          // have been contributing to the green perception around the card.
          // No mint anywhere on the card edge now.
          border: "1px solid #2D2845",
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
        {/* Avatar — 1px plum inner border, 1.5px decorative ring 4px outside.
            The ring is decorative atmosphere, not money — switched off mint
            to a cool desaturated tone per the role system. */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "1px solid rgba(90, 78, 112, 0.3)",
            outline: "1.5px solid rgba(116, 140, 150, 0.55)",
            outlineOffset: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
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
              fontFamily: "var(--font-body)",
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
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "var(--text-muted)",
              minWidth: 0,
            }}
          >
            <span
              className="loot-email-local"
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
            {/* Responsive cap on the local part. ch units = roughly the
                width of '0' in the current font, which is close enough
                to "fit N characters" for monospace and proportional
                bodies alike. 10ch fits "truconnect…" on phones; 20ch
                fits "truconnectmarketing…" on tablet+. The flex
                ellipsis kicks in if the container is even narrower. */}
            <style>{`
              .loot-email-local { max-width: 10ch; }
              @media (min-width: 640px) {
                .loot-email-local { max-width: 20ch; }
              }
            `}</style>
          </div>
        </div>

        {/* PRO badge — solid camel fill with dark text. Reads as a
            tier marker the user has *earned*, not a quiet outline.
            Dark text on the warm fill keeps it premium without
            shouting; mint stays reserved for money. */}
        {isPro && (
          <div
            style={{
              marginLeft: "auto",
              backgroundColor: "var(--accent-camel)",
              border: "none",
              boxShadow: "none",
              borderRadius: 4,
              padding: "4px 9px",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: "0.04em",
                color: "var(--bg-page)",
              }}
            >
              PRO
            </span>
          </div>
        )}
      </div>

      {/* Solid hairline separator — the dashed pattern was disappearing on
          device. Plain 1px line at #4A3D65 reads cleanly against the card
          surface. Bump to #5A4E70 if this still doesn't show. */}
      <div
        aria-hidden="true"
        style={{
          height: 1,
          width: "100%",
          background: "#4A3D65",
          margin: "14px 0 10px 0",
        }}
      />

      {/* Subscription — left-aligned reading order: label → price → cells →
          cancel. Nothing in this section is centered. */}
      <div>
        {/* Plan label — cool lavender-gray hex literal. Warmer plums shift
            warm/green-gray on OLED, this one stays neutral cool. */}
        <div
          style={{
            fontFamily: "var(--font-body)",
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
              fontFamily: "var(--font-body)",
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
              fontFamily: "var(--font-body)",
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
          {/* RENEWS / SCANS pits — solid #120e18 (page bg) hex literal so
              the surface can't pick up ambient color via CSS variable.
              1px #2D2845 border (matches the SETTINGS-label/card-border
              cool purple) so the cells read as defined containers, not as
              floating shapes whose edges might inherit any ambient tint. */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#120e18",
              border: "1px solid #2D2845",
              borderRadius: 8,
              padding: 10,
              boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
            }}
          >
            <div style={cellLabel}>RENEWS</div>
            <div
              style={{
                fontFamily: "var(--font-body)",
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
              backgroundColor: "#120e18",
              border: "1px solid #2D2845",
              borderRadius: 8,
              padding: 10,
              boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
            }}
          >
            <div style={cellLabel}>SCANS</div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                // "unlimited" is a feature label, not currency. Off-mint per
                // the role system; the value still reads as a benefit because
                // of the word, not the color.
                color: "var(--text-primary)",
              }}
            >
              {scansLabel}
            </div>
          </div>
        </div>

        {/* PRO members benchmark — promoted from a footnote to the
            second-most-prominent line in the plan card after the price.
            This is the most persuasive copy in the app (it's what a
            reseller is paying for) and it should read as a confident
            stat, not a caption. Body now at 15px / 80% white; the
            $1,200/mo span is mint at 800 weight so the dollar number
            is unambiguously the hero of the line. Static at launch;
            backed by a Supabase aggregate (avg monthly realized profit
            across active PRO accounts) once that view exists. */}
        {isPro && (
          <div
            style={{
              marginTop: 12,
              fontFamily: "var(--font-body)",
              fontSize: 15,
              fontWeight: 500,
              color: "rgba(255,255,255,0.80)",
              lineHeight: 1.35,
            }}
          >
            PRO members average{" "}
            <span
              style={{
                color: "var(--money)",
                fontWeight: 800,
                fontSize: 16,
                fontFeatureSettings: '"tnum"',
              }}
            >
              $1,200/mo
            </span>
            {" "}in flips found
          </div>
        )}

        {/* Manage plan — was "cancel anytime", which read as a warning
            and put the user's brain on the cancel path. Reframed as a
            functional link to the Stripe portal, where they can change
            plan, update payment, or cancel if they want. Same target,
            different framing.

            Promoted from a subtle text link to a full-width bordered
            pill so it reads as an intentional action, not an
            afterthought caption. The ↗ stays as the external-link cue.
            Sits last in the card with a small top margin separating
            it from the "PRO members average" benchmark above.

            The parent's onCancel handler MUST open the Stripe portal in
            a new tab via window.open(url, "_blank", "noopener,noreferrer")
            so the user keeps their place in Loot. Stripe customer-portal
            sessions return on close to a configured return_url; that
            return_url should also point back to /account so the loop
            completes cleanly even if the user navigates within Stripe. */}
        <ManagePlanButton onTap={onCancel} />
      </div>
      </div>
    </>
  );
}

interface ManagePlanButtonProps {
  onTap: () => void;
}

// Full-width bordered pill, white text, subtle white-alpha edge — same
// pill language as the EmptyHero CTA so the action reads as a peer of
// other primary affordances in the app, not as a footer link. Press
// state mirrors GoogleButton/SendButton (scale 0.98, brighter bg) so
// taps feel acknowledged without being theatrical.
function ManagePlanButton({ onTap }: ManagePlanButtonProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onClick={onTap}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        marginTop: 14,
        width: "100%",
        height: 40,
        backgroundColor: pressed
          ? "rgba(255,255,255,0.08)"
          : "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: pressed
          ? "0 0 0 1px rgba(255,255,255,0.22), 0 0 16px -4px rgba(255,255,255,0.16)"
          : "inset 0 1px 0 0 rgba(255,255,255,0.10), 0 1px 2px rgba(0,0,0,0.3)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        cursor: "pointer",
        padding: 0,
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: 13,
          color: "var(--ui-primary)",
          letterSpacing: "0.01em",
        }}
      >
        Manage plan
      </span>
      {/* External-link cue — inline SVG instead of the Unicode ↗
          glyph. iOS Safari renders U+2197 as a colored emoji
          (looks like an embossed blue square), which read as a
          rogue UI element rather than a text glyph. SVG with
          currentColor matches the button text exactly: stroke
          white, no fill, no background shape. */}
      <svg
        aria-hidden="true"
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          color: "var(--ui-primary)",
          flexShrink: 0,
        }}
      >
        <line x1={7} y1={17} x2={17} y2={7} />
        <polyline points="7 7 17 7 17 17" />
      </svg>
    </button>
  );
}
