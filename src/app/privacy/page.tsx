import type { Metadata } from "next";
import Link from "next/link";
import DotGridBackground from "@/components/shared/DotGridBackground";
import CoinMark from "@/components/shared/CoinMark";

/**
 * Privacy policy stub. Boilerplate SaaS template prepared for Digistore
 * marketplace approval review. Real copy + last-updated date need
 * David's sign-off before production push. Placeholder markers in
 * square brackets must be filled in.
 */

export const metadata: Metadata = {
  title: "Privacy — loot.works",
  description: "How loot.works collects, uses, and protects your data.",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <div
          className="text-[11px] font-[500] tracking-[0.12em] uppercase text-[var(--text-muted)] mb-10"
          style={{ fontFamily: "var(--font-label)" }}
        >
          Last updated: May 23, 2026
        </div>

        <Prose>
          <P>
            This policy describes how loot.works (&ldquo;we&rdquo;,
            &ldquo;us&rdquo;) collects, uses, and protects information when you
            use the loot.works web application and related services.
          </P>

          <H2>1. Data we collect</H2>
          <P>
            We collect the minimum data needed to operate the service:
          </P>
          <UL>
            <LI>Account: email address, OAuth profile basics (name, avatar) when you sign in with Google.</LI>
            <LI>Location: 5-digit US ZIP code you provide during onboarding and your selected search radius.</LI>
            <LI>Activity: scans you perform, items you mark sold, watch-list keywords, and notification preferences.</LI>
            <LI>Device: browser type, user agent, and the existence of a push-notification subscription.</LI>
            <LI>Affiliate attribution: if you arrived via an affiliate link, a cookie storing the referrer ID for 30 days.</LI>
          </UL>

          <H2>2. How we use it</H2>
          <UL>
            <LI>To deliver scan results, deal feeds, and yard-sale routing tailored to your ZIP and radius.</LI>
            <LI>To send the push notifications you opt into (deal alerts, watch-list matches, penny drops).</LI>
            <LI>To process subscription payments and grant Pro feature access.</LI>
            <LI>To aggregate anonymized sold-price data that improves pricing accuracy for all users (you contribute by marking items sold).</LI>
            <LI>To respond to support requests and prevent fraud.</LI>
          </UL>

          <H2>3. Third parties</H2>
          <P>
            We share the minimum data required to operate. Third-party
            processors:
          </P>
          <UL>
            <LI><b>Supabase</b> &mdash; database + authentication. Stores account and profile rows.</LI>
            <LI><b>Stripe</b> &mdash; payment processing for subscriptions purchased directly. Card data never touches our servers.</LI>
            <LI><b>Digistore24</b> &mdash; payment processing for subscriptions purchased through affiliate funnels. Subject to Digistore&rsquo;s own privacy policy.</LI>
            <LI><b>Anthropic</b> &mdash; AI inference. Scan photos and item descriptions are sent to Anthropic&rsquo;s API to generate verdicts; not used for training.</LI>
            <LI><b>Vercel</b> &mdash; hosting and edge runtime.</LI>
            <LI><b>BigDataCloud</b> &mdash; reverse-geocoding when you tap &ldquo;use my location&rdquo; during onboarding.</LI>
          </UL>

          <H2>4. Cookies</H2>
          <UL>
            <LI><b>Authentication cookies</b> (set by Supabase) keep you signed in. Required.</LI>
            <LI><b>loot_aff_source / loot_aff_id / loot_aff_campaign</b> &mdash; 30-day attribution cookies set when you arrive via an affiliate or referral link. Used to credit the referring affiliate at checkout. Not used for advertising tracking.</LI>
            <LI>We do not use third-party advertising or analytics cookies.</LI>
          </UL>

          <H2>5. Your rights</H2>
          <P>
            You can export your scan history as CSV from the Account page. You
            can delete your account by emailing the contact address below;
            account deletion removes profile, scans, watch-list, and notification
            data within 30 days. Aggregate sold-price contributions are retained
            in anonymized form.
          </P>

          <H2>6. Data security</H2>
          <P>
            Data is encrypted in transit (HTTPS) and at rest by our hosting and
            database providers. We restrict employee access on a need-to-know
            basis. No system is perfectly secure; if you believe your account
            has been compromised, contact us immediately.
          </P>

          <H2>7. Children</H2>
          <P>
            loot.works is not directed to children under 13. We do not knowingly
            collect data from children under 13.
          </P>

          <H2>8. Changes</H2>
          <P>
            We may update this policy. Material changes will be announced in-app
            or by email at least 14 days before taking effect.
          </P>

          <H2>9. Contact</H2>
          <P>
            Questions or requests: <Mail>lootworks.goflip@gmail.com</Mail>.
            <br />
            Operated by TruConnect, 1020 Ezekiel Way, Locust Grove, GA 30248, USA.
          </P>
        </Prose>

        <FooterBar />
      </div>
    </main>
  );
}

// ── Small typography helpers — keep the page body markup terse and
//    the styling consistent across the two legal stubs. Same set in
//    /terms; if a third long-form page lands, lift these into a
//    shared module.

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="space-y-5 text-[var(--text-primary)]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {children}
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-lg font-[600] text-[var(--text-primary)] pt-4"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-sm font-[300] leading-relaxed text-[var(--text-primary)]/85"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {children}
    </p>
  );
}

function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="space-y-2 list-disc pl-5 text-sm font-[300] leading-relaxed text-[var(--text-primary)]/85">
      {children}
    </ul>
  );
}

function LI({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>;
}

function Mail({ children }: { children: React.ReactNode }) {
  return (
    <a
      href={`mailto:${children}`}
      className="text-[var(--money)] hover:underline"
    >
      {children}
    </a>
  );
}

function FooterBar() {
  return (
    <div
      className="mt-16 pt-6 border-t border-white/[0.04] flex items-center justify-center gap-3 text-[10px] tracking-[0.12em] uppercase"
      style={{ fontFamily: "var(--font-label)" }}
    >
      <Link
        href="/privacy"
        className="text-white/40 hover:text-white/70 transition"
      >
        Privacy
      </Link>
      <span className="text-white/20">·</span>
      <Link
        href="/terms"
        className="text-white/40 hover:text-white/70 transition"
      >
        Terms
      </Link>
      <span className="text-white/20">·</span>
      <span className="text-white/40">&copy; 2026 loot.works</span>
    </div>
  );
}
