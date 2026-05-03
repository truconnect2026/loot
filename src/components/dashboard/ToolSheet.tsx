"use client";

import { useEffect, useRef, useState } from "react";
import BottomSheet from "@/components/shared/BottomSheet";

/**
 * Unified bottom sheet for the More-Tools tile suite. Each tool maps
 * to a tile on the dashboard:
 *
 *   shelf-scan       photo  → ranked list of items + resale values
 *   price-check      text   → eBay average + range + demand
 *   fake-check       photo  → authenticity verdict + red flags
 *   tag-decode       photo  → store, prices, clearance codes
 *   scrap-id         photo  → metal type, purity, $ per lb
 *   liquidation      url|text → manifest analysis + roi
 *
 * Photo tools use <input type="file" accept="image/*" capture="environment">
 * — that gets the native iOS/Android camera UI for free, including
 * proper auto-focus and zoom controls. Custom viewfinders are reserved
 * for continuous-detection cases (the barcode scanner).
 */

export type ToolKind =
  | "shelf-scan"
  | "price-check"
  | "fake-check"
  | "tag-decode"
  | "scrap-id"
  | "liquidation";

interface ToolSpec {
  title: string;
  blurb: string;
  apiPath: string;
  inputType: "image" | "text" | "url-or-text";
  textPlaceholder?: string;
  textLabel?: string;
}

const TOOL_SPECS: Record<ToolKind, ToolSpec> = {
  "shelf-scan": {
    title: "Shelf Scanner",
    blurb: "snap a shelf — Claude ranks every visible item by profit potential",
    apiPath: "/api/shelf-scan",
    inputType: "image",
  },
  "price-check": {
    title: "Price Check",
    blurb: "type an item — get the realistic resale price",
    apiPath: "/api/price-check",
    inputType: "text",
    textLabel: "item name",
    textPlaceholder: "vintage Pyrex casserole set",
  },
  "fake-check": {
    title: "Authenticate",
    blurb: "snap a photo — flag likely counterfeits before you buy",
    apiPath: "/api/fake-check",
    inputType: "image",
  },
  "tag-decode": {
    title: "Tag Decoder",
    blurb: "snap a clearance tag — decode the markdown codes and dates",
    apiPath: "/api/tag-decode",
    inputType: "image",
  },
  "scrap-id": {
    title: "Scrap Finder",
    blurb: "snap the metal — identify alloy, purity, and per-pound value",
    apiPath: "/api/scrap-id",
    inputType: "image",
  },
  liquidation: {
    title: "Liquidation Analyzer",
    blurb: "paste a manifest URL or text — see ROI and top items",
    apiPath: "/api/liquidation",
    inputType: "url-or-text",
  },
};

interface ToolSheetProps {
  open: boolean;
  tool: ToolKind | null;
  onClose: () => void;
}

type Status = "idle" | "loading" | "loaded" | "error";

interface ApiError {
  error: string;
}

