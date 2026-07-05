"use client";

/**
 * Footer — Digistore approval requirement.
 *
 * Required elements per Digistore Inc. (US reseller) marketplace approval:
 *   - Brand identity
 *   - Product links
 *   - Terms, Privacy, Refund Policy
 *   - Contact email + (recommended) business address
 *   - Copyright line
 *
 * TODO(David): all of the following MUST be reconciled before submitting to
 * Digistore approval:
 *   1. SUPPORT_EMAIL — replace placeholder with the real address that's
 *      monitored. Whatever shows here is what customers will email; that
 *      mailbox needs to be staffed.
 *   2. BUSINESS_NAME + BUSINESS_ADDRESS — fill in operator-of-record + the
 *      address registered with Digistore. They cross-check.
 *   3. REFUND PERIOD: this page advertises "60-day refund" in multiple
 *      places. Verify Digistore product 691098 is also set to 60 days
 *      (Digistore's allowed values are 60, 90, or 180 — 7-day is not
 *      acceptable). A mismatch between the on-page copy and the
 *      Digistore admin setting is grounds for rejection.
 */

import Link from "next/link";
import { C } from "../lib/colors.js";
import { CoinMark } from "./atoms.jsx";

// CONFIRMED: support inbox is lootworks.goflip@gmail.com
const SUPPORT_EMAIL = "lootworks.goflip@gmail.com";
const BUSINESS_NAME = "TruConnect";
const BUSINESS_ADDRESS = "1020 Ezekiel Way, Locust Grove, GA 30248, USA";

export default function Footer() {
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 1,
        background: "#0F1116",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "clamp(32px,5vw,64px) 24px 20px",
        color: "rgba(255,255,255,0.7)",
        fontFamily: "var(--font-manrope), sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 28,
        }}
      >
        {/* Column 1 — Brand */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CoinMark size={22} />
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: C.mint,
              }}
            >
              LOOT.WORKS
            </span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            AI thrift arbitrage. Real eBay comps in about a second.
          </p>
        </div>

        {/* Column 2 — Product */}
        <FooterCol title="PRODUCT">
          <FooterLink href="/">loot.works</FooterLink>
          <FooterLink href="/flip">flip or skip</FooterLink>
          <FooterLink href="/pro">pro</FooterLink>
          <FooterLink href="/app">open app</FooterLink>
        </FooterCol>

        {/* Column 3 — Legal */}
        <FooterCol title="LEGAL">
          <FooterLink href="/terms">terms of service</FooterLink>
          <FooterLink href="/privacy">privacy policy</FooterLink>
          <FooterLink href="/refund-policy">refund policy</FooterLink>
          <FooterLink href="/contact">contact</FooterLink>
        </FooterCol>

        {/* Column 4 — Contact */}
        <FooterCol title="CONTACT">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.7)",
              textDecoration: "none",
            }}
          >
            {SUPPORT_EMAIL}
          </a>
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.45)",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {BUSINESS_NAME}
            <br />
            {BUSINESS_ADDRESS}
          </p>
        </FooterCol>
      </div>

      {/* Bottom strip */}
      <div
        style={{
          maxWidth: 1200,
          margin: "24px auto 0",
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(92,224,184,0.5)",
          textAlign: "center",
        }}
      >
        © 2026 LOOT.WORKS · loot.works
      </div>
    </footer>
  );
}

function FooterCol({ title, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: "rgba(92,224,184,0.7)",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function FooterLink({ href, children }) {
  return (
    <Link
      href={href}
      style={{
        fontSize: 13,
        color: "rgba(255,255,255,0.65)",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}
