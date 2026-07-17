"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  useReducedMotion,
  animate,
} from "motion/react";
import GrailCardOverlay from "./GrailCardOverlay.jsx";
import { useTilt } from "../hooks/useMouseManager.jsx";
import { useDeviceClass } from "../lib/perf.js";

const RARITY_LABEL = {
  common: "COMMON",
  mid: "MID",
  high: "HIGH",
  grail: "GRAIL",
};

const SWIPE_OFFSET = 100;
const SWIPE_VELOCITY = 500;

/**
 * SwipeCard — editorial trading-card. Drag mechanics unchanged from prior
 * version (rotates around bottom-center, threshold + velocity exit, fly-out).
 * Visual layers are the new editorial treatment: rarity-aware bg, vignette
 * image, premium content panel, big swipe badges with sub-labels.
 */
export default function SwipeCard({ item, isTop, onSwipe, onDrag, firstRound }) {
  const x = useMotionValue(0);
  // Direct-manipulation drag stays enabled under reduced motion (the game
  // is unplayable without it, and a card tracking the finger 1:1 is not an
  // animation) — but every DERIVED motion (card rotation, image parallax,
  // snap-back spring, fly-out slide, mount pop) collapses to its final
  // state so a reduce user gets an instant, snappy, non-vestibular round.
  const reduced = useReducedMotion();
  const [exiting, setExiting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const idleTimerRef = useRef(null);
  const [idleNudge, setIdleNudge] = useState(0);
  // First-round teaching cue — dismisses the moment the player moves the
  // card, taps a button, or after 5s. Only ever shown on the very first
  // card of a round (firstRound), so returning motion never sees it.
  const [cueOff, setCueOff] = useState(false);
  const cardRef = useRef(null);
  const { enableHeavyEffects } = useDeviceClass();
  // PERF: 3D tilt only on heavy-effects-capable desktops, top card only.
  const { tiltX, tiltY } = useTilt(cardRef, {
    maxRotateX: 6,
    maxRotateY: 6,
    enabled: enableHeavyEffects && isTop && !exiting,
  });

  const rotateRaw = useTransform(x, [-200, 200], [-18, 18]);
  const opacity = useTransform(x, [-220, -150, 0, 150, 220], [0, 1, 1, 1, 0]);
  const flipBadgeOpacity = useTransform(x, [0, 80], [0, 1]);
  const skipBadgeOpacity = useTransform(x, [-80, 0], [1, 0]);
  const mintOverlay = useTransform(x, [0, 150], [0, 0.4]);
  const redOverlay = useTransform(x, [-150, 0], [0.4, 0]);
  // Parallax: image translates opposite of card drag for depth.
  const imageParallaxXRaw = useTransform(x, [-200, 200], [10, -10]);
  // Under reduce, kill the drag-derived rotation + parallax (opacity-based
  // badge/overlay feedback stays — it aids the call and reads as instant).
  const rotate = reduced ? 0 : rotateRaw;
  const imageParallaxX = reduced ? 0 : imageParallaxXRaw;

  useMotionValueEvent(x, "change", (latest) => {
    if (isTop && onDrag) onDrag(latest);
    // Cancel idle nudge + dismiss the teaching cue when the user drags.
    if (Math.abs(latest) > 4) {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      setCueOff(true);
    }
  });

  // Auto-dismiss the first-round cue after 5s even if untouched.
  useEffect(() => {
    if (!isTop || !firstRound) return;
    const t = window.setTimeout(() => setCueOff(true), 5000);
    return () => window.clearTimeout(t);
  }, [isTop, firstRound]);

  // Idle nudge — after 3s of no movement on the top card, gently nudge.
  useEffect(() => {
    if (!isTop || exiting) return;
    idleTimerRef.current = window.setTimeout(() => {
      setIdleNudge((k) => k + 1);
    }, 3000);
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [isTop, exiting]);

  useEffect(() => {
    if (idleNudge === 0) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const controls = animate(x, [0, -16, 16, 0], {
      duration: 0.9,
      ease: [0.32, 0.72, 0, 1],
    });
    return () => controls.stop();
  }, [idleNudge, x]);

  const handleDragEnd = (_event, info) => {
    if (!isTop || exiting) return;
    const dx = info.offset.x;
    const vx = info.velocity.x;
    const passOffset = Math.abs(dx) > SWIPE_OFFSET;
    const passVelocity = Math.abs(vx) > SWIPE_VELOCITY;
    if (!passOffset && !passVelocity) {
      animate(x, 0, reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 });
      return;
    }
    const direction = dx > 0 || vx > 0 ? "flip" : "skip";
    flyOut(direction);
  };

  const flyOut = (direction) => {
    setExiting(true);
    setCueOff(true);
    const targetX =
      (direction === "flip" ? 1 : -1) *
      (typeof window !== "undefined" ? window.innerWidth * 1.5 : 800);
    animate(x, targetX, reduced ? { duration: 0 } : { duration: 0.3, ease: [0.32, 0.72, 0, 1] });
    onSwipe?.(direction);
  };

  useEffect(() => {
    if (!isTop) return;
    const handler = (e) => {
      if (e.detail?.itemId === item.id) flyOut(e.detail.direction);
    };
    window.addEventListener("flip-swipe", handler);
    // Keyboard nav (desktop): arrows + space
    const keys = (e) => {
      if (!isTop || exiting) return;
      if (e.key === "ArrowLeft") flyOut("skip");
      else if (e.key === "ArrowRight" || e.key === " " || e.key === "Spacebar") flyOut("flip");
    };
    window.addEventListener("keydown", keys);
    return () => {
      window.removeEventListener("flip-swipe", handler);
      window.removeEventListener("keydown", keys);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTop, item.id, exiting]);

  const rarityLabel = RARITY_LABEL[item.rarity] ?? "COMMON";
  const isGrail = item.rarity === "grail";

  return (
    <motion.div
      ref={cardRef}
      className={`flip-swipe-card flip-swipe-card--rarity-${item.rarity || "common"}`}
      style={{
        x,
        rotate,
        opacity,
        rotateX: tiltX,
        rotateY: tiltY,
        transformOrigin: "50% 100%",
        transformPerspective: 1200,
        touchAction: "pan-y",
        willChange: isTop ? "transform" : "auto",
      }}
      drag={isTop && !exiting ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      data-flip-item-id={item.id}
      /* THE DEAL — each find is dealt into the hot seat: it drops from below
         with weight and lands with a spring settle (compositor scale/y/opacity
         only; rotate/x stay owned by the drag MotionValues above). Reduced
         motion: present at rest, no deal-in. */
      initial={isTop && !reduced ? { scale: 0.78, y: 48, opacity: 0 } : false}
      animate={isTop ? { scale: 1, y: 0, opacity: 1 } : undefined}
      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 265, damping: 21, mass: 0.9 }}
    >
      <div className="flip-swipe-card-inner">
        {/* Image layer with parallax */}
        <motion.div className="flip-card-image-wrap" style={{ x: imageParallaxX }}>
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 85vw, 480px"
            priority={isTop}
            className="flip-swipe-img"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.endsWith("_placeholder.svg")) {
                target.src = "/items/_placeholder.svg";
              }
              setImageLoaded(true);
            }}
          />
          {!imageLoaded && <div className="flip-card-shimmer" aria-hidden="true" />}
          <div className="flip-card-vignette" aria-hidden="true" />
        </motion.div>

        {/* Grail-only animated treatment */}
        {isGrail && <GrailCardOverlay isTop={isTop} />}

        {/* FLIP badge */}
        <motion.div
          className="flip-badge flip-badge--flip"
          style={{ opacity: flipBadgeOpacity }}
          aria-hidden="true"
        >
          <span>FLIP</span>
          <span className="flip-badge-sub">send it →</span>
        </motion.div>

        {/* SKIP badge */}
        <motion.div
          className="flip-badge flip-badge--skip"
          style={{ opacity: skipBadgeOpacity }}
          aria-hidden="true"
        >
          <span>SKIP</span>
          <span className="flip-badge-sub">← pass</span>
        </motion.div>

        {/* Direction wash overlays */}
        <motion.div className="flip-overlay flip-overlay--mint" style={{ opacity: mintOverlay }} aria-hidden="true" />
        <motion.div className="flip-overlay flip-overlay--red" style={{ opacity: redOverlay }} aria-hidden="true" />

        {/* First-round teaching cue — a ghost finger sweeps left↔right to
            demonstrate the drag; the label teaches the mapping. Reduced
            motion: a static finger + label (a clean, complete hint). */}
        {isTop && firstRound && !cueOff && (
          <div className="flip-gesture-cue" aria-hidden="true">
            <span className="flip-gesture-track"><span className="flip-gesture-finger" /></span>
            <span className="flip-gesture-text">← skip · flip →</span>
          </div>
        )}

        {/* Content panel — bottom 35% */}
        <div className="flip-card-bottom">
          <div className="flip-card-bottom-fade" aria-hidden="true" />
          <div className="flip-card-text">
            <div className={`flip-rarity-chip flip-rarity-chip--${item.rarity || "common"}`}>{rarityLabel}</div>
            <div className={`flip-card-name ${isGrail ? "flip-card-name--grail" : ""}`}>{item.name}</div>
            <div className="flip-card-meta">{item.era} · {item.brand}</div>
            <div className="flip-card-hint">{item.hint}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
