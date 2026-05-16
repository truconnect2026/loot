"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/**
 * /pro — public Digistore-driven Pro landing page.
 *
 * Mirrors the Loot Landing design (see Claude Design bundle) with three
 * deliberate modifications:
 *
 *   1. Hero CTA replaced with a side-by-side MONTHLY / ANNUAL pricing
 *      block. Both tiles link directly to the Digistore checkout
 *      (no Stripe, no PWA install pitch).
 *   2. Money-back guarantee line under pricing.
 *   3. New mandatory Digistore footer (privacy / terms / contact /
 *      business address / trust-badge slot).
 *
 * The route is intentionally outside the middleware matcher in
 * src/middleware.ts (which only covers /, /app/*, /account/*,
 * /onboarding/*) so this page is fully public — affiliate buyers
 * landing here are not redirected through auth.
 *
 * Tokens: design hex literals (#5CE0B8 mint, #D4A574 camel, #7B8FFF
 * periwinkle, #C8C0D8 text-primary, #5A4E70 text-muted, #120e18 page
 * bg) all line up 1:1 with the repo's CSS vars in globals.css. Fonts
 * use var(--font-body) and var(--font-jetbrains-mono) so they pick up
 * the next/font instances loaded in app/layout.tsx.
 *
 * Keyframes + responsive grid rules are namespaced with a `pro-`
 * prefix and emitted via a single <style> block at the top of the
 * page, so they don't collide with globals.css's animation set.
 */

const DIGISTORE_CHECKOUT_URL = "https://www.checkout-ds24.com/product/691098";

const FONT_BODY = "var(--font-body)";
const FONT_MONO = "var(--font-jetbrains-mono), monospace";

const PAGE_STYLES = `
  .pro-page { --pro-dot-op: 0.18; }
  .pro-dot-grid-layer {
    pointer-events: none;
    background-image: radial-gradient(circle, rgba(92,224,184,0.45) 1px, transparent 1px);
    background-size: 24px 24px;
    animation: pro-dotPulse 4s ease-in-out infinite;
  }
  @keyframes pro-dotPulse {
    0%, 100% { opacity: var(--pro-dot-op, 0.18); }
    50%      { opacity: calc(var(--pro-dot-op, 0.18) * 0.6); }
  }
  @keyframes pro-coinFall {
    0%   { transform: translateY(-3vh) translateX(0) rotate(0deg); opacity: 0; }
    6%   { opacity: 0.65; }
    92%  { opacity: 0.65; }
    100% { transform: translateY(108vh) translateX(var(--drift, 30px)) rotate(540deg); opacity: 0; }
  }
  .pro-coin-particle { animation: pro-coinFall 12s linear infinite; }
  @keyframes pro-cardFloat {
    0%, 100% { transform: translateY(0)    rotate(var(--rot, 0deg)); }
    50%      { transform: translateY(-12px) rotate(var(--rot, 0deg)); }
  }
  .pro-flip-card-float { animation: pro-cardFloat 6s ease-in-out infinite; }
  @keyframes pro-scanSweep {
    0%, 100% { top: 20%; opacity: 0.4; }
    50%      { top: 75%; opacity: 1;   }
  }
  .pro-scan-line { animation: pro-scanSweep 2s ease-in-out infinite; }
  @keyframes pro-scrollBounce {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(6px); }
  }
  .pro-scroll-bounce { animation: pro-scrollBounce 1.8s ease-in-out infinite; }
  @keyframes pro-mintDotPulse {
    0%, 100% { opacity: 1;    box-shadow: 0 0 6px rgba(92,224,184,0.6); }
    50%      { opacity: 0.35; box-shadow: 0 0 10px rgba(92,224,184,0.4); }
  }
  .pro-mint-dot-pulse { animation: pro-mintDotPulse 2.2s ease-in-out infinite; }

  .pro-hero-headline    { font-size: clamp(40px, 6.5vw, 96px) !important; }
  .pro-section-headline { font-size: 36px !important; }
  .pro-problem-grid     { grid-template-columns: 1fr; }
  .pro-steps-grid       { display: grid; grid-template-columns: 1fr; gap: 56px; }
  .pro-connect-line-h   { display: none; }
  .pro-connect-line-v   { display: block; }
  .pro-features-grid    { display: grid; grid-template-columns: 1fr; gap: 16px; }
  .pro-testimonials-wrap { display: flex; flex-direction: column; gap: 16px; }
  .pro-credibility-strip { min-height: 12vh; }
  .pro-credibility-text  { font-size: clamp(11px, 2.5vw, 14px) !important; }
  .pro-pricing-grid      { grid-template-columns: 1fr !important; }

  @media (hover: hover) {
    .pro-feature-card:hover {
      border-color: rgba(92,224,184,0.28) !important;
      transform: translateY(-2px);
    }
    .pro-price-tile:hover {
      border-color: rgba(92,224,184,0.55) !important;
      transform: translateY(-2px);
    }
  }
  @media (min-width: 640px) {
    .pro-features-grid { grid-template-columns: 1fr 1fr; }
    .pro-pricing-grid  { grid-template-columns: 1fr 1fr !important; }
  }
  @media (min-width: 768px) {
    .pro-hero-headline    { font-size: clamp(48px, 5.5vw, 72px) !important; }
    .pro-section-headline { font-size: 48px !important; }
    .pro-credibility-strip { min-height: 10vh; }
    .pro-credibility-text  { font-size: 15px !important; }
    .pro-testimonials-wrap {
      flex-direction: row; overflow-x: auto; gap: 20px; padding-bottom: 8px;
      scrollbar-width: thin; scrollbar-color: rgba(92,224,184,0.15) transparent;
    }
    .pro-testimonial-card-wrap { min-width: 290px; flex: 0 0 auto; }
  }
  @media (min-width: 1024px) {
    .pro-hero-headline      { font-size: clamp(72px, 6.5vw, 96px) !important; }
    .pro-section-headline   { font-size: 64px !important; }
    .pro-page section:first-of-type { min-height: 90vh !important; }
    .pro-problem-grid       { grid-template-columns: 1fr 1fr; }
    .pro-steps-grid         { grid-template-columns: 1fr 1fr 1fr; gap: 40px; }
    .pro-connect-line-h     { display: block; }
    .pro-connect-line-v     { display: none; }
    .pro-features-grid      { grid-template-columns: 1fr 1fr 1fr; gap: 18px; }
    .pro-testimonials-wrap  { gap: 24px; }
    .pro-testimonial-card-wrap { min-width: 270px; }
  }
  @media (min-width: 1440px) {
    .pro-features-grid { gap: 20px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pro-page *, .pro-page *::before, .pro-page *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  /* Legal footer links — Privacy/Terms/copyright row at the bottom
     of the page. Class instead of inline style so the :hover state
     works (inline styles can't carry pseudo-class transitions). */
  .pro-legal-link {
    font: 500 10px/1 var(--font-jetbrains-mono), monospace;
    letter-spacing: 0.04em;
    color: rgba(255,255,255,0.4);
    text-decoration: none;
    transition: color 150ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  a.pro-legal-link:hover {
    color: rgba(255,255,255,0.7);
  }
`;

// ─── Saturn coin mark ──────────────────────────────────────────────────────
function CoinMark({ size = 28, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        filter: glow ? "drop-shadow(0 0 14px rgba(92,224,184,0.55))" : "none",
        flexShrink: 0,
      }}
    >
      <path
        d="M 18.49 12.26 A 11 3.5 -25 0 0 5.51 11.74"
        stroke="#5CE0B8"
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.32}
      />
      <ellipse cx={12} cy={12} rx={6.5} ry={6} stroke="#5CE0B8" strokeWidth={1.5} />
      <path
        d="M 18.49 12.26 A 11 3.5 -25 0 1 5.51 11.74"
        stroke="#5CE0B8"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── LOOT.WORKS wordmark ───────────────────────────────────────────────────
