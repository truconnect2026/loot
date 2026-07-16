"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion, useMotionValue } from "motion/react";
import { track } from "@vercel/analytics";
import { getDailyItems, getPuzzleNumber } from "./lib/dailySeed.js";
import { calcTotalScore, getScoreTier } from "./lib/scoring.js";
import { boardCallCoins, comboMultiplier, readCoins } from "./lib/rewards.js";
import CosmicBackdrop from "./components/CosmicBackdrop.jsx";
import IntroScreen from "./components/IntroScreen.jsx";
import CardStack from "./components/CardStack.jsx";
import FlipSkipButtons from "./components/FlipSkipButtons.jsx";
import DirectionalBackground from "./components/DirectionalBackground.jsx";
import ScreenShake from "./components/ScreenShake.jsx";
import StreakOverlay from "./components/StreakOverlay.jsx";
import ScoreTicker from "./components/ScoreTicker.jsx";
import ScoreArc from "./components/ScoreArc.jsx";
import PlayingEnvironment from "./components/PlayingEnvironment.jsx";
import Phase2Pricer from "./components/Phase2Pricer.jsx";
import ResultReveal from "./components/ResultReveal.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import CosmicCursor from "./components/CosmicCursor.jsx";
import KeyboardHUD from "./components/KeyboardHUD.jsx";
import { SPEECH_BUBBLE_CHANCE } from "./components/Mascot.jsx";
import FlipCoyote from "@/components/shared/FlipCoyote";
import useGameSounds from "./hooks/useGameSounds.jsx";
import useHaptics from "./hooks/useHaptics.jsx";
import { markDiscovered, shouldShowHint, markHintShown } from "./lib/easterEggs.js";

const HIT_PAUSE_CORRECT_MS = 80;
const HIT_PAUSE_WRONG_MS = 60;

// Per-phase opacity multipliers for the persistent cosmic backdrop.
const COSMIC_PRESETS = {
  // Intro/TAP-IN: dial the huge diagonal Saturn ring back (it was the
  // "streak crossing the text") and ease the starfield so the cosmos reads
  // as ambient depth behind the content column, not noise over it. The
  // legibility scrim in IntroScreen finishes the job.
  intro: { bgOpacity: 0.6, starOpacity: 0.8, ringOpacity: 0.5, ringSpin: 120, aurora: false },
  warping: { bgOpacity: 0.2, starOpacity: 0.3, ringOpacity: 0, ringSpin: 0.8, aurora: false, ringScale: 3 },
  playing: { bgOpacity: 0.2, starOpacity: 0.4, ringOpacity: 0.25, ringSpin: 180, aurora: false },
  intermission_phase2: { bgOpacity: 0.3, starOpacity: 0.6, ringOpacity: 0.4, ringSpin: 30, aurora: false },
  phase2: { bgOpacity: 0.25, starOpacity: 0.5, ringOpacity: 0.3, ringSpin: 90, aurora: false },
  intermission_results: { bgOpacity: 0.4, starOpacity: 0.8, ringOpacity: 0.5, ringSpin: 20, aurora: true },
  results: { bgOpacity: 0.4, starOpacity: 0.8, ringOpacity: 0.5, ringSpin: 90, aurora: true },
};

