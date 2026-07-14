"use client";

import { useEffect, useRef, useState } from "react";
import BottomSheet from "@/components/shared/BottomSheet";
import FlipCoyote, { type FlipCoyoteMood } from "@/components/shared/FlipCoyote";
import { formatErrorMessage } from "@/lib/formatError";

/**
 * Flip Coach — Claude-backed chat advisor for resellers. Lives in a
 * BottomSheet anchored at the dashboard bottom edge. Pro-only feature:
 * the server (/api/flip-coach) returns 401 for anonymous and 403 for
 * free users (FREE_SCAN_LIMIT = 0 — the free tier gets nothing that
 * spends). On that gate response the sheet surfaces the paywall, the
 * same PaywallSheet path the scan surfaces use — there is no free-tier
 * message counter.
 *
 * Character-led redesign:
 *   - Header: FlipCoyote 60px + "FLIP COACH" wordmark + close X
 *   - Coach bubbles: black/85 bg, full mint border, JBMono 13px mint
 *     text (matches the /flip game's SpeechBubble aesthetic); a small
 *     FlipCoyote 28px sits as the avatar
 *   - User bubbles: white/10 bg, Outfit 14px white text, no border
 *     ornament (their messages are interjections, not statements)
 *   - Drag handle: mint #5CE0B8 at 40×4 via BottomSheet's handleColor
 *     + handleWidth props
 *   - Mood state: detectMood() runs on every message change, header
 *     + every bubble avatar sync to the same mood (the latest
 *     conversation state)
 *   - Persistence: chat history hydrates from localStorage on open,
 *     appends on each message exchange, capped at 20 turns. Replaces
 *     the prior reset-on-open behavior so users return to where they
 *     left off
 *
 * Initial greeting + suggested prompts render on mount when the
 * persisted history is empty — they're never sent to the API. Users
 * tapping a suggestion routes through sendMessage() the same as a
 * typed prompt.
 */

interface FlipCoachSheetProps {
  open: boolean;
  onClose: () => void;
  /** Fired when an authenticated free user hits the Pro gate (403).
   * The parent surfaces PaywallSheet. */
  onPaywall?: () => void;
  /** Fired when a logged-out visitor hits the gate (401). The parent
   * closes the sheet and routes them to signup/login — a subscribe
   * CTA is a dead end without an account. */
  onSignup?: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "What sells fast at Goodwill?",
  "How do I price vintage Pyrex?",
  "Is furniture worth flipping?",
  "Best items for beginners",
];

const INITIAL_GREETING =
  "Hey! I'm your flip coach. I can help with pricing, sourcing, spotting fakes, and anything about reselling. What are you working on?";

// localStorage key for persisted chat history. Single global key
// (not per-user) — the dashboard already gates access behind an
// authed session, so the only person who sees this history is its
// owner. Cap of 20 turns matches the server-side history limit in
// /api/flip-coach so we never persist more than we can send.
const HISTORY_KEY = "flipCoach_history";
const HISTORY_CAP = 20;

function readHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray((parsed as { messages?: unknown }).messages)
    ) {
      return [];
    }
    return ((parsed as { messages: ChatMessage[] }).messages).slice(
      -HISTORY_CAP,
    );
  } catch {
    return [];
  }
}

function writeHistory(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    const capped = messages.slice(-HISTORY_CAP);
    window.localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify({ messages: capped }),
    );
  } catch {
    /* private mode or quota exceeded — best effort */
  }
}

// Pure mood detection. Runs on every message change to drive the
// header + bubble avatar mood. Default smirk when there are no
// messages yet (fresh open with no history). Regexes are
// case-insensitive and word-bounded so partial matches inside other
// words don't trigger ("printer" won't fire on the "print" keyword).
function detectMood(messages: ChatMessage[]): FlipCoyoteMood {
  if (messages.length === 0) return "smirk";

  // Walk from newest backward to pick up the most recent
  // user/assistant pair. Either may be missing if the conversation
  // is mid-flight.
  let lastUser = "";
  let lastAssistant = "";
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!lastAssistant && m.role === "assistant") lastAssistant = m.content;
    if (!lastUser && m.role === "user") lastUser = m.content;
    if (lastUser && lastAssistant) break;
  }

  if (/\b(idk|wyd|lol|hi|test|hello|sup)\b/i.test(lastUser)) return "dead";
  if (/\b(can't help|off topic|not sure|try again)\b/i.test(lastAssistant)) {
    return "dead";
  }
  if (
    /\b(wolf|fire|grail|ship it|print|cook|stack|bag)\b/i.test(lastAssistant) ||
    lastAssistant.includes("🐺")
  ) {
    return "hyped";
  }
  if (
    /\b(maybe|depends|careful|skip|watch|risky|mid|meh)\b/i.test(lastAssistant)
  ) {
    return "sideeye";
  }
  return "smirk";
}

