"use client";

import { useEffect, useRef } from "react";

/**
 * Canvas particle system — 28 coin ellipses with gravity, drift, rotation, fade.
 * Triggers when `active` flips to true. Self-cleans after ~180 frames (~1.5s).
 */

interface CoinRainProps {
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
}

const PARTICLE_COUNT = 28;
const COLORS = ["#5CE0B8", "#8AF0D4"];
const GRAVITY = 0.12;
const OPACITY_FADE = 0.004;
const MAX_FRAMES = 180;

function createParticles(width: number, height: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height * 0.3, // start in top 30%
      vx: Math.random() * 2 - 1, // -1 to 1
      vy: -(Math.random() * 2 + 1), // initial upward burst
      radius: 4 + Math.random() * 6, // 4-10px
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      opacity: 1,
      color: COLORS[i % 2],
    });
  }
  return particles;
}

export default function CoinRain({ active }: CoinRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevActive = useRef(false);

  useEffect(() => {
    // Only trigger on rising edge (false → true)
    if (!active || prevActive.current) {
      prevActive.current = active;
      return;
    }
    prevActive.current = active;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 2x for retina
    const dpr = window.devicePixelRatio || 2;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particles = createParticles(w, h);
    let frame = 0;
    let rafId: number;

    function tick() {
      if (frame >= MAX_FRAMES) {
        ctx!.clearRect(0, 0, w, h);
        return;
      }

      ctx!.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, p.opacity - OPACITY_FADE);

        if (p.opacity <= 0) continue;

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);
        ctx!.globalAlpha = p.opacity;
        ctx!.beginPath();
        // Ellipse for coin shape
        ctx!.ellipse(0, 0, p.radius, p.radius * 0.6, 0, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.fill();
        ctx!.restore();
      }

      frame++;
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, w, h);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        pointerEvents: "none",
      }}
    />
  );
}