function Wordmark({ size = 22, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <span
      style={{
        font: `700 ${size}px/1 ${FONT_MONO}`,
        letterSpacing: "0.15em",
        color: "#5CE0B8",
        textShadow: glow
          ? "0 0 40px rgba(92,224,184,0.25), 0 0 8px rgba(92,224,184,0.35)"
          : "none",
      }}
    >
      LOOT.WORKS
    </span>
  );
}

// ─── Scroll reveal (IntersectionObserver fade-up) ─────────────────────────
function Reveal({
  children,
  delay = 0,
  style = {},
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVis(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(36px)",
        transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Coin rain particle layer ─────────────────────────────────────────────
function CoinRain({ opacity = 0.1, count = 18 }: { opacity?: number; count?: number }) {
  const coins = useRef(
    Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 12,
      dur: 9 + Math.random() * 7,
      sz: 5 + Math.random() * 9,
      drift: -40 + Math.random() * 80,
    })),
  ).current;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        opacity,
      }}
    >
      {coins.map((c, i) => (
        <div
          key={i}
          className="pro-coin-particle"
          style={
            {
              position: "absolute",
              left: `${c.left}%`,
              top: "-16px",
              width: c.sz,
              height: c.sz,
              borderRadius: "50%",
              border: "1.5px solid #5CE0B8",
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.dur}s`,
              "--drift": `${c.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

// ─── Item silhouettes (missed-flip cards) ─────────────────────────────────
type SilhouetteType = "pyrex" | "vinyl" | "handbag";
function ItemSilhouette({ type, size = 56 }: { type: SilhouetteType; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      {type === "pyrex" && (
        <>
          <path
            d="M7 14c0 7 5 10 11 10s11-3 11-10l-1.5-5c-.5-2-2-3-4-3H12.5c-2 0-3.5 1-4 3z"
            stroke="#5CE0B8"
            strokeWidth={1.4}
            fill="none"
            opacity={0.55}
          />
          <path
            d="M6 14h1.5M28.5 14H30"
            stroke="#5CE0B8"
            strokeWidth={1.4}
            strokeLinecap="round"
            opacity={0.4}
          />
        </>
      )}
      {type === "vinyl" && (
        <>
          <circle cx={18} cy={18} r={13} stroke="#5CE0B8" strokeWidth={1.4} fill="none" opacity={0.55} />
          <circle cx={18} cy={18} r={5} stroke="#5CE0B8" strokeWidth={1.2} fill="none" opacity={0.4} />
          <circle cx={18} cy={18} r={1.8} fill="#5CE0B8" opacity={0.35} />
          <path
            d="M18 5.5a12.5 12.5 0 0 1 0 25"
            stroke="#5CE0B8"
            strokeWidth={0.5}
            fill="none"
            opacity={0.2}
            strokeDasharray="2 3"
          />
        </>
      )}
      {type === "handbag" && (
        <>
          <path
            d="M8 16v14c0 2 1.5 3.5 3.5 3.5h13c2 0 3.5-1.5 3.5-3.5V16"
            stroke="#5CE0B8"
            strokeWidth={1.4}
            fill="none"
            opacity={0.55}
          />
          <path
            d="M13 16v-4c0-3.5 2.2-6 5-6s5 2.5 5 6v4"
            stroke="#5CE0B8"
            strokeWidth={1.4}
            fill="none"
            opacity={0.55}
          />
          <circle cx={18} cy={22} r={1.5} fill="#5CE0B8" opacity={0.3} />
        </>
      )}
    </svg>
  );
}

// ─── Feature icons (line, 24x24) ──────────────────────────────────────────
type FeatureIconName =
  | "barcode"
  | "vision"
  | "shelf"
  | "deals"
  | "free"
  | "map"
  | "penny"
  | "haul"
  | "bolo";

function FeatureIcon({ name, size = 22 }: { name: FeatureIconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5CE0B8"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "barcode" && (
        <>
          <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
          <line x1={7} y1={8} x2={7} y2={16} />
          <line x1={10.5} y1={8} x2={10.5} y2={16} />
          <line x1={14} y1={8} x2={14} y2={16} />
          <line x1={17} y1={8} x2={17} y2={16} />
        </>
      )}
      {name === "vision" && (
        <>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
          <circle cx={12} cy={12} r={3} />
        </>
      )}
      {name === "shelf" && (
        <>
          <line x1={4} y1={7} x2={20} y2={7} />
          <line x1={4} y1={12} x2={20} y2={12} />
          <line x1={4} y1={17} x2={20} y2={17} />
          <path d="M2 4l2.5 2M22 4l-2.5 2" opacity={0.6} />
          <rect x={8} y={13} width={4} height={4} rx={0.5} opacity={0.4} />
        </>
      )}
      {name === "deals" && (
        <>
          <path d="M20 10V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2h3" />
          <circle cx={16} cy={16} r={6} />
          <path d="M16 13.5v5M14.5 15.5h3" />
        </>
      )}
      {name === "free" && (
        <>
          <rect x={3} y={10} width={18} height={11} rx={2} />
          <path d="M12 10v11M3 14h18" />
          <path d="M7.5 10c0-3 1.5-5 4.5-5s4.5 2 4.5 5" />
        </>
      )}
      {name === "map" && (
        <>
          <path d="M3 6l6-2 6 2 6-2v16l-6 2-6-2-6 2z" />
          <path d="M9 4v16M15 8v16" />
          <circle cx={12} cy={11} r={1.5} fill="currentColor" opacity={0.5} />
        </>
      )}
      {name === "penny" && (
        <>
          <circle cx={12} cy={10} r={7} />
          <path d="M12 7v6" />
          <path d="M9.5 11l2.5 2 2.5-2" />
          <path d="M8 20h8" opacity={0.5} />
          <path d="M10 22h4" opacity={0.3} />
        </>
      )}
      {name === "haul" && (
        <>
          <rect x={3} y={3} width={18} height={18} rx={2} />
          <path d="M7 17l3-4 3 2 4-6" />
          <circle cx={17} cy={9} r={1} fill="currentColor" opacity={0.5} />
        </>
      )}
      {name === "bolo" && (
        <>
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
          <circle cx={12} cy={3} r={1} fill="currentColor" opacity={0.5} />
        </>
      )}
    </svg>
  );
}

// ─── Phone mockup frame ──────────────────────────────────────────────────
function PhoneMockup({
  children,
  style: extra = {},
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width: 200,
        height: 400,
        borderRadius: 26,
        overflow: "hidden",
        position: "relative",
        border: "2px solid rgba(255,255,255,0.10)",
        background: "#0A0812",
        boxShadow:
          "0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
        flexShrink: 0,
        ...extra,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 72,
          height: 22,
          background: "#0A0812",
          borderRadius: "0 0 14px 14px",
          zIndex: 3,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      />
      <div
        style={{
          position: "relative",
          height: "100%",
          padding: "32px 14px 14px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Nav bar ──────────────────────────────────────────────────────────────
function NavBar() {
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 24px",
        position: "relative",
        zIndex: 10,
        maxWidth: 1280,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <CoinMark size={26} glow />
        <Wordmark size={18} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          className="pro-mint-dot-pulse"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#5CE0B8",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            font: `500 13px/1 ${FONT_MONO}`,
            color: "#5CE0B8",
          }}
        >
          loot.works
        </span>
      </div>
    </nav>
  );
}

// ─── Hero pricing tile (Digistore link) ──────────────────────────────────
interface PriceTileProps {
  label: string;
  price: string;
  period: string;
  note: ReactNode;
  primary: boolean;
  popular?: boolean;
}
function PriceTile({ label, price, period, note, primary, popular }: PriceTileProps) {
  return (
    <a
      href={DIGISTORE_CHECKOUT_URL}
      className="pro-price-tile"
      style={{
        position: "relative",
        textDecoration: "none",
        textAlign: "left",
        padding: "20px 22px",
        borderRadius: 16,
        backgroundColor: "#120e18",
        backgroundImage: primary
          ? "linear-gradient(180deg, rgba(92,224,184,0.16) 0%, rgba(92,224,184,0.04) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 100%)",
        border: primary
          ? "1px solid rgba(92,224,184,0.45)"
          : "1px solid rgba(255,255,255,0.10)",
        boxShadow: primary
          ? "inset 0 1px 0 0 rgba(255,255,255,0.10), 0 0 0 1px rgba(92,224,184,0.06), 0 8px 32px rgba(92,224,184,0.14)"
          : "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        transition:
          "transform 220ms cubic-bezier(0.16, 1, 0.3, 1), border-color 220ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {popular && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -10,
            right: 16,
            zIndex: 2,
            display: "inline-block",
            backgroundColor: "rgba(92, 224, 184, 0.18)",
            padding: "3px 10px",
            borderRadius: 6,
            fontFamily: FONT_MONO,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.10em",
            color: "#5CE0B8",
            textTransform: "uppercase",
            lineHeight: 1.2,
          }}
        >
          POPULAR
        </span>
      )}
      <span
        style={{
          font: `700 11px/1 ${FONT_MONO}`,
          letterSpacing: "0.14em",
          color: primary ? "#5CE0B8" : "rgba(255,255,255,0.55)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
          marginTop: 6,
        }}
      >
        <span
          style={{
            font: `700 32px/1 ${FONT_MONO}`,
            color: primary ? "#5CE0B8" : "#E8E0F0",
            fontFeatureSettings: '"tnum"',
          }}
        >
          {price}
        </span>
        <span
          style={{
            font: `400 14px/1 ${FONT_BODY}`,
            color: "#5A4E70",
          }}
        >
          {period}
        </span>
      </div>
      <div
        style={{
          font: `400 13px/1.45 ${FONT_BODY}`,
          color: primary ? "rgba(92,224,184,0.78)" : "rgba(255,255,255,0.50)",
          marginTop: 4,
        }}
      >
        {note}
      </div>
    </a>
  );
}

// ─── 01 Hero ──────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section
      style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        className="pro-dot-grid-layer"
        style={{ position: "absolute", inset: 0, opacity: 0.18 }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 90% 55% at 50% 105%, rgba(92,224,184,0.18) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 30% 80%, rgba(123,143,255,0.06) 0%, transparent 55%)",
        }}
      />
      <CoinRain opacity={0.1} count={22} />

      <NavBar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 24px 80px",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
          gap: 8,
        }}
      >
        <Reveal>
          <h1
            className="pro-hero-headline"
            style={{
              fontFamily: FONT_BODY,
              fontWeight: 600,
              fontSize: 48,
              lineHeight: 1.18,
              margin: 0,
              textWrap: "balance",
            }}
          >
            <span style={{ color: "#fff" }}>Know what flips.</span>
            <br />
            <span
              style={{
                color: "#5CE0B8",
                textShadow:
                  "0 0 40px rgba(92,224,184,0.25), 0 0 80px rgba(92,224,184,0.10)",
              }}
            >
              Skip what doesn&rsquo;t.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={240}>
          <p
            style={{
              fontFamily: FONT_BODY,
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.58)",
              maxWidth: 540,
              margin: "36px auto 0",
            }}
          >
            Scan any thrift store item. Loot tells you the resale value, the
            profit margin, and whether to buy &mdash; in under 2 seconds.
          </p>
        </Reveal>

        {/* Pricing tiles — replaces the design's "Install free →" CTA. */}
        <Reveal delay={360} style={{ marginTop: 44, width: "100%" }}>
          <div
            className="pro-pricing-grid"
            style={{
              display: "grid",
              gap: 12,
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            <PriceTile
              label="MONTHLY"
              price="$14.99"
              period="/mo"
              note="cancel anytime"
              primary
            />
            <PriceTile
              label="ANNUAL"
              price="$99.99"
              period="/yr"
              note={
                <>
                  save{" "}
                  <span style={{ color: "#D4A574", fontWeight: 600 }}>$80</span>
                  {" "}&mdash; 5 months free
                </>
              }
              primary={false}
              popular
            />
          </div>
        </Reveal>

        <Reveal delay={440}>
          <p
            style={{
              font: `300 13px/1.5 ${FONT_BODY}`,
              color: "rgba(255,255,255,0.55)",
              marginTop: 18,
              textAlign: "center",
            }}
          >
            30-day money-back guarantee
          </p>
        </Reveal>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          zIndex: 2,
        }}
      >
        <svg
          className="pro-scroll-bounce"
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#5CE0B8"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
        <span
          style={{
            font: `500 10px/1 ${FONT_MONO}`,
            color: "#5CE0B8",
            letterSpacing: "0.12em",
          }}
        >
          SCROLL
        </span>
      </div>
    </section>
  );
}

