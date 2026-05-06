"use client";

import { useEffect, useRef, useState } from "react";
import BottomSheet from "@/components/shared/BottomSheet";
import { formatErrorMessage } from "@/lib/formatError";

/**
 * Flip Coach — Claude-backed chat advisor for resellers. Lives in an
 * 85vh BottomSheet with a sticky input bar at the foot. Free tier is
 * capped at 3 messages per local day via localStorage; the server is
 * stateless (no counter table).
 *
 * The initial assistant turn + suggested prompts render on mount —
 * they're never sent to the API. Users tapping a suggestion routes
 * through sendMessage() the same as a typed prompt.
 */

interface FlipCoachSheetProps {
  open: boolean;
  onClose: () => void;
  /** Fired when the user hits the daily free limit and taps the
   * upgrade CTA. The dashboard uses this to surface PaywallSheet. */
  onPaywall?: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const FREE_DAILY_LIMIT = 3;

const SUGGESTED_PROMPTS = [
  "What sells fast at Goodwill?",
  "How do I price vintage Pyrex?",
  "Is furniture worth flipping?",
  "Best items for beginners",
];

const INITIAL_GREETING =
  "Hey! I'm your flip coach. I can help with pricing, sourcing, spotting fakes, and anything about reselling. What are you working on?";

function todayKey(): string {
  const d = new Date();
  // Local YYYY-MM-DD key so the day rolls over at the user's
  // midnight, not UTC's.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `flipCoachCount_${y}-${m}-${day}`;
}

function readUsedCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(todayKey());
    const n = Number(raw ?? 0);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function bumpUsedCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const next = readUsedCount() + 1;
    window.localStorage.setItem(todayKey(), String(next));
    return next;
  } catch {
    return readUsedCount();
  }
}

function SaturnGlyph({
  size = 20,
  opacity = 0.5,
}: {
  size?: number;
  opacity?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5CE0B8"
      strokeOpacity={opacity}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx={12} cy={12} r={5} />
      <ellipse cx={12} cy={12} rx={10} ry={3.5} transform="rotate(-20 12 12)" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5CE0B8"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={12} y1={19} x2={12} y2={5} />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

export default function FlipCoachSheet({
  open,
  onClose,
  onPaywall,
}: FlipCoachSheetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [usedToday, setUsedToday] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Monotonic counter for chat-message IDs. Refs are pure under the
  // react-hooks/purity rule, while Date.now()/randomUUID() get
  // flagged. Bumped on every send.
  const msgIdRef = useRef(0);

  // Reset on every open — chat history is session-local. Each open
  // is a fresh conversation; the cross-session limit is the only
  // state that persists.
  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setMessages([]);
      setInput("");
      setSending(false);
      setUsedToday(readUsedCount());
    });
  }, [open]);

  // Auto-scroll the chat to the bottom whenever messages change so
  // the user always sees the latest reply without manually scrolling.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const exhausted = usedToday >= FREE_DAILY_LIMIT;

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending || exhausted) return;
    const userMsg: ChatMessage = {
      id: `u-${msgIdRef.current++}`,
      role: "user",
      content: trimmed,
    };
    // Optimistic append. The history we pass to the API is the
    // pre-userMsg array — Claude SDK expects the active turn to be
    // the latest in `messages` while history holds prior context;
    // here we model it identically with `message` separate from
    // `history` per the route contract.
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/flip-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = (await res.json()) as
        | { response: string }
        | { error: string };
      if (!res.ok || "error" in data) {
        throw new Error(
          "error" in data ? data.error : `Coach failed (${res.status})`,
        );
      }
      const assistantMsg: ChatMessage = {
        id: `a-${msgIdRef.current++}`,
        role: "assistant",
        content: data.response,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setUsedToday(bumpUsedCount());
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `a-err-${msgIdRef.current++}`,
        role: "assistant",
        content:
          err instanceof Error
            ? formatErrorMessage(err.message)
            : "something went wrong — try again",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} borderColor="#5CE0B8">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "85vh",
          maxHeight: "85vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 18px 10px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: 10,
              color: "#5CE0B8",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
            }}
          >
            FLIP COACH
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "#5A4E70",
              marginTop: 2,
            }}
          >
            your AI reselling expert
          </div>
        </div>

        {/* Chat scroll area */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 16px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
          className="loot-carousel"
        >
          {/* Initial greeting + suggested prompts — always rendered
              first; never sent to the API. */}
          <CoachBubble content={INITIAL_GREETING} />
          {messages.length === 0 && (
            <div
              style={{
                marginLeft: 28,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => sendMessage(p)}
                  disabled={sending || exhausted}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 16,
                    backgroundColor: "rgba(92,224,184,0.06)",
                    border: "1px solid rgba(92,224,184,0.12)",
                    color: "#5CE0B8",
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: 9,
                    fontWeight: 600,
                    cursor: sending || exhausted ? "default" : "pointer",
                    opacity: sending || exhausted ? 0.5 : 1,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <UserBubble key={m.id} content={m.content} />
            ) : (
              <CoachBubble key={m.id} content={m.content} />
            ),
          )}

          {sending && <TypingBubble />}
        </div>

        {/* Sticky input bar */}
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "rgba(18,14,24,0.95)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {exhausted ? (
            <button
              type="button"
              onClick={onPaywall}
              style={{
                width: "100%",
                padding: 12,
                backgroundColor: "transparent",
                border: "1px solid rgba(212,165,116,0.20)",
                borderRadius: 10,
                color: "#D4A574",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              upgrade to Pro for unlimited coaching
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage(input);
                }}
                placeholder="ask about flipping..."
                disabled={sending}
                style={{
                  flex: 1,
                  height: 40,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 20,
                  padding: "10px 16px",
                  outline: "none",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "#C8C0D8",
                }}
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={sending || !input.trim()}
                aria-label="Send"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "rgba(92,224,184,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: sending || !input.trim() ? "default" : "pointer",
                  opacity: sending || !input.trim() ? 0.4 : 1,
                  flexShrink: 0,
                }}
              >
                <ArrowUpIcon />
              </button>
            </div>
          )}
          <style>{`@keyframes coachPulse { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }`}</style>
        </div>
      </div>
    </BottomSheet>
  );
}

