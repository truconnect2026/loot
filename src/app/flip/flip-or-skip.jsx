import React, { useState, useEffect, useRef } from 'react';
import FlipCoyote from '@/components/shared/FlipCoyote';

// ============ ITEM BANK ============
const ITEMS = [
  { id: 1, name: "Pyrex Butterprint 403 Cinderella", era: "1957–68", brand: "Pyrex", condition: "Clean, no chips", buy: 4, resell: 85, roi: "High", velocity: "Fast", hint: "Turquoise farm scene. Mixing bowl. Thrift shelf staple.", bolo: "Butterprint 403s been hitting $80-95 lately. Cinderella handle = the move." },
  { id: 2, name: "Carhartt Detroit Jacket J97 (90s)", era: "1990s", brand: "Carhartt", condition: "Worn-in, no rips", buy: 8, resell: 140, roi: "High", velocity: "Fast", hint: "Brown duck canvas. Blanket lining. Made in USA tag.", bolo: "90s Detroits w/ USA tags clearing $130+. Check the inside seam." },
  { id: 3, name: "Coleman 200A Lantern (red, 70s)", era: "1970s", brand: "Coleman", condition: "Working, original glass", buy: 6, resell: 90, roi: "High", velocity: "Mid", hint: "Single mantle. Red enamel. Date-stamped on bottom.", bolo: "Date stamp on the bottom tells you everything. Pre-'78 = print." },
  { id: 4, name: "Levi's 501 Big E redline", era: "Pre-1971", brand: "Levi's", condition: "Faded, no holes", buy: 5, resell: 220, roi: "Unicorn", velocity: "Mid", hint: "Capital E on red tab. Selvedge redline inside leg.", bolo: "Big E + redline = unicorn. Flip the cuff first, always." },
  { id: 5, name: "Pendleton wool blanket", era: "1960s–80s", brand: "Pendleton", condition: "No moth, label intact", buy: 12, resell: 160, roi: "High", velocity: "Fast", hint: "Geometric Native pattern. Cream + earth tones. Heavy.", bolo: "Pendleton trade blankets clearing $150+. Label = everything." },
  { id: 6, name: "Le Creuset 7.25qt Dutch oven", era: "Any", brand: "Le Creuset", condition: "Enamel intact", buy: 20, resell: 180, roi: "High", velocity: "Fast", hint: "Cast iron, enameled. Flame orange. Cracked lid? Skip.", bolo: "Flame is the OG colorway. 7.25qt = the size people pay for." },
  { id: 7, name: "Lodge Cast Iron #8 (pre-90s)", era: "Pre-1990", brand: "Lodge", condition: "Seasoned, no cracks", buy: 7, resell: 75, roi: "Mid", velocity: "Fast", hint: "Heat ring on bottom. Smooth interior. Pre-logo era.", bolo: "Heat ring = pre-'90. Smooth bottom = even older. Both = $75+." },
  { id: 8, name: "Vintage Nike swoosh tee (single-stitch)", era: "1980s–early 90s", brand: "Nike", condition: "Soft, no holes", buy: 3, resell: 65, roi: "High", velocity: "Fast", hint: "Single-stitch hem. Faded. Made in USA tag.", bolo: "Single-stitch sleeve + USA tag = pre-'95. $60-80 all day." },
  { id: 9, name: "Y2K Mudd cargo jeans", era: "1999–2003", brand: "Mudd", condition: "Low-rise, flare", buy: 4, resell: 55, roi: "High", velocity: "Fast", hint: "Low-rise. Flared. Stitched logo on back pocket.", bolo: "Y2K Mudd's been moving since the McBling revival. Size 5-9 hits hardest." },
  { id: 10, name: "Fleetwood Mac Rumours OG press", era: "1977", brand: "Warner Bros", condition: "VG+ vinyl, original sleeve", buy: 6, resell: 80, roi: "High", velocity: "Mid", hint: "BSK 3010 catalog. Textured sleeve. No barcode.", bolo: "First press = no barcode + textured sleeve. Check the deadwax." },
  { id: 11, name: "Coach leather bag (Made in USA)", era: "1980s–90s", brand: "Coach", condition: "Patina, no cracks", buy: 10, resell: 95, roi: "High", velocity: "Mid", hint: "Glove-tanned leather. Brass hardware. Creed inside.", bolo: "Creed inside = real. NYC creed = older = better. $90-110." },
  { id: 12, name: "Sp5der hoodie (authentic)", era: "2020s", brand: "Sp5der", condition: "Brand new", buy: 25, resell: 280, roi: "High", velocity: "Fast", hint: "Web graphic. Neon colorway. Real tag inside.", bolo: "Reps everywhere. Stitching density on the web = the tell." },
  { id: 13, name: "Hellstar tee", era: "2020s", brand: "Hellstar", condition: "New w/ tags", buy: 15, resell: 120, roi: "High", velocity: "Fast", hint: "Distressed graphic. Studio drop. Holographic tag.", bolo: "Studio drops > regular drops. Holographic tag = real." },
  { id: 14, name: "Polo Ralph Lauren Stadium 1992", era: "1992", brand: "Polo RL", condition: "Vintage, no holes", buy: 12, resell: 400, roi: "Unicorn", velocity: "Mid", hint: "P-Wing logo. Stadium graphic. Heavy cotton.", bolo: "Stadium '92 = grail. P-Wing alone = $200+. Real tag check first." },
];

