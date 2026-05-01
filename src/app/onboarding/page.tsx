"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import CoinMark from "@/components/shared/CoinMark";
import DotGridBackground from "@/components/shared/DotGridBackground";

/**
 * Post-signup capture: zip code + search radius.
 *
 * Lives between auth and the dashboard. Route gating:
 *   - middleware.ts forces auth on /onboarding.
 *   - The dashboard (/app) redirects here when profile.zip_code is empty,
 *     so brand-new users land here automatically.
 *   - This page redirects back to /app once a zip is already set, so a
 *     returning user can't accidentally land back on the capture screen.
 *
 * Reverse geocoding for "use my location" uses BigDataCloud's free
 * client-side API (no key required, no proxy needed). Returns a postcode
 * field on success; manual entry remains the fallback for any failure.
 */

const RADIUS_OPTIONS: { value: number; label: string; subtitle: string }[] = [
  { value: 5, label: "5 mi", subtitle: "urban" },
  { value: 15, label: "15 mi", subtitle: "suburban" },
  { value: 50, label: "50 mi", subtitle: "rural" },
];

// Per-session skip flag — set when the user taps "skip for now" so the
// dashboard's onboarding gate stops bouncing them back here for the rest
// of this tab's session. sessionStorage (not localStorage) on purpose:
// next browser session re-prompts so onboarding is encouraged but never
// permanently disabled by a single skip. Both this page and page.tsx
// reference this exact key — keep them in sync.
export const ONBOARDING_SKIPPED_KEY = "loot.onboarding.skipped";

interface BigDataCloudResponse {
  postcode?: string;
  countryCode?: string;
}