export default function ToolSheet({ open, tool, onClose }: ToolSheetProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [liqMode, setLiqMode] = useState<"url" | "text">("url");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const spec = tool ? TOOL_SPECS[tool] : null;

  // Reset state every time a new tool opens. Without this the previous
  // tool's result would briefly flash through when the user taps a
  // different tile in quick succession. queueMicrotask defers the
  // setState past the synchronous effect body so the
  // react-hooks/set-state-in-effect rule is satisfied — same pattern
  // used elsewhere in the app for mount-time sync.
  useEffect(() => {
    if (open && tool) {
      queueMicrotask(() => {
        setStatus("idle");
        setErrorMsg(null);
        setResult(null);
        setTextInput("");
        setUrlInput("");
        setLiqMode("url");
      });
    }
  }, [open, tool]);

  async function callApi(payload: Record<string, unknown>) {
    if (!spec) return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(spec.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as unknown;
      if (!res.ok) {
        const message =
          (data as ApiError)?.error ?? `Request failed (${res.status})`;
        throw new Error(message);
      }
      setResult(data);
      setStatus("loaded");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      callApi({ image: dataUrl });
    };
    reader.onerror = () => {
      setErrorMsg("Could not read image file");
      setStatus("error");
    };
    reader.readAsDataURL(file);
    // Reset so picking the same file twice still fires a change.
    e.target.value = "";
  }

  function handleTextSubmit() {
    const trimmed = textInput.trim();
    if (!trimmed) return;
    callApi({ itemName: trimmed });
  }

  function handleLiqSubmit() {
    if (liqMode === "url") {
      const trimmed = urlInput.trim();
      if (!trimmed) return;
      callApi({ manifestUrl: trimmed });
    } else {
      const trimmed = textInput.trim();
      if (!trimmed) return;
      callApi({ manifestText: trimmed });
    }
  }

  if (!spec || !tool) {
    return (
      <BottomSheet open={open} onClose={onClose} borderColor="#2D2845">
        <div style={{ padding: 24 }} />
      </BottomSheet>
    );
  }

  return (
    <BottomSheet open={open} onClose={onClose} borderColor="#2D2845">
      <div style={{ padding: "20px 20px 32px" }}>
        <div
          style={{
            fontFamily: "var(--font-label)",
            fontSize: 9,
            color: "#5CE0B8",
            letterSpacing: "0.14em",
            marginBottom: 6,
          }}
        >
          {spec.title.toUpperCase()}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "rgba(255,255,255,0.62)",
            lineHeight: 1.4,
            marginBottom: 16,
          }}
        >
          {spec.blurb}
        </div>

        {/* Input chrome — varies by tool inputType. Disabled while
            a request is in flight so the user can't kick off two. */}
        {status !== "loaded" && (
          <div style={{ opacity: status === "loading" ? 0.5 : 1 }}>
            {spec.inputType === "image" && (
              <ImageInput
                onPick={() => fileInputRef.current?.click()}
                disabled={status === "loading"}
              />
            )}
            {spec.inputType === "text" && (
              <TextInputForm
                label={spec.textLabel ?? "input"}
                placeholder={spec.textPlaceholder ?? ""}
                value={textInput}
                onChange={setTextInput}
                onSubmit={handleTextSubmit}
                disabled={status === "loading"}
              />
            )}
            {spec.inputType === "url-or-text" && (
              <UrlOrTextInput
                mode={liqMode}
                onModeChange={setLiqMode}
                urlValue={urlInput}
                onUrlChange={setUrlInput}
                textValue={textInput}
                onTextChange={setTextInput}
                onSubmit={handleLiqSubmit}
                disabled={status === "loading"}
              />
            )}

            {/* Hidden file input — driven by the ImageInput button. */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              style={{ display: "none" }}
            />
          </div>
        )}

        {status === "loading" && (
          <div
            style={{
              marginTop: 20,
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "rgba(255,255,255,0.55)",
              textAlign: "center",
            }}
          >
            analyzing…
          </div>
        )}

        {status === "error" && errorMsg && (
          <div
            role="alert"
            style={{
              marginTop: 16,
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "rgba(232,99,107,0.85)",
              textAlign: "center",
            }}
          >
            {errorMsg}
          </div>
        )}

        {status === "loaded" && result !== null && (
          <ResultBlock tool={tool} data={result} />
        )}
      </div>
    </BottomSheet>
  );
}

// ────────────────────────────────────────────────────────────────
// Input chrome
// ────────────────────────────────────────────────────────────────

