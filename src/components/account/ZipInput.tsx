"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import SettingsTile from "./SettingsTile";

interface ZipInputProps {
  value: string;
  onChange: (val: string) => void;
  icon?: ReactNode;
  accentColor?: string;
}

export default function ZipInput({
  value,
  onChange,
  icon,
  accentColor,
}: ZipInputProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    if (draft.trim()) {
      onChange(draft.trim());
    } else {
      setDraft(value);
    }
  }

  // Empty state shows "Add zip" in mint to signal interactivity, replacing
  // the previous neutral em-dash that read as "no value, no action."
  const isEmpty = !value;

  return (
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
              width: 52,
              background: "none",
              border: "none",
              outline: "none",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 13,
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
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: 12,
              // "Add zip" is an interactive prompt, not currency. White
              // signals "tap me" without false-flagging money.
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
  );
}
