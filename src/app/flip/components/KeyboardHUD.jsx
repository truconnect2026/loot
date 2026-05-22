"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const HINTS = {
  intro: "ENTER · play",
  playing: "← skip · → flip",
  phase2: "ENTER · lock in",
  results: "S · share · ENTER · replay",
};

/**
 * Tiny fixed-corner hint strip listing the keyboard shortcuts for the
 * current phase. Appears 4s after mouse activity starts; auto-hides 8s
 * after the last keyboard press; reappears on any keydown.
 *
 * Mobile (coarse pointer) never renders.
 */
export default function KeyboardHUD({ phase }) {
  const [coarse, setCoarse] = useState(true);
  const [visible, setVisible] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    setCoarse(window.matchMedia?.("(pointer: coarse)").matches ?? false);
  }, []);

  useEffect(() => {
    if (coarse) return;
    let mouseTimer = window.setTimeout(() => setArmed(true), 4000);
    const onMove = () => {
      if (armed) return;
      window.clearTimeout(mouseTimer);
      mouseTimer = window.setTimeout(() => setArmed(true), 4000);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.clearTimeout(mouseTimer);
      window.removeEventListener("mousemove", onMove);
    };
  }, [coarse, armed]);

  useEffect(() => {
    if (coarse || !armed) return;
    setVisible(true);
    let hideTimer = window.setTimeout(() => setVisible(false), 8000);
    const onKey = () => {
      setVisible(true);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setVisible(false), 8000);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(hideTimer);
      window.removeEventListener("keydown", onKey);
    };
  }, [coarse, armed]);

  if (coarse) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fos-kbd-hud"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 0.5, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3 }}
          aria-hidden="true"
        >
          {HINTS[phase] || HINTS.intro}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