function ImageInput({
  onPick,
  disabled,
}: {
  onPick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      style={{
        width: "100%",
        height: 96,
        borderRadius: 14,
        backgroundColor: "#120e18",
        backgroundImage:
          "linear-gradient(rgba(92,224,184,0.10), rgba(92,224,184,0.04))",
        border: "1px dashed rgba(92,224,184,0.40)",
        color: "var(--ui-primary)",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <CameraGlyph />
      <span>tap to take photo</span>
    </button>
  );
}

function TextInputForm({
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-label)",
          fontSize: 9,
          color: "rgba(255,255,255,0.40)",
          letterSpacing: "0.10em",
          marginBottom: 6,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
        }}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%",
          height: 48,
          backgroundColor: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
          borderRadius: 12,
          paddingLeft: 14,
          paddingRight: 14,
          fontFamily: "var(--font-body)",
          fontSize: 16,
          color: "var(--text-primary)",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      <SubmitButton onTap={onSubmit} disabled={disabled || !value.trim()} />
    </div>
  );
}

function UrlOrTextInput({
  mode,
  onModeChange,
  urlValue,
  onUrlChange,
  textValue,
  onTextChange,
  onSubmit,
  disabled,
}: {
  mode: "url" | "text";
  onModeChange: (m: "url" | "text") => void;
  urlValue: string;
  onUrlChange: (v: string) => void;
  textValue: string;
  onTextChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const submitDisabled =
    disabled || (mode === "url" ? !urlValue.trim() : !textValue.trim());
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <ModeChip
          label="manifest URL"
          active={mode === "url"}
          onTap={() => onModeChange("url")}
        />
        <ModeChip
          label="paste text"
          active={mode === "text"}
          onTap={() => onModeChange("text")}
        />
      </div>
      {mode === "url" ? (
        <input
          type="url"
          value={urlValue}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://…"
          disabled={disabled}
          style={inputBoxStyle}
        />
      ) : (
        <textarea
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="paste manifest contents…"
          disabled={disabled}
          rows={6}
          style={{
            ...inputBoxStyle,
            height: "auto",
            paddingTop: 10,
            paddingBottom: 10,
            resize: "vertical",
            fontFamily: "var(--font-body)",
            lineHeight: 1.4,
          }}
        />
      )}
      <SubmitButton onTap={onSubmit} disabled={submitDisabled} />
    </div>
  );
}

