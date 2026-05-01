"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CoinMark from "@/components/shared/CoinMark";

interface ContextCardProps {
  todayScans: number;
  unsoldOldItems: number;
  hotDealsCount: number;
  userZip: string | null;
  dayOfWeek: number; // 0-6, Sun-Sat
  hour: number; // 0-23
}

const DISMISS_KEY = "loot.contextcard.dismissed";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Icons (20px stroke) ──

interface IconProps {
  color: string;
}

function MapPinIcon({ color }: IconProps) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx={12} cy={10} r={3} />
    </svg>
  );
}

function BoltIcon({ color }: IconProps) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function AlertTriangleIcon({ color }: IconProps) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1={12} y1={9} x2={12} y2={13} />
      <line x1={12} y1={17} x2={12.01} y2={17} />
    </svg>
  );
}

function TagIcon({ color }: IconProps) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1={7} y1={7} x2={7.01} y2={7} />
    </svg>
  );
}

function MapIcon({ color }: IconProps) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1={8} y1={2} x2={8} y2={18} />
      <line x1={16} y1={6} x2={16} y2={22} />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3D2E55"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={18} y1={6} x2={6} y2={18} />
      <line x1={6} y1={6} x2={18} y2={18} />
    </svg>
  );
}

interface MessageConfig {
  icon: React.ReactNode;
  text: string;
  cta?: { label: string; onTap: () => void };
  accentBorder?: boolean;
}

function plural(n: number, single: string, many: string): string {
  return n === 1 ? single : many;
}

export default function ContextCard({
  todayScans,
  unsoldOldItems,
  hotDealsCount,
  userZip,
  dayOfWeek,
  hour,
}: ContextCardProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  // Check localStorage for today's dismissal once mounted. The microtask
  // boundary keeps `react-hooks/set-state-in-effect` happy by deferring the
  // setState past the synchronous effect body.
  useEffect(() => {
    if (typeof window === "undefined") return;
    queueMicrotask(() => {
      if (window.localStorage.getItem(DISMISS_KEY) === todayKey()) {
        setDismissed(true);
      }
    });
  }, []);

  function handleDismiss() {
    if (dismissing) return;
    setDismissing(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, todayKey());
    }
    // Fade + lift, then collapse height. Total duration matches the spec.
    window.setTimeout(() => setDismissed(true), 200);
  }

  function scrollToDeals() {
    if (typeof document === "undefined") return;
    const el = document.getElementById("deals-near-you");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Priority chain — first match wins.
  let message: MessageConfig | null = null;

  if (!userZip) {
    message = {
      icon: <MapPinIcon color="#D4A574" />,
      text: "Set your zip code to unlock deals, clearance, and penny drops in your area.",
      cta: {
        label: "Set zip code →",
        onTap: () => router.push("/account"),
      },
    };
  } else if (hotDealsCount > 0) {
    message = {
      icon: <BoltIcon color="#5CE0B8" />,
      text: `${hotDealsCount} underpriced ${plural(hotDealsCount, "item", "items")} near you right now`,
      cta: {
        label: "View deals →",
        onTap: scrollToDeals,
      },
      accentBorder: true,
    };
  } else if (unsoldOldItems > 0) {
    message = {
      icon: <AlertTriangleIcon color="#D4A574" />,
      text: `${unsoldOldItems} ${plural(unsoldOldItems, "item", "items")} unsold for 14+ days — consider repricing`,
      cta: {
        label: "View inventory →",
        onTap: () => router.push("/app/haul"),
      },
    };
  } else if (dayOfWeek === 2 && hour >= 6 && hour <= 14) {
    message = {
      icon: <TagIcon color="#D4A574" />,
      text: "Dollar General penny list drops today — check Penny Drops",
    };
  } else if (dayOfWeek === 6 && hour >= 6 && hour <= 12) {
    message = {
      icon: <MapIcon color="#5CE0B8" />,
      text: "Saturday morning — prime yard sale time in your area",
      cta: {
        label: "Open yard sale map →",
        onTap: () => {
          // Yard-sale map route not yet wired.
          console.log("yard sale map");
        },
      },
    };
  } else if (todayScans === 0 && hour >= 8) {
    message = {
      icon: <CoinMark size={20} color="#5A4E70" />,
      text: "No scans today yet. Your next flip is out there.",
    };
  }

  if (!message || dismissed) return null;

  const fadeOut = dismissing;

  return (
    <div
      style={{
        overflow: "hidden",
        maxHeight: fadeOut ? 0 : 400,
        transition:
          "max-height 200ms cubic-bezier(0.16, 1, 0.3, 1) 200ms",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderLeft: message.accentBorder
            ? "3px solid rgba(92,224,184,0.5)"
            : "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.06)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          opacity: fadeOut ? 0 : 1,
          transform: fadeOut ? "translateY(-8px)" : "translateY(0)",
          transition:
            "opacity 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", height: 20 }}>
          {message.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: 13,
              lineHeight: 1.4,
              color: "#C8C0D8",
            }}
          >
            {message.text}
          </div>
          {message.cta && (
            <button
              type="button"
              onClick={message.cta.onTap}
              style={{
                marginTop: 6,
                padding: 0,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: 12,
                color: "#5CE0B8",
                textAlign: "left",
              }}
            >
              {message.cta.label}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            flexShrink: 0,
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
