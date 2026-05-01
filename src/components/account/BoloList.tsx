"use client";

import { useState, useRef } from "react";

interface BoloListProps {
  keywords: string[];
  onAdd: (keyword: string) => void;
  onRemove: (index: number) => void;
  onBack: () => void;
}

function XIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent-red)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={18} y1={6} x2={6} y2={18} />
      <line x1={6} y1={6} x2={18} y2={18} />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--text-muted)"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <line x1={12} y1={5} x2={12} y2={19} />
      <line x1={5} y1={12} x2={19} y2={12} />
    </svg>
  );
}

export default function BoloList({ keywords, onAdd, onRemove, onBack }: BoloListProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startAdding() {
    setAdding(true);
    setDraft("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function commitAdd() {
    const trimmed = draft.trim();
    if (trimmed) {
      onAdd(trimmed);
    }
    setAdding(false);
    setDraft("");
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            display: "flex",
          }}
        >
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 15,
            color: "var(--text-primary)",
          }}
        >
          BOLO Keywords
        </span>
      </div>

      {/* Keyword tiles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {keywords.map((kw, i) => (
          <div
            key={`${kw}-${i}`}
            style={{
              height: 44,
              backgroundColor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
              boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              paddingLeft: 16,
              paddingRight: 12,
            }}
          >
            <span
              style={{
                flex: 1,
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            >
              {kw}
            </span>
            <button
              onClick={() => onRemove(i)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                display: "flex",
              }}
            >
              <XIcon />
            </button>
          </div>
        ))}

        {/* Add tile */}
        {adding ? (
          <div
            style={{
              height: 44,
              backgroundColor: "var(--bg-surface)",
              border: "1px dashed var(--accent-mint-border)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              paddingLeft: 16,
              paddingRight: 12,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitAdd}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitAdd();
                if (e.key === "Escape") {
                  setAdding(false);
                  setDraft("");
                }
              }}
              placeholder="keyword..."
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--text-primary)",
                padding: 0,
              }}
            />
          </div>
        ) : (
          <div
            onClick={startAdding}
            style={{
              height: 44,
              border: "1px dashed rgba(255,255,255,0.06)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <PlusIcon />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 10,
                color: "var(--text-muted)",
              }}
            >
              add keyword
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
