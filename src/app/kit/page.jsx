"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import KitToc from "@/components/kit/KitToc";
import LadderVisualization from "@/components/kit/LadderVisualization";
import OpenProgram from "@/components/kit/OpenProgram";
import LadderTiers from "@/components/kit/LadderTiers";
import Founding20 from "@/components/kit/Founding20";
import WhatsNew from "@/components/kit/WhatsNew";
import ConsolidatedFaq from "@/components/kit/ConsolidatedFaq";
import Gamification from "@/components/kit/Gamification";

/**
 * /kit — unified hub for non-customer audiences (affiliates, creators,
 * press, designers seeking brand assets).
 *
 * Section order (2026-05-22 unified-hub refactor):
 *   01 HERO + Ladder Visualization (gamified centerpiece)
 *   02 The Pitch — 1-sentence / Twitter / Paragraph
 *   03 Open Program — Standard 40% sign-up
 *   04 The Ladder — Standard → Gold → Founding 20 deep cards
 *   05 Founding 20 — full /partners content port
 *   06 Post Kit — TikTok / Twitter / IG / Email / Blog swipe copy
 *   07 Brand Assets — logos, mascot, colors, type, screenshots
 *   08 Usage Rules — You Can / You Can't
 *   09 Press — table, bio, recent coverage, full PDF
 *   10 What's New — recent launches timeline
 *   11 FAQ — consolidated
 *   12 Footer
 *
 * Gamification widgets (CopiesCounter, StickyLeaderboard, MascotChip,
 * AchievementToasts, ProgressBar, StreakElement) live globally in
 * <Gamification /> at the bottom — they're dismissible and respect
 * prefers-reduced-motion / mobile.
 *
 * .jsx only — Turbopack 404s on heavy-JSX .tsx (this file was 2100 lines
 * of .tsx before; converted to .jsx for safety per the repo footgun rule).
 */

const PITCH_1S =
  "Loot is a thrift-store sidekick: scan any item, see what it's worth, flip or skip in 2 seconds.";
const PITCH_TW =
  "🪐 loot.works — scan any thrift find, get the comp, ROI, and a verdict in 2 seconds. AI vision + barcode + flip coach. $14.99/mo. Built by flippers, for flippers.";
const PITCH_PARA =
  "Loot turns every thrift store, yard sale, and estate sale into a sourcing engine. Point your phone at any item — barcode, tag, or no tag — and Loot tells you the live resale comps, your ROI, the right platform to list on, and whether to flip or skip. Built on Claude AI vision, designed for serious resellers, priced for everyone. No app store. No download. Just loot.works.";

const SCRIPT_1 = `HOOK (0-2s): "I paid $X at Goodwill. Watch what it sold for."
BUILD (2-8s): [show item rotating on table, text overlay: "almost passed on this"]
PROOF (8-18s): [show eBay sold listings screenshot]
REVEAL (18-25s): [big number animation $X → $Y]
CTA (25-30s): "Scanner that called this is at loot.works"`;

const SCRIPT_2 = `HOOK (0-2s): "🚨 If you see this at the thrift store, RUN to checkout."
BUILD (2-8s): [show item on shelf, text overlay: "this brand sells for 10×"]
PROOF (8-18s): [show Loot scan with ROI + sold comps]
REVEAL (18-25s): [show profit number, text: "from a $3 thrift find"]
CTA (25-30s): "Loot told me to grab it. loot.works 🪐"`;

const SCRIPT_3 = `HOOK (0-2s): "One of these is real. One is a $300 mistake."
BUILD (2-8s): [two items side by side, zoom on stitching/labels]
PROOF (8-15s): [Loot scan comparison, highlight authentication signals]
REVEAL (15-25s): [dramatic reveal — which is real, show resale value]
CTA (25-30s): "Loot caught it in 2 seconds. loot.works"`;

const SCRIPT_4 = `HOOK (0-3s): "ranking thrift store brands from 'sprint to checkout' to 'leave it on the shelf' — agree or fight me"
BUILD (3-12s): [show S/A/B/C/D tier list graphic, drag brand logos one by one]
  S TIER: Polo RL Stadium · Le Creuset · Big E Levi's
  A TIER: Carhartt · Pendleton · Pyrex Butterprint
  B TIER: Lodge · Coach USA · 90s Nike single-stitch
  C TIER: Mass-produced ceramic figurines · Y2K Mudd (unless flared)
  D TIER: anything with "vintage style" on the tag
PAYOFF (12-22s): [show Loot scanning an S-tier item, verdict reveal: $4 → $400 Polo Stadium]
CTA (22-30s): "scanner that called this is at loot.works — link in bio"`;

const SCRIPT_5 = `HOOK (0-2s): "duet me if you can guess what this sold for"
BUILD (2-8s): [show item rotating on table — Coleman 200A lantern in red enamel]
  Text overlay: "i paid $6 at an estate sale"
PROOF (8-14s): [show 3 ebay sold comps stacking on screen, prices blurred]
REVEAL (14-22s): [unblur the comps, biggest sold price animates: $90]
  Voice: "comments below — what would YOU have priced it at?"
CTA (22-30s): "scanner that knew before i did: loot.works"`;

const SCRIPT_6 = `HOOK (0-3s): [text on dark background, large white]
  "i almost walked past this at goodwill"
BUILD (3-10s): [ASMR-style close-ups — Pyrex Butterprint 403 bowl from multiple angles]
  Text overlay (one line at a time, paced):
  "turquoise farm scene pattern"
  "cinderella handles"
  "no chips. tagged $3.99"
PROOF (10-18s): [show Loot app scan in progress, then the verdict screen]
  Text: "loot said BUY → $85 average sold"
REVEAL (18-25s): [show ebay listing live, then "SOLD" stamp animation]
  Text: "sold in 4 days. $87 + shipping."
CTA (25-30s): [Loot wordmark + URL]
  Text: "scanner that found it: loot.works"`;

const SCRIPT_7 = `HOOK (0-3s): "POV: you're at the bins and you find this for $1"
  [show the item in hand — 90s Nike single-stitch tee]
BUILD (3-10s): [first-person camera angle, inspecting the tag, the stitching]
  Voice (calm, deliberate): "single-stitch sleeve. made in usa tag. faded just right."
PROOF (10-18s): [pull out phone, scan with Loot, show verdict]
  Voice: "loot says $65 average. let's see."
REVEAL (18-26s): [time-cut to laptop, ebay listing, then sold notification animation]
  Voice: "sold for $72. paid for the whole haul."
CTA (26-30s): "scanner that called it: loot.works — link in bio"`;

// Twitter / X templates — single-tweet swipe copy. Each ≤ 280 chars.
const TWEET_1 = `Most people lose money at the thrift store because they guess.

The ones making real money? They scan.

Loot reads any tag — barcode, label, or blank — and tells you the comp + ROI in 2 seconds.

$14.99/mo. No app. → loot.works [YOUR_LINK]`;

const TWEET_2 = `Quietly one of the best tools I've used for reselling this year.

Point phone → comp → ROI → flip/skip verdict.

No app store, runs on web. Built on Claude AI.

→ loot.works [YOUR_LINK]`;

const TWEET_3 = `If you thrift, this is a no-brainer at $14.99/mo:

→ AI scans any item (even no barcode)
→ Live eBay sold comps
→ Flip-or-skip verdict
→ Yard sale map
→ Deal feed

loot.works [YOUR_LINK]`;

const TWEET_4 = `I almost walked past a $3 Pyrex bowl.

Loot scanned it. $85 average sold.

It paid for the whole month of subscription with one find.

→ loot.works [YOUR_LINK]`;

const TWEET_5 = `Reseller stack 2026:

- listing tool
- sourcing tool (Loot)
- shipping tool

Loot is the missing piece. Scan, comp, verdict — pre-purchase.

loot.works [YOUR_LINK]`;

const TWEET_6 = `Free tip for anyone reselling part-time:

Stop opening 5 tabs to comp an item.

loot.works does it in one scan. Barcode or no barcode. 2 seconds.

$14.99/mo, no contract.

[YOUR_LINK]`;

const IG_REEL =
  "Loot called this flip in 2 seconds. The bin scan is undefeated. → loot.works 🪐 [YOUR_LINK] #thriftflip #resellercommunity #vintagefinds";

const IG_STORY = "i let an AI pick my flips for a week. results inside 👀";

const IG_LISTICLE =
  "5 brands Loot has called flips on this month: Pyrex Butterprint · Polo Stadium · Le Creuset · 90s Nike · Big E Levi's. Scanner that found them: loot.works 🪐 [YOUR_LINK]";

const IG_STORY_SEQ = `STORY 1: "this is the bin run i wasn't supposed to make" [show empty Goodwill bin pic]
STORY 2: [show item in hand] "found this. tagged $1.99."
STORY 3: [show Loot scan in progress] "let me scan it real quick..."
STORY 4: [show verdict screen] "BUY · $65 avg sold"
STORY 5: [poll sticker] "would you have grabbed it? YES / I AM SO MAD I DIDN'T"
STORY 6: [link sticker → loot.works] "scanner: [YOUR_LINK]"`;

const EMAIL_SUBJ = `1. "The $15/mo tool serious resellers won't shut up about"
2. "We built an AI that scans thrift finds in 2 seconds"
3. "Stop guessing. Start scanning. Meet Loot."`;

const EMAIL_BODY = `Hey [FIRST NAME],

Every thrift run is a gamble. You pick up an item, Google it for five minutes, check three different apps, and still aren't sure if it's worth the $4.

That's the problem Loot solves.

Point your phone at anything — barcode, label, or blank tag — and Loot returns live resale comps, your projected ROI, the best platform to list on, and a flip-or-skip verdict. All in about two seconds.

It's built on Claude AI vision, designed for full-time resellers and weekend pickers alike. No app download required — it runs at loot.works on any phone.

What makes it different:
• Works on items with NO barcode (AI vision handles it)
• Shows actual sold comps, not asking prices
• Gives you a clear verdict: flip it or skip it
• Includes a deal feed, yard sale map, and flip-or-skip game

$14.99/month or $99.99/year. No contracts, cancel anytime.

If you cover reselling, thrifting, or side hustles — your audience will thank you for this one.

→ TRY LOOT FREE AT LOOT.WORKS [YOUR_LINK]`;