// ============ FLIP LINES ============
const LINES = {
  intro: ["Aight whatchu got.", "Drop the numbers.", "Show me the tag.", "Clock's ticking."],
  wolf: ["Stone cold. Wolf shit.", "Ring saw it. You saw it. Print.", "Three for three. Respect."],
  solid: ["Two hit. Margin's there. Ship it.", "Close enough to count. Cook.", "Caught the meat. Move."],
  mid: ["One hit. Sharpen up.", "Caught one. Tag fooled you twice.", "Run it back tomorrow."],
  rip: ["Bro you cooked.", "Hard pass on this whole turn.", "Tag won. Today."],
  validation: { zero: "$0? Get serious.", huge: "Easy, Bezos.", nan: "That's not a number.", neg: "Negative? Now you owe THEM money.", roi: "Pick an ROI tier." }
};

const ROI_TIERS = ["Mid", "High", "Unicorn"];

// ============ UTILITIES ============
const getDailyIndex = () => {
  const epoch = new Date('2026-05-01').getTime();
  const days = Math.floor((Date.now() - epoch) / 86400000);
  return ((days % ITEMS.length) + ITEMS.length) % ITEMS.length;
};

const getPuzzleNumber = () => {
  const epoch = new Date('2026-05-01').getTime();
  return Math.floor((Date.now() - epoch) / 86400000) + 1;
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const checkBuy = (guess, real) => {
  const window = Math.max(3, real * 0.25);
  return Math.abs(guess - real) <= window;
};

const checkResell = (guess, real) => {
  const window = Math.max(15, real * 0.20);
  return Math.abs(guess - real) <= window;
};

// ============ SPEECH BUBBLE ============
const SpeechBubble = ({ text, visible }) => {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!visible || !text) { setDisplayed(''); return; }
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 28);
    return () => clearInterval(interval);
  }, [text, visible]);

  if (!visible || !text) return <div className="min-h-[60px]" />;

  const isTyping = displayed.length < (text?.length || 0);

  return (
    <div className="relative max-w-[220px]">
      <div
        className="px-3 py-2.5 border bg-black/85 text-[#5CE0B8] relative"
        style={{
          borderColor: '#5CE0B8',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 13,
          minHeight: 48,
          letterSpacing: '0.01em',
          lineHeight: 1.4,
        }}
      >
        {/* Inset 1px depth border (no box-shadow) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 1,
            border: '1px solid rgba(92, 224, 184, 0.4)',
            pointerEvents: 'none',
          }}
        />
        {displayed}
        {isTyping && (
          <span className="opacity-70 animate-pulse">▌</span>
        )}
        {/* Typing rhythm cue — pulses while typing, settles to a dot when done */}
        <span
          aria-hidden="true"
          className={isTyping ? 'animate-pulse' : ''}
          style={{
            position: 'absolute',
            right: 6,
            bottom: 4,
            color: '#5CE0B8',
            fontSize: 10,
            letterSpacing: '0.1em',
            opacity: isTyping ? 0.85 : 0.7,
          }}
        >
          {isTyping ? '...' : '•'}
        </span>
      </div>
      {/* Tail — Saturn-ring-arc fragment, mint stroke, no fill */}
      <svg
        className="absolute"
        style={{ left: -14, top: 12 }}
        width="16" height="18" viewBox="0 0 16 18"
        aria-hidden="true"
      >
        <path
          d="M 14 2 A 18 6 -23 0 0 0 9"
          fill="none"
          stroke="#5CE0B8"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
    </div>
  );
};

