"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import SplashScreen from "@/components/shared/SplashScreen";

/**
 * Layout-level splash wrapper. Mounts the brand splash on first load
 * and keeps it visible for at least 1200ms so the user has time to
 * register the brand even on fast hydration paths. Then plays the
 * 400ms exit fade and unmounts.
 *
 * Once the splash unmounts, this wrapper is a no-op for the rest of
 * the session — internal route transitions don't re-trigger it.
 *
 * The 1200ms minimum is the only signal — we don't gate on auth here
 * because the layout has no awareness of the auth flow. Routes that
 * need their own auth-aware loading screen (the dashboard's
 * gateChecked branch, for example) render their own SplashScreen
 * instance, sharing the same visual identity so the transition feels
 * continuous.
 */

const MIN_VISIBLE_MS = 1200;
const EXIT_MS = 400;

export default function SplashGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // /marketing-screens/* and /adcard render idealized phone-mockup / ad
  // -still content captured for the brand kit and ad compositing. The
  // splash overlay would leak into the captures, so suppress it on
  // those routes — they are never linked from anywhere user-facing.
  const skipSplash =
    (pathname?.startsWith("/marketing-screens") || pathname?.startsWith("/adcard")) ?? false;

  // mounted: render the SplashScreen at all
  // exiting: drives the splashExit fade
  const [mounted, setMounted] = useState(!skipSplash);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (skipSplash) return;
    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, MIN_VISIBLE_MS);
    const unmountTimer = window.setTimeout(() => {
      setMounted(false);
    }, MIN_VISIBLE_MS + EXIT_MS);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(unmountTimer);
    };
  }, [skipSplash]);

  return (
    <>
      {children}
      {mounted && <SplashScreen exiting={exiting} />}
    </>
  );
}
