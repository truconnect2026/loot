"use client";

import { useCallback, useRef } from "react";

/**
 * useGameSounds — Tone.js synthesis-only SFX bank.
 *
 * Why a hook with refs and not module globals: Tone.start() must run inside
 * a user gesture (iOS requirement). The intro screen's "TAP IN" button is
 * the unlock; init() must be idempotent so subsequent taps no-op.
 *
 * Every play function silently no-ops if:
 *   - ready is false (init never ran)
 *   - Tone.context.state !== "running" (browser suspended audio context)
 *   - prefers-reduced-motion is set
 */
export default function useGameSounds() {
  const ready = useRef(false);
  const synths = useRef({});
  const ToneRef = useRef(null);

  const init = useCallback(async () => {
    if (ready.current) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      // Respect the user — never spin up audio at all.
      ready.current = true;
      return;
    }
    const Tone = await import("tone");
    ToneRef.current = Tone;
    try {
      await Tone.start();
    } catch {
      /* ignore — audio just won't play */
      return;
    }

    // ─── DING (correct) ────────────────────────────────────────────────────
    synths.current.ding = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.4 },
      volume: -8,
    }).toDestination();

    // ─── BUZZ (wrong) ──────────────────────────────────────────────────────
    const distortion = new Tone.Distortion(0.4);
    const buzzFilter = new Tone.Filter(800, "lowpass");
    synths.current.buzz = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 },
      volume: -10,
    }).chain(distortion, buzzFilter, Tone.Destination);

    // ─── SWOOSH (card flying off) ──────────────────────────────────────────
    const swooshFilter = new Tone.Filter(1000, "bandpass");
    synths.current.swoosh = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0, release: 0.1 },
      volume: -14,
    }).chain(swooshFilter, Tone.Destination);
    synths.current.swooshFilter = swooshFilter;

    // ─── STREAK (escalating combo) ─────────────────────────────────────────
    const streakDelay = new Tone.FeedbackDelay("16n", 0.2);
    const streakReverb = new Tone.Reverb({ decay: 1, wet: 0.2 });
    synths.current.streak = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.005, decay: 0.12, sustain: 0, release: 0.1 },
      volume: -6,
    }).chain(streakDelay, streakReverb, Tone.Destination);

    // ─── WIN (end of round) ────────────────────────────────────────────────
    const winDelay = new Tone.FeedbackDelay("8n", 0.3);
    const winReverb = new Tone.Reverb({ decay: 2, wet: 0.4 });
    synths.current.win = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.8 },
      volume: -6,
    }).chain(winDelay, winReverb, Tone.Destination);

    // ─── REVEAL (number ticker tick) ───────────────────────────────────────
    synths.current.reveal = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
      volume: -20,
    }).toDestination();

    // ─── GRAIL REVEAL (higher-pitched twinkling triad when a grail appears)
    const grailDelay = new Tone.FeedbackDelay("16n", 0.25);
    const grailReverb = new Tone.Reverb({ decay: 1.6, wet: 0.35 });
    synths.current.grail = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 },
      volume: -10,
    }).chain(grailDelay, grailReverb, Tone.Destination);

    // ─── TICK (score arc segment fill — slight pitch climb per correct)
    synths.current.tick = new Tone.MembraneSynth({
      pitchDecay: 0.05, octaves: 4,
      oscillator: { type: "sine" },
      volume: -22,
    }).toDestination();

    // ─── TRANSITION SWELL (phase changes — filter sweeps)
    const trFilter = new Tone.Filter(200, "lowpass");
    synths.current.transitionFilter = trFilter;
    synths.current.transition = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 0.5 },
      volume: -18,
    }).chain(trFilter, Tone.Destination);

    // ─── IMPACT SWELL (WOLF/SOLID tier reveal — chord with big reverb)
    const impactReverb = new Tone.Reverb({ decay: 4, wet: 0.4 });
    synths.current.impact = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.05, decay: 0.5, sustain: 0.5, release: 1.5 },
      volume: -14,
    }).chain(impactReverb, Tone.Destination);

    ready.current = true;
  }, []);

  const guard = () => {
    if (!ready.current) return null;
    const Tone = ToneRef.current;
    if (!Tone || Tone.context.state !== "running") return null;
    return Tone;
  };

  const playDing = useCallback(() => {
    const Tone = guard();
    if (!Tone) return;
    const now = Tone.now();
    synths.current.ding.triggerAttackRelease("C5", "16n", now);
    synths.current.ding.triggerAttackRelease("E5", "16n", now + 0.08);
    synths.current.ding.triggerAttackRelease("G5", "16n", now + 0.16);
  }, []);

  const playBuzz = useCallback(() => {
    const Tone = guard();
    if (!Tone) return;
    const now = Tone.now();
    synths.current.buzz.triggerAttackRelease("A2", "8n", now);
    synths.current.buzz.triggerAttackRelease("Bb2", "8n", now);
  }, []);

  const playSwoosh = useCallback((direction) => {
    const Tone = guard();
    if (!Tone) return;
    const filter = synths.current.swooshFilter;
    const now = Tone.now();
    if (direction === "flip") {
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.linearRampToValueAtTime(4000, now + 0.2);
    } else {
      filter.frequency.setValueAtTime(4000, now);
      filter.frequency.linearRampToValueAtTime(500, now + 0.2);
    }
    synths.current.swoosh.triggerAttackRelease("16n", now);
  }, []);

  const playStreak = useCallback((comboCount) => {
    const Tone = guard();
    if (!Tone) return;
    const midi = 72 + Math.min(comboCount - 1, 18);
    const freq = Tone.Frequency(midi, "midi").toFrequency();
    synths.current.streak.triggerAttackRelease(freq, "16n");
  }, []);

  const playWin = useCallback(() => {
    const Tone = guard();
    if (!Tone) return;
    const now = Tone.now();
    const arp = ["C5", "E5", "G5", "C6"];
    arp.forEach((n, idx) => {
      synths.current.win.triggerAttackRelease(n, "8n", now + idx * 0.08);
    });
    // Final chord ring-out
    synths.current.win.triggerAttackRelease(["C5", "E5", "G5"], 0.8, now + 0.4);
  }, []);

  const playReveal = useCallback(() => {
    const Tone = guard();
    if (!Tone) return;
    synths.current.reveal.triggerAttackRelease("C6", "32n");
  }, []);

  const playGrailReveal = useCallback(() => {
    const Tone = guard();
    if (!Tone) return;
    const now = Tone.now();
    synths.current.grail.triggerAttackRelease("E6", "16n", now);
    synths.current.grail.triggerAttackRelease("G6", "16n", now + 0.06);
    synths.current.grail.triggerAttackRelease("B6", "8n", now + 0.12);
  }, []);

  const playTick = useCallback((streakIndex = 0) => {
    const Tone = guard();
    if (!Tone) return;
    // Chromatic climb up to +8 semitones from C4.
    const semitones = Math.min(streakIndex - 1, 8);
    const midi = 60 + Math.max(0, semitones * 2);
    const freq = Tone.Frequency(midi, "midi").toFrequency();
    synths.current.tick.triggerAttackRelease(freq, "32n");
  }, []);

  const playTransition = useCallback((dir = "in") => {
    const Tone = guard();
    if (!Tone) return;
    const now = Tone.now();
    const filter = synths.current.transitionFilter;
    if (dir === "in") {
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.linearRampToValueAtTime(4000, now + 0.6);
    } else {
      filter.frequency.setValueAtTime(4000, now);
      filter.frequency.linearRampToValueAtTime(200, now + 0.6);
    }
    synths.current.transition.triggerAttackRelease(["C3", "E3", "G3", "B3"], "2n", now);
  }, []);

  const playImpactSwell = useCallback((tier) => {
    const Tone = guard();
    if (!Tone) return;
    if (tier !== "wolf" && tier !== "solid") return;
    const now = Tone.now();
    if (tier === "wolf") {
      synths.current.impact.triggerAttackRelease(["C2", "G2", "C3", "E3", "G3"], 2, now);
    } else {
      synths.current.impact.triggerAttackRelease(["C3", "E3", "G3"], 2, now);
    }
  }, []);

  return {
    init, playDing, playBuzz, playSwoosh, playStreak, playWin, playReveal,
    playGrailReveal, playTick, playTransition, playImpactSwell,
  };
}