// ─── Credibility strip ────────────────────────────────────────────────────
function CredibilityStrip() {
  return (
    <section
      className="pro-credibility-strip"
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
      }}
    >
      <div
        className="pro-dot-grid-layer"
        style={{ position: "absolute", inset: 0, opacity: 0.08 }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent 5%, rgba(92,224,184,0.35) 40%, rgba(92,224,184,0.35) 60%, transparent 95%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent 5%, rgba(92,224,184,0.35) 40%, rgba(92,224,184,0.35) 60%, transparent 95%)",
        }}
      />
      <Reveal
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <span
          className="pro-mint-dot-pulse"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#5CE0B8",
            flexShrink: 0,
            marginRight: 12,
          }}
        />
        <span
          className="pro-credibility-text"
          style={{
            font: `500 14px/1.2 ${FONT_MONO}`,
            color: "#5CE0B8",
            letterSpacing: "0.18em",
            textShadow: "0 0 20px rgba(92,224,184,0.30)",
          }}
        >
          BUILT FOR THE 130 MILLION AMERICANS WHO RESELL
        </span>
      </Reveal>
    </section>
  );
}

// ─── Missed flip card ─────────────────────────────────────────────────────
function MissedFlipCard({
  type,
  label,
  price,
  rotation,
  delay = 0,
}: {
  type: SilhouetteType;
  label: string;
  price: string;
  rotation: number;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <div
        className="pro-flip-card-float"
        style={
          {
            background: "#120e18",
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.008) 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: "20px 22px",
            boxShadow:
              "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
            transform: `rotate(${rotation}deg)`,
            "--rot": `${rotation}deg`,
            animationDelay: `${delay * 0.4}ms`,
            display: "flex",
            alignItems: "center",
            gap: 18,
            maxWidth: 340,
          } as CSSProperties
        }
      >
        <ItemSilhouette type={type} size={52} />
        <div style={{ flex: 1 }}>
          <p
            style={{
              font: `300 13px/1.4 ${FONT_BODY}`,
              color: "rgba(255,255,255,0.5)",
              margin: 0,
            }}
          >
            {label}
          </p>
          <p
            style={{
              font: `700 22px/1 ${FONT_MONO}`,
              color: "#5CE0B8",
              margin: "8px 0 0",
              fontFeatureSettings: '"tnum"',
            }}
          >
            ${price}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

// ─── 02 Problem ───────────────────────────────────────────────────────────
function ProblemSection() {
  return (
    <section style={{ position: "relative", padding: "100px 0 80px" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          flexDirection: "column",
          gap: 56,
        }}
      >
        <div
          className="pro-problem-grid"
          style={{ display: "grid", gap: 56, alignItems: "center" }}
        >
          <div>
            <Reveal>
              <h2
                className="pro-section-headline"
                style={{
                  fontFamily: FONT_BODY,
                  fontWeight: 600,
                  fontSize: 40,
                  lineHeight: 1.08,
                  color: "#fff",
                  margin: 0,
                }}
              >
                You&rsquo;re walking past money.
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p
                style={{
                  fontFamily: FONT_BODY,
                  fontWeight: 300,
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.55)",
                  maxWidth: 460,
                  marginTop: 24,
                }}
              >
                Every thrift store has stuff worth 10x what they&rsquo;re
                charging. The problem isn&rsquo;t finding deals &mdash; it&rsquo;s
                knowing which deal is which. Without data, you&rsquo;re guessing.
                With Loot, you&rsquo;re hunting.
              </p>
            </Reveal>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              alignItems: "center",
            }}
          >
            <MissedFlipCard
              type="pyrex"
              label="walked past it"
              price="87"
              rotation={4}
              delay={100}
            />
            <MissedFlipCard
              type="vinyl"
              label="wasn't sure"
              price="340"
              rotation={-3}
              delay={220}
            />
            <MissedFlipCard
              type="handbag"
              label="skipped it"
              price="890"
              rotation={5}
              delay={340}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Phone screens ────────────────────────────────────────────────────────