function ArrowUpIcon({ color = "#000" }: { color?: string }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={12} y1={19} x2={12} y2={5} />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={18} y1={6} x2={6} y2={18} />
      <line x1={6} y1={6} x2={18} y2={18} />
    </svg>
  );
}

export default function FlipCoachSheet({
  open,
  onClose,
  onPaywall,
  onSignup,
}: FlipCoachSheetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  // Hydration gate — prevents the persist effect below from
  // overwriting localStorage with the initial empty messages array
  // during the brief window between component mount and the
  // queueMicrotask hydration callback. Reset on close so each open
  // re-hydrates fresh.
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Monotonic counter for chat-message IDs. Refs are pure under the
  // react-hooks/purity rule, while Date.now()/randomUUID() get
  // flagged. Bumped on every send.
  const msgIdRef = useRef(0);

  // Hydrate persisted chat history on every open. Replaces the prior
  // reset-on-open behavior — users return to whatever conversation
  // they last had.
  useEffect(() => {
    if (!open) {
      setHydrated(false);
      return;
    }
    queueMicrotask(() => {
      const hist = readHistory();
      setMessages(hist);
      // Seed the ID counter past the highest persisted ID so new
      // appends never collide with hydrated messages on React keys.
      msgIdRef.current = hist.length;
      setInput("");
      setSending(false);
      setHydrated(true);
    });
  }, [open]);

  // Persist on every message-list change (after hydration completes).
  // The writeHistory call caps to HISTORY_CAP internally so the
  // localStorage footprint stays bounded regardless of how many turns
  // the user has sent.
  useEffect(() => {
    if (!open || !hydrated) return;
    writeHistory(messages);
  }, [messages, open, hydrated]);

  // Auto-scroll the chat to the bottom whenever messages change so
  // the user always sees the latest reply without manually scrolling.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  // Mood derives from the current message list — recomputed on every
  // render. detectMood is a pure pass over the last user + assistant
  // messages and runs in O(n) over the (small, capped at 20) list.
  const mood = detectMood(messages);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
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
      // Pro gate — split the two cases. Roll back the optimistic user
      // message either way so the chat stays clean.
      //   403 (authenticated free user) → paywall (upgrade to Pro).
      //   401 (no session)              → signup/login. A subscribe CTA
      //     they can't complete without an account would be a dead end.
      if (res.status === 403) {
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        onPaywall?.();
        return;
      }
      if (res.status === 401) {
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        onSignup?.();
        return;
      }
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
    <BottomSheet
      open={open}
      onClose={onClose}
      borderColor="#5CE0B8"
      handleColor="#5CE0B8"
      handleWidth={40}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          // Fixed 78vh — sits within BottomSheet's 85vh panel cap
          // even after subtracting ~30px for the drag handle and
          // the sheet's own borders, so the input bar at the bottom
          // of this container always renders inside the visible
          // viewport instead of getting clipped under the keyboard
          // safe-area on shorter devices.
          height: "78vh",
        }}
      >
        {/* Header — character + wordmark + close. The FlipCoyote
            mood here syncs with the bubble avatars so the entire
            sheet reads as one creature reacting to the conversation. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 18px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <FlipCoyote mood={mood} size={60} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: 16,
                color: "#5CE0B8",
                letterSpacing: "0.15em",
                lineHeight: 1,
              }}
            >
              KRONOS COACH
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "#5A4E70",
                marginTop: 6,
              }}
            >
              your AI reselling expert
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Kronos Coach"
            style={{
              width: 36,
              height: 36,
              minWidth: 36,
              minHeight: 36,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.55)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              padding: 0,
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Chat scroll area — flex: 1 with min-height: 0 so the
            container can actually shrink below its content height
            and scroll. Without min-height: 0, flexbox treats the
            content as the floor and overflow:auto never engages. */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "12px 16px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            gap: 10,
          }}
          className="loot-carousel"
        >
          {/* Initial greeting + suggested prompts — always rendered
              first; never sent to the API. Suggested prompts only
              when there's no persisted history (otherwise the user
              is mid-conversation and a chip row would be noise). */}
          <CoachBubble content={INITIAL_GREETING} mood={mood} />
          {messages.length === 0 && (
            <div
              style={{
                marginLeft: 36,
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
                  disabled={sending}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 16,
                    backgroundColor: "rgba(92,224,184,0.06)",
                    border: "1px solid rgba(92,224,184,0.12)",
                    color: "#5CE0B8",
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 9,
                    fontWeight: 600,
                    cursor: sending ? "default" : "pointer",
                    opacity: sending ? 0.5 : 1,
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
              <CoachBubble key={m.id} content={m.content} mood={mood} />
            ),
          )}

          {sending && <TypingBubble mood={mood} />}
        </div>

        {/* Sticky input bar — position sticky + bottom 0 + zIndex 10
            so the bar pins to the visible viewport edge even when the
            iOS keyboard slides in and the sheet content shifts. */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            zIndex: 10,
            padding: "12px 16px",
            backgroundColor: "rgba(18,14,24,0.95)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            // Home-indicator clearance on iPhone — env() is 0px on
            // devices without one, so this is a no-op everywhere
            // else. Padding-bottom keeps the input above the
            // indicator's safe-area instead of sitting under it.
            paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage(input);
                }}
                onFocus={() => {
                  // iOS keyboard takes ~300ms to fully open. Once it
                  // settles, snap the chat scroll to the bottom so
                  // the latest message stays visible above the bar
                  // instead of being hidden behind the keyboard.
                  window.setTimeout(() => {
                    const el = scrollRef.current;
                    if (el) el.scrollTop = el.scrollHeight;
                  }, 300);
                }}
                placeholder="ask about flipping..."
                disabled={sending}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 22,
                  padding: "10px 16px",
                  outline: "none",
                  fontFamily: "var(--font-body)",
                  // iOS auto-zooms text inputs below 16px on focus,
                  // which broke the fixed dashboard layout. 16px
                  // suppresses that zoom path.
                  fontSize: 16,
                  color: "#C8C0D8",
                }}
              />
              {/* Send button — full mint bg + black icon, matching
                  the /flip CTA aesthetic (mint surface, black ink).
                  Disabled-or-empty drops to 40% opacity for the
                  obvious affordance state. */}
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={sending || !input.trim()}
                aria-label="Send"
                style={{
                  // 44×44 minimum tap target per Apple HIG.
                  minWidth: 44,
                  minHeight: 44,
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "#5CE0B8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: sending || !input.trim() ? "default" : "pointer",
                  opacity: sending || !input.trim() ? 0.4 : 1,
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                <ArrowUpIcon color="#000" />
              </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

// Coach bubble — black/85 surface, full mint border, mint JBMono
// text. Matches the /flip game's SpeechBubble aesthetic so a player
// arriving at coach from /flip recognizes the voice. FlipCoyote
// avatar at 28px on the left, mood-synced to the sheet's current
// state.
function CoachBubble({
  content,
  mood,
}: {
  content: string;
  mood: FlipCoyoteMood;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        maxWidth: "85%",
      }}
    >
      {/* marginTop:0 seats the head+shoulders portrait's face on the
          bubble's first line (matches FlipBubble; old art used a nudge). */}
      <span style={{ flexShrink: 0, marginTop: 0 }}>
        <FlipCoyote mood={mood} size={28} />
      </span>
      <div
        style={{
          backgroundColor: "rgba(0,0,0,0.85)",
          border: "1px solid #5CE0B8",
          borderRadius: "10px 10px 10px 2px",
          padding: "10px 12px",
          fontFamily: "var(--font-space-mono)",
          fontSize: 13,
          color: "#5CE0B8",
          lineHeight: 1.4,
          letterSpacing: "0.01em",
          whiteSpace: "pre-wrap",
        }}
      >
        {content}
      </div>
    </div>
  );
}

