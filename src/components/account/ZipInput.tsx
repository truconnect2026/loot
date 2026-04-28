"use client";

import { useState, useRef, useEffect } from "react";
import SettingsTile from "./SettingsTile";

interface ZipInputProps {
  value: string;
  onChange: (val: string) => void;
}

export default function ZipInput({ value, onChange }: ZipInputProps) {
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

  return (
    <SettingsTile onClick={!editing ? () => setEditing(true) : undefined}>
      <span
        style={{
          flex: 1,
          fontFamily: "var(--font-outfit), sans-serif",
          fontWeight: 600,
          fontSize: 13,
          color: "var(--text-primary)",
        }}
      >
        Zip code
      </span>
      <div
        style={{
          backgroundColor: "var(--bg-recessed)",
          borderRadius: 8,
          padding: "6px 12px",
          border: editing
            ? "1px solid var(--accent-mint-border)"
            : "1px solid transparent",
          boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
          transition: "border-color 150ms cubic-bezier(0.16, 1, 0.3, 1)",
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
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontWeight: 700,
              fontSize: 14,
              color: "var(--accent-mint)",
              textAlign: "center",
              padding: 0,
              fontFeatureSettings: '"tnum"',
            }}
          />
        ) : (
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontWeight: 700,
              fontSize: 14,
              color: "var(--accent-mint)",
              fontFeatureSettings: '"tnum"',
            }}
          >
            {value || "—"}
          </span>
        )}
      </div>
    </SettingsTile>
  );
}
