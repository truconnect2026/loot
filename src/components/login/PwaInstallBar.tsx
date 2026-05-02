"use client";

import { useEffect, useRef, useState } from "react";

/**
 * PWA install prompt — a designed-in bar pinned to the bottom of the
 * login page. NOT the browser's default banner.
 *
 * Platform paths:
 *   - iOS Safari (no programmatic install): show the bar, and on tap
 *     open a glass popover with manual share-sheet instructions.
 *   - Android Chrome / supported browsers: capture beforeinstallprompt,
 *     trigger the native dialog when the user taps Install.
 *   - Already installed (standalone display mode or navigator.standalone):
 *     never render.
 *   - Unsupported (no iOS UA, no beforeinstallprompt fires): never
 *     render — bar only appears when there's an install path to take.
 *
 * Storage gates (all wrapped in try/catch for private mode):
 *   - sessionStorage `loot.pwa.dismissed` — current session dismissal
 *   - localStorage   `loot.pwa.dismissedAt` — 7-day cooldown timestamp
 *   - localStorage   `loot.pwa.installed` — permanent "already installed"
 *
 * Animation respects prefers-reduced-motion (no slide-up; just appears).
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const STORAGE_INSTALLED = "loot.pwa.installed";
const STORAGE_DISMISSED_AT = "loot.pwa.dismissedAt";
const STORAGE_SESSION_DISMISSED = "loot.pwa.dismissed";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SLIDE_DELAY_MS = 2500;
const EXIT_MS = 280;

function safeLocalGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeLocalSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode — silent no-op */
  }
}
function safeSessionGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSessionSet(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* private mode — silent no-op */
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari has its own non-standard standalone flag.
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  // iPad on iOS 13+ reports "Macintosh" UA; check touch points as fallback.
  const isIosUa = /iPad|iPhone|iPod/.test(ua);
  const isIpadOs =
    /Macintosh/.test(ua) &&
    typeof window.navigator.maxTouchPoints === "number" &&
    window.navigator.maxTouchPoints > 1;
  if (!isIosUa && !isIpadOs) return false;
  // Exclude in-app webviews + Chrome on iOS, neither of which can install.
  if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) return false;
  return true;
}

type Platform = "ios" | "android" | "none";

