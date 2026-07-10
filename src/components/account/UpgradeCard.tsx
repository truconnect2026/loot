"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Minimum count before social proof copy renders. Below this threshold
// nothing is displayed — no guesses, no fabricated stats.
const SOCIAL_PROOF_MIN = 500;

// Gold is the app's Pro/emphasis color (the same camel the PRO badge
// and savings callout already use across the app).
const GOLD = "#D4A574";

interface UpgradeCardProps {
  /** Stripe price IDs — pulled from the build-time
   * NEXT_PUBLIC_STRIPE_PRICE_{MONTHLY,ANNUAL} env vars by the parent. */
  monthlyPriceId: string;
  annualPriceId: string;
  onSubscribe: (priceId: string) => void;
  /** Real registered-user count from the profiles table. Undefined until
   *  the parent's async fetch resolves. */
  memberCount?: number;
}

/**
 * THE PRO INSTRUMENT — free-user variant of the plan card, rebuilt on
 * brand: the old blue-purple gradient frame is gone. Deep #070510
 * face, mint hairline, house depth; gold reserved for Pro identity
 * (the PRO eyebrow, the POPULAR corner tab, the savings callout).
 *
 * Both tiles still call onSubscribe (tap = checkout, unchanged); the
 * MONTHLY tile is the highlighted plan — mint edge + fill tint —
 * exactly as its `primary` flag always marked it, and the ANNUAL tile
 * stays calm. Zero flow changes: props, price IDs, disabled logic and
 * copy semantics are identical to the previous revision.
 *
 * ONE flourish: a slow gold edge-glint orbiting the selected plan
 * (house border-beam recipe, 6s) — the whisper sits on the object
 * that closes the sale, in the app's existing living-edge language,
 * while the wordmark and prices stay print-solid like a receipt.
 * Trust over theater: everything else on this surface is still.
 * IntersectionObserver pauses it off-screen; reduced-motion removes
 * it entirely.
 */
