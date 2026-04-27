"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

/**
 * Page transition wrapper — slides pages left/right on navigation.
 * Forward: outgoing translateX(0→-100%), incoming translateX(100%→0)
 * Back: outgoing translateX(0→100%), incoming translateX(-100%→0)
 * Duration 250ms ease-out. Direction tracked via pathname depth.
 */

type Direction = "forward" | "back";

const PageTransitionContext = createContext<Direction>("forward");
export const useTransitionDirection = () => useContext(PageTransitionContext);

function pathDepth(p: string): number {
  return p.split("/").filter(Boolean).length;
}

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const prevChildrenRef = useRef(children);
  const [phase, setPhase] = useState<"idle" | "transitioning">("idle");
  const [direction, setDirection] = useState<Direction>("forward");
  const [outgoing, setOutgoing] = useState<ReactNode>(null);

  useEffect(() => {
    if (pathname === prevPathRef.current) {
      prevChildrenRef.current = children;
      return;
    }

    const dir =
      pathDepth(pathname) >= pathDepth(prevPathRef.current)
        ? "forward"
        : "back";

    setDirection(dir);
    setOutgoing(prevChildrenRef.current);
    setPhase("transitioning");

    const timer = setTimeout(() => {
      setPhase("idle");
      setOutgoing(null);
    }, 250);

    prevPathRef.current = pathname;
    prevChildrenRef.current = children;
    return () => clearTimeout(timer);
  }, [pathname, children]);

  const isMoving = phase === "transitioning";

  // Outgoing slide: slides out in the direction opposite to navigation
  const outgoingTransform = isMoving
    ? direction === "forward"
      ? "translateX(-100%)"
      : "translateX(100%)"
    : "translateX(0)";

  // Incoming starts offscreen, slides to center
  const incomingStart = direction === "forward" ? "translateX(100%)" : "translateX(-100%)";
  const incomingTransform = isMoving ? "translateX(0)" : "translateX(0)";

  return (
    <PageTransitionContext.Provider value={direction}>
      <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh" }}>
        {/* Outgoing page */}
        {isMoving && outgoing && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              transition: "transform 250ms ease-out",
              transform: outgoingTransform,
            }}
          >
            {outgoing}
          </div>
        )}

        {/* Current / incoming page */}
        <div
          style={
            isMoving
              ? {
                  transition: "transform 250ms ease-out",
                  transform: incomingTransform,
                  // Start offscreen — use animation instead for initial position
                }
              : {}
          }
        >
          {isMoving ? (
            <div
              style={{
                animation: `ptSlideIn 250ms ease-out forwards`,
              }}
            >
              <style>{`
                @keyframes ptSlideIn {
                  from { transform: ${incomingStart}; }
                  to { transform: translateX(0); }
                }
              `}</style>
              {children}
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </PageTransitionContext.Provider>
  );
}