export default function PwaInstallBar() {
  const [shouldRender, setShouldRender] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const platformRef = useRef<Platform>("none");
  const promptEventRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Dev escape hatch: append ?pwareset=1 to wipe the storage gates
    // (session dismiss + 7-day cooldown + installed flag) so a
    // previously-dismissed bar can be re-tested without manually clearing
    // DevTools storage. Runs before any of the gates below.
    const search = window.location.search;
    if (search.includes("pwareset=1")) {
      try {
        window.localStorage.removeItem(STORAGE_INSTALLED);
        window.localStorage.removeItem(STORAGE_DISMISSED_AT);
        window.sessionStorage.removeItem(STORAGE_SESSION_DISMISSED);
      } catch {
        /* private mode — silent no-op */
      }
    }
    // Debug logging gate: dev builds always log; in any env, ?pwadebug=1
    // turns it on. Tagged so it doesn't get lost in console noise.
    const debug =
      process.env.NODE_ENV !== "production" || search.includes("pwadebug=1");
    const log = (...args: unknown[]) => {
      if (debug) console.log("[PwaInstallBar]", ...args);
    };

    const standaloneMq =
      window.matchMedia?.("(display-mode: standalone)").matches ?? false;
    const navStandalone =
      (window.navigator as Navigator & { standalone?: boolean }).standalone;
    const ua = window.navigator.userAgent;
    log("detection", {
      standaloneMq,
      navStandalone,
      ua,
      isStandalone: isStandalone(),
      isIosSafari: isIosSafari(),
      maxTouchPoints: window.navigator.maxTouchPoints,
      installedFlag: safeLocalGet(STORAGE_INSTALLED),
      sessionDismissed: safeSessionGet(STORAGE_SESSION_DISMISSED),
      dismissedAt: safeLocalGet(STORAGE_DISMISSED_AT),
    });

    // Already installed — never render.
    if (isStandalone()) {
      log("gate: standalone, not rendering");
      return;
    }
    if (safeLocalGet(STORAGE_INSTALLED) === "1") {
      log("gate: installed flag set, not rendering");
      return;
    }

    // Dismissed this session — never render this session.
    if (safeSessionGet(STORAGE_SESSION_DISMISSED) === "1") {
      log("gate: session-dismissed, not rendering");
      return;
    }

    // Within 7-day cooldown after a previous dismiss — wait it out.
    const dismissedAtRaw = safeLocalGet(STORAGE_DISMISSED_AT);
    if (dismissedAtRaw) {
      const ts = parseInt(dismissedAtRaw, 10);
      if (Number.isFinite(ts) && Date.now() - ts < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - (Date.now() - ts);
        log(
          "gate: in 7-day cooldown",
          `${Math.round(remainingMs / 86400000)}d remaining`,
          "(append ?pwareset=1 to clear)",
        );
        return;
      }
    }

    // Defer the setState calls past the synchronous effect body so the
    // react-hooks/set-state-in-effect rule is satisfied — same pattern
    // as DotGridBackground's mount-time platform reads.
    queueMicrotask(() => {
      setReducedMotion(
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
          false,
      );
      if (isIosSafari()) {
        platformRef.current = "ios";
        setShouldRender(true);
        log("platform: ios — rendering");
      } else {
        log("platform: not iOS — waiting for beforeinstallprompt");
      }
    });

    // Android Chrome (+ other Chromium-based browsers) fire this when an
    // installable manifest is detected and the engagement heuristics pass.
    // Calling preventDefault() suppresses Chrome's mini-infobar so our
    // designed-in bar is the user's only install affordance.
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      promptEventRef.current = e as BeforeInstallPromptEvent;
      platformRef.current = "android";
      setShouldRender(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Fires on successful install via any path (our prompt OR the address-bar
    // install icon OR Add to Home Screen on iOS — though iOS rarely fires it).
    const handleAppInstalled = () => {
      safeLocalSet(STORAGE_INSTALLED, "1");
      setShouldRender(false);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Slide-up after the configured delay so the bar doesn't compete with
  // the login flow on first paint. The setState fires from a setTimeout
  // callback (or a microtask in the reduced-motion branch), so it's
  // already past the synchronous effect body — but the lint rule traces
  // through 0ms timers, so use queueMicrotask which it accepts as an
  // explicit deferral.
  useEffect(() => {
    if (!shouldRender) return;
    if (reducedMotion) {
      queueMicrotask(() => setSlideIn(true));
      return;
    }
    const timer = window.setTimeout(() => setSlideIn(true), SLIDE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [shouldRender, reducedMotion]);

  function handleInstall() {
    if (platformRef.current === "ios") {
      setShowIosTip((v) => !v);
      return;
    }
    const event = promptEventRef.current;
    if (!event) return;
    event.prompt().catch(() => {
      /* user cancelled at the OS level — no-op */
    });
    event.userChoice
      .then(({ outcome }) => {
        if (outcome === "accepted") {
          safeLocalSet(STORAGE_INSTALLED, "1");
          setShouldRender(false);
        }
        // Either way, the prompt event is single-use; clear the ref.
        promptEventRef.current = null;
      })
      .catch(() => {
        promptEventRef.current = null;
      });
  }

  function handleDismiss() {
    safeSessionSet(STORAGE_SESSION_DISMISSED, "1");
    safeLocalSet(STORAGE_DISMISSED_AT, String(Date.now()));
    setSlideIn(false);
    setShowIosTip(false);
    const exitMs = reducedMotion ? 0 : EXIT_MS;
    window.setTimeout(() => setShouldRender(false), exitMs);
  }

  if (!shouldRender) return null;

  return (
    <div
      role="region"
      aria-label="Install Loot"
      style={{
        position: "fixed",
        // Inset 16px from the viewport edges; never narrower than the auth
        // card stack above. zIndex above the login content but below any
        // future modals.
        left: 16,
        right: 16,
        bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        zIndex: 60,
        // Slide + fade in. Enter offset is 120% so the bar fully clears
        // the safe-area inset before easing in.
        transform: slideIn ? "translateY(0)" : "translateY(120%)",
        opacity: slideIn ? 1 : 0,
        transition: reducedMotion
          ? undefined
          : `transform 360ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms cubic-bezier(0.22, 1, 0.36, 1)`,
        pointerEvents: slideIn ? "auto" : "none",
      }}
    >
      {showIosTip && <IosInstallTip onClose={() => setShowIosTip(false)} />}

      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px) saturate(150%)",
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
          boxShadow:
            "inset 0 1px 0 0 rgba(255,255,255,0.04), 0 8px 32px -8px rgba(0,0,0,0.5)",
          borderRadius: 16,
          height: 56,
          display: "flex",
          alignItems: "center",
          paddingLeft: 14,
          paddingRight: 8,
          gap: 10,
        }}
      >
        <PhoneIcon />
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 500,
            color: "rgba(255,255,255,0.80)",
            lineHeight: 1.3,
          }}
        >
          Install Loot for the full experience
        </span>
        <button
          type="button"
          onClick={handleInstall}
          style={{
            height: 32,
            paddingLeft: 12,
            paddingRight: 12,
            borderRadius: 8,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.20)",
            color: "var(--ui-primary)",
            fontFamily: "var(--font-body)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.02em",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Install
        </button>
        <button
          type="button"
          aria-label="Dismiss install prompt"
          onClick={handleDismiss}
          style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            flexShrink: 0,
            padding: 0,
          }}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

interface IosInstallTipProps {
  onClose: () => void;
}

function IosInstallTip({ onClose }: IosInstallTipProps) {
  return (
    <div
      role="dialog"
      aria-label="iOS install instructions"
      style={{
        position: "absolute",
        bottom: "calc(100% + 10px)",
        left: 0,
        right: 0,
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px) saturate(150%)",
        WebkitBackdropFilter: "blur(20px) saturate(150%)",
        boxShadow:
          "inset 0 1px 0 0 rgba(255,255,255,0.04), 0 8px 32px -8px rgba(0,0,0,0.5)",
        borderRadius: 14,
        padding: "12px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <ShareIcon />
      <span
        style={{
          flex: 1,
          fontFamily: "var(--font-body)",
          fontSize: 12.5,
          color: "rgba(255,255,255,0.85)",
          lineHeight: 1.4,
        }}
      >
        tap the Safari share button{" "}
        <ShareIconInline />
        {" "}then choose &ldquo;Add to Home Screen&rdquo;
      </span>
      <button
        type="button"
        aria-label="Close instructions"
        onClick={onClose}
        style={{
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          padding: 0,
          flexShrink: 0,
        }}
      >
        <CloseIconSmall />
      </button>
    </div>
  );
}

// ── Icons ──

function PhoneIcon() {
  // Phone with a downward arrow inside — reads as "install to phone."
  // Avoids platform-specific iconography per the spec.
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.65)"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <rect x={5} y={2} width={14} height={20} rx={2.5} />
      <path d="M12 8v6" />
      <polyline points="9 11 12 14 15 11" />
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
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={18} y1={6} x2={6} y2={18} />
      <line x1={6} y1={6} x2={18} y2={18} />
    </svg>
  );
}

function CloseIconSmall() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={18} y1={6} x2={6} y2={18} />
      <line x1={6} y1={6} x2={18} y2={18} />
    </svg>
  );
}

function ShareIcon() {
  // iOS Safari share-button shape — square with arrow up. Same icon
  // shown inline mid-sentence below; full-size here as the visual anchor.
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.65)"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <path d="M12 16V4" />
      <polyline points="8 8 12 4 16 8" />
      <path d="M5 12v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
    </svg>
  );
}

function ShareIconInline() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.85)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        display: "inline-block",
        verticalAlign: "-1px",
      }}
    >
      <path d="M12 16V4" />
      <polyline points="8 8 12 4 16 8" />
      <path d="M5 12v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
    </svg>
  );
}
