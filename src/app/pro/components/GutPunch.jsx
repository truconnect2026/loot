"use client";

import { useEffect, useRef, useState } from "react";
import { C } from "../lib/colors.js";
import { CoinMark, Eyebrow, FadeUp } from "./atoms.jsx";
import { useCounter } from "../hooks/usePageHooks.jsx";

/**
 * Product thumbnail with onError fallback to the Saturn CoinMark.
 * Image paths reference /flip game items — slugs may not all be in
 * /public/items/ yet; the moment the PNG is dropped in, this picks it up.
 */
function ItemImage({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}
      >
        <CoinMark size={32} color="rgba(255,255,255,0.12)" />
      </div>
    );
  }
  // Plain <img> rather than next/image — we need the onError handler and the
  // tiny LCP win from Image isn't worth the LayoutShift cost on these thumbs.
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%", objectFit: "cover",
        display: "block",
      }}
    />
  );
}

// Image paths reference /flip game item slugs. If a slug image isn't yet in
// /public/items/, the onError handler falls back to the Saturn coin placeholder.
const missedItems = [
  { name: "Pyrex 403", loss: 85, img: "/items/pyrex-butterprint-403.png" },
  { name: "Carhartt J97", loss: 140, img: "/items/carhartt-detroit-j97.png" },
  { name: "Polo Stadium", loss: 220, img: "/items/polo-rl-stadium-92.png" },
  { name: "Big E Levis", loss: 220, img: "/items/big-e-levis-501.png" },
  { name: "Le Creuset 7qt", loss: 180, img: "/items/le-creuset-dutch-oven.png" },
  { name: "Air Jordan 1", loss: 250, img: "/items/air-jordan-1.png" },
];

export default function GutPunch() {
  const sectionRef = useRef(null);
  const [sectionVisible, setSectionVisible] = useState(false);
  const count = useCounter(487, 2000, sectionVisible);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSectionVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    const fallback = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 100) setSectionVisible(true);
    }, 800);
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) {
        setSectionVisible(true);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(fallback);
      window.removeEventListener("scroll", onScroll);
      obs.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "clamp(80px,10vw,128px) 24px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <FadeUp>
          <Eyebrow text="the math you don't want to do" color={C.red} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(48px,9vw,128px)",
              lineHeight: 1.3,
              paddingBottom: "0.5em",
              marginBottom: "0.5em",
            }}
          >
            THE AVERAGE FLIPPER
            <br />
            <span style={{ color: "rgba(255,255,255,0.65)" }}>MISSES</span>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(48px,9vw,128px)",
              lineHeight: 1.3,
              color: C.red,
              marginBottom: 40,
            }}
          >
            ${count}/MO
          </p>
        </FadeUp>

        <FadeUp delay={0.3}>
          <p
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: "clamp(16px,2vw,20px)",
              color: "rgba(255,255,255,0.55)",
              maxWidth: 580,
              marginBottom: 56,
              lineHeight: 1.55,
            }}
          >
            in items they passed on, items they overpaid for, items they didn&apos;t know were worth flipping. Pro is $14.99.
          </p>
        </FadeUp>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))",
            gap: 14,
          }}
        >
          {missedItems.map((item, i) => (
            <FadeUp key={i} delay={0.08 * i}>
              <div
                className="missed-card"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  padding: 16,
                  textAlign: "center",
                  transition: "border-color 0.25s, background 0.25s",
                  cursor: "default",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.02)",
                    overflow: "hidden",
                    marginBottom: 12,
                  }}
                >
                  {/* Product image — falls back to Saturn coin if 404. */}
                  <ItemImage src={item.img} alt={item.name} />
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.55)",
                    marginBottom: 6,
                  }}
                >
                  {item.name}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-bebas), sans-serif",
                    fontSize: "clamp(32px,4vw,48px)",
                    color: C.red,
                    lineHeight: 1,
                  }}
                >
                  −${item.loss}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