const inputBoxStyle: React.CSSProperties = {
  width: "100%",
  height: 48,
  backgroundColor: "rgba(0,0,0,0.3)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
  borderRadius: 12,
  paddingLeft: 14,
  paddingRight: 14,
  fontFamily: "var(--font-body)",
  fontSize: 16,
  color: "var(--text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

function ModeChip({
  label,
  active,
  onTap,
}: {
  label: string;
  active: boolean;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        height: 30,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: 8,
        border: active
          ? "1px solid rgba(92,224,184,0.40)"
          : "1px solid rgba(255,255,255,0.10)",
        backgroundColor: active
          ? "rgba(92,224,184,0.10)"
          : "rgba(255,255,255,0.04)",
        color: active ? "#5CE0B8" : "rgba(255,255,255,0.60)",
        fontFamily: "var(--font-body)",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function SubmitButton({
  onTap,
  disabled,
}: {
  onTap: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      style={{
        marginTop: 12,
        width: "100%",
        height: 44,
        borderRadius: 12,
        backgroundColor: "#120e18",
        backgroundImage: disabled
          ? "linear-gradient(rgba(255,255,255,0.04), rgba(255,255,255,0.04))"
          : "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.16) 100%)",
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow:
          "inset 0 1px 0 0 rgba(255,255,255,0.14), 0 1px 2px rgba(0,0,0,0.3)",
        color: disabled ? "rgba(255,255,255,0.30)" : "var(--ui-primary)",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      analyze
    </button>
  );
}

function CameraGlyph() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5CE0B8"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx={12} cy={13} r={4} />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────
// Result rendering — one block per tool kind. Each pulls the
// fields it expects out of the loosely-typed payload and renders
// them in a stable layout.
// ────────────────────────────────────────────────────────────────

function ResultBlock({ tool, data }: { tool: ToolKind; data: unknown }) {
  switch (tool) {
    case "shelf-scan":
      return <ShelfScanResult data={data} />;
    case "price-check":
      return <PriceCheckResult data={data} />;
    case "fake-check":
      return <FakeCheckResult data={data} />;
    case "tag-decode":
      return <TagDecodeResult data={data} />;
    case "scrap-id":
      return <ScrapIdResult data={data} />;
    case "liquidation":
      return <LiquidationResult data={data} />;
  }
}

function fmtMoney(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

function asObject(data: unknown): Record<string, unknown> {
  return (data ?? {}) as Record<string, unknown>;
}

const sectionStyle: React.CSSProperties = {
  marginTop: 16,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const rowLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-label)",
  fontSize: 9,
  color: "rgba(255,255,255,0.40)",
  letterSpacing: "0.10em",
  textTransform: "uppercase",
};

const rowValueStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 14,
  color: "var(--text-primary)",
  fontWeight: 600,
};

function ShelfScanResult({ data }: { data: unknown }) {
  const items = (asObject(data).items ?? []) as Array<Record<string, unknown>>;
  if (items.length === 0) {
    return <EmptyResult message="no recognizable items" />;
  }
  return (
    <div style={sectionStyle}>
      {items.map((it, idx) => {
        const profit =
          Number(it.estimated_resale_value ?? 0) -
          Number(it.estimated_retail_value ?? 0);
        return (
          <div key={idx} style={resultCardStyle}>
            <div style={{ ...rowValueStyle, marginBottom: 4 }}>
              {String(it.name ?? "Unknown item")}
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "rgba(255,255,255,0.60)",
              }}
            >
              <span>retail {fmtMoney(Number(it.estimated_retail_value ?? 0))}</span>
              <span>resale {fmtMoney(Number(it.estimated_resale_value ?? 0))}</span>
              <span style={{ color: profit > 0 ? "var(--money)" : undefined }}>
                {profit >= 0 ? "+" : ""}
                {fmtMoney(profit)}
              </span>
            </div>
            {it.notes ? (
              <div style={notesStyle}>{String(it.notes)}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function PriceCheckResult({ data }: { data: unknown }) {
  const obj = asObject(data);
  const range = (obj.price_range ?? {}) as Record<string, unknown>;
  return (
    <div style={sectionStyle}>
      <div style={resultCardStyle}>
        <div style={rowLabelStyle}>average sold price</div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: 28,
            color: "var(--money)",
            fontFeatureSettings: '"tnum"',
            marginTop: 2,
          }}
        >
          {fmtMoney(Number(obj.average_sold_price ?? 0))}
        </div>
        <div style={{ ...notesStyle, marginTop: 6 }}>
          range {fmtMoney(Number(range.low ?? 0))} –{" "}
          {fmtMoney(Number(range.high ?? 0))}
        </div>
      </div>
      <KeyValueCard label="demand" value={String(obj.demand ?? "—")} />
      <KeyValueCard
        label="best platform"
        value={String(obj.best_platform ?? "—")}
      />
      {obj.notes ? <div style={notesStyle}>{String(obj.notes)}</div> : null}
    </div>
  );
}

function FakeCheckResult({ data }: { data: unknown }) {
  const obj = asObject(data);
  const verdict = String(obj.verdict ?? "suspicious");
  const verdictColor =
    verdict === "likely_authentic"
      ? "var(--money)"
      : verdict === "likely_fake"
        ? "#E8636B"
        : "#D4A574";
  const verdictLabel =
    verdict === "likely_authentic"
      ? "LIKELY AUTHENTIC"
      : verdict === "likely_fake"
        ? "LIKELY FAKE"
        : "SUSPICIOUS";
  const redFlags = Array.isArray(obj.red_flags)
    ? (obj.red_flags as unknown[]).map(String)
    : [];
  const indicators = Array.isArray(obj.indicators)
    ? (obj.indicators as unknown[]).map(String)
    : [];
  return (
    <div style={sectionStyle}>
      <div style={resultCardStyle}>
        <div
          style={{
            fontFamily: "var(--font-label)",
            fontWeight: 700,
            fontSize: 14,
            color: verdictColor,
            letterSpacing: "0.10em",
          }}
        >
          {verdictLabel}
        </div>
        <div style={{ ...notesStyle, marginTop: 4 }}>
          confidence {Number(obj.confidence ?? 0)}%
        </div>
      </div>
      {redFlags.length > 0 && (
        <BulletList title="red flags" items={redFlags} color="#E8636B" />
      )}
      {indicators.length > 0 && (
        <BulletList title="positive indicators" items={indicators} color="var(--money)" />
      )}
      {obj.recommendation ? (
        <div style={resultCardStyle}>
          <div style={rowLabelStyle}>recommendation</div>
          <div style={{ ...notesStyle, marginTop: 4 }}>
            {String(obj.recommendation)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TagDecodeResult({ data }: { data: unknown }) {
  const obj = asObject(data);
  const codes = Array.isArray(obj.clearance_codes)
    ? (obj.clearance_codes as unknown[]).map(String)
    : [];
  const meanings = Array.isArray(obj.code_meanings)
    ? (obj.code_meanings as unknown[]).map(String)
    : [];
  return (
    <div style={sectionStyle}>
      <KeyValueCard label="store" value={String(obj.store ?? "—")} />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ ...resultCardStyle, flex: 1 }}>
          <div style={rowLabelStyle}>original</div>
          <div style={{ ...rowValueStyle, marginTop: 2 }}>
            {fmtMoney(Number(obj.original_price ?? 0))}
          </div>
        </div>
        <div style={{ ...resultCardStyle, flex: 1 }}>
          <div style={rowLabelStyle}>markdown</div>
          <div
            style={{
              ...rowValueStyle,
              marginTop: 2,
              color: "var(--money)",
            }}
          >
            {fmtMoney(Number(obj.markdown_price ?? 0))}
          </div>
        </div>
      </div>
      {codes.length > 0 && (
        <div style={resultCardStyle}>
          <div style={rowLabelStyle}>codes</div>
          {codes.map((code, idx) => (
            <div key={idx} style={{ marginTop: idx === 0 ? 4 : 6 }}>
              <span style={rowValueStyle}>{code}</span>
              {meanings[idx] && (
                <span style={notesStyle}> — {meanings[idx]}</span>
              )}
            </div>
          ))}
        </div>
      )}
      {obj.notes ? <div style={notesStyle}>{String(obj.notes)}</div> : null}
    </div>
  );
}

function ScrapIdResult({ data }: { data: unknown }) {
  const obj = asObject(data);
  return (
    <div style={sectionStyle}>
      <KeyValueCard label="metal" value={String(obj.metal_type ?? "—")} />
      <KeyValueCard
        label="estimated purity"
        value={String(obj.estimated_purity ?? "—")}
      />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ ...resultCardStyle, flex: 1 }}>
          <div style={rowLabelStyle}>$ / lb</div>
          <div style={{ ...rowValueStyle, marginTop: 2 }}>
            {fmtMoney(Number(obj.current_price_per_pound ?? 0))}
          </div>
        </div>
        <div style={{ ...resultCardStyle, flex: 1 }}>
          <div style={rowLabelStyle}>est. weight</div>
          <div style={{ ...rowValueStyle, marginTop: 2 }}>
            {Number(obj.weight_estimate_lbs ?? 0).toFixed(2)} lbs
          </div>
        </div>
      </div>
      <div style={resultCardStyle}>
        <div style={rowLabelStyle}>total estimated value</div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: 24,
            color: "var(--money)",
            fontFeatureSettings: '"tnum"',
            marginTop: 2,
          }}
        >
          {fmtMoney(Number(obj.total_estimated_value ?? 0))}
        </div>
      </div>
      {obj.identification_notes ? (
        <div style={notesStyle}>{String(obj.identification_notes)}</div>
      ) : null}
    </div>
  );
}

function LiquidationResult({ data }: { data: unknown }) {
  const obj = asObject(data);
  const verdict = String(obj.verdict ?? "maybe");
  const verdictColor =
    verdict === "buy"
      ? "var(--money)"
      : verdict === "pass"
        ? "#E8636B"
        : "#D4A574";
  const topItems = Array.isArray(obj.top_items)
    ? (obj.top_items as Array<Record<string, unknown>>)
    : [];
  const risks = Array.isArray(obj.risk_factors)
    ? (obj.risk_factors as unknown[]).map(String)
    : [];
  return (
    <div style={sectionStyle}>
      <div style={resultCardStyle}>
        <div
          style={{
            fontFamily: "var(--font-label)",
            fontWeight: 700,
            fontSize: 14,
            color: verdictColor,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
          }}
        >
          {verdict}
        </div>
        <div style={{ ...notesStyle, marginTop: 4 }}>
          ROI {Number(obj.roi_estimate ?? 0)}%
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ ...resultCardStyle, flex: 1 }}>
          <div style={rowLabelStyle}>retail value</div>
          <div style={{ ...rowValueStyle, marginTop: 2 }}>
            {fmtMoney(Number(obj.estimated_retail_value ?? 0))}
          </div>
        </div>
        <div style={{ ...resultCardStyle, flex: 1 }}>
          <div style={rowLabelStyle}>resale value</div>
          <div
            style={{
              ...rowValueStyle,
              marginTop: 2,
              color: "var(--money)",
            }}
          >
            {fmtMoney(Number(obj.estimated_resale_value ?? 0))}
          </div>
        </div>
      </div>
      <KeyValueCard
        label="total items"
        value={String(Number(obj.total_items ?? 0))}
      />
      {topItems.length > 0 && (
        <div style={resultCardStyle}>
          <div style={rowLabelStyle}>top items</div>
          {topItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: idx === 0 ? 4 : 6,
              }}
            >
              <span style={rowValueStyle}>{String(item.name ?? "—")}</span>
              <span
                style={{
                  ...rowValueStyle,
                  color: "var(--money)",
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {fmtMoney(Number(item.estimated_value ?? 0))}
              </span>
            </div>
          ))}
        </div>
      )}
      {risks.length > 0 && (
        <BulletList title="risk factors" items={risks} color="#E8636B" />
      )}
      {obj.notes ? <div style={notesStyle}>{String(obj.notes)}</div> : null}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Shared result-block primitives
// ────────────────────────────────────────────────────────────────

const resultCardStyle: React.CSSProperties = {
  backgroundColor: "#120e18",
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.04), rgba(255,255,255,0.04))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: 12,
};

const notesStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 12,
  color: "rgba(255,255,255,0.55)",
  lineHeight: 1.4,
};

function KeyValueCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={resultCardStyle}>
      <div style={rowLabelStyle}>{label}</div>
      <div style={{ ...rowValueStyle, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function BulletList({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div style={resultCardStyle}>
      <div style={{ ...rowLabelStyle, color }}>{title}</div>
      <ul
        style={{
          margin: "6px 0 0 0",
          padding: "0 0 0 18px",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "rgba(255,255,255,0.78)",
          lineHeight: 1.45,
        }}
      >
        {items.map((line, idx) => (
          <li key={idx}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function EmptyResult({ message }: { message: string }) {
  return (
    <div
      style={{
        marginTop: 20,
        textAlign: "center",
        fontFamily: "var(--font-body)",
        fontSize: 13,
        color: "rgba(255,255,255,0.45)",
      }}
    >
      {message}
    </div>
  );
}
