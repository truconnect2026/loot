"use client";

import { useCallback, useState } from "react";
import { C } from "../../pro/lib/colors.js";
import { Eyebrow, FadeUp } from "../../pro/components/atoms.jsx";
import { SWIPE_DATA } from "../lib/swipeData.js";

const TAB_KEYS = Object.keys(SWIPE_DATA);

/**
 * On copy, replace [YOUR_LINK] with a literal hint so the affiliate notices
 * they need to swap it before posting.
 */
function prepareForClipboard(text) {
  return text.replaceAll(
    "[YOUR_LINK]",
    "(replace with your Digistore affiliate link)",
  );
}

export default function SwipeCopy() {
  const [active, setActive] = useState(TAB_KEYS[0]);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const items = SWIPE_DATA[active].items;

  const handleCopy = useCallback(async (text, idx) => {
    try {
      await navigator.clipboard.writeText(prepareForClipboard(text));
      setCopiedIdx(idx);
      window.setTimeout(() => setCopiedIdx((v) => (v === idx ? null : v)), 2000);
    } catch {
      /* clipboard blocked — fall back to selection prompt */
      window.prompt("Copy the swipe text below:", prepareForClipboard(text));
    }
  }, []);

  return (
    <section
      id="swipe-copy"
      style={{ padding: "clamp(80px,10vw,128px) 24px", position: "relative", zIndex: 1 }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <FadeUp>
          <Eyebrow text="swipe copy" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(48px,9vw,96px)",
              lineHeight: 1.0,
              margin: "0 0 12px",
            }}
          >
            TAKE IT. POST IT. <span style={{ color: C.mint }}>EARN.</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.25}>
          <p
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: 16,
              color: "rgba(255,255,255,0.6)",
              margin: "0 0 32px",
            }}
          >
            Pre-written posts, captions, emails, scripts. Copy. Customize. Cash.
          </p>
        </FadeUp>

        <FadeUp delay={0.3}>
          <div
            role="tablist"
            aria-label="Swipe copy categories"
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              marginBottom: 24,
              paddingBottom: 0,
            }}
            onKeyDown={(e) => {
              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
              const i = TAB_KEYS.indexOf(active);
              if (i < 0) return;
              const next = e.key === "ArrowRight"
                ? (i + 1) % TAB_KEYS.length
                : (i - 1 + TAB_KEYS.length) % TAB_KEYS.length;
              setActive(TAB_KEYS[next]);
            }}
          >
            {TAB_KEYS.map((key) => {
              const isActive = key === active;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(key)}
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    background: isActive ? "rgba(92,224,184,0.1)" : "transparent",
                    color: isActive ? C.mint : "rgba(255,255,255,0.55)",
                    border: 0,
                    borderBottom: isActive
                      ? `2px solid ${C.mint}`
                      : "2px solid transparent",
                    padding: "12px 16px",
                    cursor: "pointer",
                    transition: "color 0.2s, background 0.2s",
                  }}
                >
                  {SWIPE_DATA[key].label}
                </button>
              );
            })}
          </div>
        </FadeUp>

        <div role="tabpanel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map((item, i) => (
            <FadeUp key={`${active}-${i}`} delay={0.05 * i}>
              <div
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-bebas), sans-serif",
                      fontSize: 22,
                      color: "#fff",
                      margin: 0,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {item.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.body, i)}
                    aria-label={`Copy ${item.title} to clipboard`}
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      padding: "8px 14px",
                      borderRadius: 6,
                      cursor: "pointer",
                      background: copiedIdx === i ? C.mint : "transparent",
                      color: copiedIdx === i ? C.bg : C.mint,
                      border: `1px solid ${C.mint}`,
                      transition: "all 0.2s",
                    }}
                  >
                    {copiedIdx === i ? "✓ COPIED" : "COPY"}
                  </button>
                </div>
                <pre
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.75)",
                    lineHeight: 1.6,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {item.body}
                </pre>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