// User bubble — white/10 glass, Outfit 14px white text, no border
// decoration. The user's voice is a quiet interjection in Flip's
// conversation, not a stylized statement of its own.
function UserBubble({ content }: { content: string }) {
  return (
    <div
      style={{
        alignSelf: "flex-end",
        maxWidth: "85%",
        backgroundColor: "rgba(255,255,255,0.10)",
        borderRadius: "14px 14px 4px 14px",
        padding: 12,
        fontFamily: "var(--font-body)",
        fontSize: 14,
        color: "rgba(255,255,255,0.95)",
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
      }}
    >
      {content}
    </div>
  );
}

// Typing indicator — same shape as a coach message but three pulsing
// mint dots instead of text. The stagger (0/0.2/0.4s) matches the
// splash loading dots so the loading vocabulary stays consistent
// across the app. FlipCoyote avatar uses the same current mood so
// the visual identity stays coherent during the wait.
function TypingBubble({ mood }: { mood: FlipCoyoteMood }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        maxWidth: "85%",
      }}
    >
      {/* marginTop:0 seats the head+shoulders portrait's face on the
          bubble's first line (matches FlipBubble; old art used a nudge). */}
      <span style={{ flexShrink: 0, marginTop: 0 }}>
        <FlipCoyote mood={mood} size={28} />
      </span>
      <div
        style={{
          backgroundColor: "rgba(0,0,0,0.85)",
          border: "1px solid #5CE0B8",
          borderRadius: "10px 10px 10px 2px",
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