function ScanScreen() {
  return (
    <PhoneMockup>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          position: "relative",
        }}
      >
        <div style={{ width: 140, height: 140, position: "relative" }}>
          {/* Four corner brackets */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 24,
              height: 24,
              borderTop: "2.5px solid #5CE0B8",
              borderLeft: "2.5px solid #5CE0B8",
              borderRadius: "6px 0 0 0",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 24,
              height: 24,
              borderTop: "2.5px solid #5CE0B8",
              borderRight: "2.5px solid #5CE0B8",
              borderRadius: "0 6px 0 0",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: 24,
              height: 24,
              borderBottom: "2.5px solid #5CE0B8",
              borderLeft: "2.5px solid #5CE0B8",
              borderRadius: "0 0 0 6px",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 24,
              height: 24,
              borderBottom: "2.5px solid #5CE0B8",
              borderRight: "2.5px solid #5CE0B8",
              borderRadius: "0 0 6px 0",
            }}
          />
          {/* Barcode lines */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              display: "flex",
              gap: 3,
              alignItems: "center",
              height: 40,
            }}
          >
            {[4, 2, 5, 2, 4, 3, 2, 5, 2, 4, 3, 2].map((w, i) => (
              <div
                key={i}
                style={{
                  width: w,
                  height: "100%",
                  background: "rgba(255,255,255,0.3)",
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
          <div
            className="pro-scan-line"
            style={{
              position: "absolute",
              left: 8,
              right: 8,
              height: 2,
              top: "30%",
              background:
                "linear-gradient(90deg, transparent, #5CE0B8, transparent)",
              boxShadow: "0 0 12px rgba(92,224,184,0.6)",
            }}
          />
        </div>
        <span
          style={{
            font: `500 9px/1 ${FONT_MONO}`,
            color: "#5CE0B8",
            letterSpacing: "0.15em",
          }}
        >
          SCANNING
        </span>
      </div>
    </PhoneMockup>
  );
}

function VerdictScreen() {
  return (
    <PhoneMockup>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            font: `500 9px/1 ${FONT_MONO}`,
            letterSpacing: "0.12em",
            color: "#5A4E70",
          }}
        >
          VERDICT
        </span>
        <div
          style={{
            font: `800 36px/1 ${FONT_BODY}`,
            color: "#5CE0B8",
            marginTop: 8,
            textShadow: "0 0 32px rgba(92,224,184,0.35)",
          }}
        >
          FLIP IT
        </div>
        <div
          style={{
            marginTop: 16,
            padding: "10px 20px",
            borderRadius: 10,
            background: "rgba(92,224,184,0.08)",
            border: "1px solid rgba(92,224,184,0.20)",
          }}
        >
          <span
            style={{
              font: `700 20px/1 ${FONT_MONO}`,
              color: "#5CE0B8",
              fontFeatureSettings: '"tnum"',
            }}
          >
            +$83
          </span>
          <span
            style={{
              font: `500 10px/1 ${FONT_MONO}`,
              color: "rgba(92,224,184,0.6)",
              marginLeft: 6,
              letterSpacing: "0.08em",
            }}
          >
            PROFIT
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 20,
            alignItems: "baseline",
          }}
        >
          <span style={{ font: `400 11px/1 ${FONT_BODY}`, color: "#5A4E70" }}>
            cost
          </span>
          <span style={{ font: `600 13px/1 ${FONT_MONO}`, color: "#C8C0D8" }}>
            $12
          </span>
          <span style={{ color: "#5A4E70" }}>&rarr;</span>
          <span style={{ font: `700 15px/1 ${FONT_MONO}`, color: "#5CE0B8" }}>
            $95
          </span>
        </div>
      </div>
    </PhoneMockup>
  );
}

