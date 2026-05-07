import "server-only";
import crypto from "crypto";

/**
 * Digistore24 IPN signature verification.
 *
 * Algorithm (mirrors the official Digistore PHP example):
 *   1. Take the POST params as a key/value map.
 *   2. Remove the sha_sign param itself.
 *   3. Sort the remaining keys alphabetically (case-sensitive ASCII).
 *   4. Drop entries whose value is the empty string, null, undefined,
 *      or the literal string "false". Keep "0" — only literal empty
 *      is skipped.
 *   5. Concatenate `${key}=${value}${passphrase}` for each remaining
 *      entry, with no separator.
 *   6. SHA512 the result, hex-encode, uppercase.
 *   7. Compare to the received sha_sign with a constant-time compare.
 *
 * Edge case: Digistore docs are inconsistent on whether `false` literal
 * should be skipped vs. included. The official PHP example treats
 * empty / false / null as skip, which is what we mirror.
 */
export function verifyDigistoreSignature(
  params: Record<string, string>,
  passphrase: string,
): boolean {
  const received = params["sha_sign"];
  if (!received || typeof received !== "string") return false;

  const filtered = Object.entries(params).filter(
    ([k, v]) =>
      k !== "sha_sign" &&
      v !== "" &&
      v !== null &&
      v !== undefined &&
      v !== "false",
  );

  filtered.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  const concat = filtered
    .map(([k, v]) => `${k}=${v}${passphrase}`)
    .join("");
  const computed = crypto
    .createHash("sha512")
    .update(concat, "utf8")
    .digest("hex")
    .toUpperCase();

  // timingSafeEqual requires equal-length buffers; bail early if not.
  if (received.length !== computed.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(received),
      Buffer.from(computed),
    );
  } catch {
    return false;
  }
}

/**
 * Compute a sha_sign over the given params using the same algorithm
 * verifyDigistoreSignature uses. Exported so the local test script
 * can sign a sample payload without duplicating the rules.
 */
export function computeDigistoreSignature(
  params: Record<string, string>,
  passphrase: string,
): string {
  const filtered = Object.entries(params).filter(
    ([k, v]) =>
      k !== "sha_sign" &&
      v !== "" &&
      v !== null &&
      v !== undefined &&
      v !== "false",
  );
  filtered.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const concat = filtered
    .map(([k, v]) => `${k}=${v}${passphrase}`)
    .join("");
  return crypto
    .createHash("sha512")
    .update(concat, "utf8")
    .digest("hex")
    .toUpperCase();
}
