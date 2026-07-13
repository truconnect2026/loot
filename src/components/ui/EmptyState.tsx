"use client";

import type { ReactNode } from "react";
import CoinMark from "@/components/shared/CoinMark";

interface EmptyStateProps {
  /** House glyph. Omit → the brand Saturn mark (CoinMark). Pass `null`
   * to suppress the glyph entirely (text-only sub-empties). */
  icon?: ReactNode | null;
  headline: string;
  body?: string;
  action?: ReactNode;
  /** Tighter padding + smaller glyph for in-page sub-empties (a filter
   * with no matches, a day panel with nothing tracked) vs. a full-slot
   * empty screen. */
  compact?: boolean;
}

/**
 * The house empty-state. One template so every bare slot reads the same:
 * a brand-dim Saturn glyph, a Flip-voice line, and an optional CTA — not
 * a lone gray sentence that reads as a dead end.
 *
 * Motion: glyph → headline → body → action rise in on a short stagger
 * (--ease-out), then the glyph settles into a slow, low-amplitude float
 * (GPU-cheap transform loop) so the slot feels alive, not parked.
 *
 * Reduced motion: the stagger collapses to the settled state (global
 * rule) and the float is switched off outright — a complete, static
 * composition, glyph included.
 */
export function EmptyState({ icon, headline, body, action, compact }: EmptyStateProps) {
  // undefined → house Saturn; explicit null → no glyph.
  const glyph =
    icon === undefined ? <CoinMark size={compact ? 30 : 40} /> : icon;

  return (
    <>
      <style>{`
        .es-root > .es-glyph,
        .es-root > .es-head,
        .es-root > .es-body,
        .es-root > .es-action {
          animation: sgRise 420ms var(--ease-out) both;
        }
        .es-root > .es-glyph { animation-delay: 0ms; }
        .es-root > .es-head { animation-delay: 70ms; }
        .es-root > .es-body { animation-delay: 130ms; }
        .es-root > .es-action { animation-delay: 190ms; }
        /* the glyph keeps a slow idle float once its entrance lands */
        .es-root .es-glyph-in { animation: esFloat 5s var(--ease-out) 640ms infinite; }
        @media (prefers-reduced-motion: reduce) {
          .es-root .es-glyph-in { animation: none; }
        }
      `}</style>
      <div
        className="es-root"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: compact ? "28px 20px" : "48px 24px",
          gap: compact ? 9 : 12,
        }}
      >
        {glyph && (
          <div
            className="es-glyph"
            style={{
              color: "rgba(200,192,216,0.20)",
              marginBottom: 4,
              lineHeight: 0,
            }}
          >
            <div className="es-glyph-in" style={{ lineHeight: 0 }}>
              {glyph}
            </div>
          </div>
        )}
        <div
          className="es-head"
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: compact ? 14 : 15,
            color: "var(--text-primary)",
            lineHeight: 1.3,
          }}
        >
          {headline}
        </div>
        {body && (
          <div
            className="es-body"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--text-muted)",
              lineHeight: 1.5,
              maxWidth: 260,
            }}
          >
            {body}
          </div>
        )}
        {action && <div className="es-action" style={{ marginTop: 8 }}>{action}</div>}
      </div>
    </>
  );
}
