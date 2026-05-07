"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import DotGridBackground from "@/components/shared/DotGridBackground";
import CoinMark from "@/components/shared/CoinMark";

/**
 * Post-purchase welcome page. The Digistore IPN webhook redirects
 * the buyer here via a magic link, with order_id in the query string.
 *
 * --text-secondary doesn't exist in this repo's globals.css; we use
 * --text-muted, which is the documented muted-body token (#5A4E70).
 */
export default function WelcomeClient() {
  const params = useSearchParams();
  const orderId = params.get("order_id");

  return (
    <main className="relative min-h-[100dvh] bg-[var(--bg-page)] overflow-hidden">
      <DotGridBackground />

      <div className="relative z-10 min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col items-center gap-8">
          <CoinMark size={64} />

          <div className="text-center space-y-3">
            <h1
              className="text-[32px] leading-tight font-[600] text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              You&rsquo;re in.
            </h1>
            <p
              className="text-base font-[300] text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Welcome to Loot Pro. Check your email for sign-in instructions.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-[var(--money-border)] p-6 bg-black/20 backdrop-blur-sm">
            <div
              className="text-[11px] font-[500] tracking-[0.1em] text-[var(--text-muted)] mb-2"
              style={{ fontFamily: "var(--font-label)" }}
            >
              ORDER
            </div>
            {orderId ? (
              <div
                className="text-base font-[700] text-[var(--money)] break-all"
                style={{ fontFamily: "var(--font-label)" }}
              >
                {orderId}
              </div>
            ) : (
              <div
                className="text-sm font-[300] text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Check your email for confirmation.
              </div>
            )}
          </div>

          <Link
            href="/"
            className="w-full text-center bg-[var(--money)] text-black rounded-full py-4 px-6 text-base font-[500] hover:bg-[var(--money-dim)] transition"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Open Loot &rarr;
          </Link>

          <p
            className="text-[11px] font-[300] text-[var(--text-muted)] text-center mt-4"
            style={{ fontFamily: "var(--font-body)" }}
          >
            The debit will be performed by Digistore24.com
          </p>
        </div>
      </div>
    </main>
  );
}
