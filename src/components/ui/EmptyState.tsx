"use client";

import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  headline: string;
  body?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, headline, body, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        gap: 12,
        animation: "fadeInUp 350ms cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      {icon && (
        <div
          style={{
            color: "rgba(200,192,216,0.20)",
            marginBottom: 4,
          }}
        >
          {icon}
        </div>
      )}
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: 15,
          color: "var(--text-primary)",
          lineHeight: 1.3,
        }}
      >
        {headline}
      </div>
      {body && (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--text-muted)",
            lineHeight: 1.5,
            maxWidth: 260,
          }}
        >
          {body}
        </div>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
