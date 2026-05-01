"use client";

import BottomSheet from "@/components/shared/BottomSheet";

interface RadiusSheetProps {
  open: boolean;
  onClose: () => void;
  value: number;
  onChange: (val: number) => void;
}

export default function RadiusSheet({
  open,
  onClose,
  value,
  onChange,
}: RadiusSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} borderColor="var(--accent-mint)">
      <div style={{ padding: "16px 24px 32px" }}>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 15,
            color: "var(--text-primary)",
            textAlign: "center",
            marginBottom: 4,
          }}
        >
          Search radius
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: 20,
            color: "var(--accent-mint)",
            textAlign: "center",
            marginBottom: 20,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {value} mi
        </div>

        {/* Slider */}
        <div style={{ position: "relative", height: 16, display: "flex", alignItems: "center" }}>
          {/* Track */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: "var(--bg-recessed)",
              borderRadius: 2,
            }}
          />
          {/* Fill */}
          <div
            style={{
              position: "absolute",
              left: 0,
              width: `${((value - 5) / 45) * 100}%`,
              height: 3,
              backgroundColor: "rgba(92, 224, 184, 0.3)",
              borderRadius: 2,
            }}
          />
          {/* Native range input styled to match */}
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              width: "100%",
              height: 16,
              appearance: "none",
              WebkitAppearance: "none",
              background: "transparent",
              cursor: "pointer",
              margin: 0,
            }}
          />
        </div>

        {/* Min/max labels */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 9,
              color: "var(--text-dim)",
            }}
          >
            5 mi
          </span>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 9,
              color: "var(--text-dim)",
            }}
          >
            50 mi
          </span>
        </div>

        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--bg-surface);
            border: 2px solid var(--accent-mint-border);
            cursor: pointer;
          }
          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--bg-surface);
            border: 2px solid var(--accent-mint-border);
            cursor: pointer;
          }
        `}</style>
      </div>
    </BottomSheet>
  );
}