// ============ SATURN GLYPH ============
const SaturnGlyph = ({ size = 14, color = "#5CE0B8" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className="inline-block shrink-0">
    <circle cx="8" cy="8" r="3" fill="none" stroke={color} strokeWidth="1.2"/>
    <ellipse cx="8" cy="8" rx="7" ry="2" fill="none" stroke={color} strokeWidth="1" transform="rotate(-23 8 8)"/>
  </svg>
);

// ============ MAIN APP ============
export default function FlipOrSkip() {
  const [phase, setPhase] = useState('intro'); // intro | playing | reveal
  const [item] = useState(() => ITEMS[getDailyIndex()]);
  const puzzleNum = getPuzzleNumber();

  const [buyGuess, setBuyGuess] = useState('');
  const [resellGuess, setResellGuess] = useState('');
  const [roiGuess, setRoiGuess] = useState('');

  const [validationMsg, setValidationMsg] = useState('');
  const [introLine] = useState(() => pick(LINES.intro));
  const [bubbleText, setBubbleText] = useState('');
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [mood, setMood] = useState('smirk');

  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);
  const [boloCopied, setBoloCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // True when the reveal phase was restored from sessionStorage rather than
  // freshly played this session. Drives the "already locked in today" pill.
  const [restored, setRestored] = useState(false);

  // On mount: if this puzzle was already played in this tab session, restore
  // the result and skip straight to reveal. Stale entries (older puzzleNums)
  // are pruned. All sessionStorage access is try/catch'd because Safari
  // private-mode and some embedded browsers throw on access.
  useEffect(() => {
    let raw = null;
    const dayKey = `fos-day-${puzzleNum}`;
    try {
      // Prune stale day keys.
      const stale = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith('fos-day-') && k !== dayKey) stale.push(k);
      }
      stale.forEach((k) => {
        try { sessionStorage.removeItem(k); } catch (_) {}
      });
      raw = sessionStorage.getItem(dayKey);
    } catch (_) {
      return;
    }
    if (!raw) return;

    let saved;
    try {
      saved = JSON.parse(raw);
    } catch (_) {
      try { sessionStorage.removeItem(dayKey); } catch (_) {}
      return;
    }
    if (!saved || !saved.tier || !saved.guesses) return;

    setResults({
      tier: saved.tier,
      score: saved.score,
      buyHit: saved.buyHit,
      resellHit: saved.resellHit,
      roiHit: saved.roiHit,
      guesses: saved.guesses,
      closingLine: saved.closingLine,
    });
    const moodMap = { WOLF: 'hyped', SOLID: 'smirk', MID: 'sideEye', RIP: 'dead' };
    setMood(moodMap[saved.tier] || 'smirk');
    if (saved.closingLine) {
      setBubbleText(saved.closingLine);
      setBubbleVisible(true);
    }
    setRestored(true);
    setPhase('reveal');
  }, [puzzleNum]);

  useEffect(() => {
    if (phase === 'intro') {
      const t = setTimeout(() => {
        setBubbleText(introLine);
        setBubbleVisible(true);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [phase, introLine]);

  // Live countdown to next local midnight (only ticks while on reveal).
  useEffect(() => {
    if (phase !== 'reveal') return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, [phase]);

  const validate = () => {
    const b = parseFloat(buyGuess);
    const r = parseFloat(resellGuess);
    if (buyGuess === '' || resellGuess === '') return LINES.validation.nan;
    if (isNaN(b) || isNaN(r)) return LINES.validation.nan;
    if (b < 0 || r < 0) return LINES.validation.neg;
    if (b === 0 || r === 0) return LINES.validation.zero;
    if (b > 1000000 || r > 1000000) return LINES.validation.huge;
    if (!roiGuess) return LINES.validation.roi;
    return null;
  };

  const submit = () => {
    const err = validate();
    if (err) {
      setValidationMsg(err);
      setBubbleText(err);
      setBubbleVisible(true);
      setMood('sideEye');
      setTimeout(() => setMood('smirk'), 1800);
      return;
    }
    setValidationMsg('');

    const b = parseFloat(buyGuess);
    const r = parseFloat(resellGuess);
    const buyHit = checkBuy(b, item.buy);
    const resellHit = checkResell(r, item.resell);
    const roiHit = roiGuess === item.roi;
    const score = (buyHit ? 1 : 0) + (resellHit ? 1 : 0) + (roiHit ? 1 : 0);

    let tier, lineKey, newMood;
    if (score === 3) { tier = 'WOLF'; lineKey = 'wolf'; newMood = 'hyped'; }
    else if (score === 2) { tier = 'SOLID'; lineKey = 'solid'; newMood = 'smirk'; }
    else if (score === 1) { tier = 'MID'; lineKey = 'mid'; newMood = 'sideEye'; }
    else { tier = 'RIP'; lineKey = 'rip'; newMood = 'dead'; }

    const closingLine = pick(LINES[lineKey]);

    const guesses = { buy: b, resell: r, roi: roiGuess };

    setResults({
      tier, score, buyHit, resellHit, roiHit,
      guesses,
      closingLine,
    });
    setMood(newMood);
    setBubbleText(closingLine);
    setBubbleVisible(true);
    setPhase('reveal');

    // Persist for same-tab refresh recovery. Wrapped because Safari private
    // mode throws on sessionStorage access.
    try {
      const payload = {
        tier, score, buyHit, resellHit, roiHit,
        guesses,
        closingLine,
        timestamp: new Date().toISOString(),
      };
      sessionStorage.setItem(`fos-day-${puzzleNum}`, JSON.stringify(payload));
    } catch (_) {
      // No-op: persistence is best-effort.
    }
  };

  const startPlaying = () => {
    setBubbleVisible(false);
    setTimeout(() => setPhase('playing'), 200);
  };

  const buildGrid = () => {
    if (!results) return '';
    const tierEmoji = { WOLF: '🐺🐺🐺', SOLID: '💪💪', MID: '😬', RIP: '💀' };
    const cells = [
      results.buyHit ? '🟢' : '🔴',
      results.resellHit ? '🟢' : '🔴',
      results.roiHit ? '🟢' : '🔴',
    ].join(' ');
    return `FLIP OR SKIP #${puzzleNum} ${tierEmoji[results.tier]}\n${cells}\nloot.works/flip`;
  };

  const copyGrid = async () => {
    const text = buildGrid();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyBolo = async () => {
    const text = item.bolo;
    try {
      await navigator.clipboard.writeText(text);
      setBoloCopied(true);
      setTimeout(() => setBoloCopied(false), 2000);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(ta);
      setBoloCopied(true);
      setTimeout(() => setBoloCopied(false), 2000);
    }
  };

  // Tier-strip color matrix.
  const stripColor = (() => {
    if (!results) return 'transparent';
    if (results.tier === 'WOLF' || results.tier === 'SOLID') return '#5CE0B8';
    if (results.tier === 'MID') return '#3ba889';
    return '#7a2222';
  })();

  // Percentage delta formatter for numeric comparison rows.
  const fmtDelta = (guess, truth) => {
    if (!truth) return '';
    const d = Math.round(((guess - truth) / truth) * 100);
    if (d === 0) return '(0%)';
    return d > 0 ? `(+${d}%)` : `(${d}%)`;
  };

  // Live countdown to local midnight. Updates each minute via the interval above.
  const countdownLabel = (() => {
    const n = new Date(now);
    const midnight = new Date(n);
    midnight.setHours(24, 0, 0, 0);
    const ms = midnight.getTime() - n.getTime();
    if (ms <= 0) return 'new drop ready — refresh';
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `next drop in ${hours}h ${minutes}m`;
  })();

  return (
    <div className="min-h-screen text-white" style={{
      background: 'radial-gradient(ellipse at top, #0a1612 0%, #000000 60%)',
      fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
        @keyframes fos-pulse-mint {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 168, 137, 0.55); }
          50% { box-shadow: 0 0 0 10px rgba(59, 168, 137, 0); }
        }
        @keyframes fos-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fos-pulse { animation: fos-pulse-mint 2.4s infinite; }
        .fos-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        .fos-input::-webkit-outer-spin-button,
        .fos-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .fos-input { -moz-appearance: textfield; }
        .fos-fade { animation: fos-fade-in 0.4s ease-out; }
        .fos-container {
          padding-top: max(1.5rem, env(safe-area-inset-top));
          padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
        }
        @media (orientation: landscape) and (max-height: 500px) {
          .fos-container {
            padding-top: max(0.75rem, env(safe-area-inset-top));
            padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .fos-pulse,
          .fos-fade {
            animation: none !important;
          }
        }
      `}</style>

      <div className="fos-container max-w-md mx-auto px-5">

        {/* Header */}
        <header className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <SaturnGlyph size={18}/>
            <span className="font-semibold tracking-wide text-sm">FLIP OR SKIP</span>
          </div>
          <div className="fos-mono text-xs" style={{ color: '#5CE0B8' }}>#{puzzleNum}</div>
        </header>

        {/* Flip + Speech bubble */}
        <div className="flex items-start gap-2 mb-5" style={{ minHeight: 170 }}>
          <FlipCoyote mood={mood}/>
          <div className="flex-1 pt-7">
            <SpeechBubble text={bubbleText} visible={bubbleVisible}/>
          </div>
        </div>

        {/* INTRO */}
        {phase === 'intro' && (
          <div className="space-y-4 fos-fade">
            <div>
              <div
                className="fos-mono text-xs uppercase tracking-[0.2em]"
                style={{ color: '#5CE0B8' }}
              >
                Day {puzzleNum}.
              </div>
              <div
                aria-hidden="true"
                className="mt-2"
                style={{ height: 1, background: '#5CE0B8', opacity: 0.3 }}
              />
            </div>
            <div className="border p-4" style={{ borderColor: 'rgba(92, 224, 184, 0.4)' }}>
              <div className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: '#5CE0B8' }}>Today's Drop</div>
              <div className="text-xl font-semibold mb-1 leading-tight">{item.name}</div>
              <div className="fos-mono text-[11px] text-white/55 mb-3">{item.era} · {item.brand}</div>
              <div className="text-sm text-white/85 mb-3 leading-relaxed">{item.hint}</div>
              <div className="fos-mono text-[11px]" style={{ color: '#5CE0B8' }}>Condition: {item.condition}</div>
            </div>
            <button
              onClick={startPlaying}
              className="w-full py-4 font-semibold tracking-[0.15em] fos-pulse transition hover:opacity-90"
              style={{ background: '#5CE0B8', color: '#000', fontSize: 14 }}
            >
              CALL IT
            </button>
            <div className="text-center fos-mono text-[10px] text-white/40 pt-1">
              one drop daily. miss it, miss it.
            </div>
          </div>
        )}

        {/* PLAYING */}
        {phase === 'playing' && (
          <div className="space-y-4 fos-fade">
            <div className="border p-3" style={{ borderColor: 'rgba(92, 224, 184, 0.4)' }}>
              <div className="text-[10px] uppercase tracking-[0.2em] mb-1.5" style={{ color: '#5CE0B8' }}>Today's Drop</div>
              <div className="text-base font-semibold leading-tight mb-1">{item.name}</div>
              <div className="fos-mono text-[11px] text-white/55">{item.era} · {item.brand} · {item.condition}</div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] block mb-1.5" style={{ color: '#5CE0B8' }}>Buy Price</label>
              <div className="flex items-center border focus-within:border-[#5CE0B8] transition" style={{ borderColor: 'rgba(92, 224, 184, 0.4)' }}>
                <span className="fos-mono pl-3 text-base" style={{ color: '#5CE0B8' }}>$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={buyGuess}
                  onChange={(e) => setBuyGuess(e.target.value)}
                  placeholder="0"
                  className="bg-transparent w-full px-2 py-3 fos-mono text-lg outline-none fos-input text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] block mb-1.5" style={{ color: '#5CE0B8' }}>Resell Price</label>
              <div className="flex items-center border focus-within:border-[#5CE0B8] transition" style={{ borderColor: 'rgba(92, 224, 184, 0.4)' }}>
                <span className="fos-mono pl-3 text-base" style={{ color: '#5CE0B8' }}>$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={resellGuess}
                  onChange={(e) => setResellGuess(e.target.value)}
                  placeholder="0"
                  className="bg-transparent w-full px-2 py-3 fos-mono text-lg outline-none fos-input text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] block mb-1.5" style={{ color: '#5CE0B8' }}>ROI Tier</label>
              <div className="grid grid-cols-3 gap-2">
                {ROI_TIERS.map(t => {
                  const active = roiGuess === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setRoiGuess(t)}
                      className="py-3.5 text-xs font-semibold tracking-wide border transition"
                      style={{
                        background: active ? '#5CE0B8' : 'transparent',
                        color: active ? '#000' : '#5CE0B8',
                        borderColor: active ? '#5CE0B8' : 'rgba(92, 224, 184, 0.4)',
                        minHeight: 44,
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              <div className="fos-mono text-[10px] text-white/40 mt-1.5">
                Mid 5–15× · High 15–30× · Unicorn 30×+
              </div>
            </div>

            <button
              onClick={submit}
              className="w-full py-4 font-semibold tracking-[0.15em] hover:opacity-90 transition"
              style={{ background: '#5CE0B8', color: '#000', fontSize: 14 }}
            >
              LOCK IN
            </button>
          </div>
        )}

        {/* REVEAL */}
        {phase === 'reveal' && results && (
          <div className="space-y-4 fos-fade">

            {/* Verdict Card */}
            <div
              className="border-2 relative"
              style={{
                borderColor: '#5CE0B8',
                background: 'linear-gradient(180deg, #000 0%, #0a1a14 100%)',
              }}
            >
              {/* Restored-from-session pill (only when this day's result was
                  already played and restored on mount). */}
              {restored && (
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: 12,
                    zIndex: 3,
                  }}
                >
                  <span
                    className="fos-mono text-[10px] uppercase tracking-[0.15em]"
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      background: '#0a0a0a',
                      border: '1px solid #5CE0B8',
                      color: '#5CE0B8',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    already locked in today
                  </span>
                </div>
              )}

              {/* Tier strip — full width, color signals tier */}
              <div style={{ height: 8, background: stripColor }} aria-hidden="true" />

              {/* Tier chip — overlaps strip at top-right */}
              <div
                style={{
                  position: 'absolute',
                  top: -2,
                  right: 12,
                  padding: '4px 10px',
                  background: '#0a0a0a',
                  border: '1px solid #5CE0B8',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: '#5CE0B8',
                  zIndex: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                {results.tier === 'WOLF' && '🐺 WOLF'}
                {results.tier === 'SOLID' && '💪 SOLID'}
                {results.tier === 'MID' && '😬 MID'}
                {results.tier === 'RIP' && '💀 RIP'}
                <span className="fos-mono ml-1.5 opacity-70">{results.score}/3</span>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between mb-4 mt-1">
                  <div className="flex items-center gap-2">
                    <SaturnGlyph size={16}/>
                    <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: '#5CE0B8' }}>Verdict</span>
                  </div>
                  <span className="fos-mono text-[10px] text-white/45">#{puzzleNum}</span>
                </div>

                <div className="text-lg font-semibold mb-1 leading-tight">{item.name}</div>
                <div className="fos-mono text-[10px] text-white/45 mb-5">{item.era} · {item.brand}</div>

                {/* Comparison rows */}
                <div className="space-y-2 fos-mono text-xs">
                  <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-2 gap-y-0 items-center border-b border-white/10 pb-2">
                    <div className="text-white/45 text-[10px] uppercase tracking-wider">Buy</div>
                    <div className="text-right">${results.guesses.buy}</div>
                    <div className="text-right" style={{ color: results.buyHit ? '#5CE0B8' : '#ff6b6b' }}>
                      {results.buyHit ? '✓' : '✗'} ${item.buy}
                    </div>
                    <div className="fos-mono text-[10px] text-white/40 text-right">
                      {fmtDelta(results.guesses.buy, item.buy)}
                    </div>
                  </div>
                  <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-2 gap-y-0 items-center border-b border-white/10 pb-2">
                    <div className="text-white/45 text-[10px] uppercase tracking-wider">Resell</div>
                    <div className="text-right">${results.guesses.resell}</div>
                    <div className="text-right" style={{ color: results.resellHit ? '#5CE0B8' : '#ff6b6b' }}>
                      {results.resellHit ? '✓' : '✗'} ${item.resell}
                    </div>
                    <div className="fos-mono text-[10px] text-white/40 text-right">
                      {fmtDelta(results.guesses.resell, item.resell)}
                    </div>
                  </div>
                  <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
                    <div className="text-white/45 text-[10px] uppercase tracking-wider">ROI</div>
                    <div className="text-right">{results.guesses.roi}</div>
                    <div className="text-right" style={{ color: results.roiHit ? '#5CE0B8' : '#ff6b6b' }}>
                      {results.roiHit ? '✓' : '✗'} {item.roi}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="fos-mono text-[9px] text-white/40">loot.works/flip</span>
                  <span className="fos-mono text-[9px] text-white/40">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* BOLO Card — separate, click-to-copy */}
            <div
              role="button"
              tabIndex={0}
              onClick={copyBolo}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  copyBolo();
                }
              }}
              className="border p-4 cursor-pointer transition hover:border-[#5CE0B8] focus:outline-none focus:border-[#5CE0B8]"
              style={{ borderColor: 'rgba(92, 224, 184, 0.4)' }}
              aria-label="Copy Flip's BOLO tip"
            >
              <div className="flex items-center gap-2 mb-2">
                <SaturnGlyph size={14}/>
                <span className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: '#5CE0B8' }}>
                  Flip's BOLO
                </span>
              </div>
              <div className="fos-mono text-sm text-white/85 leading-relaxed mb-3">{item.bolo}</div>
              <div className="fos-mono text-[10px] text-white/40 text-center">
                {boloCopied ? 'COPIED ✓' : 'tap to copy tip'}
              </div>
            </div>

            {/* Share grid */}
            <div className="border p-4" style={{ borderColor: 'rgba(92, 224, 184, 0.4)' }}>
              <div className="text-[10px] uppercase tracking-[0.2em] mb-2.5" style={{ color: '#5CE0B8' }}>Share Your Score</div>
              <pre className="fos-mono text-[13px] text-white/90 mb-3 whitespace-pre-wrap leading-relaxed">{buildGrid()}</pre>
              <button
                onClick={copyGrid}
                className="w-full py-4 font-semibold tracking-[0.15em] hover:opacity-90 transition text-xs"
                style={{ background: '#5CE0B8', color: '#000', minHeight: 44 }}
              >
                {copied ? 'COPIED ✓' : 'COPY GRID'}
              </button>
              <div className="fos-mono text-[10px] text-white/40 text-center mt-2">
                paste anywhere — twitter, discord, sms
              </div>
            </div>

            {/* CTA */}
            <div className="border p-4" style={{
              borderColor: 'rgba(92, 224, 184, 0.4)',
              background: 'rgba(92, 224, 184, 0.05)'
            }}>
              <div className="text-base mb-1.5 font-semibold leading-tight">you played the game. now play for real.</div>
              <div className="text-sm mb-1.5 font-semibold">Real app scans live items.</div>
              <div className="fos-mono text-[11px] text-white/65 mb-3 leading-relaxed">Flip in your pocket. Verdict in 2 seconds.</div>
              <a
                href="https://loot.works"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-4 border font-semibold tracking-[0.15em] transition text-xs hover:opacity-90"
                style={{ borderColor: '#5CE0B8', color: '#5CE0B8', minHeight: 44 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#5CE0B8'; e.currentTarget.style.color = '#000'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5CE0B8'; }}
              >
                LOOT.WORKS →
              </a>
            </div>

            {/* Live countdown to next drop */}
            <div className="text-center fos-mono text-[10px] text-white/40 pt-1">
              {countdownLabel}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