function FlipScreen() {
  return (
    <PhoneMockup>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "8px 0",
        }}
      >
        <span
          style={{
            font: `500 9px/1 ${FONT_MONO}`,
            letterSpacing: "0.12em",
            color: "#5A4E70",
            marginBottom: 10,
          }}
        >
          HAUL LOG
        </span>
        <div
          style={{
            font: `800 28px/1 ${FONT_MONO}`,
            color: "#5CE0B8",
            fontFeatureSettings: '"tnum"',
          }}
        >
          $3,847
        </div>
        <span
          style={{
            font: `500 9px/1 ${FONT_MONO}`,
            color: "rgba(92,224,184,0.5)",
            letterSpacing: "0.10em",
            marginTop: 4,
          }}
        >
          TOTAL PROFIT
        </span>
        <svg viewBox="0 0 160 60" style={{ width: "100%", height: 60, marginTop: 16 }}>
          <defs>
            <linearGradient id="pro-haul-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5CE0B8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#5CE0B8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 50 Q20 48 40 42 T80 28 T120 15 T160 5"
            fill="none"
            stroke="#5CE0B8"
            strokeWidth={2}
          />
          <path
            d="M0 50 Q20 48 40 42 T80 28 T120 15 T160 5 V60 H0Z"
            fill="url(#pro-haul-gradient)"
          />
        </svg>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 14,
          }}
        >
          {[
            { n: "Pyrex set", p: "+$67" },
            { n: "Nike Dunks", p: "+$83" },
            { n: "Coach bag", p: "+$112" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 10px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span style={{ font: `400 11px/1 ${FONT_BODY}`, color: "#C8C0D8" }}>
                {item.n}
              </span>
              <span style={{ font: `700 11px/1 ${FONT_MONO}`, color: "#5CE0B8" }}>
                {item.p}
              </span>
            </div>
          ))}
        </div>
      </div>
    </PhoneMockup>
  );
}

