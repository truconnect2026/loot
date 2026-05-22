"use client";

/**
 * WhatsNew — recent launches / milestones / news for press + creators
 * who want context on what loot.works is doing right now.
 *
 * TODO(David): keep this updated as launches happen. Order chronologically
 * (newest first). Entries that "expired" (>6mo old) should be removed.
 */

const ENTRIES = [
  { date: "May 2026", body: "FLIP OR SKIP daily game launches" },
  { date: "May 2026", body: "Pro tier launches at $14.99/mo · $99.99/yr" },
  { date: "May 2026", body: "Founding 20 affiliate program opens (20 spots)" },
  { date: "April 2026", body: "Yard Sale Map (Pro) goes live" },
  { date: "April 2026", body: "Featured on Product Hunt" },
];

export default function WhatsNew() {
  return (
    <section id="sec-news" className="wn-section">
      <style dangerouslySetInnerHTML={{ __html: WN_STYLES }} />
      <div className="wn-wrap">
        <p className="wn-eyebrow">RECENT</p>
        <h2 className="wn-headline">WHAT&apos;S NEW AT LOOT.</h2>

        <ol className="wn-timeline">
          {ENTRIES.map((e, i) => (
            <li key={i} className="wn-entry">
              <span className="wn-dot" aria-hidden="true" />
              <div className="wn-entry-body">
                <span className="wn-date">{e.date}</span>
                <span className="wn-text">{e.body}</span>
              </div>
            </li>
          ))}
        </ol>

        <a
          href="mailto:lootworks.goflip@gmail.com?subject=subscribe%20to%20updates"
          className="wn-subscribe"
        >
          → subscribe to updates
        </a>
      </div>
    </section>
  );
}

const WN_STYLES = `
.wn-section { padding: 56px 0; }
@media (min-width: 768px) { .wn-section { padding: 80px 0; } }
.wn-section .wn-wrap { max-width: 720px; margin: 0 auto; padding: 0 24px; }
.wn-section .wn-eyebrow {
  font: 500 11px/1 var(--mono, 'JetBrains Mono', monospace);
  letter-spacing: 0.28em;
  color: #7B8FFF;
  margin-bottom: 14px;
  text-transform: uppercase;
}
.wn-section .wn-headline {
  font: 600 clamp(32px, 5vw, 48px)/1 var(--display, 'Outfit', sans-serif);
  letter-spacing: -0.01em;
  color: #fff;
  margin-bottom: 32px;
  text-transform: uppercase;
}
.wn-section .wn-timeline {
  list-style: none;
  padding: 0 0 0 18px;
  margin: 0 0 24px;
  border-left: 1px solid rgba(123,143,255,0.25);
}
.wn-section .wn-entry {
  position: relative;
  padding: 12px 0;
  padding-left: 16px;
}
.wn-section .wn-dot {
  position: absolute;
  left: -23px; top: 18px;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #7B8FFF;
  border: 2px solid #0A0A0A;
  box-shadow: 0 0 8px rgba(123,143,255,0.3);
}
.wn-section .wn-entry-body { display: flex; flex-wrap: wrap; align-items: baseline; gap: 12px; }
.wn-section .wn-date {
  font: 500 11px/1 var(--mono);
  letter-spacing: 0.08em;
  color: #7B8FFF;
  background: rgba(123,143,255,0.1);
  padding: 5px 9px;
  border-radius: 6px;
  white-space: nowrap;
}
.wn-section .wn-text {
  font: 400 15px/1.5 var(--display);
  color: rgba(255,255,255,0.85);
}
.wn-section .wn-subscribe {
  display: inline-block;
  font: 500 11px/1 var(--mono);
  letter-spacing: 0.08em;
  color: #7B8FFF;
  text-decoration: underline;
}
.wn-section .wn-subscribe:hover { opacity: 0.8; }
`;