const EMAIL_BODY_LONG = `Hey [FIRST NAME],

Quick story before the pitch.

A few months ago I was at a Goodwill, holding a Pyrex Butterprint bowl tagged $3.99. I almost put it back. Then I scanned it with Loot — and saw it had been selling for $85+ on eBay all month. Bought it. Sold it in 4 days for $87.

That kind of thing happens every thrift run if you have the right scanner.

Loot is a web app (no app store, runs on any phone at loot.works) that:
1. Reads any item — barcode, label, or blank-tag (AI vision)
2. Pulls live eBay sold comps
3. Calculates projected ROI
4. Gives a clear verdict: flip or skip

Plus a deal feed (eBay listings about to under-sell), a yard sale map (Pro), and a daily flip-or-skip game.

Built on Claude AI vision. $14.99/mo or $99.99/yr. Cancel anytime.

If you've ever stood at a thrift store wondering if a $4 item was worth it — this is the tool.

→ TRY IT AT LOOT.WORKS [YOUR_LINK]

— [YOUR NAME]`;

const BLOG_REVIEW = `Title: I tested Loot for a month at the thrift store — here's what 30 days of AI-scanned finds look like

Intro hook: At the thrift store, the difference between a $4 mistake and a $400 flip is information. For 30 days I tested loot.works — a new AI-powered scanner that reads any item (barcode or no barcode) and returns live resale comps in about two seconds. Here's what I learned.

H2: What is Loot?
[2-3 paragraphs on the product. Mention $14.99/mo, no app store, web-based]

H2: 30 days of scans — the numbers
[Table or bullet list: total scans, BUY verdicts, SKIP verdicts, actual flip outcomes, total profit]

H2: The wins
[2-3 specific finds with before/after photos and sold prices]

H2: The misses
[Be honest about cases where Loot's verdict was off or you ignored it. Builds trust.]

H2: Who should use it
[Bullet list: high-volume thrifters, weekend pickers, anyone tired of opening 5 tabs to comp]

H2: Pricing & verdict
[14.99/mo. 99.99/yr. Founder offer if applicable. Your honest take.]

CTA: Try Loot at loot.works [YOUR_LINK]`;

const BLOG_COMPARISON = `Title: Loot vs Sourcing Notebook vs Flip Finder — which thrift scanner actually works?

Intro: Three tools claim to help resellers source smarter at thrift stores. I tested all three for a month at Goodwills and estate sales. Here's the side-by-side.

H2: The 3 tools
[Brief intro to each, including pricing and what platform they run on]

H2: Test methodology
[How you tested — same items, same locations, same week]

H2: Round 1 — Barcoded items
[Which tool returned the best comps and verdict, by example]

H2: Round 2 — No-barcode items (where AI vision matters)
[This is where Loot tends to shine — be specific about which items each tool handled]

H2: Round 3 — Verdict speed
[Time-to-answer comparison]

H2: Final scores
[Table with rows: accuracy, speed, no-barcode handling, value]

H2: Who should pick which
[Recommendation paragraph]

CTA: Loot is my pick for sourcing. Try it at loot.works [YOUR_LINK]`;

const BLOG_LISTICLE = `Title: 7 brands Loot has flagged as "BUY" at the thrift store this month

Intro: Some brands always sell. Some used to and don't anymore. Some are quietly making a comeback. Loot.works (the AI thrift scanner I've been using) flagged these 7 brands as BUY at thrift prices over the last 30 days. Worth a scan if you see them.

1. Pyrex Butterprint — turquoise farm-scene pattern, especially 403 cinderella bowls
2. Polo Ralph Lauren Stadium — 1992-1993, even faded
3. Le Creuset — any color, even with chips
4. Carhartt — vintage chore coats, especially Detroit Jacket
5. 90s Nike single-stitch tees — made in USA tag = ✅
6. Pendleton wool — board shirts, blankets
7. Big E Levi's — small "E" on red tab = pre-1971

H2: Why these brands keep selling
[Brief market dynamics: nostalgia, scarcity, fashion cycles]

H2: How to spot fakes
[Quick auth tips for top 2-3 brands]

CTA: Scanner that called these: loot.works [YOUR_LINK]`;

const SHOTS = [
  { src: "/brand-kit/shots/scan.png", alt: "Scan screen", label: "SCAN" },
  { src: "/brand-kit/shots/verdict-flip.png", alt: "Verdict — Flip screen", label: "VERDICT — FLIP" },
  { src: "/brand-kit/shots/verdict-skip.png", alt: "Verdict — Skip screen", label: "VERDICT — SKIP" },
  { src: "/brand-kit/shots/deal-feed.png", alt: "Deal Feed screen", label: "DEAL FEED" },
  { src: "/brand-kit/shots/map.png", alt: "Yard Sale Map screen", label: "YARD SALE MAP" },
  { src: "/brand-kit/shots/flip-or-skip-game.png", alt: "Flip or Skip Game screen", label: "FLIP OR SKIP GAME" },
];

const SWATCHES = [
  { hex: "#0A0A0A", role: "PAGE", bg: "#0A0A0A", text: "#fff" },
  { hex: "#5CE0B8", role: "ACCENT", bg: "#5CE0B8", text: "#0a0a0a" },
  { hex: "#F5C518", role: "GOLD", bg: "#F5C518", text: "#0a0a0a" },
  { hex: "#7B8FFF", role: "PRESS", bg: "#7B8FFF", text: "#0a0a0a" },
  { hex: "#FF6B6B", role: "SKIP", bg: "#FF6B6B", text: "#0a0a0a" },
];

const DOS = [
  "Use logos in videos, posts, articles",
  "Use the Flip mascot in commentary content",
  "Quote anything on this page verbatim",
  "Link to loot.works without asking",
  "Make jokes about Saturn",
  "Repost our content with credit",
];

const DONTS = [
  "Recolor the logos",
  "Stretch or distort the wordmark",
  "Use Flip in adult, violent, or hateful content",
  "Claim Loot endorses you (unless you're a signed affiliate)",
  "Crop the CoinMark out of the wordmark",
  "Reupload as your own",
];

function AccordionItem({ id, title, open, onToggle, children }) {
  return (
    <div className={`acc-item${open ? " open" : ""}`}>
      <button
        className="acc-trigger"
        aria-expanded={open}
        aria-controls={`acc-${id}-body`}
        onClick={onToggle}
      >
        {title} <span className="acc-arrow">▾</span>
      </button>
      <div className="acc-body" id={`acc-${id}-body`}>
        <div className="acc-body-inner">{children}</div>
      </div>
    </div>
  );
}

