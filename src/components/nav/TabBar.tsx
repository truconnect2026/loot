"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// Routes where the tab bar is rendered.
const TABBED_ROUTES = ["/app", "/sourcing", "/tools", "/account"];

// One real badge signal: a BUY result was recorded and the haul log
// hasn't been opened yet. Set by app/page.tsx handleScanResult;
// cleared by app/haul/page.tsx on mount. Reads localStorage so the
// value survives navigation without global state.
function useScanBadge(): boolean {
  const [has, setHas] = useState(false);
  useEffect(() => {
    const check = () =>
      setHas(localStorage.getItem("loot_haul_pending") === "1");
    check();
    window.addEventListener("storage", check);
    window.addEventListener("focus", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("focus", check);
    };
  }, []);
  return has;
}

// ── Tab icons (20px stroke) ────────────────────────────────────────────────

function HomeIcon({ color }: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CompassIcon({ color }: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={12} r={10} />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function WrenchIcon({ color }: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function UserIcon({ color }: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx={12} cy={7} r={4} />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#070510" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx={12} cy={13} r={4} />
    </svg>
  );
}

// ── Tab config ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "home",     label: "Home",     route: "/app"      },
  { id: "sourcing", label: "Sourcing", route: "/sourcing" },
  { id: "scan",     label: "SCAN",     route: null        },
  { id: "tools",    label: "Tools",    route: "/tools"    },
  { id: "account",  label: "Me",       route: "/account"  },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── TabBarMount ────────────────────────────────────────────────────────────
// Placed in root layout; renders nothing outside the tabbed routes.

export function TabBarMount() {
  const pathname = usePathname();
  const show = TABBED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );
  if (!show) return null;
  return <TabBar />;
}

// ── TabBar ─────────────────────────────────────────────────────────────────

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const hasBuyBadge = useScanBadge();

  function activeId(): TabId | null {
    for (const tab of TABS) {
      if (!tab.route) continue;
      if (pathname === tab.route || pathname.startsWith(tab.route + "/")) {
        return tab.id as TabId;
      }
    }
    return null;
  }
  const active = activeId();

  return (
    <nav
      role="navigation"
      aria-label="App navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "#070510",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.5)",
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map((tab) => {
        // ── Center SCAN button — elevated circular mint ──────────────
        if (tab.id === "scan") {
          return (
            <div
              key="scan"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 6,
                paddingBottom: 10,
              }}
            >
              <button
                onClick={() => router.push("/app?scan=shelf")}
                aria-label="Scan shelf"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#5CE0B8",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 16px rgba(92,224,184,0.45)",
                  marginTop: -16,
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                {hasBuyBadge && (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#E8636B",
                      border: "2px solid #070510",
                    }}
                  />
                )}
                <CameraIcon />
              </button>
            </div>
          );
        }

        // ── Standard tab button ─────────────────────────────────────
        const isActive = active === tab.id;
        const color = isActive ? "#5CE0B8" : "#3f3853";

        return (
          <button
            key={tab.id}
            onClick={() => tab.route && router.push(tab.route)}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: "8px 0 10px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color,
              transition: "color 150ms ease",
            }}
          >
            {tab.id === "home"     && <HomeIcon color={color} />}
            {tab.id === "sourcing" && <CompassIcon color={color} />}
            {tab.id === "tools"    && <WrenchIcon color={color} />}
            {tab.id === "account"  && <UserIcon color={color} />}
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono, monospace)",
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
