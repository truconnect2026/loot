"use client";

import { useEffect, useState } from "react";

// 12 sections per the unified-hub spec (2026-05-22). The ladder hero is
// #sec-hero (not in TOC — it's the page anchor). #sec-ladder is the deep
// gamified tier section; #founding-20 is the application landing target
// for the /partners → /kit redirect.
const SECTIONS: { id: string; n: string; label: string }[] = [
  { id: "sec-pitch", n: "01", label: "The Pitch" },
  { id: "sec-open", n: "02", label: "Open Program" },
  { id: "sec-ladder", n: "03", label: "The Ladder" },
  { id: "founding-20", n: "04", label: "Founding 20" },
  { id: "sec-post", n: "05", label: "Post Kit" },
  { id: "sec-logos", n: "06", label: "Brand Assets" },
  { id: "sec-rules", n: "07", label: "Usage Rules" },
  { id: "sec-press", n: "08", label: "Press" },
  { id: "sec-news", n: "09", label: "What's New" },
  { id: "sec-faq", n: "10", label: "FAQ" },
];

export default function KitToc() {
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const visible = new Set<string>();
    const onIntersect: IntersectionObserverCallback = (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target.id);
        else visible.delete(e.target.id);
      }
      const firstVisible = SECTIONS.find((s) => visible.has(s.id));
      if (firstVisible) setActive(firstVisible.id);
    };
    const observer = new IntersectionObserver(onIntersect, {
      rootMargin: "-30% 0px -60% 0px",
      threshold: 0,
    });
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    observers.push(observer);
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const jump = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
    history.replaceState(null, "", `#${id}`);
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="kit-toc" aria-label="Page sections">
        <div className="kit-toc-label">ON THIS PAGE</div>
        <ul>
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={jump(s.id)}
                className={active === s.id ? "active" : undefined}
                aria-current={active === s.id ? "location" : undefined}
              >
                <span className="kit-toc-n">{s.n}</span>
                <span className="kit-toc-text">{s.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <button
        type="button"
        className="kit-toc-btn"
        aria-label="Open table of contents"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((o) => !o)}
      >
        ≡
      </button>
      {mobileOpen && (
        <>
          <div
            className="kit-toc-overlay"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <nav className="kit-toc-panel" aria-label="Page sections (mobile)">
            <div className="kit-toc-label">ON THIS PAGE</div>
            <ul>
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={jump(s.id)}
                    className={active === s.id ? "active" : undefined}
                  >
                    <span className="kit-toc-n">{s.n}</span>
                    <span className="kit-toc-text">{s.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </>
  );
}
