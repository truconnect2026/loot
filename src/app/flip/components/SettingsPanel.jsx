"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

function readBool(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    if (v === "true") return true;
    if (v === "false") return false;
  } catch { /* private mode */ }
  return fallback;
}

function writeBool(key, value) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, value ? "true" : "false"); } catch { /* */ }
}

export default function SettingsPanel({ onClose }) {
  const [sounds, setSounds] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [stats, setStats] = useState({ streak: 0, total: 0, best: 0 });

  useEffect(() => {
    setSounds(readBool("fos-sounds-enabled", true));
    setHaptics(readBool("fos-haptics-enabled", true));
    setReducedMotion(readBool("fos-reduced-motion", false));
    try {
      setStats({
        streak: parseInt(localStorage.getItem("fos-streak-count") || "0", 10),
        total: parseInt(localStorage.getItem("fos-total-flipped") || "0", 10),
        best: parseInt(localStorage.getItem("fos-best-score") || "0", 10),
      });
    } catch { /* */ }
  }, []);

  const onResetAll = () => {
    if (typeof window === "undefined") return;
    if (!window.confirm("Reset all loot.works/flip data? This clears streaks and history.")) return;
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("fos-"))
        .forEach((k) => localStorage.removeItem(k));
    } catch { /* */ }
    onClose?.();
  };

  return (
    <motion.div
      className="flip-settings-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="flip-settings"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flip-settings-handle" />
        <div className="flip-settings-title">SETTINGS</div>

        <Row label="SOUNDS" value={sounds} onChange={(v) => { setSounds(v); writeBool("fos-sounds-enabled", v); }} />
        <Row label="HAPTICS" value={haptics} onChange={(v) => { setHaptics(v); writeBool("fos-haptics-enabled", v); }} />
        <Row label="REDUCED MOTION" value={reducedMotion} onChange={(v) => { setReducedMotion(v); writeBool("fos-reduced-motion", v); }} />

        <div className="flip-settings-stats">
          <Stat label="STREAK" value={stats.streak} />
          <Stat label="LIFETIME" value={`$${stats.total.toLocaleString()}`} />
          <Stat label="BEST" value={`${stats.best}`} />
        </div>

        <button type="button" onClick={onResetAll} className="flip-settings-reset">RESET ALL DATA</button>

        <div className="flip-settings-foot">v1.0.0 · loot.works/flip</div>
      </motion.div>
    </motion.div>
  );
}

function Row({ label, value, onChange }) {
  return (
    <label className="flip-settings-row">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`flip-settings-toggle ${value ? "is-on" : ""}`}
      >
        <span />
      </button>
    </label>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flip-settings-stat">
      <div className="flip-settings-stat-label">{label}</div>
      <div className="flip-settings-stat-value">{value}</div>
    </div>
  );
}
