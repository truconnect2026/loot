#!/usr/bin/env bash
# Local test for the Digistore IPN webhook.
#
# Usage:
#   DIGISTORE_IPN_PASSPHRASE=... bash scripts/test-webhook.sh [URL]
#
# Default URL is http://localhost:3000/api/digistore-webhook. Pass
# a different one as the first argument to hit a deployed env.
#
# Computes the same SHA512 sig the route verifies (see
# src/lib/digistore.ts), then POSTs as application/x-www-form-urlencoded.
# Sample payload is a `payment` event with mode=test, so the route
# logs to digistore_events but does not mutate any user.
#
# Re-running the script must return "OK" both times and produce only
# one row in digistore_events (idempotent on order_id/event_type/transaction_id).

set -euo pipefail

URL="${1:-http://localhost:3000/api/digistore-webhook}"

if [[ -z "${DIGISTORE_IPN_PASSPHRASE:-}" ]]; then
  # Try to source from .env.local for convenience.
  if [[ -f .env.local ]]; then
    val="$(grep -E '^DIGISTORE_IPN_PASSPHRASE=' .env.local | head -n1 | cut -d= -f2- || true)"
    if [[ -n "$val" ]]; then
      DIGISTORE_IPN_PASSPHRASE="$val"
    fi
  fi
fi

if [[ -z "${DIGISTORE_IPN_PASSPHRASE:-}" ]]; then
  echo "DIGISTORE_IPN_PASSPHRASE not set (env or .env.local)" >&2
  exit 1
fi

# Sample payload — payment event for a test purchase. Fields chosen to
# match what Digistore actually POSTs in production for a payment IPN.
#
# Override the event name with EVENT=... (e.g. on_payment, on_refund,
# bogus_xyz) and the mode with MODE=... (test = no profile mutation,
# live = exercise the switch). Defaults are backward-compatible.
declare -A FIELDS=(
  [event]="${EVENT:-payment}"
  [order_id]="${ORDER_ID:-TEST123}"
  [transaction_id]="${TX_ID:-TXN-TEST-001}"
  [pay_sequence_no]=1
  [buyer_email]="${BUYER_EMAIL:-test@example.com}"
  [product_id]=691098
  [product_name]="Loot Pro Monthly"
  [amount_brutto]=14.99
  [currency]=USD
  [mode]="${MODE:-test}"
  [billing_type]=subscription
)

# Build the signing string: sort keys ASCII, drop empty/false/null,
# concat as `${key}=${value}${passphrase}` with no separator.
keys=()
for k in "${!FIELDS[@]}"; do
  v="${FIELDS[$k]}"
  if [[ -z "$v" || "$v" == "false" ]]; then
    continue
  fi
  keys+=("$k")
done

# Sort keys ASCII (LC_ALL=C ensures byte-order, not locale-aware sort).
IFS=$'\n' sorted=($(LC_ALL=C printf "%s\n" "${keys[@]}" | sort))
unset IFS

sign_str=""
for k in "${sorted[@]}"; do
  sign_str+="${k}=${FIELDS[$k]}${DIGISTORE_IPN_PASSPHRASE}"
done

# SHA512 → uppercase hex.
if command -v sha512sum >/dev/null 2>&1; then
  SHA="$(printf '%s' "$sign_str" | sha512sum | awk '{print toupper($1)}')"
else
  # macOS fallback
  SHA="$(printf '%s' "$sign_str" | shasum -a 512 | awk '{print toupper($1)}')"
fi

FIELDS[sha_sign]="$SHA"

# URL-encode each field value. Uses jq @uri if available, else
# falls back to python3. Important: pipe with `printf %s` (no
# trailing newline) so the encoded value doesn't end up with a
# stray %0A that would break signature verification.
urlencode() {
  local raw="$1"
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$raw" | jq -sRr @uri
  else
    printf '%s' "$raw" | python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read(), safe=""), end="")'
  fi
}

body=""
first=1
for k in "${!FIELDS[@]}"; do
  v="$(urlencode "${FIELDS[$k]}")"
  if [[ $first -eq 1 ]]; then
    body+="${k}=${v}"
    first=0
  else
    body+="&${k}=${v}"
  fi
done

echo "POST $URL"
echo "sha_sign=$SHA"
echo

curl -sS -X POST "$URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "$body" \
  -w "\nHTTP %{http_code}\n"
