"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CoinMark from "@/components/shared/CoinMark";

interface ContextCardProps {
  todayScans: number;
  unsoldOldItems: number;
  hotDealsCount: number;
  userZip: string | null;
  dayOfWeek: number;
  hour: number;
  /** Optional: scroll to the deals carousel when "View deals" is tapped. */
  onViewDeals?: () => void;
}

type IconKind = "map-pin" | "lightning" | "alert" | "tag" | "map" | "saturn";

interface ResolvedCard {
  key: string;
  message: string;
  cta: { label: string; onTap: () => void } | null;
  icon: IconKind;
  iconColor: string;
  accent?: "mint" | "camel";
}

function MapPinIcon({ color }: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx={12} cy={10} r={3} />
    </svg>
  );
}

function LightningIcon({ color }: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function AlertIcon({ color }: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1={12} y1={9} x2={12} y2={13} />
      <line x1={12} y1={17} x2={12.01} y2={17} />
    </svg>
  );
}

function TagIcon({ color }: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1={7} y1={7} x2={7.01} y2={7} />
    </svg>
  );
}

function MapShapeIcon({ color }: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1={8} y1={2} x2={8} y2={18} />
      <line x1={16} y1={6} x2={16} y2={22} />
    </svg>
  );
}

function renderIcon(kind: IconKind, color: string) {
  switch (kind) {
    case "map-pin":
      return <MapPinIcon color={color} />;
    case "lightning":
      return <LightningIcon color={color} />;
    case "alert":
      return <AlertIcon color={color} />;
    case "tag":
      return <TagIcon color={color} />;
    case "map":
      return <MapShapeIcon color={color} />;
    case "saturn":
      return <CoinMark size={20} color={color} />;
  }
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function loadDismissedKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem("loot:contextCard:dismissed");
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as { date: string; keys: string[] };
    if (parsed.date !== todayKey()) return new Set();
    return new Set(parsed.keys);
  } catch {
    return new Set();
  }
}

function saveDismissedKeys(keys: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      "loot:contextCard:dismissed",
      JSON.stringify({ date: todayKey(), keys: Array.from(keys) })
    );
  } catch {
    /* localStorage unavailable — silent */
  }
}

export default function ContextCard({
  todayScans,
  unsoldOldItems,
  hotDealsCount,
  userZip,
  dayOfWeek,
  hour,
  onViewDeals,
}: ContextCardProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [closing, setClosing] = useState(false);

  // Hydrate dismissed state on mount only — localStorage is unavailable at
  // SSR, so we have to read it after hydration and sync into React state.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(loadDismissedKeys());
  }, []);

  const card = useMemo<ResolvedCard | null>(() => {
    // Priority order — first match wins.
    if (!userZip) {
      return {
        key: "no-zip",
        message:
          "Set your zip code to unlock deals, clearance, and penny drops in your area.",
        cta: { label: "Set zip code →", onTap: () => router.push("/account") },
        icon: "map-pin",
        iconColor: "#D4A574",
      };
    }
    if (hotDealsCount > 0) {
      return {
        key: "hot-deals",
        message: `${hotDealsCount} underpriced items near you right now`,
        cta: {
          label: "View deals →",
          onTap: () => onViewDeals?.(),
        },
        icon: "lightning",
        iconColor: "#5CE0B8",
        accent: "mint",
      };
    }
    if (unsoldOldItems > 0) {
      return {
        key: "dead-inventory",
        message: `${unsoldOldItems} items unsold for 14+ days — consider repricing`,
        cta: {
          label: "View inventory →",
          onTap: () => router.push("/app/haul"),
        },
        icon: "alert",
        iconColor: "#D4A574",
      };
    }
    if (dayOfWeek === 2 && hour >= 6 && hour <= 14) {
      return {
        key: "tuesday-penny",
        message:
          "Dollar General penny list drops today — check Penny Drops",
        cta: null,
        icon: "tag",
        iconColor: "#D4A574",
      };
    }
    if (dayOfWeek === 6 && hour >= 6 && hour <= 12) {
      return {
        key: "saturday-yard-sales",
        message:
          "Saturday morning — prime yard sale time in your area",
        cta: {
          label: "Open yard sale map →",
          onTap: () => console.log("Open yard sale map"),
        },
        icon: "map",
        iconColor: "#5CE0B8",
      };
    }
    if (todayScans === 0 && hour >= 8) {
      return {
        key: "no-scans-today",
        message: "No scans today yet. Your next flip is out there.",
        cta: null,
        icon: "saturn",
        iconColor: "#5A4E70",
      };
    }
    return null;
  }, [
    userZip,
    hotDealsCount,
    unsoldOldItems,
    dayOfWeek,
    hour,
    todayScans,
    router,
    onViewDeals,
  ]);

  if (!card) return null;
  if (dismissed.has(card.key)) return null;

  const handleDismiss = () => {
    // Confirm the tap physically — Android Chrome only, silent elsewhere.
    try {
      navigator?.vibrate?.(10);
    } catch {
      /* iOS silently fails, that's fine */
    }
    setClosing(true);
    setTimeout(() => {
      setDismissed((prev) => {
        const next = new Set(prev).add(card.key);
        saveDismissedKeys(next);
        return next;
      });
      setClosing(false);
    }, 200);
  };

  return (
    <>
      <style>{`
        @keyframes contextCardOut {
          from { opacity: 1; transform: translateY(0); max-height: 200px; }
          to { opacity: 0; transform: translateY(-8px); max-height: 0; }
        }
      `}</style>
      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.06)",
          padding: "14px 16px",
          position: "relative",
          // Mint-accent left rim for the hot-deals variant only.
          borderLeftWidth: card.accent === "mint" ? 3 : 1,
          borderLeftColor:
            card.accent === "mint" ? "#5CE0B8" : "rgba(255,255,255,0.06)",
          animation: closing
            ? "contextCardOut 200ms ease-out forwards"
            : undefined,
          overflow: closing ? "hidden" : undefined,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flexShrink: 0, marginTop: 1 }}>
            {renderIcon(card.icon, card.iconColor)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontWeight: 500,
                fontSize: 13,
                lineHeight: 1.4,
                color: "#C8C0D8",
              }}
            >
              {card.message}
            </div>
            {card.cta && (
              <button
                type="button"
                onClick={card.cta.onTap}
                style={{
                  marginTop: 6,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontWeight: 500,
                  fontSize: 12,
                  color: "#5CE0B8",
                  transition: "color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onPointerDown={(e) => {
                  e.currentTarget.style.color = "#7CFFCC";
                }}
                onPointerUp={(e) => {
                  e.currentTarget.style.color = "#5CE0B8";
                }}
                onPointerLeave={(e) => {
                  e.currentTarget.style.color = "#5CE0B8";
                }}
              >
                {card.cta.label}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            style={{
              flexShrink: 0,
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "#3D2E55",
              transition:
                "color 100ms cubic-bezier(0.16, 1, 0.3, 1), transform 100ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onPointerEnter={(e) => {
              e.currentTarget.style.color = "#C8C0D8";
            }}
            onPointerDown={(e) => {
              e.currentTarget.style.transform = "scale(0.9)";
              e.currentTarget.style.color = "#C8C0D8";
            }}
            onPointerUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.color = "#3D2E55";
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1={18} y1={6} x2={6} y2={18} />
              <line x1={6} y1={6} x2={18} y2={18} />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