export default function UpgradeCard({
  monthlyPriceId,
  annualPriceId,
  onSubscribe,
  memberCount,
}: UpgradeCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleTap = (priceId: string) => {
    onSubscribe(priceId);
  };

  return (
    <div
      ref={rootRef}
      className={inView ? "upc" : "upc upc--paused"}
      style={{
        marginTop: 16,
        position: "relative",
        borderRadius: 18,
        backgroundColor: "#070510",
        backgroundImage:
          "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(92, 224, 184, 0.09) 0%, transparent 60%)",
        border: "1px solid rgba(92, 224, 184, 0.22)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.09), 0 -2px 18px -8px rgba(92,224,184,0.16), 0 12px 32px -12px rgba(0,0,0,0.6)",
        padding: 20,
        overflow: "hidden",
      }}
    >
      <style>{STYLES}</style>

      {/* Eyebrow — gold owns the Pro identity */}
      <div
        style={{
          fontFamily: "var(--font-space-mono), monospace",
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.18em",
          marginBottom: 6,
          display: "inline-flex",
          alignItems: "center",
          color: GOLD,
        }}
      >
        <span style={{ fontSize: 14, marginRight: 6, lineHeight: 1 }}>✦</span>
        <span>UPGRADE TO PRO</span>
      </div>

      {/* Headline — display type */}
      <div
        style={{
          fontFamily: "var(--font-bebas-neue), sans-serif",
          fontSize: 27,
          letterSpacing: "0.03em",
          color: "#EDE7F8",
          marginBottom: 2,
          lineHeight: 1.05,
        }}
      >
        UNLIMITED SCANS, UNLOCKED FEEDS
      </div>
      {memberCount !== undefined && memberCount >= SOCIAL_PROOF_MIN && (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12.5,
            color: "#5CE0B8",
            fontWeight: 600,
          }}
        >
          join {Math.floor(memberCount / 100) * 100}+ flippers
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
        <PriceOption
          label="MONTHLY"
          price="$14.99"
          period="/mo"
          note="cancel anytime"
          disabled={!monthlyPriceId}
          onTap={() => handleTap(monthlyPriceId)}
          primary
          popular
        />
        <PriceOption
          label="ANNUAL"
          price="$99.99"
          period="/yr"
          note={
            <>
              save{" "}
              <span style={{ color: GOLD, fontWeight: 700 }}>$80</span>{" "}
              — 5 months free
            </>
          }
          disabled={!annualPriceId}
          onTap={() => handleTap(annualPriceId)}
          primary={false}
        />
      </div>

      {/* Feature checklist — 2×2 grid, mint checks, legible */}
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "7px 12px",
        }}
      >
        {["unlimited scans", "condition grading", "flip coach", "batch listings"].map(
          (feat) => (
            <div
              key={feat}
              style={{ display: "flex", alignItems: "center", gap: 7 }}
            >
              <svg
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5CE0B8"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11.5,
                  color: "#B9B0CC",
                }}
              >
                {feat}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

interface PriceOptionProps {
  label: string;
  price: string;
  period: string;
  note: ReactNode;
  disabled: boolean;
  primary: boolean;
  popular?: boolean;
  onTap: () => void;
}

function PriceOption({
  label,
  price,
  period,
  note,
  disabled,
  primary,
  popular = false,
  onTap,
}: PriceOptionProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        // Two-row plan tile. The selected (primary) plan reads
        // unmistakably selected: mint edge + mint fill tint + the gold
        // glint; the other stays calm on hairline white.
        position: "relative",
        textAlign: "left",
        padding: "13px 14px 12px",
        borderRadius: 13,
        backgroundColor: "#0B0817",
        backgroundImage: pressed
          ? "linear-gradient(rgba(255,255,255,0.14), rgba(255,255,255,0.14))"
          : primary
            ? "linear-gradient(180deg, rgba(92,224,184,0.13) 0%, rgba(92,224,184,0.03) 100%)"
            : "linear-gradient(rgba(255,255,255,0.045), rgba(255,255,255,0.045))",
        border: primary
          ? "1px solid rgba(92,224,184,0.5)"
          : "1px solid rgba(255,255,255,0.10)",
        boxShadow: pressed
          ? "0 0 0 1px rgba(92,224,184,0.5), 0 0 16px -5px rgba(92,224,184,0.5)"
          : primary
            ? "inset 0 1px 0 0 rgba(255,255,255,0.10), 0 4px 14px -6px rgba(92,224,184,0.25)"
            : "inset 0 1px 0 0 rgba(255,255,255,0.07), 0 1px 2px rgba(0,0,0,0.3)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        overflow: "hidden",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 120ms ease",
      }}
    >
      {/* the ONE flourish: slow gold edge-glint on the selected plan */}
      {primary && (
        <span className="upc-glint" aria-hidden="true">
          <span className="upc-glint-spin" />
        </span>
      )}
      {/* POPULAR — gold corner tab, tucked INTO the card corner */}
      {popular && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            zIndex: 2,
            backgroundColor: "rgba(212, 165, 116, 0.16)",
            borderLeft: "1px solid rgba(212, 165, 116, 0.28)",
            borderBottom: "1px solid rgba(212, 165, 116, 0.28)",
            padding: "3px 9px 4px",
            borderRadius: "0 12px 0 10px",
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "#E2B888",
            textTransform: "uppercase",
            lineHeight: 1.2,
          }}
        >
          POPULAR
        </span>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-label)",
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: "0.12em",
            color: primary ? "#5CE0B8" : "rgba(255,255,255,0.6)",
          }}
        >
          {label}
        </span>
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 2, paddingRight: popular ? 52 : 0 }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              fontSize: 22,
              color: "#EFE9FA",
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
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {period}
          </span>
        </span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: primary ? "rgba(92,224,184,0.8)" : "rgba(255,255,255,0.5)",
        }}
      >
        {note}
      </div>
    </button>
  );
}

const STYLES = `
/* gold edge-glint — house border-beam recipe (ring mask + rotating
   conic arc), gold, slow. The only motion on this surface. */
.upc-glint {
  position: absolute; inset: 0; border-radius: 13px; padding: 1.5px;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  overflow: hidden; pointer-events: none;
  opacity: 0.6;
}
.upc-glint-spin {
  position: absolute; left: -55%; top: -220%; width: 210%; height: 540%;
  background: conic-gradient(transparent 0deg 316deg, rgba(212,165,116,0.9) 342deg, transparent 360deg);
  animation: upcGlint 6s linear infinite;
}
@keyframes upcGlint { to { transform: rotate(360deg); } }
.upc--paused .upc-glint-spin { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .upc-glint { display: none; }
}
`;
