"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import SettingsTile from "./SettingsTile";

interface ZipInputProps {
  value: string;
  /**
   * Called on a successful blur-commit with a valid 5-digit zip. May
   * return void or a Promise — when async, the component awaits it
   * before flipping into the "saved" feedback state, so the
   * checkmark only appears after the parent's persistence step
   * actually resolves.
   */
  onChange: (val: string) => void | Promise<void>;
  icon?: ReactNode;
  accentColor?: string;
}

type Status = "idle" | "saving" | "saved" | "error";

export default function ZipInput({
  value,
  onChange,
  icon,
  accentColor,
}: ZipInputProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<Status>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const statusTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Keep draft synced when the parent pushes a fresh value (e.g.,
  // first profile load after the page mounts, or another tab updates
  // the row). Without this, draft would stick to whatever was first
  // rendered and the chip would show a stale number. queueMicrotask
  // defers the setState past the synchronous effect body so the
  // react-hooks/set-state-in-effect rule is satisfied.
  useEffect(() => {
    queueMicrotask(() => setDraft(value));
  }, [value]);

  // Tear down any pending status timer when the component unmounts —
  // otherwise setState could fire after unmount and React would warn.
  useEffect(() => {
    return () => {
      if (statusTimerRef.current !== null) {
        window.clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  function flashStatus(next: Status, holdMs: number) {
    if (statusTimerRef.current !== null) {
      window.clearTimeout(statusTimerRef.current);
    }
    setStatus(next);
    statusTimerRef.current = window.setTimeout(() => {
      setStatus("idle");
      statusTimerRef.current = null;
    }, holdMs);
  }

  async function commit() {
    setEditing(false);
    const trimmed = draft.trim();

    // Empty + no prior value: silent no-op so a tap-into-empty-and-
    // tap-out doesn't fire an "error" the user didn't earn.
    if (!trimmed) {
      setDraft(value);
      return;
    }

    // Same as current value: no save, no feedback. The user typed
    // the same zip back; nothing to confirm.
    if (trimmed === value) {
      return;
    }

    // Validation: exactly 5 ASCII digits. inputMode="numeric" +
    // maxLength=5 already keeps mobile keyboards numeric, but a
    // desktop user could paste anything in.
    if (!/^\d{5}$/.test(trimmed)) {
      flashStatus("error", 3000);
      // Don't revert the draft — keep what the user typed visible
      // so they can fix it. The chip closes (editing=false) but
      // tapping back in shows their bad input rather than a reset.
      return;
    }

    setStatus("saving");
    try {
      await onChange(trimmed);
      flashStatus("saved", 2000);
    } catch {
      flashStatus("error", 3000);
    }
  }

  const isEmpty = !value;

  return (
    <div>
      <SettingsTile
        onClick={!editing ? () => setEditing(true) : undefined}
        icon={icon}
        accentColor={accentColor}
      >
        <span
          style={{
            flex: 1,
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 13,
            color: "var(--text-primary)",
          }}
        >
          Zip code
        </span>

        {/* Saved checkmark — fades in to the left of the chip when
            a save resolves, fades out 2s later. Always rendered so
            the opacity transition can run both directions; the icon
            takes no layout space when transparent because flex
            children with opacity:0 still occupy width. We use a
            visibility:hidden fallback via width:0 to keep the chip
            position stable. Actually simpler: keep it inside its own
            fixed-width slot so the chip never shifts. */}
        <span
          aria-hidden={status !== "saved"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: status === "saved" ? 22 : 0,
            marginRight: status === "saved" ? 6 : 0,
            color: "var(--money)",
            opacity: status === "saved" ? 1 : 0,
            transition:
              "opacity 200ms cubic-bezier(0.16, 1, 0.3, 1), width 200ms cubic-bezier(0.16, 1, 0.3, 1), margin-right 200ms cubic-bezier(0.16, 1, 0.3, 1)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <CheckIcon />
        </span>

        <div
          data-cell-flash=""
          style={{
            backgroundColor: "var(--bg-recessed)",
            borderRadius: "3px 8px 8px 8px",
            padding: "6px 12px",
            border: editing
              ? "1px solid var(--ui-border-focus)"
              : "1px solid transparent",
            boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
            transition:
              "border-color 150ms cubic-bezier(0.16, 1, 0.3, 1), background-color 120ms ease-out",
          }}
        >
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
              }}
              style={{
                // Width bumped 52 → 64 to keep 5 digits comfortable
                // at the 16px font (was 13).
                width: 64,
                background: "none",
                border: "none",
                outline: "none",
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                // 16px minimum — iOS Safari auto-zooms into any input
                // below 16, which yanks the layout when the user taps
                // into the chip. 16 keeps focus calm.
                fontSize: 16,
                // Zip is a number, not money. Interactive value → white.
                color: "var(--ui-primary)",
                textAlign: "center",
                padding: 0,
                fontFeatureSettings: '"tnum"',
              }}
            />
          ) : isEmpty ? (
            <span
              style={{
                // Match the filled-state value font (13 / 700) so the empty
                // "Add zip" chip looks like a value chip waiting to be filled,
                // not a separate button-style affordance. Same chip language
                // as the radius "15 mi" cell.
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 13,
                color: "var(--ui-primary)",
              }}
            >
              Add zip
            </span>
          ) : (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 13,
                color: "var(--ui-primary)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              {value}
            </span>
          )}
        </div>
      </SettingsTile>

      {/* Inline error — sits 6px below the tile, in muted red, fades
          when status flips back to idle. role="alert" gives screen
          readers a polite cue that something invalid was entered. */}
      <div
        role="alert"
        style={{
          marginTop: status === "error" ? 6 : 0,
          maxHeight: status === "error" ? 20 : 0,
          paddingLeft: 14,
          fontFamily: "var(--font-body)",
          fontSize: 11,
          fontWeight: 500,
          color: "rgba(232,99,107,0.85)",
          opacity: status === "error" ? 1 : 0,
          overflow: "hidden",
          transition:
            "opacity 200ms cubic-bezier(0.16, 1, 0.3, 1), max-height 200ms cubic-bezier(0.16, 1, 0.3, 1), margin-top 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        enter a 5-digit zip
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
