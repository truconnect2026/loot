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
 * THE PRO INSTRUMENT — theater pass. On-brand face (#070510, mint
 * hairline, gold = Pro identity), and now the card does arithmetic in
 * front of you: THE MATH MOMENT — the annual plan's "$80" savings
 * counts up 0→80 in gold ONCE when the card first enters the viewport
 * (800ms, tabular digits, width reserved so nothing shifts), then
 * stays print-solid forever. Loss-aversion made visible, then
 * trustworthy stillness.
 *
 * Selection reality: a tap IS the checkout (both tiles call
 * onSubscribe immediately — there is no selection state; MONTHLY's
 * highlight is a static recommendation). So the decision theater is a
 * press-state charge-up — one lap of accent light around the tile's
 * perimeter on pointer-down (the login-input recipe; mint on the
 * highlighted plan, gold on annual) — arming the purchase, not faking
 * a selector.
 *
 * Flow unchanged: props, price IDs, disabled logic, tap targets all
 * byte-equivalent to the previous revision. Reduced motion: no charge,
 * static star, "$80" renders final instantly.
 */
export default function UpgradeCard({
  monthlyPriceId,
  annualPriceId,
  onSubscribe,
  memberCount,
}: UpgradeCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [savings, setSavings] = useState(0);
  const countedRef = useRef(false);
  const rafRef = useRef(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    try {
      setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch { /* default: animate */ }
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        // THE MATH MOMENT — one-shot on first sight, never loops.
        if (entry.isIntersecting && !countedRef.current) {
          countedRef.current = true;
          let prefersReduced = false;
          try {
            prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          } catch { /* animate */ }
          if (prefersReduced) {
            setSavings(80);
            return;
          }
          const t0 = performance.now();
          const tick = (now: number) => {
            const t = Math.min((now - t0) / 800, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setSavings(Math.round(80 * eased));
            if (t < 1) rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
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
        <span
          className="upc-star"
          style={{ fontSize: 14, marginRight: 6, lineHeight: 1 }}
        >
          ✦
        </span>
        <span>UPGRADE TO PRO</span>
      </div>

      {/* Headline — display type, deliberate two-line break at the
          comma (the auto-wrap orphaned "FEEDS" on its own line).
          Each half is nowrap so no viewport width can ever re-break
          a line mid-thought — the break is markup, not font-size luck. */}
      <div
        style={{
          fontFamily: "var(--font-bebas-neue), sans-serif",
          fontSize: 28,
          letterSpacing: "0.03em",
          color: "#EDE7F8",
          marginBottom: 2,
          lineHeight: 1.04,
        }}
      >
        <span style={{ whiteSpace: "nowrap" }}>UNLIMITED SCANS,</span>
        <br />
        <span style={{ whiteSpace: "nowrap" }}>UNLOCKED FEEDS</span>
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
          reduced={reduced}
        />
        <PriceOption
          label="ANNUAL"
          price="$99.99"
          period="/yr"
          note={
            <>
              save{" "}
              <span
                style={{
                  color: GOLD,
                  fontWeight: 700,
                  textShadow: "0 0 10px rgba(212,165,116,0.55)",
                }}
              >
                {/* width reserved (3ch, tabular) so the count-up never
                    shifts layout; renders "$80" instantly under
                    reduced motion */}
                <span
                  style={{
                    display: "inline-block",
                    minWidth: "3ch",
                    fontFeatureSettings: '"tnum"',
                  }}
                >
                  ${savings}
                </span>
              </span>{" "}
              — 5 months free
            </>
          }
          disabled={!annualPriceId}
          onTap={() => handleTap(annualPriceId)}
          primary={false}
          reduced={reduced}
        />
      </div>

      {/* Feature checklist — these four items ARE the product */}
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px 12px",
        }}
      >
        {["unlimited scans", "condition grading", "flip coach", "batch listings"].map(
          (feat) => (
            <div
              key={feat}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5CE0B8"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  flexShrink: 0,
                  filter: "drop-shadow(0 0 4px rgba(92,224,184,0.55))",
                }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.66)",
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
  reduced: boolean;
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
  reduced,
  onTap,
}: PriceOptionProps) {
  const [pressed, setPressed] = useState(false);
  const [chargeKey, setChargeKey] = useState(0);
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      onPointerDown={() => {
        setPressed(true);
        // charge-up press: one perimeter lap per touch (login recipe)
        if (!reduced) setChargeKey((k) => k + 1);
      }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={
        {
          "--cacc": primary ? "rgba(92,224,184,0.95)" : "rgba(212,165,116,0.95)",
          // The highlighted plan reads unmistakably highlighted:
          // mint edge 0.62 + fill 0.20 + under-glow 0.38 (was
          // 0.5 / 0.13 / 0.25 pre-theater). The other stays calm.
          position: "relative",
          textAlign: "left",
          padding: "13px 14px 12px",
          borderRadius: 13,
          backgroundColor: "#0B0817",
          backgroundImage: pressed
            ? "linear-gradient(rgba(255,255,255,0.14), rgba(255,255,255,0.14))"
            : primary
              ? "linear-gradient(180deg, rgba(92,224,184,0.20) 0%, rgba(92,224,184,0.05) 100%)"
              : "linear-gradient(rgba(255,255,255,0.05), rgba(255,255,255,0.05))",
          border: primary
            ? "1px solid rgba(92,224,184,0.62)"
            : "1px solid rgba(255,255,255,0.12)",
          boxShadow: pressed
            ? "0 0 0 1px var(--cacc), 0 0 16px -5px var(--cacc)"
            : primary
              ? "inset 0 1px 0 0 rgba(255,255,255,0.10), 0 6px 18px -6px rgba(92,224,184,0.38)"
              : "inset 0 1px 0 0 rgba(255,255,255,0.07), 0 1px 2px rgba(0,0,0,0.3)",
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.5 : 1,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          overflow: "hidden",
          transform: pressed && !reduced ? "scale(0.98)" : "scale(1)",
          transition: reduced
            ? "none"
            : "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 120ms ease",
        } as React.CSSProperties
      }
    >
      {/* charge-up press — one lap of accent light around the perimeter.
          (The idle gold edge-glint was killed here: a perpetual traveling
          light on a price card reads as sell-pressure, and its beam
          painted through the translucent POPULAR tab as a smudge. The
          press charge owns the premium cue at the moment of intent.) */}
      {chargeKey > 0 && !reduced && (
        <span key={chargeKey} className="upc-charge" aria-hidden="true">
          <span className="upc-charge-spin" />
        </span>
      )}
      {/* POPULAR — gold corner tab, tucked INTO the card corner.
          Its outer radius (11) deliberately undercuts the tile's inner
          curve (outer 13 − 1px border = 12) so the overflow clip can
          never shave a fringe off the tab at any device pixel ratio. */}
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
            borderRadius: "0 11px 0 10px",
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
              color: "rgba(255,255,255,0.55)",
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
          color: primary ? "rgba(92,224,184,0.8)" : "rgba(255,255,255,0.55)",
        }}
      >
        {note}
      </div>
    </button>
  );
}

const STYLES = `
/* eyebrow star — ambient whisper twinkle, the card's only idle life.
   Opacity-only, 4s, paused off-screen; static under reduced motion. */
.upc-star { display: inline-block; animation: upcTwinkle 4s ease-in-out infinite; }
@keyframes upcTwinkle { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.upc--paused .upc-star { animation-play-state: paused !important; }

/* charge-up press — one perimeter lap per pointer-down (login recipe) */
.upc-charge {
  position: absolute; inset: 0; border-radius: 13px; padding: 1.5px;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  overflow: hidden; pointer-events: none;
  animation: upcChargeFade 700ms ease-out both;
}
.upc-charge-spin {
  position: absolute; left: -55%; top: -220%; width: 210%; height: 540%;
  background: conic-gradient(transparent 0deg 285deg, var(--cacc, rgba(92,224,184,0.95)) 330deg, transparent 360deg);
  animation: upcChargeSpin 420ms ease-out both;
}
@keyframes upcChargeSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes upcChargeFade { 0%, 55% { opacity: 1; } 100% { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .upc-star { animation: none; }
  .upc-charge { display: none; }
}
`;
