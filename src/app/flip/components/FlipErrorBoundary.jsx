"use client";

import { Component } from "react";

const IS_DEV = typeof process !== "undefined" && process.env.NODE_ENV === "development";

/**
 * Class-based error boundary — the only reason this needs `use client` is
 * that componentDidCatch is a class lifecycle. Renders a calm reset screen
 * with a mailto link when any child throws.
 */
export default class FlipErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || String(error) };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error("[fos-crash]", error, errorInfo);
  }

  handleReset = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="fos-err">
        <style>{ERR_STYLES}</style>
        <div className="fos-err-inner">
          <svg width="120" height="120" viewBox="0 0 160 160" aria-hidden="true">
            <ellipse cx="80" cy="80" rx="70" ry="20" fill="none" stroke="#ef4444" strokeWidth="2" transform="rotate(-23 80 80)" />
            <ellipse cx="80" cy="86" rx="38" ry="36" fill="none" stroke="#ef4444" strokeWidth="2" />
            <line x1="56" y1="76" x2="68" y2="84" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="68" y1="76" x2="56" y2="84" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="92" y1="76" x2="104" y2="84" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="104" y1="76" x2="92" y2="84" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="62" y1="108" x2="98" y2="108" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          <h1 className="fos-err-head">SOMETHING BROKE</h1>
          <p className="fos-err-sub">the game crashed — let&apos;s reset</p>
          <button type="button" onClick={this.handleReset} className="fos-err-btn">
            RESTART GAME
          </button>
          <a href="mailto:david@loot.works?subject=loot.works%2Fflip%20crash" className="fos-err-mail">
            still broken? david@loot.works
          </a>
          {IS_DEV && this.state.errorMessage && (
            <pre className="fos-err-trace">{this.state.errorMessage}</pre>
          )}
        </div>
      </div>
    );
  }
}

const ERR_STYLES = `
.fos-err {
  position: relative; min-height: 100dvh;
  background:
    radial-gradient(ellipse 50% 40% at 50% 40%, rgba(239,68,68,0.08) 0%, transparent 60%),
    #000;
  display: flex; align-items: center; justify-content: center;
  padding: 32px; color: #fff; font-family: 'Outfit', sans-serif;
}
.fos-err-inner {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 12px; max-width: 480px;
}
.fos-err-head {
  font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 40px;
  color: #ef4444; margin: 8px 0 0; letter-spacing: 0.04em;
}
.fos-err-sub {
  font-family: 'Outfit', sans-serif; font-weight: 500; font-size: 16px;
  color: rgba(255,255,255,0.8); margin: 0 0 12px;
}
.fos-err-btn {
  width: 100%; max-width: 320px; height: 56px;
  background: #5CE0B8; color: #000; border: 0; cursor: pointer;
  font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 14px;
  letter-spacing: 0.22em;
}
.fos-err-mail {
  font-family: 'Outfit', sans-serif; font-size: 13px; color: #5CE0B8;
  text-decoration: underline; opacity: 0.8;
}
.fos-err-trace {
  font-family: ui-monospace, monospace; font-size: 11px; color: rgba(239,68,68,0.6);
  background: rgba(0,0,0,0.6); border: 1px solid rgba(239,68,68,0.3);
  padding: 12px; max-width: 100%; overflow-x: auto;
  text-align: left; white-space: pre-wrap;
}
`;
