"use client";

import { useEffect, useState } from "react";

const SECTIONS: { id: string; n: string; label: string }[] = [
  { id: "sec-pitch", n: "01", label: "The Pitch" },
  { id: "sec-logos", n: "02", label: "Logos" },
  { id: "sec-flip", n: "03", label: "Meet Flip" },
  { id: "sec-colors", n: "04", label: "Color System" },
  { id: "sec-type", n: "05", label: "Type" },
  { id: "sec-shots", n: "06", label: "Screenshots" },
  { id: "sec-post", n: "07", label: "Post Kit" },
  { id: "sec-affiliate", n: "08", label: "Affiliate Program" },
  { id: "sec-press", n: "09", label: "Press" },
  { id: "sec-do", n: "10", label: "You Can" },
  { id: "sec-dont", n: "11", label: "You Can't" },
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
