import Link from "next/link";
import type { Metadata } from "next";
import DotGridBackground from "@/components/shared/DotGridBackground";
import CoinMark from "@/components/shared/CoinMark";

/**
 * Post-checkout landing. Buyer arrives here from Digistore's success
 * URL (and from the magic-link email's redirectTo) before /welcome
 * handles auth state + Pro flag bookkeeping. Pure static — no auth
 * gate, no Supabase calls, no analytics. order_id (if present) is
 * surfaced verbatim for support tickets.
 */

export const metadata: Metadata = {
  title: "Welcome to Pro — loot.works",
  description: "Your Pro subscription is active.",
  robots: { index: false, follow: false },
};

export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id: orderId } = await searchParams;

  return (
    <main className="relative min-h-[100dvh] bg-[var(--bg-page)] overflow-hidden">
      <DotGridBackground />

      <div className="relative z-10 min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col items-center gap-8">
          <CoinMark size={64} color="#5CE0B8" />

          <div className="text-center space-y-3">
            <h1
              className="text-[40px] leading-tight font-[700]"
              style={{
                fontFamily: "var(--font-body)",
                color: "#5CE0B8",
                textShadow:
                  "0 0 40px rgba(92,224,184,0.25), 0 0 8px rgba(92,224,184,0.35)",
              }}
            >
              You&rsquo;re in.
            </h1>
            <p
              className="text-base font-[300] text-[var(--text-muted)] leading-relaxed"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Check your email &mdash; magic link inbound. Tap it, you&rsquo;re Pro.
            </p>
          </div>

          {orderId && (
            <div className="w-full rounded-2xl border border-[var(--money-border)] p-5 bg-black/20">
              <div
                className="text-[10px] font-[500] tracking-[0.12em] uppercase text-[var(--text-muted)] mb-1.5"
                style={{ fontFamily: "var(--font-label)" }}
              >
                Order
              </div>
              <div
                className="text-sm font-[700] text-[var(--money)] break-all"
                style={{ fontFamily: "var(--font-label)" }}
              >
                {orderId}
              </div>
            </div>
          )}

          <Link
            href="/welcome"
            className="w-full text-center bg-[var(--money)] text-black rounded-full py-4 px-6 text-base font-[600] hover:bg-[var(--money-dim)] transition"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Open loot.works &rarr;
          </Link>

          <p
            className="text-[11px] font-[300] text-[var(--text-muted)] text-center"
            style={{ fontFamily: "var(--font-body)" }}
          >
            The debit will be performed by Digistore24.com
          </p>
        </div>
      </div>
    </main>
  );
}
