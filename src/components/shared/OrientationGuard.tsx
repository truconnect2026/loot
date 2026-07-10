import CoinMark from "@/components/shared/CoinMark";

/**
 * PORTRAIT LOCK — browser/PWA side.
 *
 * The manifest's "orientation": "portrait" only binds installed PWAs
 * on platforms that honor it; Safari tabs and iOS standalone can
 * still rotate. This is the guard for those: a full-screen branded
 * overlay that sits over everything except the splash while the
 * device is landscape.
 *
 * GATE (pure CSS, no JS): orientation: landscape AND pointer: coarse
 * AND max-height: 520px. Coarse primary pointer = touch handheld —
 * desktops and touch-screen laptops (fine primary pointer) never
 * match. The 520px height ceiling keeps tablets out: phones in
 * landscape run ~320–440px tall, the smallest iPad is 744px.
 *
 * Static by design — no motion, so reduced-motion needs no branch.
 * z-index 9998: above sheets (61), film grain (100), and page
 * modals; below only the splash (9999).
 */
export default function OrientationGuard() {
  return (
    <div className="loot-og" role="status" aria-live="polite">
      <style>{`
        .loot-og { display: none; }
        @media (orientation: landscape) and (pointer: coarse) and (max-height: 520px) {
          .loot-og {
            position: fixed;
            inset: 0;
            z-index: 9998;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            background-color: #0A0812;
            background-image: radial-gradient(ellipse 70% 60% at 50% 40%, rgba(92,224,184,0.07) 0%, transparent 65%);
          }
        }
      `}</style>
      <CoinMark size={40} color="#5CE0B8" />
      <div
        style={{
          fontFamily: "var(--font-bebas-neue), sans-serif",
          fontSize: 26,
          letterSpacing: "0.06em",
          color: "#EDE7F8",
          lineHeight: 1,
        }}
      >
        ROTATE BACK
      </div>
      <div
        style={{
          fontFamily: "var(--font-space-mono), monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: "rgba(255,255,255,0.55)",
        }}
      >
        LOOT WORKS IN PORTRAIT
      </div>
    </div>
  );
}