export default function KitPage() {
  const [activeTab, setActiveTab] = useState("1s");
  const [copiedKey, setCopiedKey] = useState(null);
  const [openAccs, setOpenAccs] = useState(() => new Set(["tiktok"]));
  const ariaLiveRef = useRef(null);

  const copy = useCallback(async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* best-effort */
      }
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    if (ariaLiveRef.current) ariaLiveRef.current.textContent = "Copied to clipboard";
    // Fire gamification counter event — Gamification.tsx listens for this.
    window.dispatchEvent(new CustomEvent("loot-kit-copy"));
    window.setTimeout(() => {
      setCopiedKey((k) => (k === key ? null : k));
      if (ariaLiveRef.current) ariaLiveRef.current.textContent = "";
    }, 1600);
  }, []);

  const toggleAcc = useCallback((id) => {
    setOpenAccs((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* Scroll-reveal via IntersectionObserver */
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      document.querySelectorAll(".kit-page .reveal").forEach((el) => el.classList.add("visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    document.querySelectorAll(".kit-page .reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function handleAnchorScroll(e) {
    const href = e.currentTarget.getAttribute("href");
    if (!href || !href.startsWith("#")) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top, behavior: "smooth" });
  }

  const copyLabel = (key) => (copiedKey === key ? "COPIED ✓" : "COPY");
  const copyClass = (key) => `btn-copy${copiedKey === key ? " copied" : ""}`;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Outfit:wght@300;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      <div className="kit-page">
        <KitToc />
        <div id="aria-live" className="sr-only" aria-live="polite" ref={ariaLiveRef} />

        {/* SVG SYMBOLS */}
        <svg xmlns="http://www.w3.org/2000/svg" style={{ display: "none" }} aria-hidden>
          <symbol id="sym-coinmark" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
            <ellipse cx="16" cy="16" rx="15" ry="4.5" stroke="currentColor" strokeWidth="1.5" transform="rotate(-30 16 16)" />
          </symbol>
        </svg>

        {/* NAV */}
        <nav className="kit-nav" role="navigation" aria-label="Kit navigation">
          <div className="nav-left">
            <svg className="coinmark" width="22" height="22">
              <use href="#sym-coinmark" />
            </svg>
            <span className="wordmark">LOOT</span>
          </div>
          <span className="nav-center">/ KIT</span>
          <div className="nav-right">
            <a href="/">BACK TO LOOT.WORKS →</a>
          </div>
        </nav>

        {/* ═══ 01 — HERO + LADDER VISUALIZATION ═══ */}
        <section className="hero hero--unified" id="sec-hero">
          <div className="kit-wrap">
            <div className="hero-grid">
              <div className="hero-text reveal">
                <p className="hero-eyebrow">AFFILIATE HUB · BRAND KIT · PRESS</p>
                <h1>
                  EVERY THRIFT STORE IS YOUR{" "}
                  <span className="hero-mint">STOREFRONT.</span>
                </h1>
                <p className="hero-sub">
                  Promote loot.works. Climb the tier ladder. Earn 40% → 50%
                  → 60% recurring. Free brand assets + swipe copy below.
                </p>
                <p className="hero-stats">
                  ✓ 40% RECURRING · ✓ 60-DAY COOKIE · ✓ WEEKLY PAYOUT
                </p>
                <a
                  href="#sec-open"
                  className="hero-cta"
                  onClick={handleAnchorScroll}
                >
                  START EARNING (60 SEC) →
                </a>
                <div className="hero-tertiary">
                  <a href="#sec-logos" onClick={handleAnchorScroll}>
                    I want brand assets only →
                  </a>
                  <a href="#sec-press" onClick={handleAnchorScroll}>
                    I&apos;m with the press →
                  </a>
                  <a href="#founding-20" onClick={handleAnchorScroll}>
                    Tell me about Founding 20 →
                  </a>
                </div>
              </div>
              <div className="hero-ladder reveal">
                <LadderVisualization />
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 02 — THE PITCH ═══ */}
        <section id="sec-pitch">
          <div className="kit-wrap reveal">
            <div className="sec-header">
              <h2>The Pitch</h2>
              <span className="sec-num">02 / 12</span>
            </div>
            <div className="tab-container">
              <div className="tab-row" role="tablist">
                <button
                  className={`tab-btn${activeTab === "1s" ? " active" : ""}`}
                  role="tab"
                  aria-selected={activeTab === "1s"}
                  onClick={() => setActiveTab("1s")}
                >
                  1 SENTENCE
                </button>
                <button
                  className={`tab-btn${activeTab === "tw" ? " active" : ""}`}
                  role="tab"
                  aria-selected={activeTab === "tw"}
                  onClick={() => setActiveTab("tw")}
                >
                  TWITTER
                </button>
                <button
                  className={`tab-btn${activeTab === "para" ? " active" : ""}`}
                  role="tab"
                  aria-selected={activeTab === "para"}
                  onClick={() => setActiveTab("para")}
                >
                  PARAGRAPH
                </button>
              </div>
              <div className="dark-card dark-card--mint">
                <div className={`tab-panel${activeTab === "1s" ? " active" : ""}`}>
                  <div className="tab-content">
                    <button className={copyClass("pitch-1s")} onClick={() => copy("pitch-1s", PITCH_1S)}>
                      {copyLabel("pitch-1s")}
                    </button>
                    <p className="tab-text lg">{PITCH_1S}</p>
                  </div>
                </div>
                <div className={`tab-panel${activeTab === "tw" ? " active" : ""}`}>
                  <div className="tab-content">
                    <button className={copyClass("pitch-tw")} onClick={() => copy("pitch-tw", PITCH_TW)}>
                      {copyLabel("pitch-tw")}
                    </button>
                    <p className="tab-text">{PITCH_TW}</p>
                  </div>
                </div>
                <div className={`tab-panel${activeTab === "para" ? " active" : ""}`}>
                  <div className="tab-content">
                    <button className={copyClass("pitch-para")} onClick={() => copy("pitch-para", PITCH_PARA)}>
                      {copyLabel("pitch-para")}
                    </button>
                    <p className="tab-text">{PITCH_PARA}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="kit-divider" />

        {/* ═══ 03 — OPEN PROGRAM (Standard 40%) ═══ */}
        <OpenProgram />

        <hr className="kit-divider" />

        {/* ═══ 04 — THE LADDER (3 tier deep cards) ═══ */}
        <LadderTiers />

        <hr className="kit-divider" />

        {/* ═══ 05 — FOUNDING 20 (full /partners port) ═══ */}
        <Founding20 />

        <hr className="kit-divider" />

        {/* ═══ 06 — POST KIT ═══ */}
        <section id="sec-post">
          <div className="kit-wrap reveal">
            <div className="sec-header">
              <h2>Post Kit</h2>
              <span className="sec-num">06 / 12</span>
            </div>
            <p className="sec-sub">
              Templates. Tap COPY. Replace [YOUR_LINK] with your Digistore
              affiliate link.
            </p>
            <div className="accordion">
              <AccordionItem
                id="tiktok"
                title="TikTok Scripts (7)"
                open={openAccs.has("tiktok")}
                onToggle={() => toggleAcc("tiktok")}
              >
                <p className="acc-sub">7 faceless scripts. 15-30s. Plug in your item, hit record.</p>
                {[
                  { key: "s1-beats", title: "SCRIPT 01 — $X → $Y REVEAL", body: SCRIPT_1 },
                  { key: "s2-beats", title: "SCRIPT 02 — BOLO ALERT", body: SCRIPT_2 },
                  { key: "s3-beats", title: "SCRIPT 03 — REAL VS FAKE", body: SCRIPT_3 },
                  { key: "s4-beats", title: "SCRIPT 04 — TIER LIST RANKING", body: SCRIPT_4 },
                  { key: "s5-beats", title: "SCRIPT 05 — DUET BAIT", body: SCRIPT_5 },
                  { key: "s6-beats", title: "SCRIPT 06 — STORY TIME (faceless)", body: SCRIPT_6 },
                  { key: "s7-beats", title: "SCRIPT 07 — POV NARRATIVE", body: SCRIPT_7 },
                ].map((s) => (
                  <div key={s.key} className="script-card">
                    <h4>{s.title}</h4>
                    <div className="code-block">
                      <button className={copyClass(s.key)} onClick={() => copy(s.key, s.body)}>
                        {copyLabel(s.key)}
                      </button>
                      <span>{s.body}</span>
                    </div>
                  </div>
                ))}
              </AccordionItem>

              <AccordionItem
                id="twitter"
                title="Twitter / X (6 tweets)"
                open={openAccs.has("twitter")}
                onToggle={() => toggleAcc("twitter")}
              >
                <p className="acc-sub">Single-tweet templates. ≤ 280 chars each.</p>
                {[TWEET_1, TWEET_2, TWEET_3, TWEET_4, TWEET_5, TWEET_6].map((t, i) => (
                  <div key={i} className="script-card">
                    <h4>TWEET 0{i + 1}</h4>
                    <div className="code-block">
                      <button className={copyClass(`tw-${i}`)} onClick={() => copy(`tw-${i}`, t)}>
                        {copyLabel(`tw-${i}`)}
                      </button>
                      <span>{t}</span>
                    </div>
                  </div>
                ))}
              </AccordionItem>

              <AccordionItem
                id="instagram"
                title="Instagram (4)"
                open={openAccs.has("instagram")}
                onToggle={() => toggleAcc("instagram")}
              >
                <div className="script-card">
                  <h4>REEL CAPTION</h4>
                  <div className="code-block">
                    <button className={copyClass("ig-reel")} onClick={() => copy("ig-reel", IG_REEL)}>
                      {copyLabel("ig-reel")}
                    </button>
                    <span>{IG_REEL}</span>
                  </div>
                </div>
                <div className="script-card">
                  <h4>STORY STICKER TEXT</h4>
                  <div className="code-block">
                    <button className={copyClass("ig-story")} onClick={() => copy("ig-story", IG_STORY)}>
                      {copyLabel("ig-story")}
                    </button>
                    <span>{IG_STORY}</span>
                  </div>
                </div>
                <div className="script-card">
                  <h4>LISTICLE CAPTION</h4>
                  <div className="code-block">
                    <button className={copyClass("ig-listicle")} onClick={() => copy("ig-listicle", IG_LISTICLE)}>
                      {copyLabel("ig-listicle")}
                    </button>
                    <span>{IG_LISTICLE}</span>
                  </div>
                </div>
                <div className="script-card">
                  <h4>STORY SEQUENCE (6 frames)</h4>
                  <div className="code-block">
                    <button className={copyClass("ig-seq")} onClick={() => copy("ig-seq", IG_STORY_SEQ)}>
                      {copyLabel("ig-seq")}
                    </button>
                    <span>{IG_STORY_SEQ}</span>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem
                id="email"
                title="Email / Newsletter (3)"
                open={openAccs.has("email")}
                onToggle={() => toggleAcc("email")}
              >
                <div className="script-card">
                  <h4>SUBJECT LINES (pick one)</h4>
                  <div className="code-block">
                    <button className={copyClass("email-subj")} onClick={() => copy("email-subj", EMAIL_SUBJ)}>
                      {copyLabel("email-subj")}
                    </button>
                    <span>{EMAIL_SUBJ}</span>
                  </div>
                </div>
                <div className="script-card">
                  <h4>SHORT BODY (~200 WORDS)</h4>
                  <div className="code-block" style={{ fontSize: 11, lineHeight: 1.65 }}>
                    <button className={copyClass("email-body")} onClick={() => copy("email-body", EMAIL_BODY)}>
                      {copyLabel("email-body")}
                    </button>
                    <span>{EMAIL_BODY}</span>
                  </div>
                </div>
                <div className="script-card">
                  <h4>LONG STORY-DRIVEN BODY (~350 WORDS)</h4>
                  <div className="code-block" style={{ fontSize: 11, lineHeight: 1.65 }}>
                    <button className={copyClass("email-long")} onClick={() => copy("email-long", EMAIL_BODY_LONG)}>
                      {copyLabel("email-long")}
                    </button>
                    <span>{EMAIL_BODY_LONG}</span>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem
                id="blog"
                title="Blog / YouTube (3 outlines)"
                open={openAccs.has("blog")}
                onToggle={() => toggleAcc("blog")}
              >
                <p className="acc-sub">Outline templates. Plug in your own experience.</p>
                <div className="script-card">
                  <h4>REVIEW OUTLINE</h4>
                  <div className="code-block">
                    <button className={copyClass("blog-review")} onClick={() => copy("blog-review", BLOG_REVIEW)}>
                      {copyLabel("blog-review")}
                    </button>
                    <span>{BLOG_REVIEW}</span>
                  </div>
                </div>
                <div className="script-card">
                  <h4>COMPARISON OUTLINE</h4>
                  <div className="code-block">
                    <button className={copyClass("blog-compare")} onClick={() => copy("blog-compare", BLOG_COMPARISON)}>
                      {copyLabel("blog-compare")}
                    </button>
                    <span>{BLOG_COMPARISON}</span>
                  </div>
                </div>
                <div className="script-card">
                  <h4>LISTICLE OUTLINE</h4>
                  <div className="code-block">
                    <button className={copyClass("blog-list")} onClick={() => copy("blog-list", BLOG_LISTICLE)}>
                      {copyLabel("blog-list")}
                    </button>
                    <span>{BLOG_LISTICLE}</span>
                  </div>
                </div>
              </AccordionItem>
            </div>
          </div>
        </section>

        <hr className="kit-divider" />

        {/* ═══ 07 — BRAND ASSETS (combined logos / mascot / colors / type / shots) ═══ */}
        <section id="sec-logos">
          <div className="kit-wrap reveal">
            <div className="sec-header">
              <h2>Brand Assets</h2>
              <span className="sec-num">07 / 12</span>
            </div>
            <p className="sec-sub">All assets SVG + PNG @ 2x. Tap any button to download.</p>

            {/* Logos */}
            <div className="logo-grid">
              <div className="logo-tile">
                <div className="tile-bg-grid" />
                <div className="tile-asset">
                  <img src="/brand-kit/logos/wordmark-mint-on-black.svg" alt="Loot wordmark, mint on black" />
                </div>
                <span className="tile-label">WORDMARK — MINT ON BLACK</span>
                <div className="tile-actions">
                  <a href="/brand-kit/logos/wordmark-mint-on-black.svg" download>SVG</a>
                  <a href="/brand-kit/logos/wordmark-mint-on-black.png" download>PNG</a>
                </div>
              </div>
              <div className="logo-tile" style={{ background: "#5CE0B8" }}>
                <div className="tile-bg-grid" style={{ opacity: 0.3 }} />
                <div className="tile-asset">
                  <img src="/brand-kit/logos/wordmark-black-on-mint.svg" alt="Loot wordmark, black on mint" />
                </div>
                <span className="tile-label" style={{ color: "rgba(0,0,0,0.4)" }}>WORDMARK — BLACK ON MINT</span>
                <div className="tile-actions">
                  <a href="/brand-kit/logos/wordmark-black-on-mint.svg" download>SVG</a>
                  <a href="/brand-kit/logos/wordmark-black-on-mint.png" download>PNG</a>
                </div>
              </div>
              <div className="logo-tile logo-tile--checker">
                <div className="tile-bg-grid" />
                <div className="tile-asset">
                  <img src="/brand-kit/logos/wordmark-white-on-transparent.svg" alt="Loot wordmark, white on transparent" />
                </div>
                <span className="tile-label">WORDMARK — WHITE ON TRANSPARENT</span>
                <div className="tile-actions">
                  <a href="/brand-kit/logos/wordmark-white-on-transparent.svg" download>SVG</a>
                  <a href="/brand-kit/logos/wordmark-white-on-transparent.png" download>PNG</a>
                </div>
              </div>
              <div className="logo-tile">
                <div className="tile-bg-grid" />
                <div className="tile-asset">
                  <img src="/brand-kit/logos/coinmark-mint.svg" alt="Loot CoinMark icon, mint" />
                </div>
                <span className="tile-label">COINMARK — PRIMARY ICON</span>
                <span className="tile-subtitle">App icon, social, favicons</span>
                <div className="tile-actions">
                  <a href="/brand-kit/logos/coinmark-mint.svg" download>SVG</a>
                  <a href="/brand-kit/logos/coinmark-mint.png" download>PNG</a>
                </div>
              </div>
              <div className="logo-tile">
                <div className="tile-bg-grid" />
                <div className="tile-asset">
                  <img src="/brand-kit/logos/coinmark-white.svg" alt="Loot CoinMark icon, white" />
                </div>
                <span className="tile-label">COINMARK — INVERSE</span>
                <span className="tile-subtitle">Light backgrounds, print</span>
                <div className="tile-actions">
                  <a href="/brand-kit/logos/coinmark-white.svg" download>SVG</a>
                  <a href="/brand-kit/logos/coinmark-white.png" download>PNG</a>
                </div>
              </div>
              <div className="logo-tile">
                <div className="tile-bg-grid" />
                <div className="tile-asset">
                  <img src="/brand-kit/logos/saturn-glyph-mint.svg" alt="Loot Saturn glyph, mint" />
                </div>
                <span className="tile-label">SATURN GLYPH — INLINE USE</span>
                <span className="tile-subtitle">Body text, captions, UI chrome</span>
                <div className="tile-actions">
                  <a href="/brand-kit/logos/saturn-glyph-mint.svg" download>SVG</a>
                  <a href="/brand-kit/logos/saturn-glyph-mint.png" download>PNG</a>
                </div>
              </div>
            </div>

            {/* Meet Flip */}
            <div className="dark-card dark-card--mint" style={{ padding: "40px 28px", marginTop: 32 }}>
              <div className="flip-section">
                <div className="flip-visual flip-glow" style={{ position: "relative" }}>
                  <img
                    src="/brand-kit/flip/flip-smirk.png"
                    alt="Flip mascot — smirk mood"
                    style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
                <div className="flip-info">
                  <p className="flip-eyebrow">THE COACH</p>
                  <h3>Meet Flip</h3>
                  <p>
                    Loot&apos;s in-app AI coach. Saturn-themed. Street-smart. Disciplined, not patient.
                    He calls your shots in 4 moods — smirk, hyped, side-eye, dead — depending on how
                    badly you cooked.
                  </p>
                  <div className="moods-row">
                    {[
                      { mood: "smirk", label: "SMIRK" },
                      { mood: "hyped", label: "HYPED" },
                      { mood: "sideeye", label: "SIDE-EYE" },
                      { mood: "dead", label: "DEAD" },
                    ].map((m) => (
                      <div key={m.mood} className="mood-item">
                        <img
                          src={`/brand-kit/flip/flip-${m.mood}.png`}
                          alt={`Flip — ${m.label.toLowerCase()} mood`}
                          width={80}
                          height={80}
                          style={{ borderRadius: 8, objectFit: "contain" }}
                        />
                        <span className="mood-label">{m.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flip-downloads">
                    <a href="/brand-kit/flip/flip-sprite-sheet.png" className="btn-dl" download>
                      SPRITE SHEET (PNG)
                    </a>
                    <a href="/brand-kit/flip/flip-moods.zip" className="btn-dl" download="flip-moods.zip">
                      MOODS (ZIP)
                    </a>
                    <a href="/brand-kit/flip/flip-animated-ring.svg" className="btn-dl" download>
                      ANIMATED RING (SVG)
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Colors */}
            <h3 className="kit-sub-header" style={{ marginTop: 48 }}>Color System</h3>
            <div className="swatch-row">
              {SWATCHES.map((s) => {
                const key = `swatch-${s.hex}`;
                return (
                  <div
                    key={s.hex}
                    className="swatch"
                    style={{ background: s.bg, color: s.text }}
                    onClick={() => copy(key, s.hex)}
                  >
                    <div className="swatch-info">
                      <span className="swatch-role">{s.role}</span>
                      <span className="swatch-hex">
                        {s.hex}{" "}
                        <button
                          className={`swatch-copy${copiedKey === key ? " copied" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            copy(key, s.hex);
                          }}
                        >
                          {copiedKey === key ? "COPIED" : "COPY"}
                        </button>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="color-note">Mint is the only accent that earns its place. Gold for Founding 20. Use sparingly.</p>

            {/* Type */}
            <h3 className="kit-sub-header" style={{ marginTop: 48 }}>Type</h3>
            <div className="type-cards">
              <div className="dark-card">
                <p className="type-eyebrow">DISPLAY + BODY</p>
                <p className="type-specimen">scan. price. flip.</p>
                <div className="weight-ladder">
                  <span style={{ fontWeight: 300 }}>300 LIGHT</span>
                  <span className="dot" />
                  <span style={{ fontWeight: 500 }}>500 MEDIUM</span>
                  <span className="dot" />
                  <span style={{ fontWeight: 600 }}>600 SEMIBOLD</span>
                  <span className="dot" />
                  <span style={{ fontWeight: 700 }}>700 BOLD</span>
                </div>
              </div>
              <div className="dark-card">
                <p className="type-eyebrow">NUMBERS + UI</p>
                <p className="type-specimen type-specimen--mono">$4 → $85 · 21× ROI</p>
                <div className="weight-ladder" style={{ fontFamily: "var(--mono)" }}>
                  <span style={{ fontWeight: 500 }}>500 MEDIUM</span>
                  <span className="dot" />
                  <span style={{ fontWeight: 700 }}>700 BOLD</span>
                </div>
              </div>
            </div>
            <p className="type-footer">
              Both fonts are Google Fonts. Free for any use.{" "}
              <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer">
                → fonts.google.com
              </a>
            </p>

            {/* Screenshots */}
            <h3 className="kit-sub-header" style={{ marginTop: 48 }}>Screenshots</h3>
            <p className="sec-sub">Phone mockups, ready for press. PNG @ 3x, transparent BG.</p>
            <div className="shots-grid">
              {SHOTS.map((s) => (
                <div key={s.label} className="shot-tile">
                  <div className="phone-frame">
                    <img className="phone-screen-img" src={s.src} alt={s.alt} />
                  </div>
                  <span className="shot-label">{s.label}</span>
                  <div className="shot-dl">
                    <a href={s.src} className="btn-dl" download>DOWNLOAD PNG</a>
                  </div>
                </div>
              ))}
            </div>

            {/* Scan UI Mockup — the product visualization that also lives in
                the /pro hero. Press and creators want this for write-ups +
                tutorials without re-screenshotting the live app. */}
            <h3 className="kit-sub-header" style={{ marginTop: 48 }}>Scan UI Mockup</h3>
            <p className="sec-sub">Product visualization · iPhone mockup · PNG.</p>
            <div className="sitemap-card">
              <a href="/kit/scan-ui-mockup.png" className="sitemap-thumb" download aria-label="Download scan UI mockup PNG">
                <img
                  src="/kit/scan-ui-mockup.png"
                  alt="loot.works Pro mid-scan on a Pyrex Butterprint 403 — verdict in 1.45s: $4 buy, $35 resell, 21× ROI, FLIP IT"
                />
              </a>
              <div className="sitemap-meta">
                <span className="sitemap-label">SCAN UI MOCKUP</span>
                <p className="sitemap-desc">
                  Hyper-realistic iPhone showing the live scan flow on a vintage
                  Pyrex find. Use for product write-ups, tutorials, and
                  feature explainers. Transparent background.
                </p>
                <p className="sitemap-fileinfo">1 file · PNG · transparent bg</p>
                <a href="/kit/scan-ui-mockup.png" className="btn-dl" download>DOWNLOAD PNG</a>
              </div>
            </div>

            {/* IG ad creative bundle — 6 editorial vertical ads. Affiliates
                and Founding 20 creators drop these straight into IG / Reels /
                TikTok posts without re-shooting. Multi-file: each download
                link grabs a single PNG so creators can pull only what fits
                their angle. */}
            <h3 className="kit-sub-header" style={{ marginTop: 48 }}>IG Ad Creatives</h3>
            <p className="sec-sub">6 vertical ad variants · 1122×1402 · ready for IG / TikTok / Reels.</p>
            <div className="sitemap-card adkit-card">
              <a
                href="/ads/ig-carhartt.png"
                className="sitemap-thumb"
                download
                aria-label="Download Carhartt ad PNG"
              >
                <img
                  src="/ads/ig-carhartt.png"
                  alt="loot.works ad creative — Carhartt jacket $8 at Goodwill, $140 resell, 17× ROI"
                />
                <span className="adkit-multi-badge" aria-hidden="true">6 FILES</span>
              </a>
              <div className="sitemap-meta">
                <span className="sitemap-label">IG AD CREATIVES</span>
                <p className="sitemap-desc">
                  Editorial vertical ads for thrift finds — Carhartt, Le
                  Creuset, Big E Levi&apos;s, Pendleton, vintage Nike, vinyl.
                  Drop straight into IG, Reels, TikTok, or Pinterest. Each
                  shows the buy / resell / ROI verdict.
                </p>
                <p className="sitemap-fileinfo">6 files · PNG · 1122×1402</p>
                <ul className="adkit-filelist">
                  {[
                    { file: "ig-carhartt.png",   label: "Carhartt jacket — $8 → $140" },
                    { file: "ig-lecreuset.png",  label: "Le Creuset Dutch oven" },
                    { file: "ig-levis-bige.png", label: "Levi's 501 Big E" },
                    { file: "ig-nike-tee.png",   label: "Nike single-stitch tee" },
                    { file: "ig-pendleton.png",  label: "Pendleton blanket" },
                    { file: "ig-vinyl.png",      label: "Vinyl record" },
                  ].map((a) => (
                    <li key={a.file}>
                      <a href={`/ads/${a.file}`} download className="adkit-dl">
                        <span className="adkit-dl-name">{a.label}</span>
                        <span className="adkit-dl-action">DOWNLOAD →</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sitemap — full site architecture diagram. Press + designers
                reference this for the 3-pillar (MARKETING / APP / LEGAL)
                route taxonomy. */}
            <h3 className="kit-sub-header" style={{ marginTop: 48 }}>Sitemap</h3>
            <p className="sec-sub">Full site architecture · 3-pillar tree · PNG @ 2x.</p>
            <div className="sitemap-card">
              <a href="/kit/sitemap.png" className="sitemap-thumb" download aria-label="Download sitemap PNG">
                <img src="/kit/sitemap.png" alt="loot.works sitemap — MARKETING, APP, LEGAL columns" />
              </a>
              <div className="sitemap-meta">
                <span className="sitemap-label">SITEMAP</span>
                <p className="sitemap-desc">
                  Every public route at a glance. Useful for press,
                  designers, and creators referencing the site structure.
                </p>
                <p className="sitemap-fileinfo">1 file · PNG · 2x resolution</p>
                <a href="/kit/sitemap.png" className="btn-dl" download>DOWNLOAD PNG</a>
              </div>
            </div>
          </div>
        </section>

        <hr className="kit-divider" />

        {/* ═══ 08 — USAGE RULES ═══ */}
        <section id="sec-rules">
          <div className="kit-wrap reveal">
            <div className="sec-header">
              <h2>Usage Rules</h2>
              <span className="sec-num">08 / 12</span>
            </div>
            <p className="sec-sub">Common-sense lines for using Loot&apos;s brand and mascot in your content.</p>
            <div className="rules-twin">
              <div>
                <h3 className="rules-title rules-title--do">YOU CAN</h3>
                <div className="rules-grid">
                  {DOS.map((line) => (
                    <div key={line} className="rule-item rule-item--do">
                      <span className="rule-icon rule-icon--do">✓</span>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="rules-title rules-title--dont">YOU CAN&apos;T</h3>
                <div className="rules-grid">
                  {DONTS.map((line) => (
                    <div key={line} className="rule-item rule-item--dont">
                      <span className="rule-icon rule-icon--dont">✗</span>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="kit-divider" />

        {/* ═══ 09 — PRESS ═══ */}
        <section id="sec-press">
          <div className="kit-wrap reveal">
            <div className="sec-header">
              <h2>Press</h2>
              <span className="sec-num">09 / 12</span>
            </div>
            <div className="dark-card" style={{ padding: 32 }}>
              <div className="press-table">
                {[
                  ["Founded", "2026"],
                  ["Headquarters", "McDonough, GA"],
                  ["Founder", "David Jones"],
                  ["Product", "Mobile-first PWA for resellers"],
                  ["Pricing", "$14.99/mo · $99.99/yr"],
                  ["Stack", "Next.js · Supabase · Claude AI · Vercel"],
                ].map(([k, v]) => (
                  <div key={k} className="press-row">
                    <span className="press-key">{k}</span>
                    <span className="press-val">{v}</span>
                  </div>
                ))}
                <div className="press-row">
                  <span className="press-key">Available</span>
                  <span className="press-val">
                    <a href="https://loot.works">loot.works</a> (no app store)
                  </span>
                </div>
                <div className="press-row">
                  <span className="press-key">Press contact</span>
                  <span className="press-val">
                    <a href="mailto:lootworks.goflip@gmail.com?subject=loot.works%20press%20inquiry">
                      lootworks.goflip@gmail.com
                    </a>
                  </span>
                </div>
                <div className="press-row">
                  <span className="press-key">Founder DMs</span>
                  <span className="press-val">@loot.works on TikTok / IG / X</span>
                </div>
              </div>
            </div>

            {/* Founder bio mini-card */}
            <div className="founder-card">
              <div className="founder-avatar">
                {/* TODO(David): swap in real founder headshot */}
                <span aria-hidden="true">DJ</span>
              </div>
              <div className="founder-body">
                <p className="founder-name">DAVID JONES, FOUNDER</p>
                <p className="founder-bio">
                  Reseller-turned-builder. Spent years opening five tabs to comp a single
                  thrift find — built Loot so no one else has to. Based in McDonough, GA.
                </p>
              </div>
            </div>

            {/* Recent Coverage */}
            <h3 className="kit-sub-header" style={{ marginTop: 40 }}>Recent Coverage</h3>
            {/* TODO(David): populate as press lands */}
            <div className="press-empty">
              <em>— populate as coverage lands —</em>
            </div>

            <div style={{ marginTop: 24 }}>
              <a href="#" className="btn-dl" style={{ padding: "14px 28px", fontSize: 12 }}>
                DOWNLOAD FULL PRESS KIT (PDF)
              </a>
            </div>
          </div>
        </section>

        <hr className="kit-divider" />

        {/* ═══ 10 — WHAT'S NEW ═══ */}
        <WhatsNew />

        <hr className="kit-divider" />

        {/* ═══ 11 — FAQ ═══ */}
        <ConsolidatedFaq />

        {/* ═══ 12 — FOOTER ═══ */}
        <footer className="kit-footer">
          <div className="kit-wrap">
            <div className="footer-top">
              <div>
                <div className="footer-brand">
                  <svg className="coinmark" width="20" height="20">
                    <use href="#sym-coinmark" />
                  </svg>
                  <span className="wordmark">LOOT</span>
                </div>
              </div>
              <div className="footer-col">
                <h4>PRODUCT</h4>
                <a href="/pro">Pro</a>
                <a href="/flip">Flip or Skip</a>
                <a href="/kit">Kit</a>
              </div>
              <div className="footer-col">
                <h4>COMPANY</h4>
                <a href="/about">About</a>
                <a href="#sec-press" onClick={handleAnchorScroll}>Press</a>
                <a href="/contact">Contact</a>
              </div>
              <div className="footer-col">
                <h4>LEGAL</h4>
                <a href="/privacy">Privacy</a>
                <a href="/terms">Terms</a>
                <a href="/refund-policy">Refunds</a>
              </div>
            </div>
            <div className="footer-bottom">
              <p className="footer-biz">
                Loot — operated by Loot.works, McDonough, Georgia
              </p>
              <p className="footer-tagline">// BUILT FOR THE 130 MILLION AMERICANS WHO RESELL</p>
              <p className="footer-copy">© 2026 Loot. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Gamification widgets — copies counter, progress bar, mascot, toasts. */}
      <Gamification />
    </>
  );
}

const PAGE_STYLES = `
.kit-page *, .kit-page *::before, .kit-page *::after { box-sizing: border-box; margin: 0; padding: 0; }

.kit-page {
  --bg: #0a0a0a;
  --mint: #5CE0B8;
  --gold: #F5C518;
  --peri: #7B8FFF;
  --red: #ff6b6b;
  --white: #ffffff;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --display: 'Outfit', sans-serif;
  --mono: 'JetBrains Mono', monospace;
  background: var(--bg);
  background-image: radial-gradient(ellipse at 50% 0%, #0a1612 0%, #000 70%);
  background-attachment: fixed;
  color: var(--white);
  font-family: var(--display);
  font-weight: 300;
  font-size: 16px;
  line-height: 1.6;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}
html:has(.kit-page) { scroll-behavior: smooth; scroll-padding-top: 80px; }

/* TOC */
.kit-page .kit-toc { display: none; }
.kit-page .kit-toc-btn {
  position: fixed; bottom: 88px; right: 24px;
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--mint); color: var(--bg);
  border: none; cursor: pointer; z-index: 45;
  font-size: 26px; line-height: 1;
  box-shadow: 0 0 24px rgba(92,224,184,0.4), 0 8px 24px rgba(0,0,0,0.4);
  transition: transform 150ms var(--ease);
}
.kit-page .kit-toc-btn:hover, .kit-page .kit-toc-btn:focus-visible { transform: scale(1.05); outline: none; }
.kit-page .kit-toc-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 49; }
.kit-page .kit-toc-panel {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
  background: #0a0a0a; border-top: 1px solid rgba(92,224,184,0.4);
  padding: 24px; max-height: 70vh; overflow-y: auto;
  animation: kit-toc-slide-in 280ms cubic-bezier(0.4,0,0.2,1);
}
@keyframes kit-toc-slide-in { from { transform: translateY(100%); } to { transform: translateY(0); } }
.kit-page .kit-toc-label { font: 500 10px/1 var(--mono); letter-spacing: 0.24em; color: var(--mint); margin-bottom: 14px; text-transform: uppercase; }
.kit-page .kit-toc ul, .kit-page .kit-toc-panel ul { list-style: none; margin: 0; padding: 0; }
.kit-page .kit-toc a, .kit-page .kit-toc-panel a {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px; min-height: 44px;
  color: rgba(255,255,255,0.75); text-decoration: none;
  border-left: 2px solid transparent;
  transition: all 180ms var(--ease);
}
.kit-page .kit-toc a:hover, .kit-page .kit-toc-panel a:hover { color: #fff; background: rgba(255,255,255,0.03); }
.kit-page .kit-toc a.active, .kit-page .kit-toc-panel a.active {
  color: var(--mint); border-left-color: var(--mint);
  background: rgba(92,224,184,0.06);
}
.kit-page .kit-toc-n { font: 500 10px/1 var(--mono); color: rgba(255,255,255,0.35); width: 18px; }
.kit-page .kit-toc-text { font: 500 13px/1 var(--display); }
.kit-page .kit-toc a.active .kit-toc-n, .kit-page .kit-toc-panel a.active .kit-toc-n { color: var(--mint); }
@media (min-width: 1024px) {
  .kit-page .kit-toc {
    display: block; position: fixed; top: 96px; left: 24px;
    width: 200px; max-height: 70vh; overflow-y: auto; z-index: 40;
    background: rgba(10,22,18,0.6); backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(92,224,184,0.25);
    padding: 20px 0;
  }
  .kit-page .kit-toc-label { padding: 0 16px; }
  .kit-page .kit-toc-btn, .kit-page .kit-toc-panel, .kit-page .kit-toc-overlay { display: none; }
}

/* Dot grid */
.kit-page::before {
  content: ''; position: fixed; inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none; z-index: 0;
}

.kit-page .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

/* LAYOUT */
.kit-page .kit-wrap {
  position: relative; z-index: 1;
  width: 100%; max-width: 1440px;
  margin: 0 auto; padding: 0 24px;
}
@media (min-width: 768px) { .kit-page .kit-wrap { padding: 0 48px; } }
@media (min-width: 1024px) { .kit-page .kit-wrap { padding: 0 64px 0 240px; } }

.kit-page section { padding: 56px 0; position: relative; z-index: 1; }
@media (min-width: 768px) { .kit-page section { padding: 80px 0; } }
@media (min-width: 1024px) { .kit-page section { padding: 100px 0; } }

/* DIVIDERS */
.kit-page .kit-divider {
  border: none;
  height: 1px;
  margin: 0;
  background: linear-gradient(90deg, transparent, rgba(92,224,184,0.3) 50%, transparent);
  max-width: 800px;
  margin-left: auto; margin-right: auto;
}

/* SECTION HEADERS */
.kit-page .sec-header {
  display: flex; align-items: baseline; justify-content: space-between;
  padding-bottom: 16px; border-bottom: 1px solid var(--mint);
  margin-bottom: 28px;
}
.kit-page .sec-header h2 {
  font-family: var(--display); font-weight: 600; font-size: 24px;
  letter-spacing: -0.01em; color: var(--white);
}
@media (min-width: 768px) { .kit-page .sec-header h2 { font-size: 32px; } }
.kit-page .sec-header .sec-num {
  font-family: var(--mono); font-weight: 500; font-size: 11px;
  color: var(--mint); letter-spacing: 0.12em; white-space: nowrap; opacity: 0.7;
}
.kit-page .kit-sub-header {
  font-family: var(--display); font-weight: 600; font-size: 20px;
  color: var(--white); margin-bottom: 20px;
  letter-spacing: -0.01em;
}
.kit-page .sec-sub { font-weight: 300; font-size: 14px; color: rgba(255,255,255,0.55); margin-bottom: 28px; }

/* SCROLL REVEAL */
.kit-page .reveal {
  opacity: 0; transform: translateY(24px);
  transition: opacity 0.6s var(--ease), transform 0.6s var(--ease);
}
.kit-page .reveal.visible { opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) { .kit-page .reveal { transform: none; opacity: 1; } }

/* NAV */
.kit-page .kit-nav {
  position: fixed; top: 0; left: 0; right: 0;
  height: 64px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px;
  background: rgba(10,10,10,0.82);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border-bottom: 1px solid var(--mint);
  z-index: 100;
}
@media (min-width: 768px) { .kit-page .kit-nav { padding: 0 48px; } }
.kit-page .nav-left { display: flex; align-items: center; gap: 10px; }
.kit-page .nav-left .coinmark { width: 22px; height: 22px; color: var(--mint); }
.kit-page .nav-left .wordmark {
  font-family: var(--display); font-weight: 600; font-size: 14px;
  color: var(--white); letter-spacing: 0.08em;
}
.kit-page .nav-center {
  font-family: var(--mono); font-weight: 500; font-size: 11px;
  color: var(--mint); letter-spacing: 0.24em;
  position: absolute; left: 50%; transform: translateX(-50%);
}
.kit-page .nav-right a {
  font-family: var(--mono); font-weight: 500; font-size: 10px;
  letter-spacing: 0.08em; color: var(--mint); text-decoration: none;
  border: 1px solid var(--mint); padding: 6px 14px;
  transition: background 0.2s var(--ease), color 0.2s var(--ease);
}
.kit-page .nav-right a:hover { background: var(--mint); color: var(--bg); }

/* HERO */
.kit-page .hero { min-height: 60vh; display: flex; align-items: center; padding-top: 100px !important; }
@media (min-width: 768px) { .kit-page .hero { padding-top: 120px !important; } }
.kit-page .hero-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
  align-items: center;
  width: 100%;
}
@media (min-width: 960px) {
  .kit-page .hero-grid { grid-template-columns: 1.05fr 1fr; gap: 56px; }
}
.kit-page .hero-text { max-width: 720px; }
.kit-page .hero-eyebrow {
  font-family: var(--mono); font-weight: 500; font-size: 11px;
  color: var(--mint); letter-spacing: 0.28em; margin-bottom: 20px;
}
.kit-page .hero h1 {
  font-family: var(--display); font-weight: 600;
  font-size: clamp(40px, 8vw, 88px);
  line-height: 0.98;
  color: var(--white);
  margin-bottom: 18px;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}
.kit-page .hero-mint { color: var(--mint); }
.kit-page .hero-sub {
  font-weight: 300; font-size: 18px; color: rgba(255,255,255,0.7);
  margin-bottom: 18px; max-width: 580px; line-height: 1.55;
}
.kit-page .hero-stats {
  font-family: var(--mono); font-weight: 500; font-size: 11px;
  letter-spacing: 0.12em; color: rgba(255,255,255,0.55);
  margin-bottom: 24px;
}
.kit-page .hero-cta {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 18px 30px;
  background: linear-gradient(180deg, #6FE5C0 0%, #5CE0B8 100%);
  color: #0A0A0A;
  font-family: var(--display); font-weight: 700; font-size: 16px;
  letter-spacing: 0.04em;
  text-decoration: none;
  border-radius: 100px;
  border-top: 1px solid rgba(255,255,255,0.3);
  box-shadow: 0 12px 36px rgba(92,224,184,0.35), inset 0 0 0 1px rgba(92,224,184,0.3);
  transition: transform 0.15s, box-shadow 0.2s;
  margin-bottom: 20px;
}
.kit-page .hero-cta:hover { transform: translateY(-1px); box-shadow: 0 14px 44px rgba(92,224,184,0.5), inset 0 0 0 1px rgba(92,224,184,0.4); }

.kit-page .hero-tertiary {
  display: flex; flex-direction: column; gap: 6px;
}
.kit-page .hero-tertiary a {
  font-family: var(--mono); font-weight: 500; font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--mint);
  text-decoration: underline;
  width: fit-content;
}
.kit-page .hero-tertiary a:hover { color: #fff; }

.kit-page .hero-ladder {
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}

/* DARK CARD */
.kit-page .dark-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 32px;
}
.kit-page .dark-card--mint { border-color: rgba(92,224,184,0.3); }

/* COPY BUTTON */
.kit-page .btn-copy {
  font-family: var(--mono); font-weight: 500; font-size: 10px;
  letter-spacing: 0.08em; color: var(--mint); background: transparent;
  border: 1px solid var(--mint); padding: 6px 14px; cursor: pointer;
  transition: all 0.2s var(--ease); line-height: 1; white-space: nowrap;
}
.kit-page .btn-copy:hover { background: rgba(92,224,184,0.08); }
.kit-page .btn-copy.copied { background: var(--mint); color: var(--bg); border-color: var(--mint); }

/* DOWNLOAD BUTTON */
.kit-page .btn-dl {
  font-family: var(--mono); font-weight: 500; font-size: 10px;
  letter-spacing: 0.08em; color: var(--bg); background: var(--mint);
  border: none; padding: 8px 16px; cursor: pointer; text-decoration: none;
  display: inline-block; transition: transform 0.2s var(--ease), box-shadow 0.2s var(--ease);
  line-height: 1;
}
.kit-page .btn-dl:hover { transform: scale(1.02); box-shadow: 0 0 20px rgba(92,224,184,0.08); }

/* PITCH TABS */
.kit-page .tab-row { display: flex; gap: 0; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.kit-page .tab-btn {
  font-family: var(--mono); font-weight: 500; font-size: 11px;
  letter-spacing: 0.06em; color: rgba(255,255,255,0.45);
  background: none; border: none; padding: 12px 20px; cursor: pointer;
  position: relative; transition: color 0.24s var(--ease);
}
.kit-page .tab-btn::after {
  content: ''; position: absolute; bottom: -1px; left: 0;
  width: 0; height: 2px; background: var(--mint);
  transition: width 0.24s var(--ease);
}
.kit-page .tab-btn.active { color: var(--mint); }
.kit-page .tab-btn.active::after { width: 100%; }
.kit-page .tab-panel { display: none; }
.kit-page .tab-panel.active { display: block; }
.kit-page .tab-content { position: relative; }
.kit-page .tab-content .btn-copy { position: absolute; top: 0; right: 0; }
.kit-page .tab-text {
  font-family: var(--display); font-weight: 500; font-size: 18px;
  line-height: 1.5; color: var(--white); padding-right: 80px;
}
@media (min-width: 768px) { .kit-page .tab-text.lg { font-size: 22px; } }

/* LOGOS GRID */
.kit-page .logo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
@media (min-width: 768px) { .kit-page .logo-grid { grid-template-columns: repeat(3, 1fr); } }
.kit-page .logo-tile {
  aspect-ratio: 1; position: relative; display: flex;
  flex-direction: column; overflow: hidden;
  border-radius: 16px; background: rgba(255,255,255,0.02);
  border: 1px solid rgba(92,224,184,0.25);
}
.kit-page .logo-tile:hover { border-color: rgba(92,224,184,0.5); }
.kit-page .logo-tile .tile-bg-grid {
  position: absolute; inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 16px 16px;
}
.kit-page .logo-tile--checker .tile-bg-grid {
  background-image:
    linear-gradient(45deg, rgba(255,255,255,0.07) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255,255,255,0.07) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.07) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.07) 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0;
}
.kit-page .tile-subtitle {
  position: absolute; bottom: 24px; left: 12px;
  font-family: var(--mono); font-weight: 500; font-size: 8px;
  letter-spacing: 0.06em; color: rgba(255,255,255,0.3);
}
.kit-page .tile-label {
  position: absolute; bottom: 12px; left: 12px;
  font-family: var(--mono); font-weight: 500; font-size: 9px;
  letter-spacing: 0.1em; color: rgba(255,255,255,0.4);
}
.kit-page .tile-actions {
  display: flex; gap: 0; min-height: 40px;
  border-top: 1px solid rgba(92,224,184,0.2);
  background: rgba(0,0,0,0.2); position: relative; z-index: 2;
}
.kit-page .tile-actions a {
  flex: 1; text-align: center; padding: 12px 8px;
  font-family: var(--mono); font-size: 10px; font-weight: 700;
  letter-spacing: 0.12em; color: var(--mint); background: transparent;
  text-decoration: none; transition: background 0.15s var(--ease), color 0.15s var(--ease);
  display: flex; align-items: center; justify-content: center;
  min-height: 44px;
}
.kit-page .tile-actions a + a { border-left: 1px solid rgba(92,224,184,0.2); }
.kit-page .tile-actions a:hover { background: var(--mint); color: var(--bg); }
.kit-page .logo-tile .tile-asset {
  flex: 1; position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: center;
  padding: 24px; min-height: 0;
}
.kit-page .logo-tile .tile-asset img {
  max-width: 70%; max-height: 70%; width: auto; height: auto;
  object-fit: contain; display: block;
}

/* FLIP MASCOT */
.kit-page .flip-section { display: flex; flex-direction: column; gap: 32px; }
@media (min-width: 768px) { .kit-page .flip-section { flex-direction: row; align-items: flex-start; gap: 48px; } }
.kit-page .flip-section .flip-visual { display: flex; justify-content: center; flex-shrink: 0; width: 160px; height: 160px; }
@media (min-width: 768px) { .kit-page .flip-section .flip-visual { width: 200px; height: 200px; } }
.kit-page .flip-info { flex: 1; }
.kit-page .flip-eyebrow {
  font-family: var(--mono); font-weight: 500; font-size: 10px;
  letter-spacing: 0.24em; color: var(--mint); margin-bottom: 8px;
}
.kit-page .flip-info h3 { font-family: var(--display); font-weight: 600; font-size: 28px; margin-bottom: 12px; }
.kit-page .flip-info p { font-weight: 300; font-size: 15px; color: rgba(255,255,255,0.7); margin-bottom: 22px; line-height: 1.6; }
.kit-page .moods-row { display: flex; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; }
.kit-page .mood-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.kit-page .mood-item img { width: 64px; height: 64px; }
@media (min-width: 768px) { .kit-page .mood-item img { width: 72px; height: 72px; } }
.kit-page .mood-label { font-family: var(--mono); font-weight: 500; font-size: 10px; color: var(--mint); letter-spacing: 0.08em; }
.kit-page .flip-downloads { display: flex; gap: 10px; flex-wrap: wrap; }
.kit-page .flip-glow { filter: drop-shadow(0 0 40px rgba(92,224,184,0.08)); }

/* COLORS */
.kit-page .swatch-row { display: flex; gap: 0; border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
.kit-page .swatch {
  flex: 1; height: 120px; position: relative; cursor: pointer;
  transition: transform 0.2s var(--ease); display: flex;
  align-items: flex-end; padding: 12px;
}
@media (min-width: 768px) { .kit-page .swatch { height: 200px; padding: 16px; } }
.kit-page .swatch-info { display: flex; flex-direction: column; gap: 2px; width: 100%; }
.kit-page .swatch-role { font-family: var(--mono); font-weight: 500; font-size: 8px; letter-spacing: 0.24em; opacity: 0.8; }
@media (min-width: 768px) { .kit-page .swatch-role { font-size: 10px; } }
.kit-page .swatch-hex {
  font-family: var(--mono); font-weight: 700; font-size: 11px;
  display: flex; align-items: center; justify-content: space-between;
}
@media (min-width: 768px) { .kit-page .swatch-hex { font-size: 14px; } }
.kit-page .swatch-copy {
  font-family: var(--mono); font-size: 8px; font-weight: 500;
  letter-spacing: 0.08em; background: none; border: 1px solid currentColor;
  color: inherit; padding: 3px 6px; cursor: pointer;
  opacity: 0; transition: opacity 0.2s var(--ease);
}
.kit-page .swatch:hover .swatch-copy { opacity: 1; }
.kit-page .swatch-copy.copied { opacity: 1; background: currentColor; color: var(--bg); }
.kit-page .color-note {
  font-family: var(--display); font-weight: 300; font-style: italic;
  font-size: 14px; color: rgba(255,255,255,0.55); text-align: center;
}

/* TYPOGRAPHY */
.kit-page .type-cards { display: flex; flex-direction: column; gap: 16px; }
.kit-page .type-eyebrow {
  font-family: var(--mono); font-weight: 500; font-size: 10px;
  letter-spacing: 0.24em; color: var(--mint); margin-bottom: 12px;
}
.kit-page .type-specimen {
  font-family: var(--display); font-weight: 600; font-size: 36px;
  line-height: 1.05; margin-bottom: 20px;
}
@media (min-width: 768px) { .kit-page .type-specimen { font-size: 56px; } }
.kit-page .type-specimen--mono { font-family: var(--mono); font-weight: 700; font-size: 28px; }
@media (min-width: 768px) { .kit-page .type-specimen--mono { font-size: 40px; } }
.kit-page .weight-ladder { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13px; }
@media (min-width: 768px) { .kit-page .weight-ladder { font-size: 16px; gap: 12px; } }
.kit-page .weight-ladder span { font-family: var(--display); }
.kit-page .weight-ladder .dot { width: 4px; height: 4px; background: var(--mint); border-radius: 50%; flex-shrink: 0; }
.kit-page .type-footer { font-weight: 300; font-size: 14px; color: rgba(255,255,255,0.55); margin-top: 16px; }
.kit-page .type-footer a { color: var(--mint); text-decoration: none; }
.kit-page .type-footer a:hover { opacity: 0.7; }

/* SCREENSHOTS */
/* SITEMAP CARD */
.kit-page .sitemap-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  align-items: center;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(92,224,184,0.25);
  border-radius: 16px;
  padding: 24px;
  margin-top: 4px;
}
@media (min-width: 768px) {
  .kit-page .sitemap-card { grid-template-columns: minmax(0, 240px) 1fr; gap: 32px; padding: 32px; }
}
.kit-page .sitemap-thumb {
  display: block;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(0,0,0,0.3);
  transition: border-color 0.2s var(--ease), transform 0.2s var(--ease);
  outline: none;
}
.kit-page .sitemap-thumb:hover,
.kit-page .sitemap-thumb:focus-visible {
  border-color: rgba(92,224,184,0.6);
  transform: translateY(-1px);
}
.kit-page .sitemap-thumb img {
  display: block; width: 100%; height: auto;
}
.kit-page .sitemap-meta { display: flex; flex-direction: column; gap: 10px; }
.kit-page .sitemap-label {
  font-family: var(--mono); font-weight: 700; font-size: 11px;
  letter-spacing: 0.16em; color: var(--mint);
}
.kit-page .sitemap-desc { font-weight: 300; font-size: 14px; color: rgba(255,255,255,0.65); margin: 0; line-height: 1.55; }
.kit-page .sitemap-fileinfo {
  font-family: var(--mono); font-weight: 500; font-size: 11px;
  color: rgba(255,255,255,0.4); letter-spacing: 0.04em; margin: 0;
}
.kit-page .sitemap-meta .btn-dl { align-self: flex-start; margin-top: 6px; padding: 10px 18px; font-size: 11px; }

/* Multi-file asset card variant — IG ad creatives bundle. Adds the
   "6 FILES" badge to the thumb and a per-file download list inside
   the meta column. */
.kit-page .adkit-card .sitemap-thumb { position: relative; }
.kit-page .adkit-multi-badge {
  position: absolute; top: 10px; right: 10px;
  font-family: var(--mono); font-weight: 700; font-size: 9px;
  letter-spacing: 0.14em; color: var(--gold);
  background: rgba(0,0,0,0.7);
  border: 1px solid rgba(245,197,24,0.55);
  border-radius: 999px;
  padding: 4px 9px;
  text-transform: uppercase;
}
.kit-page .adkit-filelist {
  list-style: none; padding: 0; margin: 12px 0 0;
  display: flex; flex-direction: column;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.kit-page .adkit-filelist li { border-bottom: 1px solid rgba(255,255,255,0.04); }
.kit-page .adkit-filelist li:last-child { border-bottom: none; }
.kit-page .adkit-dl {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 10px 4px;
  font-family: var(--display); font-weight: 500; font-size: 13px;
  color: rgba(255,255,255,0.75);
  text-decoration: none;
  transition: color 0.15s var(--ease), padding-left 0.15s var(--ease);
}
.kit-page .adkit-dl:hover, .kit-page .adkit-dl:focus-visible {
  color: var(--mint); padding-left: 8px; outline: none;
}
.kit-page .adkit-dl-name { flex: 1; min-width: 0; }
.kit-page .adkit-dl-action {
  font-family: var(--mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--mint);
  opacity: 0.6;
  white-space: nowrap;
}
.kit-page .adkit-dl:hover .adkit-dl-action { opacity: 1; }

.kit-page .shots-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
@media (min-width: 768px) { .kit-page .shots-grid { grid-template-columns: repeat(3, 1fr); } }
.kit-page .shot-tile {
  position: relative; border-radius: 16px; overflow: hidden;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08);
  padding: 22px 14px; display: flex; flex-direction: column;
  align-items: center; gap: 14px;
}
.kit-page .shot-tile:hover { border-color: rgba(92,224,184,0.3); }
.kit-page .phone-frame {
  width: 100%; max-width: 130px; aspect-ratio: 9 / 19.5;
  border-radius: 24px; border: 2px solid rgba(255,255,255,0.08);
  overflow: hidden; display: flex; align-items: center;
  justify-content: center; position: relative;
}
.kit-page .phone-screen-img {
  position: absolute; inset: 4px;
  width: calc(100% - 8px); height: calc(100% - 8px);
  border-radius: 20px; object-fit: cover; object-position: top center;
}
.kit-page .shot-label { font-family: var(--mono); font-weight: 500; font-size: 10px; letter-spacing: 0.08em; color: rgba(255,255,255,0.5); }

/* POST KIT ACCORDIONS */
.kit-page .accordion { display: flex; flex-direction: column; gap: 16px; }
.kit-page .acc-item {
  border-radius: 16px; overflow: hidden;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(92,224,184,0.3);
}
.kit-page .acc-trigger {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; background: none; border: none; color: var(--white);
  font-family: var(--display); font-weight: 600; font-size: 17px;
  cursor: pointer; transition: color 0.2s var(--ease); text-align: left;
}
.kit-page .acc-trigger:hover { color: var(--mint); }
.kit-page .acc-arrow { font-size: 18px; color: var(--mint); transition: transform 0.32s var(--ease); flex-shrink: 0; }
.kit-page .acc-item.open .acc-arrow { transform: rotate(180deg); }
.kit-page .acc-body { max-height: 0; overflow: hidden; transition: max-height 0.32s var(--ease); }
.kit-page .acc-item.open .acc-body { max-height: 8000px; }
.kit-page .acc-body-inner { padding: 0 24px 24px; display: flex; flex-direction: column; gap: 16px; }
.kit-page .script-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; padding: 18px;
}
.kit-page .script-card h4 {
  font-family: var(--mono); font-weight: 700; font-size: 11px;
  color: var(--mint); letter-spacing: 0.08em; margin-bottom: 10px;
}
.kit-page .code-block {
  position: relative;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px; padding: 14px; padding-right: 72px;
  font-family: var(--mono); font-weight: 500; font-size: 12px;
  line-height: 1.65; color: rgba(255,255,255,0.78);
  white-space: pre-wrap; word-break: break-word;
}
.kit-page .code-block .btn-copy { position: absolute; top: 8px; right: 8px; }
.kit-page .acc-sub { font-weight: 300; font-size: 13px; color: rgba(255,255,255,0.55); margin-bottom: 4px; }

/* PRESS */
.kit-page .press-table { display: flex; flex-direction: column; font-family: var(--mono); font-size: 13px; }
.kit-page .press-row {
  display: flex; justify-content: space-between; gap: 14px;
  padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.kit-page .press-row:last-child { border-bottom: none; }
.kit-page .press-key { font-weight: 500; color: rgba(255,255,255,0.45); letter-spacing: 0.06em; }
.kit-page .press-val { font-weight: 500; color: var(--white); text-align: right; }
.kit-page .press-val a { color: var(--mint); text-decoration: none; }
.kit-page .press-val a:hover { text-decoration: underline; }

.kit-page .founder-card {
  display: flex; gap: 18px; margin-top: 24px;
  padding: 20px;
  background: rgba(123,143,255,0.04);
  border: 1px solid rgba(123,143,255,0.25);
  border-radius: 12px;
}
.kit-page .founder-avatar {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(123,143,255,0.4), rgba(92,224,184,0.3));
  border: 1px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--display); font-weight: 700; font-size: 18px;
  color: rgba(255,255,255,0.85);
  flex-shrink: 0;
}
.kit-page .founder-name {
  font-family: var(--mono); font-weight: 700; font-size: 11px;
  letter-spacing: 0.12em; color: var(--peri);
  margin-bottom: 6px;
}
.kit-page .founder-bio { font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.5; margin-bottom: 8px; }
.kit-page .press-empty {
  padding: 24px;
  text-align: center;
  background: rgba(255,255,255,0.02);
  border: 1px dashed rgba(255,255,255,0.1);
  border-radius: 10px;
  color: rgba(255,255,255,0.4);
  font-size: 14px;
}

/* RULES */
.kit-page .rules-twin {
  display: grid; grid-template-columns: 1fr;
  gap: 24px;
}
@media (min-width: 768px) { .kit-page .rules-twin { grid-template-columns: 1fr 1fr; gap: 32px; } }
.kit-page .rules-title {
  font-family: var(--mono); font-weight: 700; font-size: 11px;
  letter-spacing: 0.16em; margin-bottom: 12px;
}
.kit-page .rules-title--do { color: var(--mint); }
.kit-page .rules-title--dont { color: var(--gold); }
.kit-page .rules-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
.kit-page .rule-item {
  padding: 14px 18px; background: rgba(255,255,255,0.02);
  border-radius: 8px; font-weight: 500; font-size: 14px;
  display: flex; align-items: center; gap: 12px;
}
.kit-page .rule-item--do { border-left: 2px solid var(--mint); }
.kit-page .rule-item--dont { border-left: 2px solid var(--gold); }
.kit-page .rule-icon { font-family: var(--mono); font-weight: 700; font-size: 14px; flex-shrink: 0; }
.kit-page .rule-icon--do { color: var(--mint); }
.kit-page .rule-icon--dont { color: var(--gold); }

/* FOOTER */
.kit-page .kit-footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 64px 0 40px; }
.kit-page .footer-top { display: grid; grid-template-columns: 1fr; gap: 40px; margin-bottom: 48px; }
@media (min-width: 768px) { .kit-page .footer-top { grid-template-columns: 1.5fr 1fr 1fr 1fr; } }
.kit-page .footer-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.kit-page .footer-brand .coinmark { width: 20px; height: 20px; color: var(--mint); }
.kit-page .footer-brand .wordmark { font-family: var(--display); font-weight: 600; font-size: 14px; letter-spacing: 0.08em; }
.kit-page .footer-col h4 {
  font-family: var(--mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.16em; color: rgba(255,255,255,0.4); margin-bottom: 16px;
}
.kit-page .footer-col a {
  display: block; font-family: var(--display); font-weight: 300; font-size: 14px;
  color: rgba(255,255,255,0.6); text-decoration: none; padding: 4px 0;
  transition: color 0.2s var(--ease);
}
.kit-page .footer-col a:hover { color: var(--mint); }
.kit-page .footer-bottom { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px; display: flex; flex-direction: column; gap: 12px; }
.kit-page .footer-biz { font-family: var(--display); font-weight: 300; font-size: 13px; color: rgba(255,255,255,0.35); }
.kit-page .footer-tagline { font-family: var(--mono); font-weight: 500; font-size: 11px; color: rgba(255,255,255,0.25); letter-spacing: 0.04em; }
.kit-page .footer-copy { font-size: 12px; color: rgba(255,255,255,0.3); }

/* Make /kit's main content area respect the desktop TOC fixed sidebar. */
@media (min-width: 1024px) {
  .kit-page section, .kit-page .kit-footer { padding-left: 0; padding-right: 0; }
}
`;