export default function FlipGame() {
  const router = useRouter();
  const items = useMemo(() => getDailyItems(), []);
  const puzzleNumber = useMemo(() => getPuzzleNumber(), []);

  const [phase, setPhase] = useState("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [priceGuesses, setPriceGuesses] = useState({});
  const [streak, setStreak] = useState(0);
  const [streakKey, setStreakKey] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [verdict, setVerdict] = useState({ key: 0, correct: true });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [offline, setOffline] = useState(false);
  const [intermissionKind, setIntermissionKind] = useState(null);
  const [replayCount, setReplayCount] = useState(0);
  const [konamiArmed, setKonamiArmed] = useState(false);
  const [konamiHintVisible, setKonamiHintVisible] = useState(false);
  // Coins — the honest, banked balance (read once; the write happens in
  // ResultReveal). The live board tally + combo multiplier are DERIVED from the
  // real answers/streak, never granted. See lib/rewards.js.
  const [coinBalance, setCoinBalance] = useState(0);
  const [coinPop, setCoinPop] = useState({ key: 0, delta: 0 });
  const boardCoins = useMemo(() => boardCallCoins(answers), [answers]);
  const combo = comboMultiplier(streak);
  const prevBoardCoinsRef = useRef(0);
  const dragX = useMotionValue(0);
  const playingMascotRef = useRef(null);
  const phase2MascotRef = useRef(null);
  const lastCorrectRef = useRef(true); // for "back in" speech

  const sounds = useGameSounds();
  const haptics = useHaptics();
  const confettiRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    import("canvas-confetti").then((mod) => {
      if (!cancelled) confettiRef.current = mod.default;
    });
    return () => { cancelled = true; };
  }, []);

  // Sync the banked coin balance when a board opens (picks up what the last
  // results screen honestly banked). The HUD adds the live board tally on top.
  useEffect(() => {
    if (phase === "intro" || phase === "playing") setCoinBalance(readCoins());
  }, [phase]);

  // Coin-pop juice — fires ONLY on a correct call that actually adds coins
  // (delta > 0). Derived from the real answers; a wrong call adds nothing and
  // triggers no pop. Self-resets when a new board clears `answers`.
  useEffect(() => {
    const nb = boardCallCoins(answers);
    const delta = nb - prevBoardCoinsRef.current;
    prevBoardCoinsRef.current = nb;
    const last = answers[answers.length - 1];
    if (last && last.correct && delta > 0) {
      setCoinPop((p) => ({ key: p.key + 1, delta }));
    }
  }, [answers]);

  // Referral tracking + replay-count hydration
  useEffect(() => {
    if (typeof window === "undefined") return;
    track("flip_page_viewed");
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      try { localStorage.setItem("fos-referred-by", ref); } catch { /* */ }
    }
    try {
      const r = parseInt(sessionStorage.getItem("fos-replay-count") || "0", 10);
      setReplayCount(r);
    } catch { /* */ }
    // Konami hint — only if user has played 3+ days without discovery
    if (shouldShowHint("konami")) {
      setKonamiHintVisible(true);
      markHintShown("konami");
      window.setTimeout(() => setKonamiHintVisible(false), 7000);
    }
  }, []);

  // One-shot analytics event when the round resolves to results. Reset on
  // replay (phase === "playing") so the next completion re-fires.
  const roundTrackedRef = useRef(false);
  useEffect(() => {
    if (phase === "playing") {
      roundTrackedRef.current = false;
      return;
    }
    if (phase !== "results" || roundTrackedRef.current) return;
    roundTrackedRef.current = true;
    const scoreData = calcTotalScore(answers, priceGuesses);
    track("flip_round_completed", {
      score: scoreData.finalScore,
      tier: getScoreTier(scoreData.finalScore),
    });
  }, [phase, answers, priceGuesses]);

  // Konami code on intro phase
  useEffect(() => {
    if (phase !== "intro") return;
    const sequence = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let pos = 0;
    const onKey = (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === sequence[pos]) {
        pos++;
        if (pos === sequence.length) {
          markDiscovered("konami");
          setKonamiArmed(true);
          try { sessionStorage.setItem("fos-grail-hunter", "true"); } catch { /* */ }
          // eslint-disable-next-line no-console
          console.log("🪐 konami unlocked — GRAIL HUNTER mode");
          pos = 0;
        }
      } else {
        pos = k === sequence[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  // Idle mascot wink (every 20s of no interaction in playing/phase2)
  useEffect(() => {
    if (phase !== "playing" && phase !== "phase2") return;
    let t = window.setTimeout(() => {
      const ref = phase === "playing" ? playingMascotRef : phase2MascotRef;
      ref.current?.wink();
      if (Math.random() < SPEECH_BUBBLE_CHANCE) ref.current?.speak("trust your gut");
    }, 20000);
    const reset = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        const ref = phase === "playing" ? playingMascotRef : phase2MascotRef;
        ref.current?.wink();
      }, 20000);
    };
    window.addEventListener("mousemove", reset, { passive: true });
    window.addEventListener("keydown", reset);
    window.addEventListener("touchstart", reset, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
      window.removeEventListener("touchstart", reset);
    };
  }, [phase]);

  // Keyboard shortcuts (desktop only; skip when typing in inputs)
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      if (phase === "intro" && e.key === "Enter") { e.preventDefault(); startGame(); }
      else if (phase === "playing") {
        if (e.key === "ArrowLeft") { e.preventDefault(); handleButton("skip"); }
        else if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); handleButton("flip"); }
      }
      // Phase2: Enter lockin is handled inside the input
      else if (phase === "results") {
        if (e.key === "s" || e.key === "S") {
          // Open share modal — bubble a synthetic click via the DOM
          document.querySelector(".flip-share-primary")?.click();
        } else if (e.key === "Enter") {
          // Replay
          document.querySelector(".flip-rev-replay")?.click();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Online/offline banner
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Grail-card reveal sound — fires when a top card is a grail item.
  const lastGrailIdRef = useRef(null);
  useEffect(() => {
    if (phase !== "playing") return;
    const current = items[currentIndex];
    if (!current || current.rarity !== "grail") return;
    if (lastGrailIdRef.current === current.id) return;
    lastGrailIdRef.current = current.id;
    sounds.playGrailReveal?.();
  }, [phase, currentIndex, items, sounds]);

  const triggerConfetti = useCallback((direction) => {
    const confetti = confettiRef.current;
    if (!confetti) return;
    const x = direction === "flip" ? 0.85 : 0.15;
    confetti({
      particleCount: 30, angle: direction === "flip" ? 60 : 120, spread: 55,
      origin: { x, y: 0.6 },
      colors: ["#5CE0B8", "#7DC8C0", "#ffffff"],
      disableForReducedMotion: true, ticks: 200,
    });
  }, []);

  const triggerFireworks = useCallback(() => {
    const confetti = confettiRef.current;
    if (!confetti) return;
    const end = Date.now() + 1500;
    const interval = setInterval(() => {
      if (Date.now() > end) return clearInterval(interval);
      confetti({ particleCount: 40, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors: ["#5CE0B8", "#F5C518", "#ffffff"], disableForReducedMotion: true });
      confetti({ particleCount: 40, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors: ["#5CE0B8", "#F5C518", "#ffffff"], disableForReducedMotion: true });
    }, 200);
  }, []);

  const handleSwipe = useCallback(async (direction) => {
    const current = items[currentIndex];
    if (!current) return;
    const choseFlip = direction === "flip";
    const correct = choseFlip === current.isFlip;

    sounds.playSwoosh(direction);

    if (correct) {
      setVerdict((v) => ({ key: v.key + 1, correct: true }));
      sounds.playDing();
      sounds.playTick?.(streak + 1);
      haptics.hapticSuccess();
      triggerConfetti(direction);
      window.dispatchEvent(new CustomEvent("fos:correct-swipe"));
      // "back in" speech bubble after a wrong→right transition
      if (!lastCorrectRef.current && Math.random() < SPEECH_BUBBLE_CHANCE) {
        playingMascotRef.current?.speak("back in");
      }
      lastCorrectRef.current = true;
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setStreakKey((k) => k + 1);
      // Mascot reactions
      playingMascotRef.current?.wink();
      if (nextStreak >= 3) {
        sounds.playStreak(nextStreak);
        haptics.hapticStreak();
        setShakeKey((k) => k + 1);
        window.dispatchEvent(new CustomEvent("fos:streak-milestone", { detail: { streak: nextStreak } }));
        if (nextStreak === 5 && Math.random() < SPEECH_BUBBLE_CHANCE) playingMascotRef.current?.speak("wolf shit");
        else if (nextStreak === 10 && Math.random() < SPEECH_BUBBLE_CHANCE) playingMascotRef.current?.speak("cold blooded");
        else if (nextStreak === 5 && Math.random() < SPEECH_BUBBLE_CHANCE) playingMascotRef.current?.speak("respect");
      }
      await new Promise((r) => setTimeout(r, HIT_PAUSE_CORRECT_MS));
    } else {
      setVerdict((v) => ({ key: v.key + 1, correct: false }));
      sounds.playBuzz();
      haptics.hapticError();
      window.dispatchEvent(new CustomEvent("fos:wrong-swipe"));
      lastCorrectRef.current = false;
      setStreak(0);
      await new Promise((r) => setTimeout(r, HIT_PAUSE_WRONG_MS));
    }

    const nextAnswers = [...answers, { item: current, choice: direction, correct }];
    setAnswers(nextAnswers);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= items.length) {
      const finalCorrect = nextAnswers.filter((a) => a.correct).length;
      if (finalCorrect === items.length) triggerFireworks();
      const correctFlips = nextAnswers.filter((a) => a.correct && a.choice === "flip");
      // Pick the right intermission, then advance.
      const isPerfect = finalCorrect === items.length;
      const isZero = correctFlips.length === 0;
      if (isPerfect) {
        setIntermissionKind("perfect");
        window.setTimeout(() => { setIntermissionKind(null); setPhase("phase2"); }, 3000);
      } else if (isZero) {
        setIntermissionKind("zero");
        window.setTimeout(() => { setIntermissionKind(null); sounds.playWin(); setPhase("results"); }, 3000);
      } else {
        setIntermissionKind("phase2");
        window.setTimeout(() => { setIntermissionKind(null); setPhase("phase2"); }, 1500);
      }
      return;
    }
    setCurrentIndex(nextIndex);
  }, [items, currentIndex, answers, streak, sounds, haptics, triggerConfetti, triggerFireworks]);

  const handleButton = useCallback((direction) => {
    const current = items[currentIndex];
    if (!current) return;
    window.dispatchEvent(new CustomEvent("flip-swipe", { detail: { itemId: current.id, direction } }));
  }, [items, currentIndex]);

  const startGame = useCallback(async () => {
    await sounds.init();
    haptics.hapticTap();
    // Bump replay counter if this is a replay (already played today)
    try {
      const ymd = new Date().toISOString().slice(0, 10);
      const last = localStorage.getItem("fos-last-played-date");
      if (last === ymd) {
        const r = parseInt(sessionStorage.getItem("fos-replay-count") || "0", 10) + 1;
        sessionStorage.setItem("fos-replay-count", String(r));
        setReplayCount(r);
      }
    } catch { /* */ }
    setPhase("warping");
    window.setTimeout(() => setPhase("playing"), 800);
  }, [sounds, haptics]);

  // Listen for ShareGrid's mascot-action events so we can react from any phase.
  useEffect(() => {
    const onAction = (e) => {
      const a = e.detail?.action;
      const ref = phase === "playing" ? playingMascotRef
        : phase === "phase2" ? phase2MascotRef
        : null;
      if (a === "wink") ref?.current?.wink();
    };
    window.addEventListener("fos:mascot-action", onAction);
    return () => window.removeEventListener("fos:mascot-action", onAction);
  }, [phase]);

  const cosmic = COSMIC_PRESETS[phase] || COSMIC_PRESETS.intro;

  // Speech on perfect Phase 1
  useEffect(() => {
    if (intermissionKind === "perfect" && Math.random() < SPEECH_BUBBLE_CHANCE) {
      playingMascotRef.current?.speak("ALL CALLS");
    }
  }, [intermissionKind]);

  return (
    <MotionConfig reducedMotion="user">
      <style>{INLINE_STYLES}</style>
      <CosmicCursor />
      <KeyboardHUD phase={phase} />

      {/* SR-only live region announces phase changes */}
      <div className="sr-only" aria-live="polite">
        {phase === "playing" && `Playing — ${currentIndex + 1} of ${items.length}, streak ${streak}`}
        {phase === "phase2" && "Pricing round"}
        {phase === "results" && "Results"}
      </div>

      <CosmicBackdrop {...cosmic} />

      <div className="flip-game-wrap">
        {offline && <div className="flip-offline-banner">offline · game still works ✓</div>}

        <AnimatePresence mode="wait">
          {(phase === "intro" || phase === "warping") && (
            <motion.div key="intro" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <IntroScreen
                puzzleNumber={puzzleNumber}
                onStart={startGame}
                warping={phase === "warping"}
                replayCount={replayCount}
                konamiArmed={konamiArmed}
                konamiHint={konamiHintVisible}
              />
            </motion.div>
          )}

          {phase === "playing" && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="flip-playing-shell">
              <PlayingEnvironment streak={streak} />
              <DirectionalBackground x={dragX} />
              <VerdictFlash flash={verdict} />

              <div className="flip-game-header">
                <div className="flip-game-header-left">
                  <span className="flip-day-chip">
                    DAY {puzzleNumber}
                  </span>
                  <span className="flip-coin-chip">
                    <span className="flip-coin-chip-glyph" aria-hidden="true">🪙</span>
                    <span className="flip-coin-chip-value">{coinBalance}</span>
                    {boardCoins > 0 && (
                      <span className="flip-coin-chip-board">+{boardCoins}</span>
                    )}
                    {coinPop.delta > 0 && (
                      <motion.span
                        key={coinPop.key}
                        className="flip-coin-pop"
                        initial={{ opacity: 0, y: 2, scale: 0.8 }}
                        animate={{ opacity: [0, 1, 1, 0], y: [2, -10, -15, -22], scale: [0.8, 1.12, 1, 0.9] }}
                        transition={{ duration: 0.7, ease: "easeOut", times: [0, 0.2, 0.6, 1] }}
                      >
                        +{coinPop.delta}
                      </motion.span>
                    )}
                  </span>
                  {streak >= 2 && (
                    <span className="flip-header-streak">
                      🔥 {streak}
                      {combo >= 2 && <span className="flip-combo-mult">×{combo}</span>}
                    </span>
                  )}
                </div>
                <div className="flip-game-header-right">
                  <ScoreTicker current={currentIndex} total={items.length} />
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    className="flip-header-cog"
                    aria-label="Settings"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/app")}
                    className="flip-header-cog"
                    aria-label="Exit game"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              <ScoreArc total={items.length} answers={answers} />

              <ScreenShake trigger={shakeKey} intensity={4}>
                <CardStack
                  items={items}
                  currentIndex={currentIndex}
                  onSwipe={handleSwipe}
                  onDragX={(v) => dragX.set(v)}
                  firstRound={currentIndex === 0}
                />
              </ScreenShake>
              <StreakOverlay streakKey={streakKey} streak={streak} />
              <FlipSkipButtons
                onFlip={() => handleButton("flip")}
                onSkip={() => handleButton("skip")}
              />
            </motion.div>
          )}

          {phase === "phase2" && (
            <motion.div key="phase2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <div className="flip-corner-mascot flip-corner-mascot--top-right">
                <FlipCoyote mood="smirk" size={56} />
              </div>
              <Phase2Pricer
                flipItems={answers.filter((a) => a.correct && a.choice === "flip").map((a) => a.item)}
                onComplete={(guesses) => {
                  setPriceGuesses(guesses);
                  setIntermissionKind("results");
                  window.setTimeout(() => { setIntermissionKind(null); setPhase("results"); }, 1500);
                }}
              />
            </motion.div>
          )}

          {phase === "results" && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <ResultReveal
                answers={answers}
                priceGuesses={priceGuesses}
                scoreData={calcTotalScore(answers, priceGuesses)}
                puzzleNumber={puzzleNumber}
                onReplay={() => {
                  setAnswers([]);
                  setPriceGuesses({});
                  setCurrentIndex(0);
                  setStreak(0);
                  setVerdict({ key: 0, correct: true });
                  setPhase("playing");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {intermissionKind && <Intermission kind={intermissionKind} />}
        </AnimatePresence>

        <AnimatePresence>
          {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}


/**
 * Correct/wrong verdict beat — a brief edge-vignette flash (mint on a hit,
 * red on a miss) keyed to each swipe so it retriggers. It hugs the screen
 * edges (transparent center) so it never blocks the card. Purely additive
 * dopamine on top of the sound/haptic/confetti/score-arc feedback — and the
 * first real visual punch on a MISS. Reduced motion: not rendered (the CSS
 * guard hides it), so a reduce user just gets the instant arc-colour change.
 */
function VerdictFlash({ flash }) {
  if (!flash.key) return null;
  return (
    <div
      key={flash.key}
      className={`flip-verdict-flash flip-verdict-flash--${flash.correct ? "hit" : "miss"}`}
      aria-hidden="true"
    />
  );
}

function Intermission({ kind }) {
  const META = {
    phase2: { heading: "PHASE TWO", gradient: "mint-gold", flash: "mint" },
    results: { heading: "THE TALLY", gradient: "gold-mint", flash: "gold" },
    perfect: { heading: "ALL CALLS HIT", gradient: "mint-gold", flash: "mint", sub: "perfect read. now show us how well you know the prices." },
    zero: { heading: "ZERO GRAILS.", gradient: "red", flash: "red", sub: "no flips called means no pricing round. tomorrow's a new day." },
  };
  const m = META[kind] || META.phase2;
  return (
    <motion.div
      className={`flip-intermission flip-intermission--flash-${m.flash}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`flip-intermission-head flip-intermission-head--${m.gradient}`}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
      >
        {m.heading}
      </motion.div>
      {m.sub && <div className="flip-intermission-sub">{m.sub}</div>}
    </motion.div>
  );
}

const INLINE_STYLES = `
:root { --mint: #5CE0B8; --gold: #F5C518; --red: #ef4444; --blue: #3B82F6; --purple: #6B46C1; }

.flip-game-wrap {
  --display: var(--font-manrope), ui-sans-serif, system-ui, sans-serif;
  --mono: var(--font-space-mono), ui-monospace, monospace;
  /* ════ DESIGN SYSTEM — the SAME vocabulary as .flip-intro, round-tuned so
     the round + title scene read as one product. Presentation tokens only. ══ */
  /* TYPE — 2 roles (display / mono) + one scale */
  --fs-display-lg: 22px;   /* item title */
  --fs-display-md: 15px;   /* FLIP/SKIP verbs, tier value */
  --fs-badge: 56px;        /* the drag FLIP/SKIP stamp */
  --fs-label: 10px;        /* tracked caps: DAY, rarity chip, action labels */
  --fs-body: 12px;         /* meta, hint, action hint */
  --fs-data: 14px;         /* score ticker, coin values */
  --tr-display: 0.02em; --tr-label: 0.18em; --tr-body: 0.08em;
  /* SPACE — 8pt */
  --sp-4: 4px; --sp-8: 8px; --sp-12: 12px; --sp-16: 16px; --sp-24: 24px; --sp-32: 32px;
  /* COLOR — mint = GO (flip), stop-red = controlled STOP (skip), gold =
     achievement (coins/streak). The FLIP/SKIP decision owns focus; the HUD
     recedes to ink support tones. */
  --acc: #5CE0B8;
  --acc-text: rgba(92,224,184,0.62);
  --acc-line: rgba(92,224,184,0.30);
  --acc-fill: rgba(92,224,184,0.07);
  --stop: #ef4444;
  --stop-text: rgba(239,68,68,0.72);
  --stop-line: rgba(239,68,68,0.48);
  --stop-fill: rgba(239,68,68,0.10);
  --gold-line: rgba(245,197,24,0.38); --gold-fill: rgba(245,197,24,0.10);
  --ink-1: rgba(255,255,255,0.92); --ink-2: rgba(255,255,255,0.62); --ink-3: rgba(255,255,255,0.42);
  /* RADIUS — one scale */
  --r-card: 24px; --r-pill: 999px; --r-md: 16px; --r-sm: 10px; --r-xs: 4px;
  /* ELEVATION — support-tier treatment (border weight + glow + inset) */
  --bd: 1px;
  --inset-hi: inset 0 1px 0 rgba(255,255,255,0.12);
  --elev-go: 0 14px 34px -16px rgba(92,224,184,0.5);
  --elev-stop: 0 14px 34px -16px rgba(239,68,68,0.5);
  position: relative; z-index: 1;
  min-height: 100dvh;
  color: #fff;
  font-family: var(--display);
  overflow-x: hidden;
  display: flex; flex-direction: column;
  /* iOS notch clearance: max() against env() so simulator/desktop
     where the inset is 0 still gets the baseline 16px gutter. */
  padding: max(16px, env(safe-area-inset-top)) 16px 16px;
}

/* ─── Cosmic backdrop ─────────────────────────────────────────── */
.flip-cosmic { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.flip-cosmic-bg, .flip-cosmic-bg-fallback {
  position: absolute; inset: 0; transition: opacity 600ms ease;
}
.flip-cosmic-bg { background-size: cover; background-position: center; }
.flip-cosmic-bg-fallback {
  z-index: -1;
  background:
    radial-gradient(ellipse 60% 50% at 75% 70%, rgba(107,70,193,0.35) 0%, transparent 60%),
    radial-gradient(ellipse 80% 60% at 20% 20%, rgba(59,130,246,0.15) 0%, transparent 50%),
    radial-gradient(ellipse 100% 100% at 50% 50%, #0a0a14 0%, #000 70%);
}
.flip-starfield {
  position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none;
  transition: opacity 600ms ease;
}
.flip-star { animation: flip-twinkle 3s ease-in-out infinite; }
.flip-star--drift { animation: flip-twinkle 3s ease-in-out infinite, flip-drift 60s linear infinite; }
@keyframes flip-twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
@keyframes flip-drift { 0% { transform: translateX(0); } 100% { transform: translateX(20px); } }
@media (prefers-reduced-motion: reduce) {
  .flip-star, .flip-star--drift { animation: none; }
}
.flip-dot-grid {
  position: fixed; inset: 0; pointer-events: none; opacity: 0.04;
  background-image: radial-gradient(rgba(92,224,184,0.5) 1px, transparent 1px);
  background-size: 24px 24px;
}
.flip-cosmic-ring {
  position: fixed; top: 50%; left: 50%; width: 3000px; height: 600px;
  pointer-events: none;
  filter: drop-shadow(0 0 40px rgba(92,224,184,0.3));
}
.flip-cosmic-ring-svg {
  width: 100%; height: 100%;
  animation: flip-cosmic-spin var(--spin, 120s) linear infinite;
  animation-duration: inherit; /* style override */
  transform: rotate(-23deg);
}
.flip-cosmic-ring svg { animation: flip-cosmic-spin 120s linear infinite; transform-origin: 50% 50%; }
@keyframes flip-cosmic-spin {
  0% { transform: rotate(-23deg); }
  100% { transform: rotate(337deg); }
}
.flip-aurora {
  position: fixed; top: 0; left: 0; right: 0; height: 50vh;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(92,224,184,0.2) 0%, rgba(59,130,246,0.15) 30%, rgba(107,70,193,0.1) 60%, transparent 100%);
  animation: flip-aurora-drift 12s ease-in-out infinite alternate;
}
@keyframes flip-aurora-drift {
  0% { transform: translateX(-2%); opacity: 0.6; }
  100% { transform: translateX(2%); opacity: 1; }
}

/* ─── Offline banner ──────────────────────────────────────────── */
.flip-offline-banner {
  position: sticky; top: 0; z-index: 60;
  margin: 0 -16px 8px; padding: 8px 16px;
  background: var(--mint); color: #000;
  font-family: var(--mono); font-weight: 700; font-size: 12px;
  letter-spacing: 0.1em; text-align: center;
}

/* ─── Intro ───────────────────────────────────────────────────── */
/* min-height: 80vh was forcing a tall intro that pushed content
   below the fold on smaller phones (iPhone SE / 13 mini). flex: 1
   inside .flip-game-wrap (100dvh) still gives the section the full
   viewport when there's room; without the floor it collapses to
   content height when the viewport is short. */
.flip-intro {
  position: relative; flex: 1;
  display: flex; align-items: center; justify-content: center;
  text-align: center; padding: 12px 16px;
}
.flip-intro--warping { animation: flip-warp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
@keyframes flip-warp {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.04); opacity: 0; }
}
/* NOTE: the old .flip-intro-day absolute chip (top:16 over the centered
   column) was the source of the DAY-clips-through-Kronos bug — the z-1 host
   column, vertically centered, painted over it on short viewports. It is
   GONE: the DAY counter is now an in-flow HERO streak badge rendered inside
   IntroScreen (below Kronos, its own row), so it can never intersect his
   silhouette at any font size or viewport height. Rule removed to kill the
   dead selector and its font-dependent fragility. */
.flip-intro-inner {
  position: relative; z-index: 1; max-width: 540px; width: 100%;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
/* Legibility scrim — a soft radial vignette centered on the content
   column. Darkens where the headline/CTA sit so the cosmic ring + stars
   stay ambient depth behind the words, never streaks across them. */
.flip-intro-scrim {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 82% 62% at 50% 46%, rgba(7,5,16,0.82) 0%, rgba(7,5,16,0.5) 46%, transparent 78%);
}
/* Kronos — the host. Present (132px), gold-mint halo breathing on FILTER
   so he feels alive; the drop-shadow bloom lifts him off the cosmos. */
.flip-intro-host {
  position: relative; z-index: 1; line-height: 0;
  margin-bottom: 2px;
  filter: drop-shadow(0 6px 20px rgba(92,224,184,0.35));
  animation: flip-host-glow 3.6s ease-in-out infinite;
}
@keyframes flip-host-glow {
  0%, 100% { filter: drop-shadow(0 6px 20px rgba(92,224,184,0.32)); }
  50% { filter: drop-shadow(0 6px 30px rgba(245,197,24,0.42)); }
}
.flip-intro-host--static { animation: none; filter: drop-shadow(0 6px 24px rgba(92,224,184,0.4)); }
.flip-intro-title {
  font-family: var(--display); font-weight: 900; font-size: 56px;
  line-height: 0.95; letter-spacing: -0.02em;
  margin: 2px 0 0;
}
.flip-intro-title--gradient {
  background: linear-gradient(90deg, #5CE0B8 0%, #3B82F6 50%, #6B46C1 100%);
  -webkit-background-clip: text; background-clip: text;
  color: transparent !important;
}
@media (min-width: 768px) { .flip-intro-title { font-size: 112px; } }
/* One-line hook — clear enough for a stranger, Kronos-voiced. */
.flip-intro-hook {
  font-family: var(--display); font-weight: 600; font-size: 16px;
  color: rgba(255,255,255,0.82); margin: 2px 0 14px;
  letter-spacing: 0.01em; line-height: 1.35; max-width: 340px;
}
@media (min-width: 768px) { .flip-intro-hook { font-size: 19px; max-width: 420px; } }
/* Hero CTA — the single most tappable object in the app. Layered depth
   (mint gradient + inner top-highlight + inner-bottom shade + outer bloom),
   NOT a flat fill. The idle "tap me" pulse and press glow-surge both run
   on OPACITY of the .flip-tap-in-bloom layer (compositor-only); the press
   scale is owned by Framer whileTap. Gold accent lives in the bloom tint. */
.flip-tap-in {
  position: relative;
  width: 100%; max-width: 360px; height: 72px;
  border: none; cursor: pointer; border-radius: 16px;
  background: linear-gradient(180deg, #6FE9C6 0%, #4FCDA5 54%, #38BC91 100%);
  color: #04120D;
  font-family: var(--display); font-weight: 900; font-size: 22px;
  letter-spacing: 0.22em;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.5),
    inset 0 -3px 8px rgba(0,0,0,0.16),
    0 10px 26px -8px rgba(92,224,184,0.55);
  overflow: hidden;
  transition: transform 140ms var(--ease-out, ease), box-shadow 220ms var(--ease-out, ease);
}
.flip-tap-in-label { position: relative; z-index: 2; }
/* Bloom — a mint→gold halo behind the label; pulses at idle, surges on
   press. Radial so it reads as light coming off the button, not a border. */
.flip-tap-in-bloom {
  position: absolute; inset: -40% -10%; z-index: 0; pointer-events: none;
  background: radial-gradient(ellipse 60% 100% at 50% 50%, rgba(92,224,184,0.55) 0%, rgba(245,197,24,0.20) 45%, transparent 72%);
  opacity: 0.35;
  animation: flip-tapin-bloom 2.6s ease-in-out infinite;
}
@keyframes flip-tapin-bloom {
  0%, 100% { opacity: 0.28; }
  50% { opacity: 0.7; }
}
.flip-tap-in--cosmic:hover { transform: translateY(-1px); }
.flip-tap-in:active .flip-tap-in-bloom { opacity: 1; animation: none; }
.flip-tap-in:disabled { opacity: 0.5; cursor: not-allowed; }
.flip-tap-in:disabled .flip-tap-in-bloom { animation: none; opacity: 0.15; }
.flip-tap-in--idle .flip-tap-in-bloom { animation: flip-tapin-bloom 1.3s ease-in-out infinite; }
.flip-tap-in-particles { position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden; }
.flip-tap-in-particles span {
  position: absolute; bottom: -4px;
  width: 4px; height: 4px; border-radius: 50%;
  background: rgba(255,255,255,0.7);
  animation: flip-tapin-float 3s ease-in infinite;
}
.flip-tap-in-particles span:nth-child(1) { left: 22%; animation-delay: 0s; }
.flip-tap-in-particles span:nth-child(2) { left: 50%; animation-delay: 1s; }
.flip-tap-in-particles span:nth-child(3) { left: 78%; animation-delay: 2s; }
@keyframes flip-tapin-float {
  0% { transform: translateY(0); opacity: 0; }
  20% { opacity: 0.6; }
  100% { transform: translateY(-72px); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  /* Designed static composition: no entrance motion, no idle pulse, but a
     complete, intentional look — the bloom freezes at a soft glow, the
     host halo stays lit. */
  .flip-tap-in-bloom, .flip-tap-in--idle .flip-tap-in-bloom { animation: none; opacity: 0.4; }
  .flip-tap-in-particles { display: none; }
  .flip-intro-host { animation: none; }
}
/* The FREE flex — a PRIMARY selling point for cold traffic (no friction,
   no risk). Mint pill, readable, confident — never fine print. */
.flip-intro-free {
  display: inline-flex; align-items: center; gap: 10px; flex-wrap: wrap;
  justify-content: center;
  margin: 16px 0 0; padding: 9px 16px;
  border: 1px solid rgba(92,224,184,0.35);
  background: rgba(92,224,184,0.08);
  border-radius: 999px;
  font-family: var(--mono); font-weight: 700; font-size: 12px;
  letter-spacing: 0.1em; color: var(--mint);
}
.flip-intro-free-dot { color: rgba(92,224,184,0.5); }
.flip-intro-confidence {
  font-family: var(--display); font-weight: 500; font-size: 13px;
  color: rgba(255,255,255,0.55); letter-spacing: 0.01em;
  margin: 12px 0 0;
}
/* Short-viewport safety (iPhone SE / small Androids ≤667px tall): compress
   Kronos + headline + gaps so the whole assembled composition (Kronos, the
   in-flow DAY streak badge, headline, hook, TAP IN) fits above the fold.
   Font-independent so it holds regardless of Bebas vs fallback metrics. */
@media (max-height: 700px) {
  .flip-intro-host img { width: 104px !important; height: 104px !important; }
  .flip-intro-inner { gap: 7px; }
  .flip-intro-title { font-size: 44px; }
  .flip-intro-hook { font-size: 15px; margin-bottom: 8px; }
  .flip-intro-free { margin-top: 10px; padding: 7px 14px; }
  .flip-intro-confidence { margin-top: 8px; }
}
.flip-intro-played {
  font-family: var(--mono); font-size: 11px; color: var(--mint);
  letter-spacing: 0.12em; margin-top: 8px;
  padding: 6px 12px; border: 1px solid var(--mint); display: inline-block;
}
.flip-intro-tip {
  margin-top: 12px;
  font-family: var(--mono); font-size: 12px; color: var(--mint);
  background: rgba(10,22,18,0.85); border: 1px solid rgba(92,224,184,0.5);
  padding: 8px 14px; letter-spacing: 0.04em;
}
.flip-intro-tip--idle { color: #000; background: var(--mint); border-color: var(--mint); }

.flip-day-chip {
  display: inline-flex; align-items: center;
  font-family: var(--mono); font-weight: 700; font-size: var(--fs-label);
  letter-spacing: var(--tr-label); color: var(--ink-2);
  padding: var(--sp-4) var(--sp-12); border-radius: var(--r-pill);
  border: var(--bd) solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
}
.flip-day-chip--center { margin: 0 auto var(--sp-16); }

/* ─── Playing phase ───────────────────────────────────────────── */
.flip-playing-shell { position: relative; z-index: 1; }
.flip-game-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--sp-8) var(--sp-4) var(--sp-12); max-width: 480px; margin: 0 auto; width: 100%;
  position: relative; z-index: 2;
}
.flip-game-header-left, .flip-game-header-right {
  display: flex; align-items: center; gap: var(--sp-8);
}
.flip-header-streak {
  font-family: var(--display); font-weight: 700; font-size: var(--fs-data);
  color: var(--gold);
  display: inline-flex; align-items: center; gap: var(--sp-4);
}
.flip-combo-mult {
  font-family: var(--mono); font-weight: 700; font-size: var(--fs-label);
  letter-spacing: var(--tr-body); color: #0a0a0a;
  padding: 2px var(--sp-8); border-radius: var(--r-pill);
  background: var(--gold); line-height: 1;
  box-shadow: 0 0 12px var(--gold-line);
}
.flip-coin-chip {
  position: relative;
  display: inline-flex; align-items: center; gap: var(--sp-4);
  font-family: var(--mono); font-weight: 700; font-size: var(--fs-body);
  letter-spacing: var(--tr-body); color: var(--gold);
  padding: var(--sp-4) var(--sp-8); border-radius: var(--r-pill);
  border: var(--bd) solid var(--gold-line);
  background: var(--gold-fill); backdrop-filter: blur(4px);
  font-variant-numeric: tabular-nums;
}
.flip-coin-chip-glyph { font-size: var(--fs-data); line-height: 1; }
.flip-coin-chip-value { color: var(--gold); }
.flip-coin-chip-board {
  color: var(--acc-text); font-size: var(--fs-label);
  padding-left: var(--sp-4); margin-left: 1px;
  border-left: var(--bd) solid rgba(255,255,255,0.14);
}
.flip-coin-pop {
  position: absolute; top: -2px; left: 50%;
  transform: translateX(-50%);
  font-family: var(--display); font-weight: 900; font-size: var(--fs-display-md);
  color: var(--gold); text-shadow: 0 0 12px rgba(245,197,24,0.6);
  pointer-events: none; white-space: nowrap; z-index: 5;
}
.flip-header-cog {
  background: transparent; border: 0; cursor: pointer; padding: var(--sp-4);
  color: var(--ink-3);
  transition: color 180ms ease;
}
.flip-header-cog:hover { color: var(--acc); }

.flip-score-ticker {
  font-family: var(--mono); font-weight: 700; font-size: var(--fs-data);
  color: var(--acc-text); letter-spacing: var(--tr-body);
  font-variant-numeric: tabular-nums;
  display: inline-flex; align-items: baseline;
}
.flip-score-ticker-sep { margin: 0 2px; opacity: 0.5; }

/* Score arc — 10 segments (the round's progress rhythm) */
.flip-score-arc {
  max-width: 360px; width: 60%; margin: 0 auto var(--sp-16);
  display: flex; gap: var(--sp-4); justify-content: center;
}
@media (min-width: 768px) { .flip-score-arc { max-width: 480px; } }
.flip-score-seg {
  flex: 1; height: 4px; border-radius: var(--r-xs);
  display: block; transition: background-color 200ms ease;
}
.flip-score-seg--empty { background: var(--acc-fill); }
.flip-score-seg--correct { background: var(--acc); }
.flip-score-seg--wrong { background: var(--stop); }

.flip-card-stack {
  position: relative; width: 100%; max-width: 360px; aspect-ratio: 3 / 4;
  margin: 0 auto;
}
@media (min-width: 768px) { .flip-card-stack { max-width: 420px; } }

.flip-swipe-card {
  position: absolute; inset: 0;
  border-radius: var(--r-card);
  user-select: none; -webkit-user-select: none;
  z-index: 1;
}
.flip-swipe-card--peek { pointer-events: none; }
.flip-swipe-card-inner {
  position: relative; width: 100%; height: 100%; overflow: hidden;
  border-radius: var(--r-card);
  background: #0a0a0a;
  box-shadow:
    0 0 56px rgba(92,224,184,0.18),
    var(--inset-hi),
    inset 0 0 80px rgba(0,0,0,0.8),
    0 20px 50px rgba(0,0,0,0.6);
  border: var(--bd) solid var(--acc-line);
}
.flip-card-image-wrap {
  position: absolute; top: 0; left: 0; right: 0; height: 65%;
  overflow: hidden;
}
/* Crisp inner frame around the item photo + a soft seat shadow so the
   image reads as inset glass, not a pasted rectangle. The item photo (and
   any thrift price sticker on it) is the star of the round. */
.flip-card-image-wrap::after {
  content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 1;
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,0.05),
    inset 0 -36px 44px -22px rgba(0,0,0,0.55);
}
.flip-swipe-img { object-fit: cover; }
.flip-card-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.5) 100%);
  pointer-events: none;
}
.flip-card-shimmer {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(92,224,184,0.18) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: flip-shimmer 1.4s linear infinite;
  pointer-events: none;
}
@keyframes flip-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Rarity treatments */
.flip-swipe-card--rarity-mid .flip-swipe-card-inner::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 35%;
  background: linear-gradient(180deg, transparent 0%, rgba(92,224,184,0.15) 100%);
  pointer-events: none;
}
.flip-swipe-card--rarity-high .flip-swipe-card-inner::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(92,224,184,0.15) 0%, transparent 50%, rgba(59,130,246,0.15) 100%);
  pointer-events: none; mix-blend-mode: screen;
}
.flip-swipe-card--rarity-grail .flip-swipe-card-inner {
  border-color: rgba(245,197,24,0.6);
  box-shadow:
    0 0 80px rgba(245,197,24,0.4),
    inset 0 0 80px rgba(0,0,0,0.8),
    0 18px 48px rgba(0,0,0,0.55);
}
.flip-grail-border {
  position: absolute; inset: -2px; pointer-events: none; z-index: 2;
  border-radius: 26px;
  background: conic-gradient(from 0deg, #F5C518, #5CE0B8, #F5C518, #5CE0B8, #F5C518);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  padding: 2px;
  animation: flip-grail-spin 8s linear infinite;
}
@keyframes flip-grail-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.flip-grail-dust { position: absolute; inset: 0; pointer-events: none; z-index: 2; overflow: hidden; }
.flip-grail-dust span {
  position: absolute; bottom: -8px;
  width: 6px; height: 6px; border-radius: 50%;
  background: radial-gradient(circle, #F5C518 0%, transparent 70%);
  animation: flip-grail-dust 6s ease-in infinite;
}
@keyframes flip-grail-dust {
  0% { transform: translateY(0) scale(0.6); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(-400px) scale(0.2); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .flip-grail-border, .flip-grail-dust span, .flip-card-shimmer { animation: none; }
}

.flip-rarity-chip {
  display: inline-block;
  font-family: var(--mono); font-weight: 700; font-size: var(--fs-label);
  letter-spacing: var(--tr-label);
  padding: var(--sp-4) var(--sp-8); border-radius: var(--r-xs);
  border: var(--bd) solid currentColor;
  margin-bottom: var(--sp-8);
}
.flip-rarity-chip--common { color: var(--ink-3); }
.flip-rarity-chip--mid { color: var(--acc); }
.flip-rarity-chip--high { color: var(--acc); }
.flip-rarity-chip--grail {
  background: linear-gradient(90deg, #F5C518, #FFD650); color: #000; border-color: var(--gold);
  animation: flip-grail-chip-pulse 2.5s ease-in-out infinite;
}
@keyframes flip-grail-chip-pulse { 0%,100% { box-shadow: 0 0 8px rgba(245,197,24,0.4); } 50% { box-shadow: 0 0 18px rgba(245,197,24,0.8); } }
@media (prefers-reduced-motion: reduce) {
  .flip-rarity-chip--grail { animation: none; box-shadow: 0 0 12px rgba(245,197,24,0.6); }
}

.flip-card-name--grail { border-bottom: 2px solid var(--gold); padding-bottom: var(--sp-4); }

.flip-badge {
  position: absolute; top: var(--sp-24); z-index: 4;
  font-family: var(--display); font-weight: 900;
  display: flex; flex-direction: column; align-items: center;
  padding: var(--sp-12) var(--sp-24);
  pointer-events: none;
}
.flip-badge > span:first-child { font-size: var(--fs-badge); letter-spacing: var(--tr-display); line-height: 1; }
.flip-badge-sub { font-family: var(--mono); font-weight: 700; font-size: var(--fs-label); letter-spacing: var(--tr-label); margin-top: var(--sp-4); }
.flip-badge--flip {
  left: var(--sp-24); color: var(--acc); border: 4px solid var(--acc);
  transform: rotate(-10deg);
  filter: drop-shadow(0 0 30px rgba(92,224,184,0.6));
}
.flip-badge--skip {
  right: var(--sp-24); color: var(--stop); border: 4px solid var(--stop);
  transform: rotate(10deg);
  filter: drop-shadow(0 0 30px rgba(239,68,68,0.6));
}
.flip-overlay { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
.flip-overlay--mint { background: var(--acc); mix-blend-mode: screen; }
.flip-overlay--red { background: var(--stop); mix-blend-mode: screen; }

.flip-card-bottom {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 3;
  padding: var(--sp-24) var(--sp-16) var(--sp-16);
  min-height: 35%;
}
.flip-card-bottom-fade {
  position: absolute; left: 0; right: 0; bottom: 0; top: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.92) 30%, rgba(0,0,0,0.65) 65%, transparent 100%);
  pointer-events: none;
}
.flip-card-text { position: relative; z-index: 1; }
.flip-card-name {
  font-family: var(--display); font-weight: 700; font-size: var(--fs-display-lg);
  line-height: 1.1; letter-spacing: -0.01em; color: var(--ink-1);
  margin-bottom: var(--sp-4);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
@media (min-width: 768px) { .flip-game-wrap { --fs-display-lg: 28px; --fs-badge: 72px; } }
.flip-card-meta {
  font-family: var(--mono); font-size: var(--fs-body);
  color: var(--acc-text); letter-spacing: var(--tr-body); margin-bottom: var(--sp-4);
}
.flip-card-hint {
  font-family: var(--display); font-weight: 500; font-size: var(--fs-body);
  color: var(--ink-1); font-style: italic;
}

/* ─── First-round gesture cue ─────────────────────────────────────
   A ghost finger sweeps left↔right (transform only) to demonstrate the
   drag; the label teaches skip-left / flip-right. First card only, gone
   on first interaction. */
.flip-gesture-cue {
  position: absolute; left: 0; right: 0; top: 44%; z-index: 4;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  pointer-events: none;
}
.flip-gesture-track { position: relative; width: 96px; height: 32px; }
.flip-gesture-finger {
  position: absolute; top: 50%; left: 50%;
  width: 30px; height: 30px; margin: -15px 0 0 -15px; border-radius: 50%;
  background: rgba(255,255,255,0.16);
  border: 1.5px solid rgba(255,255,255,0.6);
  box-shadow: 0 0 16px rgba(255,255,255,0.3), inset 0 0 8px rgba(255,255,255,0.2);
  animation: flipGestureSwipe 2.4s ease-in-out infinite;
}
@keyframes flipGestureSwipe {
  0%, 100% { transform: translateX(-34px); opacity: 0.15; }
  16% { opacity: 1; }
  50% { transform: translateX(34px); opacity: 1; }
  74% { opacity: 0.15; }
}
.flip-gesture-text {
  font-family: var(--mono); font-weight: 700; font-size: var(--fs-body);
  letter-spacing: var(--tr-body); color: var(--ink-1);
  text-shadow: 0 1px 8px rgba(0,0,0,0.9);
}
@media (prefers-reduced-motion: reduce) {
  .flip-gesture-finger { animation: none; transform: none; opacity: 0.85; }
}
.flip-peek-tint--purple {
  position: absolute; inset: 0; pointer-events: none; border-radius: var(--r-card);
  background: rgba(107,70,193,0.1); mix-blend-mode: multiply;
}

/* ─── Action buttons — the round's HERO interaction (the decision moment).
   Premium domed discs with real depth, a charged-ready ring, and a shadow
   that collapses on press. mint = GO (flip), stop-red = STOP (skip). ─────── */
.flip-action-row {
  display: flex; justify-content: center; align-items: center; gap: var(--sp-24);
  margin: var(--sp-16) auto var(--sp-12);
  position: relative; z-index: 1;
}
.flip-action-cell { display: flex; flex-direction: column; align-items: center; gap: var(--sp-8); }
.flip-action {
  position: relative;
  width: 76px; height: 76px; border-radius: 50%;
  background: radial-gradient(125% 125% at 50% 22%, rgba(255,255,255,0.10), rgba(10,10,10,0.92) 62%);
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  border-width: 2px; border-style: solid;
  transition: box-shadow 200ms ease, transform 120ms ease, border-color 200ms ease;
}
/* Charged-ready ring — compositor scale/opacity breath, tinted to the action. */
.flip-action::before {
  content: ""; position: absolute; inset: -5px; border-radius: 50%;
  border: 1px solid currentColor; opacity: 0.24; pointer-events: none;
  animation: flip-action-charge 2.8s ease-in-out infinite;
}
@keyframes flip-action-charge {
  0%, 100% { transform: scale(0.94); opacity: 0.16; }
  50% { transform: scale(1.05); opacity: 0.5; }
}
.flip-action--idle::before { animation-duration: 1.8s; } /* charged emphasis once idle */
.flip-action:disabled { opacity: 0.4; cursor: not-allowed; }
.flip-action:active { box-shadow: var(--inset-hi), 0 4px 12px -8px rgba(0,0,0,0.85); }
.flip-action--skip { border-color: var(--stop); color: var(--stop);
  box-shadow: var(--inset-hi), 0 10px 24px -10px rgba(0,0,0,0.75), var(--elev-stop); }
.flip-action--flip { border-color: var(--acc); color: var(--acc);
  box-shadow: var(--inset-hi), 0 10px 24px -10px rgba(0,0,0,0.75), var(--elev-go); }
@media (prefers-reduced-motion: reduce) {
  .flip-action::before { animation: none; transform: none; opacity: 0.3; }
}
.flip-action-label {
  font-family: var(--mono); font-weight: 700; font-size: var(--fs-label);
  letter-spacing: var(--tr-label);
}
.flip-action-label--skip { color: var(--stop-text); }
.flip-action-label--flip { color: var(--acc-text); }
.flip-action-hint {
  font-family: var(--mono); font-size: var(--fs-body); letter-spacing: var(--tr-body);
  color: var(--ink-3); min-width: 110px; text-align: center;
}

/* ─── Streak overlay ──────────────────────────────────────────── */
.flip-streak-overlay {
  position: absolute; top: 33%; left: 50%; transform: translateX(-50%);
  z-index: 30; pointer-events: none;
}
.flip-streak-text {
  font-family: var(--display); font-weight: 900; letter-spacing: 0.04em;
  text-shadow: 0 4px 16px rgba(0,0,0,0.5);
  white-space: nowrap;
}
.flip-streak-text--rainbow {
  background: linear-gradient(90deg, #ff6b6b, #F5C518, #5CE0B8, #7B8FFF);
  -webkit-background-clip: text; background-clip: text;
  color: transparent !important;
}

/* ─── Verdict flash — edge-vignette hit/miss beat ─────────────────
   Fixed, edge-only (transparent center) so the card stays clear;
   opacity-only pulse (compositor). Keyed per swipe to retrigger. */
.flip-verdict-flash {
  position: fixed; inset: 0; z-index: 3; pointer-events: none; opacity: 0;
}
.flip-verdict-flash--hit {
  background: radial-gradient(ellipse 130% 82% at 50% 50%, transparent 56%, rgba(92,224,184,0.28) 100%);
  animation: flipVerdictFlash 380ms cubic-bezier(0.22,1,0.36,1);
}
.flip-verdict-flash--miss {
  background: radial-gradient(ellipse 130% 82% at 50% 50%, transparent 56%, rgba(239,68,68,0.32) 100%);
  animation: flipVerdictFlash 380ms cubic-bezier(0.22,1,0.36,1);
}
@keyframes flipVerdictFlash {
  0% { opacity: 0; }
  28% { opacity: 1; }
  100% { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  /* No flash under reduce — the instant score-arc colour change already
     marks the verdict; a full-screen pulse would violate the contract. */
  .flip-verdict-flash { display: none; }
}

/* ─── Playing env ─────────────────────────────────────────────── */
.flip-env { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.flip-env-drift {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(107,70,193,0.05) 0%, transparent 60%);
  animation: flip-env-drift 60s ease-in-out infinite alternate;
}
@keyframes flip-env-drift {
  0% { background: linear-gradient(135deg, rgba(107,70,193,0.05) 0%, transparent 60%); }
  100% { background: linear-gradient(145deg, rgba(107,70,193,0.05) 0%, transparent 60%); }
}
.flip-env-aura {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  border-radius: 50%; pointer-events: none;
  transition: width 600ms ease, height 600ms ease, background 600ms ease, box-shadow 600ms ease;
}
.flip-env-aura--low {
  width: 320px; height: 320px;
  background: radial-gradient(circle, rgba(92,224,184,0.05) 0%, transparent 70%);
}
.flip-env-aura--mid {
  width: 480px; height: 480px;
  background: radial-gradient(circle, rgba(92,224,184,0.15) 0%, transparent 70%);
  box-shadow: 0 0 0 1px rgba(245,197,24,0.2) inset;
}
.flip-env-aura--high {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%);
  box-shadow:
    0 0 0 1px rgba(245,197,24,0.4) inset,
    0 0 0 8px rgba(92,224,184,0.15) inset;
}
.flip-env-particles { position: absolute; inset: 0; }
.flip-env-particle {
  position: absolute; bottom: -8px; width: 4px; height: 4px;
  border-radius: 50%;
  animation: flip-env-float 30s linear infinite;
  opacity: 0;
}
.flip-env-particle--mint { background: rgba(92,224,184,0.4); }
.flip-env-particle--gold { background: rgba(245,197,24,0.5); }
.flip-env-particle--blue { background: rgba(59,130,246,0.5); width: 5px; height: 5px; border-radius: 0; }
@keyframes flip-env-float {
  0% { transform: translateY(0); opacity: 0; }
  10% { opacity: 0.8; }
  90% { opacity: 0.6; }
  100% { transform: translateY(-100vh); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .flip-env-particle, .flip-env-drift { animation: none; }
}

/* ─── Intermission overlays ───────────────────────────────────── */
.flip-intermission {
  position: fixed; inset: 0; z-index: 80;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center; padding: 24px;
  pointer-events: none;
}
.flip-intermission--flash-mint { background: rgba(92,224,184,0.08); }
.flip-intermission--flash-gold { background: rgba(245,197,24,0.1); }
.flip-intermission--flash-red { background: rgba(239,68,68,0.08); }
.flip-intermission-head {
  font-family: var(--display); font-weight: 900; font-size: 56px;
  letter-spacing: 0.04em; line-height: 1;
  text-shadow: 0 4px 30px rgba(0,0,0,0.5);
}
@media (min-width: 768px) { .flip-intermission-head { font-size: 96px; } }
.flip-intermission-head--mint-gold {
  background: linear-gradient(90deg, #5CE0B8 0%, #F5C518 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent !important;
}
.flip-intermission-head--gold-mint {
  background: linear-gradient(90deg, #F5C518 0%, #5CE0B8 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent !important;
}
.flip-intermission-head--red { color: #ef4444; }
.flip-intermission-sub {
  font-family: var(--display); font-weight: 500; font-size: 16px;
  color: rgba(255,255,255,0.85); margin-top: 16px;
  max-width: 480px; line-height: 1.4;
}

/* ─── Settings panel ──────────────────────────────────────────── */
.flip-settings-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
  display: flex; align-items: flex-end; justify-content: center;
}
@media (min-width: 768px) {
  .flip-settings-backdrop { align-items: center; padding: 24px; }
}
.flip-settings {
  width: 100%; max-width: 480px;
  background: #0a1612; color: #fff;
  border-top: 1px solid rgba(92,224,184,0.3);
  padding: 16px 20px 24px;
  display: flex; flex-direction: column; gap: 12px;
}
@media (min-width: 768px) { .flip-settings { border-radius: 24px; border: 1px solid rgba(92,224,184,0.3); } }
.flip-settings-handle { width: 40px; height: 4px; background: rgba(255,255,255,0.25); margin: 0 auto 8px; border-radius: 2px; }
.flip-settings-title { font-family: var(--mono); font-weight: 700; font-size: 12px; letter-spacing: 0.22em; color: var(--mint); text-align: center; margin-bottom: 4px; }
.flip-settings-row {
  display: flex; justify-content: space-between; align-items: center;
  font-family: var(--mono); font-weight: 700; font-size: 11px;
  letter-spacing: 0.16em; padding: 12px 0;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.flip-settings-toggle {
  width: 44px; height: 24px; border-radius: 12px;
  background: rgba(255,255,255,0.15); border: 0; cursor: pointer; padding: 2px;
  position: relative; transition: background 200ms;
}
.flip-settings-toggle.is-on { background: var(--mint); }
.flip-settings-toggle span {
  display: block; width: 20px; height: 20px; border-radius: 50%;
  background: #fff; transform: translateX(0); transition: transform 200ms;
}
.flip-settings-toggle.is-on span { transform: translateX(20px); }
.flip-settings-stats {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 16px 0;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.flip-settings-stat { text-align: center; }
.flip-settings-stat-label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.18em; color: rgba(255,255,255,0.5); }
.flip-settings-stat-value { font-family: var(--mono); font-weight: 700; font-size: 16px; color: var(--mint); margin-top: 4px; }
.flip-settings-reset {
  margin-top: 8px; padding: 12px; cursor: pointer;
  background: transparent; border: 1px solid rgba(239,68,68,0.5); color: #ef4444;
  font-family: var(--mono); font-weight: 700; font-size: 11px; letter-spacing: 0.16em;
}
.flip-settings-foot {
  font-family: var(--mono); font-size: 10px; color: rgba(255,255,255,0.3);
  text-align: center; letter-spacing: 0.12em; margin-top: 8px;
}

/* ─── Phase 2 pricer ──────────────────────────────────────────── */
.flip-pricer {
  position: relative; z-index: 1;
  width: 100%; max-width: 520px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 14px;
  padding: 8px 0 24px;
}
.flip-pricer-progress { text-align: center; }
.flip-pricer-progress-label {
  font-family: var(--mono); font-weight: 700; font-size: 11px;
  letter-spacing: 0.2em; color: var(--mint); opacity: 0.7;
  margin-bottom: 8px;
}
.flip-pricer-progress-strip {
  display: flex; gap: 6px; justify-content: center;
}
.flip-pricer-tile {
  width: 28px; height: 4px; border-radius: 2px;
  background: rgba(92,224,184,0.2);
  transition: background-color 200ms;
}
.flip-pricer-tile--pending { background: rgba(92,224,184,0.15); }
.flip-pricer-tile--current { background: rgba(92,224,184,0.6); }
.flip-pricer-tile--grail { background: #F5C518; }
.flip-pricer-tile--sharp { background: #5CE0B8; }
.flip-pricer-tile--fair { background: rgba(255,255,255,0.5); }
.flip-pricer-tile--off { background: #ef4444; }
.flip-pricer-head {
  font-family: var(--display); font-weight: 900; font-size: 28px;
  letter-spacing: 0.06em; color: var(--mint); text-align: center; margin: 8px 0 0;
}
@media (min-width: 768px) { .flip-pricer-head { font-size: 32px; } }
.flip-pricer-sub {
  font-family: var(--mono); font-size: 12px; letter-spacing: 0.18em;
  color: var(--gold); opacity: 0.85; text-align: center;
}
.flip-pricer-body { display: flex; flex-direction: column; gap: 14px; }
.flip-pricer-card {
  position: relative; overflow: hidden;
  background: rgba(10,10,10,0.85); border: 1px solid rgba(92,224,184,0.4);
  border-radius: 16px; padding: 0;
  box-shadow: 0 0 60px rgba(92,224,184,0.2);
  min-height: 220px;
  display: flex; flex-direction: column;
}
.flip-pricer-card--rarity-grail { border-color: rgba(245,197,24,0.5); box-shadow: 0 0 60px rgba(245,197,24,0.25); }
.flip-pricer-card-img-wrap { position: relative; flex: 1; min-height: 140px; }
.flip-pricer-card-img { object-fit: cover; }
.flip-pricer-card-meta { padding: 12px 14px; }
.flip-pricer-card-name {
  font-family: var(--display); font-weight: 700; font-size: 18px;
  color: #fff; line-height: 1.15;
}
.flip-pricer-card-sub {
  font-family: var(--mono); font-size: 11px;
  color: rgba(92,224,184,0.7); letter-spacing: 0.08em; margin-top: 4px;
}
.flip-pricer-q {
  font-family: var(--display); font-weight: 700; font-size: 18px;
  letter-spacing: 0.22em; color: var(--mint); text-align: center;
  margin: 8px 0 0;
}
.flip-pricer-input-row {
  display: flex; align-items: center; justify-content: center;
  gap: 12px; margin: 8px 0 4px; min-height: 100px;
  cursor: text;
}
.flip-pricer-dollar {
  font-family: var(--display); font-weight: 900; font-size: 64px;
  color: var(--gold); line-height: 1;
}
.flip-pricer-input-display {
  font-family: var(--display); font-weight: 900; font-size: 96px;
  color: #fff; line-height: 1; font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
.flip-pricer-input-placeholder { color: rgba(255,255,255,0.2); }
.flip-pricer-input-hidden {
  position: absolute; opacity: 0; width: 1px; height: 1px;
  pointer-events: none;
  font-size: 16px; /* prevent iOS zoom */
}
.flip-pricer-underline {
  height: 2px; width: 0; background: var(--mint); margin: 0 auto;
  transition: width 800ms ease-out;
}
.flip-pricer-underline--active { width: 60%; }
.flip-pricer-presets {
  display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px;
  scrollbar-width: none; justify-content: center; flex-wrap: wrap;
}
.flip-pricer-presets::-webkit-scrollbar { display: none; }
.flip-pricer-preset {
  font-family: var(--mono); font-weight: 700; font-size: 14px;
  color: var(--mint); background: transparent;
  border: 1px solid var(--mint); padding: 8px 14px; min-height: 36px;
  cursor: pointer; letter-spacing: 0.08em;
}
.flip-pricer-preset:active { background: var(--mint); color: #000; }
.flip-pricer-presets-hint {
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
  color: rgba(92,224,184,0.4); text-align: center;
}
.flip-pricer-lockin {
  margin-top: 12px;
  width: 100%; height: 64px;
  background: linear-gradient(180deg, #5CE0B8 0%, #4FCDA5 100%);
  color: #000; border: 0; cursor: pointer;
  font-family: var(--display); font-weight: 900; font-size: 20px;
  letter-spacing: 0.22em;
  box-shadow: 0 0 30px rgba(92,224,184,0.5);
}
.flip-pricer-lockin:disabled { opacity: 0.3; cursor: not-allowed; box-shadow: none; }
.flip-pricer-lockin-arrow { margin-left: 8px; }
.flip-pricer-lockin--final { margin-top: 24px; max-width: 320px; align-self: center; }

/* Pricer reveal */
.flip-reveal {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; padding: 16px 4px; text-align: center;
}
.flip-reveal-evidence {
  position: relative; width: 80px; height: 80px;
  border: 1px solid rgba(92,224,184,0.4); overflow: hidden;
}
.flip-reveal-evidence-img { object-fit: cover; }
.flip-reveal-divider {
  height: 2px; width: 100%; background: var(--mint);
  transform-origin: left center;
}
.flip-reveal-numbers {
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px; width: 100%;
}
.flip-reveal-col { display: flex; flex-direction: column; gap: 4px; }
.flip-reveal-label {
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em;
  color: rgba(255,255,255,0.6);
}
.flip-reveal-num {
  font-family: var(--display); font-weight: 900; font-size: 56px;
  color: #fff; line-height: 1; font-variant-numeric: tabular-nums;
}
@media (min-width: 768px) { .flip-reveal-num { font-size: 72px; } }
.flip-reveal-bar-track {
  height: 6px; width: 100%; background: rgba(255,255,255,0.08); border-radius: 3px;
  overflow: hidden;
}
.flip-reveal-bar-fill { height: 100%; border-radius: 3px; }
.flip-reveal-tier {
  display: inline-flex; align-items: center; gap: 12px;
  font-family: var(--display); font-weight: 900; font-size: 32px;
  letter-spacing: 0.06em; margin-top: 8px;
}
.flip-reveal-tier-glyph { font-size: 36px; }
.flip-reveal-tier--glow { text-shadow: 0 0 24px rgba(245,197,24,0.6); }

/* ─── Result reveal screen ────────────────────────────────────── */
.flip-rev {
  position: relative; z-index: 1; overflow-y: auto;
  min-height: 100dvh;
  display: flex; flex-direction: column; align-items: center;
  padding: 24px 16px 32px;
  color: #fff;
}
.flip-rev-aurora {
  position: fixed; top: 0; left: 0; right: 0; height: 40vh;
  background: linear-gradient(180deg, rgba(92,224,184,0.12) 0%, rgba(59,130,246,0.08) 40%, rgba(107,70,193,0.06) 70%, transparent 100%);
  pointer-events: none; z-index: 0;
  animation: flip-aurora-drift 12s ease-in-out infinite alternate;
}
.flip-rev-mascot { position: relative; z-index: 2; margin-top: 24px; }
.flip-rev-tier {
  position: relative; z-index: 3;
  display: flex; flex-direction: column; align-items: center;
  font-family: var(--display); font-weight: 900;
  margin: 16px 0;
}
.flip-rev-tier-glyph { font-size: 72px; }
.flip-rev-tier-label { font-size: 96px; line-height: 1; letter-spacing: 0.02em; margin-top: 8px; }
@media (min-width: 768px) { .flip-rev-tier-label { font-size: 144px; } }
.flip-rev-tier-sub {
  font-family: var(--mono); font-weight: 700; font-size: 14px;
  letter-spacing: 0.22em; color: var(--mint); margin-top: 16px;
}
.flip-rev-tier--glow { filter: drop-shadow(0 0 40px currentColor); }
.flip-rev-tier-chip {
  position: absolute; top: 20px; right: 20px; z-index: 3;
  font-family: var(--mono); font-weight: 700; font-size: 12px;
  letter-spacing: 0.18em;
  padding: 6px 12px; border: 1.5px solid;
  display: inline-flex; gap: 6px; align-items: center;
}
.flip-rev-dollars-block {
  position: relative; z-index: 3;
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; margin: 24px 0; text-align: center;
}
.flip-rev-dollars {
  font-family: var(--display); font-weight: 900; font-size: 128px;
  background: linear-gradient(90deg, #5CE0B8 0%, #F5C518 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent !important;
  line-height: 1; font-variant-numeric: tabular-nums;
}
@media (min-width: 768px) { .flip-rev-dollars { font-size: 192px; } }
.flip-rev-dollars-tag {
  font-family: var(--display); font-weight: 700; font-size: 22px;
  letter-spacing: 0.22em; color: #fff;
}
.flip-rev-dollars-sub {
  font-family: var(--mono); font-size: 12px; letter-spacing: 0.12em;
  color: var(--mint); opacity: 0.85;
}
.flip-rev-stats {
  position: relative; z-index: 3;
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 12px; width: 100%; max-width: 420px;
  margin: 8px 0 16px;
}
.flip-rev-stat {
  background: rgba(10,10,10,0.7); border: 1px solid rgba(92,224,184,0.3);
  padding: 16px 8px; text-align: center;
  border-radius: 12px;
  transition: transform 200ms, box-shadow 200ms;
}
.flip-rev-stat:hover { transform: scale(1.05); box-shadow: 0 0 20px rgba(92,224,184,0.3); }
.flip-rev-stat--gold { border-color: #F5C518; box-shadow: 0 0 12px rgba(245,197,24,0.3); }
.flip-rev-stat-label {
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em;
  color: rgba(255,255,255,0.55);
}
.flip-rev-stat-value {
  font-family: var(--display); font-weight: 900; font-size: 32px;
  font-variant-numeric: tabular-nums; margin-top: 4px;
}
.flip-rev-lifetime {
  position: relative; z-index: 3;
  width: 100%; max-width: 420px;
  border-top: 1px solid rgba(92,224,184,0.15);
  padding: 16px 8px; text-align: center;
  margin-bottom: 16px;
}
.flip-rev-lifetime-label {
  font-family: var(--mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.22em; color: var(--mint);
}
.flip-rev-lifetime-row {
  display: flex; gap: 24px; justify-content: center; margin: 8px 0;
}
.flip-rev-lifetime-stat {
  font-family: var(--display); font-weight: 900; font-size: 36px;
  color: var(--gold); font-variant-numeric: tabular-nums;
}
.flip-rev-lifetime-sub {
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em;
  color: rgba(255,255,255,0.5);
}
.flip-rev-coins {
  position: relative; z-index: 3;
  width: 100%; max-width: 420px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 18px 12px; margin-bottom: 16px;
  border: 1px solid rgba(245,197,24,0.28);
  border-radius: 16px;
  background:
    radial-gradient(120% 140% at 50% 0%, rgba(245,197,24,0.12), rgba(245,197,24,0) 62%),
    rgba(10,10,10,0.55);
  box-shadow: 0 0 28px rgba(245,197,24,0.10), inset 0 1px 0 rgba(255,255,255,0.05);
}
.flip-rev-coins-label {
  font-family: var(--mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.24em; color: var(--gold);
}
.flip-rev-coins-hero {
  display: flex; align-items: center; gap: 8px;
}
.flip-rev-coins-glyph { font-size: 30px; line-height: 1; }
.flip-rev-coins-earned {
  font-family: var(--display); font-weight: 900; font-size: 46px; line-height: 1;
  color: var(--gold); font-variant-numeric: tabular-nums;
  text-shadow: 0 0 22px rgba(245,197,24,0.35);
}
.flip-rev-coins-breakdown {
  display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;
}
.flip-rev-coins-chip {
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em;
  color: rgba(255,255,255,0.72);
  padding: 4px 10px; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04);
}
.flip-rev-coins-chip--gold {
  color: var(--gold); border-color: rgba(245,197,24,0.4);
  background: rgba(245,197,24,0.08);
}
.flip-rev-coins-note {
  font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.04em;
  color: rgba(255,255,255,0.5); text-align: center; max-width: 300px; line-height: 1.5;
}
.flip-rev-coins-balance {
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em;
  color: rgba(255,255,255,0.55);
}
.flip-rev-coins-balance b { color: rgba(255,255,255,0.9); font-weight: 700; }
.flip-rev-cta {
  position: sticky; bottom: 0; z-index: 4;
  width: 100%; max-width: 520px;
  background: linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.95) 20%, #0a0a0a 60%);
  padding: 32px 16px 20px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  margin-top: 16px;
}
.flip-rev-cta-head {
  font-family: var(--display); font-weight: 900; font-size: 32px;
  background: linear-gradient(90deg, #5CE0B8 0%, #F5C518 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent !important;
  text-align: center;
}
@media (min-width: 768px) { .flip-rev-cta-head { font-size: 40px; } }
.flip-rev-cta-sub-head {
  font-family: var(--mono); font-size: 13px; color: var(--mint);
  text-align: center; letter-spacing: 0.1em;
}
.flip-rev-miss-card {
  width: 100%; padding: 16px;
  border: 1px solid rgba(92,224,184,0.3); background: rgba(92,224,184,0.04);
  border-radius: 12px; display: flex; flex-direction: column; gap: 10px;
}
.flip-rev-miss-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.flip-rev-miss-col { display: flex; flex-direction: column; gap: 2px; }
.flip-rev-miss-col--right { text-align: right; }
.flip-rev-miss-label {
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em;
  color: rgba(239,68,68,0.7);
}
.flip-rev-miss-col--right .flip-rev-miss-label { color: rgba(255,255,255,0.6); }
.flip-rev-miss-big {
  font-family: var(--display); font-weight: 900; font-size: 32px;
  color: #fff; font-variant-numeric: tabular-nums; line-height: 1;
}
@media (min-width: 768px) { .flip-rev-miss-big { font-size: 40px; } }
.flip-rev-miss-strip {
  display: flex; gap: 8px; overflow-x: auto;
  scrollbar-width: none;
}
.flip-rev-miss-strip::-webkit-scrollbar { display: none; }
.flip-rev-miss-thumb {
  position: relative; flex-shrink: 0;
  width: 64px; height: 64px;
  border-radius: 8px; overflow: hidden;
  background: #0a0a0a;
}
.flip-rev-miss-thumb img { object-fit: cover; }
.flip-rev-miss-thumb span {
  position: absolute; left: 0; right: 0; bottom: 0;
  font-family: var(--mono); font-size: 9px; font-weight: 700;
  background: rgba(0,0,0,0.7); color: var(--mint);
  text-align: center; padding: 2px;
}
.flip-rev-cta-btn {
  position: relative;
  width: 100%; max-width: 420px; height: 72px; border-radius: 16px;
  background: linear-gradient(180deg, #6FE9C6 0%, #4FCDA5 54%, #38BC91 100%);
  color: #04120D; text-decoration: none;
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--display); font-weight: 900; font-size: 18px;
  letter-spacing: 0.22em;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.5),
    inset 0 -3px 8px rgba(0,0,0,0.16),
    0 10px 26px -8px rgba(92,224,184,0.55);
}
.flip-rev-cta-btn-label { position: relative; z-index: 2; }
/* Same layered-bloom language as the TAP-IN hero: idle pulse + press surge
   on OPACITY (compositor). Replaces the old box-shadow-pulse animation. */
.flip-rev-cta-btn-bloom {
  position: absolute; inset: -40% -8%; z-index: 0; pointer-events: none;
  background: radial-gradient(ellipse 60% 100% at 50% 50%, rgba(92,224,184,0.5) 0%, rgba(245,197,24,0.18) 45%, transparent 72%);
  opacity: 0.4;
  animation: flip-tapin-bloom 2.6s ease-in-out infinite;
}
.flip-rev-cta-btn:active .flip-rev-cta-btn-bloom { opacity: 1; animation: none; }
@media (min-width: 768px) { .flip-rev-cta-btn { height: 80px; font-size: 22px; } }
.flip-rev-cta-sub-link {
  font-family: var(--display); font-size: 13px;
  color: var(--mint); text-decoration: underline; opacity: 0.8;
}
.flip-rev-share-section {
  position: relative; z-index: 3; width: 100%; max-width: 480px;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  margin-top: 32px;
}
.flip-rev-share-divider {
  font-family: var(--mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.22em; color: rgba(92,224,184,0.5);
  margin: 8px 0;
}
.flip-rev-footer {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  margin-top: 24px; padding-bottom: 24px;
}
.flip-rev-countdown {
  display: flex; align-items: center; gap: 10px;
  font-family: var(--mono); letter-spacing: 0.16em;
}
.flip-rev-countdown-label { font-size: 11px; color: var(--mint); opacity: 0.6; }
.flip-rev-countdown-time { font-family: var(--display); font-weight: 900; font-size: 24px; color: var(--gold); font-variant-numeric: tabular-nums; }
.flip-rev-countdown--urgent .flip-rev-countdown-time { color: var(--gold); animation: flip-countdown-pulse 1.5s ease-in-out infinite; }
.flip-rev-countdown--imminent .flip-rev-countdown-time { color: var(--mint); border-bottom: 1px solid var(--gold); animation: flip-countdown-pulse 0.8s ease-in-out infinite; }
@keyframes flip-countdown-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.flip-rev-replay {
  font-family: var(--display); font-weight: 600; font-size: 13px;
  letter-spacing: 0.18em; color: rgba(255,255,255,0.5);
  background: none; border: 0; cursor: pointer; padding: 8px;
}
.flip-rev-replay:hover { color: rgba(255,255,255,0.85); }

/* ─── Share ───────────────────────────────────────────────────── */
.flip-share-wrap {
  width: 100%; display: flex; flex-direction: column;
  align-items: center; gap: 14px;
}
.flip-share-card {
  width: 100%; max-width: 360px;
  background: rgba(10,10,10,0.7); border: 1px solid rgba(92,224,184,0.35);
  border-radius: 16px; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 8px;
  font-family: var(--mono);
}
.flip-share-card--in-modal { background: rgba(0,0,0,0.55); }
.flip-share-card-head {
  display: flex; gap: 10px; align-items: center;
  font-family: var(--display); font-weight: 700; font-size: 18px;
  color: var(--mint);
}
.flip-share-card-score { display: flex; flex-direction: column; gap: 4px; }
.flip-share-card-score-big {
  font-family: var(--display); font-weight: 900; font-size: 30px;
  color: var(--mint); letter-spacing: -0.01em;
}
.flip-share-card-score-dollars {
  font-family: var(--mono); font-size: 14px; color: var(--gold); letter-spacing: 0.06em;
}
.flip-share-card-emoji { font-size: 24px; letter-spacing: 0.04em; line-height: 1.2; word-break: break-all; }
.flip-share-card-foot {
  font-family: var(--mono); font-size: 10px; color: rgba(92,224,184,0.5); letter-spacing: 0.12em;
}
.flip-share-primary {
  width: 100%; max-width: 360px; height: 56px;
  background: linear-gradient(180deg, #5CE0B8 0%, #4FCDA5 100%);
  color: #000; border: 0; cursor: pointer;
  font-family: var(--display); font-weight: 900; font-size: 16px;
  letter-spacing: 0.22em;
}
.flip-share-modal-backdrop {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
  display: flex; align-items: flex-end; justify-content: center;
}
@media (min-width: 768px) { .flip-share-modal-backdrop { align-items: center; padding: 24px; } }
.flip-share-modal {
  position: relative;
  background: #0a0a0a; color: #fff;
  border-top: 1px solid rgba(92,224,184,0.4);
  width: 100%; max-width: 480px;
  padding: 16px 20px 24px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 0 80px rgba(92,224,184,0.25);
  border-top-left-radius: 32px; border-top-right-radius: 32px;
}
@media (min-width: 768px) {
  .flip-share-modal { border: 1px solid rgba(92,224,184,0.4); border-radius: 24px; }
}
.flip-share-modal-handle { width: 40px; height: 4px; background: var(--mint); opacity: 0.6; margin: 0 auto 4px; border-radius: 2px; }
.flip-share-modal-x {
  position: absolute; top: 12px; right: 16px;
  background: none; border: 0; cursor: pointer; padding: 4px;
  font-size: 16px; color: rgba(255,255,255,0.5);
}
.flip-share-modal-title {
  font-family: var(--display); font-weight: 900; font-size: 24px;
  background: linear-gradient(90deg, #5CE0B8, #3B82F6);
  -webkit-background-clip: text; background-clip: text; color: transparent !important;
  text-align: center; letter-spacing: 0.04em;
}
.flip-share-modal-sub {
  font-family: var(--mono); font-size: 12px; color: rgba(92,224,184,0.6);
  text-align: center; letter-spacing: 0.06em;
}
.flip-share-modal-actions {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
  margin-top: 4px;
}
.flip-share-action {
  height: 56px; background: transparent; cursor: pointer;
  border: 1px solid var(--mint); color: var(--mint);
  font-family: var(--display); font-weight: 700; font-size: 13px;
  letter-spacing: 0.16em;
}
.flip-share-action--primary { background: var(--mint); color: #000; }
.flip-share-action--full { grid-column: 1 / -1; height: 72px; font-size: 18px; }
.flip-share-modal-foot {
  font-family: var(--mono); font-size: 10px; color: rgba(92,224,184,0.4);
  text-align: center; letter-spacing: 0.18em; margin-top: 4px;
}
.flip-share-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  z-index: 300;
  font-family: var(--display); font-weight: 700; font-size: 13px;
  color: #000; background: var(--mint);
  padding: 10px 18px; letter-spacing: 0.04em;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}

/* Post-share thanks */
.flip-share-thanks {
  width: 100%; max-width: 420px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 24px;
  border: 1px solid rgba(92,224,184,0.3); border-radius: 16px;
  background: rgba(10,10,10,0.5);
}
.flip-share-thanks-check {
  width: 64px; height: 64px;
  display: flex; align-items: center; justify-content: center;
  border: 3px solid var(--mint); color: var(--mint);
  border-radius: 50%; font-size: 32px;
  filter: drop-shadow(0 0 20px rgba(92,224,184,0.6));
}
.flip-share-thanks-head {
  font-family: var(--display); font-weight: 900; font-size: 48px;
  color: var(--mint); letter-spacing: 0.04em; line-height: 1;
}
.flip-share-thanks-sub {
  font-family: var(--display); font-weight: 700; font-size: 18px;
  color: #fff;
}
.flip-share-thanks-fine {
  font-family: var(--mono); font-size: 11px; color: rgba(255,255,255,0.4);
  letter-spacing: 0.08em;
}

/* ─── Focus rings (accessibility) ─────────────────────────────── */
.flip-game-wrap button:focus-visible,
.flip-game-wrap a:focus-visible {
  outline: 2px solid var(--mint);
  outline-offset: 2px;
  box-shadow: 0 0 0 1px #fff inset;
}

/* ─── sr-only (visually hidden but screen-reader accessible) ──── */
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

/* ─── Cosmic cursor (desktop fine-pointer only) ──────────────── */
body.fos-cursor-active, body.fos-cursor-active * { cursor: none !important; }
.fos-cursor-ring {
  position: fixed; top: 0; left: 0; z-index: 9999;
  width: 20px; height: 20px; margin: -10px 0 0 -10px;
  border: 1px solid rgba(92,224,184,0.6); border-radius: 50%;
  pointer-events: none;
}
.fos-cursor-dot {
  position: fixed; top: 0; left: 0; z-index: 9999;
  width: 4px; height: 4px; margin: -2px 0 0 -2px;
  background: #5CE0B8; border-radius: 50%;
  pointer-events: none;
}
.fos-cursor-trail {
  position: fixed; top: 0; left: 0; z-index: 9998;
  width: 4px; height: 4px;
  background: #5CE0B8; border-radius: 50%;
  pointer-events: none; transition: opacity 200ms;
}
.fos-cursor-ripple {
  position: fixed; top: 0; left: 0; z-index: 9997;
  width: 24px; height: 24px; margin: -12px 0 0 -12px;
  border: 2px solid #5CE0B8; border-radius: 50%;
  pointer-events: none;
}

/* ─── Mascot bubble ──────────────────────────────────────────── */
.fos-mascot-wrap {
  position: relative; display: inline-block; cursor: pointer;
  transition: transform 200ms ease;
}
.fos-mascot-shake { display: inline-block; }
.fos-mascot-bubble {
  position: absolute; top: -8px; left: 90%;
  font-family: var(--mono); font-weight: 700; font-size: 11px;
  letter-spacing: 0.08em; color: var(--mint);
  background: rgba(0,0,0,0.85); border: 1px solid rgba(92,224,184,0.5);
  padding: 6px 10px; border-radius: 12px;
  white-space: nowrap; z-index: 5;
  max-width: 180px; overflow: hidden; text-overflow: ellipsis;
}

/* ─── Keyboard HUD ───────────────────────────────────────────── */
.fos-kbd-hud {
  position: fixed; bottom: 16px; left: 16px; z-index: 40;
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em;
  color: var(--mint); pointer-events: none;
}

/* ─── Corner mascot ──────────────────────────────────────────── */
.flip-corner-mascot {
  position: fixed; z-index: 5; opacity: 0.6;
  transition: opacity 200ms;
}
/* Notch clearance — the corner mascot is position:fixed, so the
   wrap's safe-area padding doesn't apply. Bump top by the inset
   directly. */
.flip-corner-mascot--top-left { top: max(12px, env(safe-area-inset-top)); left: 12px; }
.flip-corner-mascot--top-right { top: max(12px, env(safe-area-inset-top)); right: 12px; }
.flip-corner-mascot:hover { opacity: 1; }

/* ─── Replay banner / konami hint / grail hunter badge ───────── */
.flip-intro-replay-banner {
  display: flex; align-items: center; gap: 10px;
  margin-top: 12px; padding: 8px 14px;
  border: 1px solid rgba(92,224,184,0.4); background: rgba(10,22,18,0.85);
  font-family: var(--mono); font-weight: 700; font-size: 12px;
  color: var(--mint); letter-spacing: 0.04em;
}
.flip-intro-replay-banner button {
  background: none; border: 0; cursor: pointer; color: var(--mint);
  font-size: 14px; padding: 0 4px;
}
.flip-intro-replay-banner--pro {
  background: var(--mint); color: #000; border-color: var(--mint);
  text-decoration: none;
}
.flip-intro-grail-hunter {
  margin-top: 12px; padding: 6px 12px;
  background: var(--gold); color: #000;
  font-family: var(--mono); font-weight: 700; font-size: 11px;
  letter-spacing: 0.2em;
}
.flip-intro-konami-hint {
  position: fixed; top: 24px; right: 24px;
  font-family: var(--mono); font-size: 11px; color: var(--mint);
  opacity: 0.3; letter-spacing: 0.12em;
  pointer-events: none; z-index: 30;
}

/* ─── ResultReveal extras ────────────────────────────────────── */
.flip-rev--wolf-flash { animation: flip-rev-wolf 0.22s ease-out; }
@keyframes flip-rev-wolf {
  0%, 100% { filter: none; }
  50% { filter: brightness(1.4) sepia(1) saturate(2) hue-rotate(-20deg); }
}
.flip-rev-saved-icon {
  position: fixed; top: 20px; right: 20px; z-index: 50;
  font-family: var(--mono); font-size: 11px; color: var(--mint);
  letter-spacing: 0.06em;
  display: inline-flex; align-items: center; gap: 6px;
}
.flip-rev-saved-dot {
  width: 4px; height: 4px; border-radius: 50%; background: var(--mint);
}
.flip-rev-egg-hint {
  font-family: var(--mono); font-size: 11px; color: var(--mint);
  opacity: 0.3; letter-spacing: 0.12em; margin: 4px 0;
}
.flip-rev-milestone-flash {
  position: fixed; left: 0; right: 0; top: 30%; height: 1px;
  background: var(--mint); transform-origin: center;
  pointer-events: none; z-index: 60;
  box-shadow: 0 0 12px var(--mint);
}
.flip-rev-dollars-floaters {
  position: absolute; inset: 0; pointer-events: none; overflow: visible;
}
.flip-rev-dollars-floater {
  position: absolute; bottom: 0;
  color: rgba(245,197,24,0.7); font-family: var(--display); font-weight: 900;
  animation: flip-rev-floater 1.2s ease-out forwards;
  --drift: 0px;
}
@keyframes flip-rev-floater {
  0% { transform: translate(0, 0); opacity: 0.7; }
  100% { transform: translate(var(--drift), -100px); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .flip-rev-dollars-floater { animation: none; opacity: 0; }
  .flip-rev-milestone-flash { display: none; }
  .flip-rev--wolf-flash { animation: none; }
  .flip-rev-cta-btn-bloom { animation: none; opacity: 0.4; }
}

/* ─── Headline wave (subtle continuous oscillation per letter) ── */
@keyframes flip-headline-wave {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1.5px); }
}
@media (prefers-reduced-motion: no-preference) {
  .flip-intro-title--gradient > span {
    animation: flip-headline-wave 6s ease-in-out infinite;
  }
  .flip-intro-title--gradient > span:nth-child(1) { animation-delay: 0s; }
  .flip-intro-title--gradient > span:nth-child(2) { animation-delay: 0.2s; }
  .flip-intro-title--gradient > span:nth-child(3) { animation-delay: 0.4s; }
  .flip-intro-title--gradient > span:nth-child(4) { animation-delay: 0.6s; }
  .flip-intro-title--gradient > span:nth-child(5) { animation-delay: 0.8s; }
  .flip-intro-title--gradient > span:nth-child(6) { animation-delay: 1s; }
  .flip-intro-title--gradient > span:nth-child(7) { animation-delay: 1.2s; }
  .flip-intro-title--gradient > span:nth-child(8) { animation-delay: 1.4s; }
  .flip-intro-title--gradient > span:nth-child(9) { animation-delay: 1.6s; }
  .flip-intro-title--gradient > span:nth-child(10) { animation-delay: 1.8s; }
  .flip-intro-title--gradient > span:nth-child(11) { animation-delay: 2s; }
  .flip-intro-title--gradient > span:nth-child(12) { animation-delay: 2.2s; }
}

/* ─── Grail holographic sheen ────────────────────────────────── */
.flip-swipe-card--rarity-grail .flip-swipe-card-inner::before {
  content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 5;
  background: linear-gradient(110deg,
    transparent 30%,
    rgba(92,224,184,0.25) 45%,
    rgba(245,197,24,0.35) 55%,
    transparent 70%);
  background-size: 300% 300%;
  background-position: -100% 0%;
  mix-blend-mode: overlay;
  animation: flip-grail-sheen 6s ease-in-out infinite;
}
@keyframes flip-grail-sheen {
  0%, 30% { background-position: -100% 0%; }
  70%, 100% { background-position: 200% 0%; }
}
@media (prefers-reduced-motion: reduce) {
  .flip-swipe-card--rarity-grail .flip-swipe-card-inner::before { animation: none; }
}

/* ─── COPY AS IMAGE hidden 1080x1080 source ──────────────────── */
.fos-share-source {
  position: absolute; left: -9999px; top: -9999px;
  width: 1080px; height: 1080px;
  background: #0a0a0a; color: #fff; overflow: hidden;
  font-family: var(--font-manrope), sans-serif;
}
.fos-share-source-bg {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 70% 70%, rgba(107,70,193,0.25) 0%, transparent 60%),
    radial-gradient(ellipse 100% 100% at 50% 50%, #0a0a14 0%, #000 70%);
}
.fos-share-source-inner {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 100%; height: 100%; padding: 80px; text-align: center;
}
.fos-share-source-head {
  font-weight: 700; font-size: 32px; color: #5CE0B8; letter-spacing: 0.04em; margin-bottom: 24px;
}
.fos-share-source-score {
  font-weight: 900; font-size: 180px; line-height: 1; margin-bottom: 16px;
  background: linear-gradient(90deg, #5CE0B8 0%, #F5C518 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  letter-spacing: -0.03em;
}
.fos-share-source-dollars { font-weight: 700; font-size: 56px; color: #F5C518; margin-bottom: 24px; }
.fos-share-source-tier { font-weight: 900; font-size: 48px; margin-bottom: 32px; }
.fos-share-source-grid { font-size: 28px; letter-spacing: 0.06em; margin-bottom: 40px; }
.fos-share-source-foot { font-family: ui-monospace, monospace; font-size: 20px; color: rgba(92,224,184,0.6); }

/* ─── Phase2 tilt source — disable input zoom on iOS ───────── */
.flip-pricer-input-hidden { font-size: 16px !important; }
`;
