"use client";

/**
 * Mesh-gradient background — blurred color blobs over a dark base.
 *
 * `variant="default"` — three slow-drifting blobs on a flat #120e18 base.
 *
 * `variant="login"` — a living environment: five overlapping blobs on offset
 * loops (large mint + periwinkle slow, three small accents faster), a canvas
 * of 18 ember-like particles drifting upward, a cinematic vignette, and a
 * subtle ground gradient (#120e18 → #16121e).
 */

import { useEffect, useRef } from "react";

interface DotGridBackgroundProps {
  variant?: "default" | "login";
}

export default function DotGridBackground({
  variant = "default",
}: DotGridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    const makeParticle = (randomY = true) => ({
      x: Math.random() * viewW(),
      y: randomY ? Math.random() * viewH() : viewH() + 2,
      speed: 0.2 + Math.random() * 0.3,
      wobbleSpeed: 0.5 + Math.random() * 1.5,
      wobblePhase: Math.random() * Math.PI * 2,
      opacity: 0.1 + Math.random() * 0.15,
    });

    const particles = Array.from({ length: 18 }, () => makeParticle(true));

    let raf = 0;
    let time = 0;
    const draw = () => {
      time += 0.016;
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
          p.wobbleSpeed = fresh.wobbleSpeed;
          p.wobblePhase = fresh.wobblePhase;
          p.opacity = fresh.opacity;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(92, 224, 184, ${p.opacity})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [variant]);

  if (variant === "login") {
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
              backgroundColor: "#5CE0B8",
              opacity: 0.12,
              filter: "blur(120px)",
              animation: "loginBlobLargeA 22s ease-in-out infinite",
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
              opacity: 0.08,
              filter: "blur(120px)",
              animation: "loginBlobLargeB 25s ease-in-out infinite",
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
              opacity: 0.1,
              filter: "blur(80px)",
              animation: "loginBlobSmallA 10s ease-in-out infinite",
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
              opacity: 0.06,
              filter: "blur(70px)",
              animation: "loginBlobSmallB 8s ease-in-out infinite",
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
              opacity: 0.07,
              filter: "blur(60px)",
              animation: "loginBlobSmallC 12s ease-in-out infinite",
            }}
          />
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
            opacity: 0.07,
            filter: "blur(120px)",
            animation: "blobDriftA 22s ease-in-out infinite",
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
            opacity: 0.05,
            filter: "blur(120px)",
            animation: "blobDriftB 25s ease-in-out infinite",
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
            opacity: 0.05,
            filter: "blur(120px)",
            animation: "blobDriftC 20s ease-in-out infinite",
          }}
        />
      </div>
    </>
  );
}