async function reverseGeocodeZip(
  lat: number,
  lon: number,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as BigDataCloudResponse;
    const zip = data.postcode?.trim();
    if (!zip) return null;
    // US-only: trim ZIP+4 to 5 digits, drop anything non-numeric.
    if (data.countryCode === "US") {
      const five = zip.match(/^\d{5}/)?.[0];
      return five ?? null;
    }
    return zip;
  } catch {
    return null;
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [zip, setZip] = useState("");
  const [zipFocused, setZipFocused] = useState(false);
  const [radius, setRadius] = useState<number>(15);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Gate the form behind a profile check so a returning user with a
  // saved zip never sees this screen — they bounce straight to /app.
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        // Middleware will catch this, but guard anyway.
        if (!cancelled) router.replace("/");
        return;
      }
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("zip_code, search_radius_miles")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled && profileRow?.zip_code) {
        router.replace("/app");
        return;
      }
      if (!cancelled) {
        if (profileRow?.search_radius_miles) {
          setRadius(profileRow.search_radius_miles);
        }
        setChecking(false);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  async function handleUseLocation() {
    if (locating) return;
    setLocationError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("location not supported on this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const found = await reverseGeocodeZip(
          pos.coords.latitude,
          pos.coords.longitude,
        );
        setLocating(false);
        if (found) {
          setZip(found);
          setLocationError(null);
        } else {
          setLocationError("couldn't read your zip — enter it below");
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("location permission denied — enter zip below");
        } else {
          setLocationError("couldn't get your location — enter zip below");
        }
      },
      { timeout: 8000, maximumAge: 60_000 },
    );
  }

  async function handleSubmit() {
    const trimmed = zip.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setSubmitError("enter a 5-digit zip code");
      inputRef.current?.focus();
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setSubmitting(false);
      router.replace("/");
      return;
    }
    // upsert in case the profile row doesn't exist yet (Supabase trigger
    // creates it normally, but we don't want a race condition to block a
    // brand-new signup from completing onboarding).
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          zip_code: trimmed,
          search_radius_miles: radius,
        },
        { onConflict: "id" },
      );
    setSubmitting(false);
    if (error) {
      setSubmitError("couldn't save — try again in a moment");
      return;
    }
    router.replace("/app");
  }

  if (checking) {
    return (
      <>
        <DotGridBackground />
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.06)",
              borderTopColor: "rgba(255,255,255,0.30)",
              animation: "onboardSpin 1s linear infinite",
            }}
          />
          <style>{`
            @keyframes onboardSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </>
    );
  }

  return (
    <>
      <DotGridBackground />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          minHeight: "100vh",
          paddingTop: "calc(48px + env(safe-area-inset-top, 0px))",
          paddingBottom: "calc(40px + env(safe-area-inset-bottom, 0px))",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            paddingLeft: 24,
            paddingRight: 24,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 40,
            }}
          >
            <CoinMark size={22} color="#5CE0B8" />
            <span
              style={{
                fontFamily: "var(--font-label)",
                fontWeight: 700,
                fontSize: 22,
                color: "#5CE0B8",
                letterSpacing: "0.08em",
                lineHeight: 1,
              }}
            >
              LOOT
            </span>
          </div>

          {/* Step 1 — zip */}
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 22,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            Where are you?
          </h2>
          <p
            style={{
              marginTop: 8,
              marginBottom: 20,
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              fontSize: 14,
              color: "var(--text-muted)",
              lineHeight: 1.4,
            }}
          >
            we&rsquo;ll show deals and free finds in your area
          </p>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="zip code"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
              onFocus={() => setZipFocused(true)}
              onBlur={() => setZipFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              style={{
                flex: 1,
                minWidth: 0,
                height: 52,
                backgroundColor: "rgba(0,0,0,0.3)",
                border: zipFocused
                  ? "1px solid rgba(255,255,255,0.25)"
                  : "1px solid rgba(255,255,255,0.06)",
                boxShadow: zipFocused
                  ? "inset 0 1px 2px 0 rgba(0,0,0,0.4), 0 0 16px -4px rgba(255,255,255,0.12)"
                  : "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
                borderRadius: 14,
                paddingLeft: 18,
                paddingRight: 18,
                fontFamily: "var(--font-body)",
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "var(--text-primary)",
                outline: "none",
                fontFeatureSettings: '"tnum"',
                transition:
                  "border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
            <UseLocationButton
              onTap={handleUseLocation}
              loading={locating}
            />
          </div>
          {locationError && (
            <div
              role="alert"
              style={{
                marginTop: 10,
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "rgba(232,99,107,0.85)",
                lineHeight: 1.4,
              }}
            >
              {locationError}
            </div>
          )}

          {/* Step 2 — radius */}
          <h2
            style={{
              marginTop: 36,
              marginBottom: 8,
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 22,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            How far will you drive?
          </h2>
          <p
            style={{
              marginTop: 0,
              marginBottom: 20,
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              fontSize: 14,
              color: "var(--text-muted)",
              lineHeight: 1.4,
            }}
          >
            change anytime in account settings
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)",
              gap: 8,
            }}
          >
            {RADIUS_OPTIONS.map((opt) => (
              <RadiusOption
                key={opt.value}
                label={opt.label}
                subtitle={opt.subtitle}
                active={radius === opt.value}
                onTap={() => setRadius(opt.value)}
              />
            ))}
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              marginTop: 36,
              width: "100%",
              height: 54,
              backgroundColor: submitting
                ? "rgba(255,255,255,0.04)"
                : "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow:
                "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.3)",
              borderRadius: 16,
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 15,
              color: "var(--ui-primary)",
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.6 : 1,
              transition: "all 150ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {submitting ? "saving…" : "Continue →"}
          </button>
          {submitError && (
            <div
              role="alert"
              style={{
                marginTop: 10,
                textAlign: "center",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "rgba(232,99,107,0.85)",
              }}
            >
              {submitError}
            </div>
          )}

          {/* Skip — encouraged-not-required gate. Sets a session flag
              and bounces to /app. The dashboard reads this flag on
              mount to suppress the onboarding redirect for the rest
              of this tab session; next session re-prompts. */}
          <button
            type="button"
            onClick={() => {
              try {
                window.sessionStorage.setItem(ONBOARDING_SKIPPED_KEY, "1");
              } catch {
                /* sessionStorage may be unavailable (private mode);
                   the redirect will simply re-fire on next /app visit,
                   which is acceptable degradation. */
              }
              router.replace("/app");
            }}
            style={{
              display: "block",
              margin: "20px auto 0",
              background: "none",
              border: "none",
              padding: "8px 12px",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: 13,
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            skip for now
          </button>
        </div>
      </div>
    </>
  );
}

function UseLocationButton({
  onTap,
  loading,
}: {
  onTap: () => void;
  loading: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={loading}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        flexShrink: 0,
        height: 52,
        paddingLeft: 14,
        paddingRight: 14,
        backgroundColor: pressed
          ? "rgba(255,255,255,0.10)"
          : "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow:
          "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.3)",
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: loading ? "default" : "pointer",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
        opacity: loading ? 0.7 : 1,
      }}
    >
      <PinIcon />
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 500,
          fontSize: 13,
          color: "var(--ui-primary)",
          whiteSpace: "nowrap",
        }}
      >
        {loading ? "locating…" : "use my location"}
      </span>
    </button>
  );
}

interface RadiusOptionProps {
  label: string;
  subtitle: string;
  active: boolean;
  onTap: () => void;
}

function RadiusOption({ label, subtitle, active, onTap }: RadiusOptionProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onClick={onTap}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: "100%",
        height: 72,
        backgroundColor: active
          ? "rgba(255,255,255,0.10)"
          : "rgba(255,255,255,0.04)",
        border: active
          ? "1px solid rgba(255,255,255,0.30)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: active
          ? "inset 0 1px 0 0 rgba(255,255,255,0.10), 0 0 16px -4px rgba(255,255,255,0.10)"
          : "inset 0 1px 0 0 rgba(255,255,255,0.04)",
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        cursor: "pointer",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background-color 150ms cubic-bezier(0.16, 1, 0.3, 1), border-color 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 700,
          fontSize: 16,
          color: active ? "var(--ui-primary)" : "var(--text-primary)",
          fontFeatureSettings: '"tnum"',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 400,
          fontSize: 11,
          color: "var(--text-muted)",
        }}
      >
        {subtitle}
      </span>
    </button>
  );
}

function PinIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--ui-primary)"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx={12} cy={10} r={3} />
    </svg>
  );
}