// ─── 03 How it works ─────────────────────────────────────────────────────
function HowItWorksSection() {
  const ref = useRef<HTMLElement | null>(null);
  const [lineVis, setLineVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLineVis(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const steps: { num: string; title: string; desc: string; phone: ReactNode }[] = [
    {
      num: "01",
      title: "SCAN",
      desc:
        "Point your camera at the barcode, the item, or the entire shelf. Loot reads it instantly.",
      phone: <ScanScreen />,
    },
    {
      num: "02",
      title: "VERDICT",
      desc:
        "Loot pulls live comps, calculates fees, and tells you flat: flip it or skip it. With the profit number, in mint.",
      phone: <VerdictScreen />,
    },
    {
      num: "03",
      title: "FLIP",
      desc:
        "Buy it. Loot generates the listing. Tracks your profit. Stacks your wins.",
      phone: <FlipScreen />,
    },
  ];

  return (
    <section ref={ref} style={{ position: "relative", padding: "100px 0 80px" }}>
      <div
        className="pro-dot-grid-layer"
        style={{ position: "absolute", inset: 0, opacity: 0.15 }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 80% 50% at 50% 95%, rgba(92,224,184,0.12) 0%, transparent 60%)",
        }}
      />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <Reveal>
            <h2
              className="pro-section-headline"
              style={{
                fontFamily: FONT_BODY,
                fontWeight: 600,
                fontSize: 40,
                lineHeight: 1.08,
                color: "#fff",
                margin: 0,
              }}
            >
              Three steps. Two seconds.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p
              style={{
                fontFamily: FONT_BODY,
                fontWeight: 300,
                fontSize: 16,
                color: "rgba(255,255,255,0.55)",
                marginTop: 16,
              }}
            >
              Loot does what your gut can&rsquo;t &mdash; accurately.
            </p>
          </Reveal>
        </div>

        <div className="pro-steps-grid" style={{ position: "relative" }}>
          <div
            className="pro-connect-line-h"
            style={{
              position: "absolute",
              top: 50,
              left: "10%",
              right: "10%",
              height: 1.5,
              background:
                "linear-gradient(90deg, transparent, rgba(92,224,184,0.35) 15%, rgba(92,224,184,0.35) 85%, transparent)",
              transform: lineVis ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left",
              transition: "transform 1.8s cubic-bezier(0.16,1,0.3,1) 0.4s",
            }}
          />
          <div
            className="pro-connect-line-v"
            style={{
              position: "absolute",
              left: 40,
              top: "5%",
              bottom: "5%",
              width: 1.5,
              background:
                "linear-gradient(180deg, transparent, rgba(92,224,184,0.35) 10%, rgba(92,224,184,0.35) 90%, transparent)",
              transform: lineVis ? "scaleY(1)" : "scaleY(0)",
              transformOrigin: "top",
              transition: "transform 1.8s cubic-bezier(0.16,1,0.3,1) 0.4s",
            }}
          />

          {steps.map((s, i) => (
            <Reveal
              key={i}
              delay={i * 150}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 16,
                position: "relative",
                zIndex: 1,
              }}
            >
              <span
                style={{
                  font: `700 72px/1 ${FONT_MONO}`,
                  color: "rgba(92,224,184,0.12)",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.num}
              </span>
              <h3
                style={{
                  font: `600 22px/1.2 ${FONT_BODY}`,
                  color: "#fff",
                  margin: 0,
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  font: `300 14px/1.6 ${FONT_BODY}`,
                  color: "rgba(255,255,255,0.5)",
                  maxWidth: 260,
                }}
              >
                {s.desc}
              </p>
              <div style={{ marginTop: 8 }}>{s.phone}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 04 Features ─────────────────────────────────────────────────────────
function FeaturesSection() {
  const features: { icon: FeatureIconName; name: string; desc: string }[] = [
    {
      icon: "barcode",
      name: "Barcode Scan",
      desc: "Instant retail and resale comps from a single scan. Works in under 2 seconds.",
    },
    {
      icon: "vision",
      name: "AI Vision",
      desc: "No barcode? Snap a photo. Loot's AI identifies the item and pulls comps anyway.",
    },
    {
      icon: "shelf",
      name: "Shelf Scanner",
      desc: "One photo of an entire shelf. Loot ranks every item by profit potential.",
    },
    {
      icon: "deals",
      name: "Deals Near You",
      desc: "Underpriced Marketplace and Craigslist listings, surfaced from your zip code.",
    },
    {
      icon: "free",
      name: "Free Finds",
      desc: "Curbside finds, Buy Nothing groups, free Craigslist — all in one feed.",
    },
    {
      icon: "map",
      name: "Yard Sale Map",
      desc: "Every yard sale in your area, ranked by AI, plotted with an optimized route.",
    },
    {
      icon: "penny",
      name: "Penny Drops",
      desc: "Dollar General and Dollar Tree penny clearance lists, updated weekly.",
    },
    {
      icon: "haul",
      name: "Haul Log + P&L",
      desc: "Every flip tracked. Real profit numbers. Real history. Real proof.",
    },
    {
      icon: "bolo",
      name: "BOLO Alerts",
      desc: "Be On the Lookout. Set a keyword, get a push when it shows up anywhere.",
    },
  ];

  return (
    <section style={{ position: "relative", padding: "100px 0 80px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <Reveal>
          <h2
            className="pro-section-headline"
            style={{
              fontFamily: FONT_BODY,
              fontWeight: 600,
              fontSize: 40,
              lineHeight: 1.08,
              color: "#fff",
              margin: 0,
            }}
          >
            Not just a barcode scanner.
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p
            style={{
              fontFamily: FONT_BODY,
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.55)",
              marginTop: 14,
              maxWidth: 420,
            }}
          >
            Loot is the entire reseller stack, in one app.
          </p>
        </Reveal>

        <div className="pro-features-grid" style={{ marginTop: 52 }}>
          {features.map((f, i) => (
            <Reveal key={i} delay={i * 60}>
              <div
                className="pro-feature-card"
                style={{
                  background: "#120e18",
                  backgroundImage:
                    "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.008) 100%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
                  transition: "border-color 200ms ease, transform 200ms ease",
                  height: "100%",
                }}
              >
                <FeatureIcon name={f.icon} size={22} />
                <h3
                  style={{
                    font: `600 17px/1.3 ${FONT_BODY}`,
                    color: "#fff",
                    margin: "14px 0 8px",
                  }}
                >
                  {f.name}
                </h3>
                <p
                  style={{
                    font: `300 13.5px/1.55 ${FONT_BODY}`,
                    color: "rgba(255,255,255,0.48)",
                    margin: 0,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 05 Social proof ──────────────────────────────────────────────────────
function SocialProofSection() {
  const people = [
    { initials: "AM", name: "A.M.", loc: "Atlanta" },
    { initials: "JK", name: "J.K.", loc: "Detroit" },
    { initials: "RS", name: "R.S.", loc: "Phoenix" },
    { initials: "DL", name: "D.L.", loc: "Brooklyn" },
  ];
  return (
    <section style={{ position: "relative", padding: "80px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <Reveal>
          <span
            style={{
              font: `500 12px/1 ${FONT_MONO}`,
              letterSpacing: "0.10em",
              color: "#5CE0B8",
            }}
          >
            // HUNTERS USING LOOT.WORKS
          </span>
        </Reveal>

        <div className="pro-testimonials-wrap" style={{ marginTop: 36 }}>
          {people.map((p, i) => (
            <Reveal key={i} delay={i * 100} className="pro-testimonial-card-wrap">
              <div
                style={{
                  background: "#120e18",
                  backgroundImage:
                    "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.008) 100%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
                  minWidth: 280,
                  flex: "0 0 auto",
                }}
              >
                <p
                  style={{
                    font: `300 14.5px/1.6 ${FONT_BODY}`,
                    color: "rgba(255,255,255,0.5)",
                    fontStyle: "italic",
                    margin: 0,
                    minHeight: 72,
                  }}
                >
                  &ldquo;[TESTIMONIAL TBD]&rdquo;
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 20,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: "rgba(92,224,184,0.10)",
                      border: "1px solid rgba(92,224,184,0.20)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      font: `600 13px/1 ${FONT_BODY}`,
                      color: "#5CE0B8",
                    }}
                  >
                    {p.initials}
                  </div>
                  <div>
                    <div
                      style={{
                        font: `600 14px/1.3 ${FONT_BODY}`,
                        color: "#fff",
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        font: `300 12px/1.3 ${FONT_BODY}`,
                        color: "#5A4E70",
                      }}
                    >
                      {p.loc}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Digistore-mandatory footer ──────────────────────────────────────────
function FooterSection() {
  return (
    <footer style={{ position: "relative", padding: "80px 0 0", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 100% 70% at 50% 60%, rgba(92,224,184,0.10) 0%, transparent 60%)",
        }}
      />
      <CoinRain opacity={0.08} count={12} />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <Reveal>
          <div style={{ marginBottom: 8 }}>
            <CoinMark size={36} glow />
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div
            style={{
              font: `700 44px/1 ${FONT_MONO}`,
              letterSpacing: "0.15em",
              color: "#5CE0B8",
              textShadow:
                "0 0 48px rgba(92,224,184,0.22), 0 0 8px rgba(92,224,184,0.32)",
              marginBottom: 4,
            }}
          >
            LOOT
          </div>
        </Reveal>
        <Reveal delay={110}>
          <div
            aria-hidden="true"
            style={{
              font: `500 16px/1 ${FONT_MONO}`,
              letterSpacing: "0.2em",
              color: "#5CE0B8",
              opacity: 0.4,
              marginBottom: 12,
            }}
          >
            loot.works
          </div>
        </Reveal>
        <Reveal delay={140}>
          <p
            style={{
              font: `300 14px/1.5 ${FONT_BODY}`,
              color: "rgba(255,255,255,0.55)",
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            Know what flips. Skip what doesn&rsquo;t.
          </p>
        </Reveal>

        {/* Business + trust line — Digistore-mandatory imprint. */}
        <Reveal delay={220} style={{ marginTop: 40 }}>
          <p
            style={{
              font: `400 12px/1.6 ${FONT_BODY}`,
              color: "#5A4E70",
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            loot.works &mdash; operated by [BUSINESS NAME], [ADDRESS]
          </p>
        </Reveal>

        {/* Digistore trust badge slot — Digistore injects markup here at runtime. */}
        <Reveal
          delay={260}
          style={{
            marginTop: 24,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div id="digistore-trust-badge" />
        </Reveal>
      </div>

      {/* Legal footer row — Privacy/Terms/copyright in a single
          centered line. Stuck at the bottom hairline; the imprint
          paragraph above carries the operated-by line, this row
          carries the click-through links Digistore requires for
          marketplace approval. */}
      <div
        style={{
          marginTop: 56,
          padding: "20px 24px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          maxWidth: 1200,
          margin: "56px auto 0",
          position: "relative",
          zIndex: 2,
          flexWrap: "wrap",
        }}
      >
        <a href="/privacy" className="pro-legal-link">
          Privacy
        </a>
        <span
          aria-hidden="true"
          className="pro-legal-link"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          ·
        </span>
        <a href="/terms" className="pro-legal-link">
          Terms
        </a>
        <span
          aria-hidden="true"
          className="pro-legal-link"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          ·
        </span>
        <span className="pro-legal-link">&copy; 2026 loot.works</span>
      </div>

      <div style={{ height: 20 }} />
    </footer>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────
export default function ProPage() {
  return (
    <Fragment>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />
      <div
        className="pro-page"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#120e18",
          color: "#C8C0D8",
          minHeight: "100dvh",
          fontFamily: FONT_BODY,
        }}
      >
        <HeroSection />
        <CredibilityStrip />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <SocialProofSection />
        <FooterSection />
      </div>
    </Fragment>
  );
}
