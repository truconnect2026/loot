"use client";

import { useState } from "react";

interface ApplicationRow {
  id: string;
  name: string;
  email: string;
  primary_platform: string | null;
  follower_count: string | null;
  handle: string | null;
  channel_url: string | null;
  notes: string | null;
  status: "pending" | "reviewing" | "approved" | "rejected";
  reviewed_at: string | null;
  reviewed_by: string | null;
  notes_internal: string | null;
  submitted_at: string;
}

type Status = ApplicationRow["status"];

const STATUS_COLORS: Record<Status, string> = {
  pending: "#F5C518",
  reviewing: "#3B82F6",
  approved: "#5CE0B8",
  rejected: "#ef4444",
};

export default function ReviewClient({ rows }: { rows: ApplicationRow[] }) {
  const [items, setItems] = useState<ApplicationRow[]>(rows);
  const [filter, setFilter] = useState<Status | "all">("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = filter === "all" ? items : items.filter((r) => r.status === filter);
  const counts: Record<Status, number> = {
    pending: items.filter((r) => r.status === "pending").length,
    reviewing: items.filter((r) => r.status === "reviewing").length,
    approved: items.filter((r) => r.status === "approved").length,
    rejected: items.filter((r) => r.status === "rejected").length,
  };

  async function review(id: string, status: Status, notesInternal?: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/founding20/${id}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, notes_internal: notesInternal ?? null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      setItems((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                reviewed_at: new Date().toISOString(),
                notes_internal: notesInternal ?? r.notes_internal,
              }
            : r,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 24px 96px",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Founding 20 — applications</h1>
      <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 24, fontSize: 14 }}>
        Approved spots flow into the live counter on /kit. Approve cautiously.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {(["pending", "reviewing", "approved", "rejected", "all"] as const).map((s) => {
          const active = filter === s;
          const count = s === "all" ? items.length : counts[s as Status];
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              style={{
                padding: "8px 14px",
                border: `1px solid ${active ? "#5CE0B8" : "rgba(255,255,255,0.15)"}`,
                background: active ? "rgba(92,224,184,0.1)" : "transparent",
                color: active ? "#5CE0B8" : "rgba(255,255,255,0.7)",
                fontFamily: "ui-monospace, monospace",
                fontSize: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: 6,
              }}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: 12,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.4)",
            color: "#ef4444",
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {visible.length === 0 && (
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
          No applications in this bucket.
        </p>
      )}

      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {visible.map((r) => (
          <Row key={r.id} row={r} busy={busy === r.id} onReview={review} />
        ))}
      </ul>
    </main>
  );
}

function Row({
  row,
  busy,
  onReview,
}: {
  row: ApplicationRow;
  busy: boolean;
  onReview: (id: string, status: Status, notesInternal?: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(row.notes_internal ?? "");
  return (
    <li
      style={{
        padding: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div>
          <strong style={{ fontSize: 16 }}>{row.name}</strong>{" "}
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>· {row.email}</span>
        </div>
        <span
          style={{
            padding: "3px 10px",
            background: `${STATUS_COLORS[row.status]}20`,
            border: `1px solid ${STATUS_COLORS[row.status]}`,
            color: STATUS_COLORS[row.status],
            fontSize: 10,
            fontFamily: "ui-monospace, monospace",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            borderRadius: 4,
          }}
        >
          {row.status}
        </span>
      </div>

      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "4px 16px",
          fontSize: 13,
          margin: "12px 0",
          color: "rgba(255,255,255,0.75)",
        }}
      >
        {row.primary_platform && (
          <>
            <dt style={{ color: "rgba(255,255,255,0.4)" }}>platform</dt>
            <dd>{row.primary_platform}</dd>
          </>
        )}
        {row.follower_count && (
          <>
            <dt style={{ color: "rgba(255,255,255,0.4)" }}>followers</dt>
            <dd>{row.follower_count}</dd>
          </>
        )}
        {row.handle && (
          <>
            <dt style={{ color: "rgba(255,255,255,0.4)" }}>handle</dt>
            <dd>{row.handle}</dd>
          </>
        )}
        {row.channel_url && (
          <>
            <dt style={{ color: "rgba(255,255,255,0.4)" }}>url</dt>
            <dd>
              <a href={row.channel_url} target="_blank" rel="noopener noreferrer" style={{ color: "#5CE0B8" }}>
                {row.channel_url}
              </a>
            </dd>
          </>
        )}
        {row.notes && (
          <>
            <dt style={{ color: "rgba(255,255,255,0.4)" }}>note</dt>
            <dd style={{ fontStyle: "italic" }}>{row.notes}</dd>
          </>
        )}
        <dt style={{ color: "rgba(255,255,255,0.4)" }}>submitted</dt>
        <dd style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
          {new Date(row.submitted_at).toLocaleString()}
        </dd>
      </dl>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="internal notes (optional, not visible to applicant)"
        rows={2}
        style={{
          width: "100%",
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
          padding: 8,
          fontSize: 13,
          fontFamily: "system-ui, sans-serif",
          borderRadius: 6,
          resize: "vertical",
          marginBottom: 8,
        }}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" disabled={busy} onClick={() => onReview(row.id, "approved", notes)} style={btnStyle("#5CE0B8")}>
          Approve
        </button>
        <button type="button" disabled={busy} onClick={() => onReview(row.id, "reviewing", notes)} style={btnStyle("#3B82F6")}>
          Reviewing
        </button>
        <button type="button" disabled={busy} onClick={() => onReview(row.id, "rejected", notes)} style={btnStyle("#ef4444")}>
          Reject
        </button>
        <button type="button" disabled={busy} onClick={() => onReview(row.id, "pending", notes)} style={btnStyle("rgba(255,255,255,0.4)")}>
          Reset
        </button>
      </div>
    </li>
  );
}

function btnStyle(color: string): React.CSSProperties {
  return {
    padding: "6px 14px",
    border: `1px solid ${color}`,
    background: "transparent",
    color,
    fontFamily: "ui-monospace, monospace",
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    cursor: "pointer",
    borderRadius: 6,
  };
}
