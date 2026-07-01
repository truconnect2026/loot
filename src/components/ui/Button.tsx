"use client";

import { useState, type ReactNode, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  children,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "11px 20px",
    borderRadius: 12,
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    fontSize: 14,
    letterSpacing: "0.01em",
    cursor: disabled ? "default" : "pointer",
    border: "none",
    outline: "none",
    userSelect: "none",
    transition: "transform 80ms cubic-bezier(0.16,1,0.3,1), opacity 80ms ease",
    transform: pressed ? "scale(0.975) translateY(1px)" : "scale(1)",
    opacity: disabled ? 0.45 : 1,
    ...style,
  };

  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: "#17122A",
      backgroundImage: pressed
        ? "linear-gradient(rgba(255,255,255,0.14), rgba(255,255,255,0.14))"
        : "linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)",
      color: "#E8E0F0",
      boxShadow: [
        "inset 0 1px 0 0 rgba(255,255,255,0.10)",
        "0 1px 3px rgba(0,0,0,0.25)",
        "0 4px 12px -2px rgba(0,0,0,0.30)",
      ].join(", "),
      border: "1px solid rgba(255,255,255,0.10)",
    },
    secondary: {
      backgroundColor: "transparent",
      backgroundImage: "none",
      color: "var(--text-primary)",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
      border: "1px solid rgba(255,255,255,0.10)",
    },
    ghost: {
      backgroundColor: "transparent",
      backgroundImage: "none",
      color: "var(--text-muted)",
      boxShadow: "none",
      border: "1px solid transparent",
    },
  };

  return (
    <button
      {...rest}
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{ ...base, ...variants[variant] }}
    >
      {children}
    </button>
  );
}