function CoachBubble({ content }: { content: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        maxWidth: "85%",
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 2 }}>
        <SaturnGlyph size={20} opacity={0.5} />
      </span>
      <div
        style={{
          backgroundColor: "rgba(92,224,184,0.05)",
          borderRadius: "14px 14px 14px 4px",
          // Mint left rule = "quoted reply" feel; matches the coach
          // identity color. Drop shadow gives bubbles physical lift
          // off the chat surface.
          borderLeft: "2px solid rgba(92,224,184,0.15)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          padding: 12,
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "#C8C0D8",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
        }}
      >
        {content}
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div
      style={{
        alignSelf: "flex-end",
        maxWidth: "85%",
        backgroundColor: "rgba(123,143,255,0.10)",
        borderRadius: "14px 14px 4px 14px",
        // Periwinkle right rule mirrors the coach's left rule but in
        // the user's identity color.
        borderRight: "2px solid rgba(123,143,255,0.15)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        padding: 12,
        fontFamily: "var(--font-body)",
        fontSize: 13,
        color: "#C8C0D8",
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
      }}
    >
      {content}
    </div>
  );
}

// Typing indicator — same bubble shape as a coach message but with
// three pulsing mint dots instead of text. The stagger (0/0.2/0.4s)
// matches the splash loading dots so the loading vocabulary stays
// consistent across the app.
function TypingBubble() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        maxWidth: "85%",
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 2 }}>
        <SaturnGlyph size={20} opacity={0.5} />
      </span>
      <div
        style={{
          backgroundColor: "rgba(92,224,184,0.05)",
          borderRadius: "14px 14px 14px 4px",
          borderLeft: "2px solid rgba(92,224,184,0.15)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          padding: "14px 14px",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {[0, 0.2, 0.4].map((d, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              backgroundColor: "#5CE0B8",
              animation: `typingDotPulse 1.4s ease-in-out infinite`,
              animationDelay: `${d}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes typingDotPulse {
          0%, 60%, 100% { opacity: 0.15; }
          30% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
