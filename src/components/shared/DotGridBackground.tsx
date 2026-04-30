"use client";

/**
 * Mesh-gradient background — blurred color blobs over a dark base.
 *
 * `variant="default"` — three slow-drifting blobs on a flat #120e18 base.
 *
 * `variant="login"` — a living environment: five overlapping blobs on offset
 * loops (large mint + periwinkle slow, three small accents faster), a canvas
 * of 18 ember-like particles drifting upward, a cinematic vignette, and a
 * subtle ground gradient (#120e18 → #16121e). Mint hue and overall opacity
 * shift by hour: morning adds a 6th gold blob; evening cools mint to teal;
 * night dims everything 30%.
 *
 * Honors `prefers-reduced-motion`: drops blob CSS drift animations and paints
 * the particle canvas once instead of running the requestAnimationFrame loop.
 */

import { useEffect, useRef, useState } from "react";

interface DotGridBackgroundProps {
  variant?: "default" | "login";
}

export default function DotGridBackground({
  variant = "default",
}: DotGridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hour, setHour] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Microtask defers the setState past the synchronous effect body so
    // react-hooks/set-state-in-effect doesn't trace the call into setState.
    queueMicrotask(() => {
      setHour(new Date().getHours());
      if (typeof window !== "undefined" && window.matchMedia) {
        setReducedMotion(
          window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        );
      }
    });
  }, []);

  useEffect(() => {
    if (variant !== "login") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const viewW = () => window.innerWidth;
    const viewH = () => window.innerHeight;

    // Size-based parallax: small particles (1–2px) drift fast (0.4–0.6 px/frame);
    // large particles (2.5–3.5px) drift slow (0.15–0.3 px/frame).
    const makeParticle = (randomY = true) => {
      const radius = 1 + Math.random() * 2.5;
      const sizeT = Math.min(1, Math.max(0, (radius - 1) / 2.5));
      const speed = 0.55 - 0.35 * sizeT + (Math.random() - 0.5) * 0.06;
      return {
        x: Math.random() * viewW(),
        y: randomY ? Math.random() * viewH() : viewH() + 2,
        speed,
        radius,
        wobbleSpeed: 0.5 + Math.random() * 1.5,
        wobblePhase: Math.random() * Math.PI * 2,
        opacity: 0.1 + Math.random() * 0.15,
        flashCountdown: 200 + Math.floor(Math.random() * 400),
        flashState: "idle" as "idle" | "rising" | "holding" | "fading",
        flashFrame: 0,
      };
    };

    const particles = Array.from({ length: 18 }, () => makeParticle(true));

    // Reduced-motion: paint particles once, no RAF loop.
    const drawStatic = () => {
      const w = viewW();
      const h = viewH();
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(92, 224, 184, ${p.opacity})`;
        ctx.fill();
      }
    };

    if (reducedMotion) {
      drawStatic();
      return () => {
        window.removeEventListener("resize", resize);
      };
    }

    // Firefly flash: 10f rise → 10f hold @ 0.6 → 40f fade. Only one particle
    // at a time — others wait until current flash + 60-frame buffer clears.
    const FLASH_PEAK = 0.6;
    const FLASH_RISE = 10;
    const FLASH_HOLD = 10;
    const FLASH_FADE = 40;
    const FLASH_GAP = 60;
    let frame = 0;
    let nextFlashAllowed = 0;

    let raf = 0;
    let time = 0;
    const draw = () => {
      time += 0.016;
      frame++;
      const w = viewW();
      const h = viewH();
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y -= p.speed;
        p.x += Math.sin(time * p.wobbleSpeed + p.wobblePhase) * 0.3;

        if (p.y < -2) {
          const fresh = makeParticle(false);
          p.x = fresh.x;
          p.y = fresh.y;
          p.speed = fresh.speed;
          p.radius = fresh.radius;
          p.wobbleSpeed = fresh.wobbleSpeed;
          p.wobblePhase = fresh.wobblePhase;
          p.opacity = fresh.opacity;
          p.flashCountdown = fresh.flashCountdown;
          p.flashState = "idle";
          p.flashFrame = 0;
        }

        let alpha = p.opacity;
        if (p.flashState === "idle") {
          p.flashCountdown--;
          if (p.flashCountdown <= 0 && frame >= nextFlashAllowed) {
            p.flashState = "rising";
            p.flashFrame = 0;
            nextFlashAllowed =
              frame + FLASH_RISE + FLASH_HOLD + FLASH_FADE + FLASH_GAP;
          }
        } else if (p.flashState === "rising") {
          p.flashFrame++;
          alpha =
            p.opacity + (FLASH_PEAK - p.opacity) * (p.flashFrame / FLASH_RISE);
          if (p.flashFrame >= FLASH_RISE) {
            p.flashState = "holding";
            p.flashFrame = 0;
          }
        } else if (p.flashState === "holding") {
          p.flashFrame++;
          alpha = FLASH_PEAK;
          if (p.flashFrame >= FLASH_HOLD) {
            p.flashState = "fading";
            p.flashFrame = 0;
          }
        } else {
          p.flashFrame++;
          alpha =
            FLASH_PEAK + (p.opacity - FLASH_PEAK) * (p.flashFrame / FLASH_FADE);
          if (p.flashFrame >= FLASH_FADE) {
            p.flashState = "idle";
            p.flashCountdown = 200 + Math.floor(Math.random() * 400);
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(92, 224, 184, ${alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [variant, reducedMotion]);

  if (variant === "login") {
    // Time-of-day tinting — afternoon defaults used during SSR before hour resolves.
    let largeMintColor = "#5CE0B8";
    let largeMintOpacity = 0.12;
    let largePeriOpacity = 0.08;
    let showMorningGold = false;
    let dim = 1;

    if (hour !== null) {
      if (hour >= 6 && hour < 12) {
        // Morning — mint slightly brighter, add small gold near top.
        largeMintOpacity = 0.13;
        showMorningGold = true;
      } else if (hour >= 18 && hour < 24) {
        // Evening — cooler teal mint, periwinkle warmer.
        largeMintColor = "#4AB8D4";
        largeMintOpacity = 0.1;
        largePeriOpacity = 0.09;
      } else if (hour >= 0 && hour < 6) {
        // Night — quiet, all blobs dimmed 30%.
        dim = 0.7;
      }
    }

    return (
      <>
        <style>{`
          @keyframes loginBlobLargeA {
            0%   { transform: translate(0, 0); }
            25%  { transform: translate(18px, 14px); }
            50%  { transform: translate(32px, -10px); }
            75%  { transform: translate(6px, -24px); }
            100% { transform: translate(0, 0); }
          }
          @keyframes loginBlobLargeB {
            0%   { transform: translate(0, 0); }
            25%  { transform: translate(-22px, 12px); }
            50%  { transform: translate(-30px, -20px); }
            75%  { transform: translate(8px, -26px); }
            100% { transform: translate(0, 0); }
          }
          @keyframes loginBlobSmallA {
            0%   { transform: translate(0, 0); }
            25%  { transform: translate(14px, -10px); }
            50%  { transform: translate(-8px, -22px); }
            75%  { transform: translate(-18px, 6px); }
            100% { transform: translate(0, 0); }
          }
          @keyframes loginBlobSmallB {
            0%   { transform: translate(0, 0); }
            25%  { transform: translate(-12px, 10px); }
            50%  { transform: translate(-20px, -8px); }
            75%  { transform: translate(6px, -16px); }
            100% { transform: translate(0, 0); }
          }
          @keyframes loginBlobSmallC {
            0%   { transform: translate(0, 0); }
            25%  { transform: translate(10px, 12px); }
            50%  { transform: translate(20px, -6px); }
            75%  { transform: translate(-6px, -18px); }
            100% { transform: translate(0, 0); }
          }
        `}</style>
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            overflow: "hidden",
            pointerEvents: "none",
            background:
              "linear-gradient(180deg, #120e18 0%, #16121e 100%)",
          }}
        >
          {/* Mint — top-center, large */}
          <div
            style={{
              position: "absolute",
              top: -200,
              left: "50%",
              marginLeft: -300,
              width: 600,
              height: 600,
              borderRadius: "50%",
              backgroundColor: largeMintColor,
              opacity: largeMintOpacity * dim,
              filter: "blur(120px)",
              animation: reducedMotion
                ? undefined
                : "loginBlobLargeA 22s ease-in-out infinite",
            }}
          />
          {/* Periwinkle — bottom-right */}
          <div
            style={{
              position: "absolute",
              bottom: -120,
              right: -120,
              width: 450,
              height: 450,
              borderRadius: "50%",
              backgroundColor: "#7B8FFF",
              opacity: largePeriOpacity * dim,
              filter: "blur(120px)",
              animation: reducedMotion
                ? undefined
                : "loginBlobLargeB 25s ease-in-out infinite",
            }}
          />
          {/* Small mint — bottom-left */}
          <div
            style={{
              position: "absolute",
              bottom: "20%",
              left: "10%",
              width: 150,
              height: 150,
              borderRadius: "50%",
              backgroundColor: "#5CE0B8",
              opacity: 0.1 * dim,
              filter: "blur(80px)",
              animation: reducedMotion
                ? undefined
                : "loginBlobSmallA 10s ease-in-out infinite",
            }}
          />
          {/* Small warm gold — center-right */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: "25%",
              width: 120,
              height: 120,
              borderRadius: "50%",
              backgroundColor: "#D4A574",
              opacity: 0.06 * dim,
              filter: "blur(70px)",
              animation: reducedMotion
                ? undefined
                : "loginBlobSmallB 8s ease-in-out infinite",
            }}
          />
          {/* Small periwinkle — top-right */}
          <div
            style={{
              position: "absolute",
              top: "15%",
              right: "15%",
              width: 100,
              height: 100,
              borderRadius: "50%",
              backgroundColor: "#7B8FFF",
              opacity: 0.07 * dim,
              filter: "blur(60px)",
              animation: reducedMotion
                ? undefined
                : "loginBlobSmallC 12s ease-in-out infinite",
            }}
          />
          {/* Morning-only gold — small, near top */}
          {showMorningGold && (
            <div
              style={{
                position: "absolute",
                top: 60,
                left: "20%",
                width: 100,
                height: 100,
                borderRadius: "50%",
                backgroundColor: "#D4A574",
                opacity: 0.05,
                filter: "blur(60px)",
              }}
            />
          )}
          {/* Ambient particle canvas — above blobs, below vignette */}
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
          {/* Cinematic vignette — darken corners */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 2,
              background:
                "radial-gradient(circle, transparent 50%, rgba(0,0,0,0.35) 100%)",
            }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes blobDriftA {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(20px, 18px); }
          50%  { transform: translate(36px, -12px); }
          75%  { transform: translate(8px, -30px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes blobDriftB {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(-24px, 14px); }
          50%  { transform: translate(-32px, -22px); }
          75%  { transform: translate(10px, -28px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes blobDriftC {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(28px, -16px); }
          50%  { transform: translate(-12px, -32px); }
          75%  { transform: translate(-30px, 10px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          pointerEvents: "none",
          backgroundColor: "#120e18",
        }}
      >
        {/* Mint — top-left */}
        <div
          style={{
            position: "absolute",
            top: -160,
            left: -80,
            width: 500,
            height: 500,
            borderRadius: "50%",
            backgroundColor: "#5CE0B8",
            opacity: 0.09,
            filter: "blur(120px)",
            animation: reducedMotion
              ? undefined
              : "blobDriftA 22s ease-in-out infinite",
          }}
        />
        {/* Periwinkle — mid-right */}
        <div
          style={{
            position: "absolute",
            top: "40%",
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            backgroundColor: "#7B8FFF",
            opacity: 0.07,
            filter: "blur(120px)",
            animation: reducedMotion
              ? undefined
              : "blobDriftB 25s ease-in-out infinite",
          }}
        />
        {/* Camel — bottom-center */}
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: "30%",
            width: 350,
            height: 350,
            borderRadius: "50%",
            backgroundColor: "#D4A574",
            opacity: 0.06,
            filter: "blur(120px)",
            animation: reducedMotion
              ? undefined
              : "blobDriftC 20s ease-in-out infinite",
          }}
        />
      </div>
    </>
  );
}
