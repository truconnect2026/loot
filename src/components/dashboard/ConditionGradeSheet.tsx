"use client";

import { useEffect, useRef, useState } from "react";
import BottomSheet from "@/components/shared/BottomSheet";
import type {
  ConditionGrade,
  ConditionGradeResult,
} from "@/lib/claude";
import { formatErrorMessage } from "@/lib/formatError";

/**
 * Condition Grade sheet — Pro-only multi-image AI grading. Capture
 * up to 6 photos (front / back / label / damage close-ups), POST to
 * /api/condition-grade, render the 5-tier letter + flaws + price
 * impact. The capture grid uses a hidden file input so users can
 * either snap a photo or pull from gallery — gallery access is the
 * primary mode for grading items already in hand.
 */

interface ConditionGradeSheetProps {
  open: boolean;
  onClose: () => void;
  onPaywall?: () => void;
  /** Fired when a logged-out visitor hits the gate (401). The parent
   * closes the sheet and routes them to signup/login — mirrors
   * FlipCoachSheet's onSignup. */
  onSignup?: () => void;
}

type Status = "idle" | "loading" | "loaded" | "error";

interface ApiError {
  error: string;
}

const MAX_PHOTOS = 6;

// Letter color + tint per grade tier. MINT/EXCELLENT trend mint;
// FAIR/POOR trend red; GOOD sits at camel as the neutral middle.
const GRADE_COLOR: Record<ConditionGrade, string> = {
  MINT: "#5CE0B8",
  EXCELLENT: "rgba(92,224,184,0.8)",
  GOOD: "#D4A574",
  FAIR: "rgba(232,99,107,0.7)",
  POOR: "#E8636B",
};

export default function ConditionGradeSheet({
  open,
  onClose,
  onPaywall,
  onSignup,
}: ConditionGradeSheetProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ConditionGradeResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset on open so the previous result/photos don't leak into the
  // next session. queueMicrotask satisfies the
  // react-hooks/set-state-in-effect rule by deferring the writes
  // past the synchronous effect body.
  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setPhotos([]);
      setStatus("idle");
      setErrorMsg(null);
      setResult(null);
    });
  }, [open]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      setPhotos((prev) =>
        prev.length >= MAX_PHOTOS ? prev : [...prev, dataUrl],
      );
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submitGrade() {
    if (photos.length === 0) return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/condition-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: photos }),
      });
      if (res.status === 401) {
        // No session — route to signup/login instead of an error
        // state (a subscribe CTA is a dead end without an account).
        onSignup?.();
        onClose();
        return;
      }
      if (res.status === 403) {
        // Pro paywall — bubble up to caller.
        onPaywall?.();
        onClose();
        return;
      }
      const data = (await res.json()) as ConditionGradeResult | ApiError;
      if (!res.ok) {
        const err = data as ApiError;
        throw new Error(err.error ?? `Request failed (${res.status})`);
      }
      setResult(data as ConditionGradeResult);
      setStatus("loaded");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Grade failed");
      setStatus("error");
    }
  }

  function gradeAnother() {
    setPhotos([]);
    setStatus("idle");
    setErrorMsg(null);
    setResult(null);
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      borderColor="#D4A574"
      minHeight="60vh"
    >
      <div style={{ padding: "16px 18px 28px" }}>
        <div
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            color: "#D4A574",
            letterSpacing: "0.10em",
            textTransform: "uppercase",
          }}
        >
          CONDITION GRADE
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "#5A4E70",
            marginTop: 4,
            marginBottom: 16,
          }}
        >
          add up to 6 photos for the most accurate grade
        </div>

        {status !== "loaded" && (
          <CaptureGrid
            photos={photos}
            disabled={status === "loading"}
            onAdd={() => fileInputRef.current?.click()}
            onRemove={removePhoto}
          />
        )}

        {status !== "loaded" && (
          <div
            style={{
              marginTop: 8,
              fontFamily: "var(--font-body)",
              fontSize: 10,
              color: "#3D2E55",
              textAlign: "center",
            }}
          >
            front · back · label · close-up of any damage
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: "none" }}
        />

        {(status === "idle" || status === "error") && (
          <button
            type="button"
            onClick={submitGrade}
            disabled={photos.length === 0}
            style={{
              marginTop: 16,
              width: "100%",
              padding: 14,
              borderRadius: 10,
              backgroundColor: "rgba(212,165,116,0.10)",
              border: "1px solid rgba(212,165,116,0.20)",
              color: "#D4A574",
              fontFamily: "var(--font-space-mono)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              cursor: photos.length === 0 ? "default" : "pointer",
              opacity: photos.length === 0 ? 0.4 : 1,
            }}
          >
            grade condition
          </button>
        )}

        {status === "loading" && <LoadingView photos={photos} />}

        {status === "error" && errorMsg && (
          <div
            role="alert"
            style={{
              marginTop: 12,
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "#D4A574",
              textAlign: "center",
            }}
          >
            {formatErrorMessage(errorMsg)}
          </div>
        )}

        {status === "loaded" && result && (
          <ResultView result={result} onAnother={gradeAnother} />
        )}
      </div>
    </BottomSheet>
  );
}

