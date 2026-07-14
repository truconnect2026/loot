"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import useGameSounds from "../hooks/useGameSounds.jsx";
import useHaptics from "../hooks/useHaptics.jsx";
import { useTilt } from "../hooks/useMouseManager.jsx";
import { useDeviceClass } from "../lib/perf.js";

function buildEmojiGrid(answers, priceGuesses) {
  return answers.map((a) => {
    if (!a.correct) return "🟥";
    const g = priceGuesses?.[a.item?.id];
    if (g?.tier === "grail") return "💎";
    return "🟩";
  }).join("");
}

function buildCopyText({ day, score, total, dollars, emojiGrid }) {
  const url = `https://loot.works/flip?ref=share_grid`;
  return `FLIP OR SKIP #${day}\n${score}/${total} 🟩 · $${dollars} spotted\n${emojiGrid}\n\n${url}`;
}

function buildSmsText({ score, dollars }) {
  return `i spotted $${dollars} in thrift flips today on loot.works/flip — can you beat ${score}/10?`;
}

function buildTwitterIntent({ day, score, total, dollars, emojiGrid }) {
  const url = `https://loot.works/flip?ref=share_grid`;
  const text = `FLIP OR SKIP #${day}\n${score}/${total} 🟩 · $${dollars} spotted\n${emojiGrid}\n\nplay daily → `;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

export default function ShareGrid({ scoreData, puzzleNumber, answers, priceGuesses, tierGlyph, tierLabel }) {
  const sounds = useGameSounds();
  const haptics = useHaptics();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shared, setShared] = useState(false); // post-share thank-you state
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const confettiRef = useRef(null);
  const triggerRef = useRef(null);

  const emojiGrid = buildEmojiGrid(answers, priceGuesses);
  const copyText = buildCopyText({
    day: puzzleNumber, score: scoreData.swipeScore, total: 10,
    dollars: scoreData.totalDollarsSpotted, emojiGrid,
  });

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") setCanNativeShare(true);
    let cancelled = false;
    import("canvas-confetti").then((mod) => { if (!cancelled) confettiRef.current = mod.default; });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setPreviewOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const markShareCompleted = useCallback(() => {
    try {
      const prev = parseInt(localStorage.getItem("fos-share-completes") || "0", 10);
      localStorage.setItem("fos-share-completes", String(prev + 1));
      // Streak-boost banner on dashboard reads this within a 10-min window.
      sessionStorage.setItem("fos-just-shared", String(Date.now()));
    } catch { /* */ }
    setShared(true);
    window.dispatchEvent(new CustomEvent("fos:mascot-action", { detail: { action: "wink" } }));
    if (confettiRef.current) {
      confettiRef.current({
        particleCount: 30, spread: 70, origin: { x: 0.5, y: 0.6 },
        colors: ["#5CE0B8", "#F5C518", "#ffffff"], disableForReducedMotion: true,
      });
    }
  }, []);

  /**
   * COPY AS IMAGE — desktop-only. Uses html-to-image's toBlob on the hidden
   * 1080x1080 source card. Tries the async clipboard image API first; if
   * the browser denies image clipboard, falls back to downloading a PNG.
   *
   * Capability gate: width >= 1024 + navigator.clipboard.write exists.
   */
  const sourceRef = useRef(null);
  const [canImageShare, setCanImageShare] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      window.innerWidth >= 1024 &&
      typeof navigator !== "undefined" &&
      typeof navigator.clipboard?.write === "function" &&
      typeof window.ClipboardItem !== "undefined";
    setCanImageShare(ok);
  }, []);

  const doCopyAsImage = useCallback(async () => {
    if (!sourceRef.current) return;
    try {
      const htmlToImage = await import("html-to-image");
      const blob = await htmlToImage.toBlob(sourceRef.current, {
        cacheBust: true, width: 1080, height: 1080, pixelRatio: 1,
      });
      if (!blob) throw new Error("toBlob returned null");
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        showToast("📸 paste anywhere — IG ready");
        haptics.hapticTap();
        markShareCompleted();
        return;
      } catch {
        // Clipboard image denied — download instead.
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `flip-or-skip-day-${puzzleNumber}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast("📸 downloaded — share from your files");
        markShareCompleted();
      }
    } catch {
      showToast("couldn't render image — copy text instead");
    }
  }, [haptics, markShareCompleted, puzzleNumber, showToast]);

  const doCopy = useCallback(async (text = copyText, msg = "📋 grid copied — paste anywhere") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      sounds.playDing();
      haptics.hapticTap();
      if (confettiRef.current) {
        confettiRef.current({
          particleCount: 14, spread: 60, origin: { x: 0.5, y: 0.85 },
          colors: ["#5CE0B8", "#ffffff"], disableForReducedMotion: true,
        });
      }
      showToast(msg);
      window.setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      showToast("couldn't copy — long-press to grab text");
      return false;
    }
  }, [copyText, sounds, haptics, showToast]);

  const doNativeShare = useCallback(async () => {
    try {
      await navigator.share({
        title: `FLIP OR SKIP #${puzzleNumber}`,
        text: copyText,
        url: `https://loot.works/flip?ref=share_grid`,
      });
      haptics.hapticTap();
      markShareCompleted();
      return true;
    } catch {
      return false;
    }
  }, [copyText, puzzleNumber, haptics, markShareCompleted]);

  const openIntent = useCallback((url) => {
    haptics.hapticTap();
    window.open(url, "_blank", "noopener,noreferrer");
    markShareCompleted();
  }, [haptics, markShareCompleted]);

  const openSms = useCallback(() => {
    haptics.hapticTap();
    const text = buildSmsText({ score: scoreData.swipeScore, dollars: scoreData.totalDollarsSpotted });
    window.location.href = `sms:?&body=${encodeURIComponent(text)}`;
    markShareCompleted();
  }, [scoreData, haptics, markShareCompleted]);

  if (shared) {
    return (
      <motion.div
        className="flip-share-thanks"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flip-share-thanks-check" aria-hidden="true">✓</div>
        <div className="flip-share-thanks-head">DROPPED ✓</div>
        <div className="flip-share-thanks-sub">now do it for real</div>
        <Link href="/app?ref=flip_post_share" className="flip-rev-cta-btn">
          OPEN LOOT.WORKS →
        </Link>
        <div className="flip-share-thanks-fine">or play again tomorrow</div>
      </motion.div>
    );
  }

  return (
    <div className="flip-share-wrap">
      <div className="flip-share-card">
        <div className="flip-share-card-head">
          <span aria-hidden="true">🪐</span>
          <span>FLIP OR SKIP #{puzzleNumber}</span>
        </div>
        <div className="flip-share-card-score">
          <span className="flip-share-card-score-big">{scoreData.swipeScore}/10 🟩</span>
          <span className="flip-share-card-score-dollars">${scoreData.totalDollarsSpotted} spotted</span>
        </div>
        <div className="flip-share-card-emoji">{emojiGrid}</div>
        <div className="flip-share-card-foot">loot.works/flip</div>
      </div>

      <motion.button
        ref={triggerRef}
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => setPreviewOpen(true)}
        className="flip-share-primary"
      >
        {canNativeShare ? "SHARE RESULT" : "DROP THE GRID"}
      </motion.button>

      <AnimatePresence>
        {previewOpen && (
          <SharePreview
            text={copyText}
            emojiGrid={emojiGrid}
            puzzleNumber={puzzleNumber}
            scoreData={scoreData}
            canNativeShare={canNativeShare}
            canImageShare={canImageShare}
            copied={copied}
            onClose={() => { setPreviewOpen(false); triggerRef.current?.focus(); }}
            onShare={async () => { const ok = await doNativeShare(); if (ok) setPreviewOpen(false); }}
            onCopy={async () => { const ok = await doCopy(); if (ok) { markShareCompleted(); setPreviewOpen(false); } }}
            onCopyImage={async () => { await doCopyAsImage(); setPreviewOpen(false); }}
            onTwitter={() => { openIntent(buildTwitterIntent({ day: puzzleNumber, score: scoreData.swipeScore, total: 10, dollars: scoreData.totalDollarsSpotted, emojiGrid })); setPreviewOpen(false); }}
            onSms={() => { openSms(); setPreviewOpen(false); }}
            onDiscord={async () => {
              const ok = await doCopy(copyText, "📋 copied — paste in your Discord");
              if (ok) { markShareCompleted(); setPreviewOpen(false); }
            }}
          />
        )}
      </AnimatePresence>

      {/* Hidden 1080×1080 source element for COPY AS IMAGE. Positioned off-screen
          but rendered (display:none breaks html-to-image rendering). */}
      <div ref={sourceRef} className="fos-share-source" aria-hidden="true">
        <div className="fos-share-source-bg" />
        <div className="fos-share-source-inner">
          <div className="fos-share-source-head">FLIP OR SKIP #{puzzleNumber}</div>
          <div className="fos-share-source-score">{scoreData.swipeScore}/10</div>
          <div className="fos-share-source-dollars">${scoreData.totalDollarsSpotted} SPOTTED</div>
          {/* Tier MUST match the on-screen result. It is passed in from
              ResultReveal's authoritative tier (getScoreTier(finalScore)),
              NOT re-derived from swipeScore here — otherwise the shared
              image could show a different tier than the player saw (e.g.
              9/10 swipes but bad pricing = RIP on screen, was WOLF here). */}
          <div className="fos-share-source-tier">{tierGlyph} {tierLabel}</div>
          <div className="fos-share-source-grid">{emojiGrid}</div>
          <div className="fos-share-source-foot">loot.works/flip</div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="flip-share-toast"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SharePreview({ text, emojiGrid, puzzleNumber, scoreData, canNativeShare, canImageShare, copied, onClose, onShare, onCopy, onCopyImage, onTwitter, onSms, onDiscord }) {
  const previewRef = useRef(null);
  const { enableHeavyEffects } = useDeviceClass();
  const { tiltX, tiltY } = useTilt(previewRef, { maxRotateX: 5, maxRotateY: 5, enabled: enableHeavyEffects });

  // ESC dismisses
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="flip-share-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="flip-share-modal"
        initial={{ y: 80, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="flip-share-modal-x" aria-label="Close">✕</button>
        <div className="flip-share-modal-handle" aria-hidden="true" />
        <div className="flip-share-modal-title">DROP THE GRID</div>
        <div className="flip-share-modal-sub">show 'em how you did</div>

        <motion.div
          ref={previewRef}
          className="flip-share-card flip-share-card--in-modal"
          style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1000 }}
        >
          <div className="flip-share-card-head">
            <span aria-hidden="true">🪐</span>
            <span>FLIP OR SKIP #{puzzleNumber}</span>
          </div>
          <div className="flip-share-card-score">
            <span className="flip-share-card-score-big">{scoreData.swipeScore}/10 🟩</span>
            <span className="flip-share-card-score-dollars">${scoreData.totalDollarsSpotted} spotted</span>
          </div>
          <div className="flip-share-card-emoji">{emojiGrid}</div>
          <div className="flip-share-card-foot">loot.works/flip</div>
        </motion.div>

        <div className="flip-share-modal-actions">
          {canNativeShare && (
            <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={onShare} className="flip-share-action flip-share-action--primary flip-share-action--full">
              SHARE
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={onCopy} className="flip-share-action flip-share-action--primary">
            {copied ? "COPIED ✓" : "COPY"}
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={onTwitter} className="flip-share-action">X</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={onSms} className="flip-share-action">SMS</motion.button>
          {canImageShare && (
            <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={onCopyImage} className="flip-share-action">
              COPY AS IMAGE
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={onDiscord} className="flip-share-action">DISCORD</motion.button>
        </div>

        <div className="flip-share-modal-foot">shared via loot.works/flip</div>
      </motion.div>
    </motion.div>
  );
}
