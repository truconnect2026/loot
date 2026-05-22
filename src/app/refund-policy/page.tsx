import type { Metadata } from "next";
import Link from "next/link";
import DotGridBackground from "@/components/shared/DotGridBackground";
import CoinMark from "@/components/shared/CoinMark";

/**
 * Refund Policy — Digistore approval requirement.
 *
 * The /pro sales page advertises a 60-day refund (Digistore's required
 * minimum is 60, 90, or 180 — 7 days is not on their allowed list).
 * Verify Digistore product 691098 is set to 60 days in the admin panel.
 * A mismatch between the on-page copy and the Digistore admin setting
 * is grounds for marketplace rejection.
 *
 * TODO(David): replace the boilerplate copy below with the policy you (and
 * counsel) sign off on. The placeholders in [SQUARE BRACKETS] must be
 * filled before this page goes to Digistore for review.
 */

export const metadata: Metadata = {
  title: "Refund Policy — loot.works",
  description: "Refund and cancellation policy for loot.works Pro.",
  robots: { index: false, follow: false },
};

export default function RefundPolicyPage() {
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
          className="text-[32px] leading-tight font-[600] text-[var(--text-primary)] mb-3"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Refund Policy
        </h1>
        <div
          className="text-[11px] font-[500] tracking-[0.12em] uppercase text-[var(--text-muted)] mb-10"
          style={{ fontFamily: "var(--font-label)" }}
        >
          Last updated: [LAST UPDATED DATE]
        </div>

        <div
          className="space-y-6 text-[15px] leading-[1.7] text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.8)" }}
        >
          <section>
            <h2 className="text-[18px] font-[600] mb-2" style={{ color: "#fff" }}>
              60-Day Money-Back Guarantee
            </h2>
            <p>
              We offer a full refund within 60 days of your initial purchase, no
              questions asked. If you are not satisfied with loot.works Pro for
              any reason, contact us within 60 days of purchase and we will
              process a full refund.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-[600] mb-2" style={{ color: "#fff" }}>
              How to Request a Refund
            </h2>
            <p>
              Email <a href="mailto:lootworks.goflip@gmail.com" style={{ color: "#5CE0B8" }}>lootworks.goflip@gmail.com</a>{" "}
              with the order ID from your Digistore receipt and a brief reason
              for the request. Refunds are typically processed within 5
              business days and credited to the original payment method.
            </p>
            {/* TODO(David): confirm the support address. If you use a different
                inbox (e.g. help@, hello@), update both here AND in
                src/app/pro/components/Footer.jsx. */}
          </section>

          <section>
            <h2 className="text-[18px] font-[600] mb-2" style={{ color: "#fff" }}>
              Cancellation
            </h2>
            <p>
              You can cancel your subscription at any time from your account
              settings or by emailing support. Cancellation takes effect at
              the end of your current billing period — you retain access until
              that date.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-[600] mb-2" style={{ color: "#fff" }}>
              Annual Plan Refunds
            </h2>
            <p>
              Annual plan refunds within the 60-day window are processed in
              full. Outside the 60-day window, annual plans are non-refundable
              for the remaining term, but you can cancel future renewals at
              any time.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-[600] mb-2" style={{ color: "#fff" }}>
              Marketplace Details
            </h2>
            <p>
              Purchases are processed by Digistore24 Inc. as the merchant of
              record. The Digistore24 terms of service also apply to your
              purchase and may provide additional rights under applicable
              consumer protection laws in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-[600] mb-2" style={{ color: "#fff" }}>
              Contact
            </h2>
            <p>
              Questions about this policy?{" "}
              <a href="mailto:lootworks.goflip@gmail.com" style={{ color: "#5CE0B8" }}>
                lootworks.goflip@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