function CaptureGrid({
  photos,
  disabled,
  onAdd,
  onRemove,
}: {
  photos: string[];
  disabled: boolean;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}) {
  const slots = Array.from({ length: MAX_PHOTOS });
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {slots.map((_, idx) => {
        const photo = photos[idx];
        if (photo) {
          return (
            <div
              key={idx}
              style={{
                position: "relative",
                aspectRatio: "1",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt={`Capture ${idx + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <button
                type="button"
                onClick={() => onRemove(idx)}
                aria-label={`Remove photo ${idx + 1}`}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "rgba(232,99,107,0.8)",
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
          );
        }
        const isNext = idx === photos.length;
        return (
          <button
            key={idx}
            type="button"
            disabled={disabled || !isNext}
            onClick={isNext ? onAdd : undefined}
            style={{
              aspectRatio: "1",
              borderRadius: 10,
              border: "1px dashed rgba(212,165,116,0.20)",
              backgroundColor: "transparent",
              color: "rgba(212,165,116,0.4)",
              fontSize: 20,
              fontWeight: 300,
              cursor: isNext && !disabled ? "pointer" : "default",
            }}
          >
            +
          </button>
        );
      })}
    </div>
  );
}

function LoadingView({ photos }: { photos: string[] }) {
  return (
    <div style={{ marginTop: 16, textAlign: "center" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: "#C8C0D8",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#D4A574",
            animation: "conditionPulse 1.2s ease-in-out infinite",
          }}
        />
        Examining {photos.length === 1 ? "photo" : "photos"}…
      </div>
      <style>{`@keyframes conditionPulse { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }`}</style>
    </div>
  );
}

function ResultView({
  result,
  onAnother,
}: {
  result: ConditionGradeResult;
  onAnother: () => void;
}) {
  const color = GRADE_COLOR[result.grade];
  return (
    <div style={{ marginTop: 8 }}>
      <style>{`
        @keyframes gradeLetterIn {
          from { transform: scale(2); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes gradeBurst {
          from { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          to { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
      `}</style>
      <div
        style={{
          textAlign: "center",
          marginTop: 12,
          position: "relative",
        }}
      >
        {/* Color burst — radial bloom of the grade color, fired
            simultaneously with the letter scale-in so the reveal
            feels like a stamp landing. */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 32,
            left: "50%",
            width: 120,
            height: 120,
            borderRadius: "50%",
            backgroundColor: color,
            opacity: 0.15,
            transform: "translate(-50%, -50%) scale(0)",
            animation: "gradeBurst 600ms ease-out both",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            fontFamily: "var(--font-space-mono)",
            fontSize: 64,
            fontWeight: 800,
            color,
            lineHeight: 1,
            // Bounce overshoot — the letter pops in from 2x scale
            // down to 1x, mirroring the verdict-pill reveal.
            animation:
              "gradeLetterIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}
        >
          {result.gradeLabel}
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: "var(--font-body)",
            fontSize: 15,
            fontWeight: 600,
            color,
          }}
        >
          {result.grade}
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: "var(--font-space-mono)",
            fontSize: 12,
            color: "#5A4E70",
          }}
        >
          {result.confidence}% confident
        </div>
      </div>

      {result.flaws.length > 0 && (
        <BulletList
          title="FLAWS FOUND"
          items={result.flaws}
          headColor="#E8636B"
          dotColor="#E8636B"
        />
      )}

      {result.positives.length > 0 && (
        <BulletList
          title="CONDITION NOTES"
          items={result.positives}
          headColor="#5CE0B8"
          dotColor="#5CE0B8"
        />
      )}

      {result.priceImpact && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 10,
            backgroundColor: "rgba(212,165,116,0.05)",
            border: "1px solid rgba(212,165,116,0.10)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "#D4A574",
            lineHeight: 1.45,
          }}
        >
          {result.priceImpact}
        </div>
      )}

      {result.summary && (
        <div
          style={{
            marginTop: 10,
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "#5A4E70",
            lineHeight: 1.5,
          }}
        >
          {result.summary}
        </div>
      )}

      <button
        type="button"
        onClick={onAnother}
        style={{
          marginTop: 20,
          width: "100%",
          padding: 12,
          borderRadius: 10,
          backgroundColor: "transparent",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#5A4E70",
          fontFamily: "var(--font-space-mono)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        grade another
      </button>
    </div>
  );
}

function BulletList({
  title,
  items,
  headColor,
  dotColor,
}: {
  title: string;
  items: string[];
  headColor: string;
  dotColor: string;
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 9,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: headColor,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((line, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "#C8C0D8",
              lineHeight: 1.45,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                marginTop: 6,
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: dotColor,
                flexShrink: 0,
              }}
            />
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
