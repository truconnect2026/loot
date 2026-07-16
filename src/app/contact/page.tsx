import type { Metadata } from "next";
import Link from "next/link";
import DotGridBackground from "@/components/shared/DotGridBackground";
import CoinMark from "@/components/shared/CoinMark";

/**
 * Contact page — Digistore approval requirement (working contact channel).
 *
 * TODO(David): confirm the support email + business address. The same
 * values appear in src/app/pro/components/Footer.jsx and the
 * /refund-policy page — change all three together when you have the
 * final values.
 */

export const metadata: Metadata = {
  title: "Contact — loot.works",
  description: "Get in touch with the loot.works team.",
  robots: { index: false, follow: false },
};

export default function ContactPage() {
  return (
    <main className="relative min-h-[100dvh] bg-[var(--bg-page)] overflow-hidden">
      <DotGridBackground />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-12 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
        >
          <CoinMark size={22} color="#5CE0B8" />
          <span
            className="text-sm font-[600] tracking-[0.06em]"
            style={{ fontFamily: "var(--font-label)", color: "#5CE0B8" }}
          >
            LOOT.WORKS
          </span>
        </Link>

        <h1
          className="text-[32px] leading-tight font-[600] text-[var(--text-primary)] mb-6"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Contact
        </h1>

        <div
          className="space-y-6 text-[15px] leading-[1.7]"
          style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.8)" }}
        >
          <section>
            <h2 className="text-[18px] font-[600] mb-2" style={{ color: "#fff" }}>
              Support
            </h2>
            <p>
              Email{" "}
              <a href="mailto:lootworks.goflip@gmail.com" style={{ color: "#5CE0B8" }}>
                lootworks.goflip@gmail.com
              </a>{" "}
              for help with your account, billing, scans, or anything else.
              We aim to respond within one business day.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-[600] mb-2" style={{ color: "#fff" }}>
              Refunds & Cancellations
            </h2>
            <p>
              See our{" "}
              <Link href="/refund-policy" style={{ color: "#5CE0B8" }}>
                Refund Policy
              </Link>
              . The fastest way to request a refund is by email — include your
              order ID from the Digistore receipt.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-[600] mb-2" style={{ color: "#fff" }}>
              Business
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", whiteSpace: "pre-line" }}>
              TruConnect
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
