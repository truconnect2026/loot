/**
 * Affiliate-cookie helpers used by the upgrade UI.
 *
 * The middleware stamps three cookies whenever a request URL carries
 * ?aff=... or ?ref=... :
 *   loot_aff_source    'digistore'
 *   loot_aff_id        the affiliate id (whatever was in the query)
 *   loot_aff_campaign  same value (Digistore treats id + campaign as a
 *                      pair for now; the column is split so we can
 *                      diverge later without touching the cookie shape)
 *
 * Cookies are httpOnly:false so client components can read them and
 * route the upgrade buttons accordingly.
 */

export const DIGISTORE_PRODUCT_ID = "691098";

const COOKIE_SOURCE = "loot_aff_source";
const COOKIE_ID = "loot_aff_id";
const COOKIE_CAMPAIGN = "loot_aff_campaign";

interface AffiliateCookies {
  source: "digistore" | null;
  id: string | null;
  campaign: string | null;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const target = name + "=";
  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(target)) {
      try {
        return decodeURIComponent(part.slice(target.length));
      } catch {
        return part.slice(target.length);
      }
    }
  }
  return null;
}

export function readAffiliateCookies(): AffiliateCookies {
  const rawSource = readCookie(COOKIE_SOURCE);
  return {
    source: rawSource === "digistore" ? "digistore" : null,
    id: readCookie(COOKIE_ID),
    campaign: readCookie(COOKIE_CAMPAIGN),
  };
}

/**
 * True iff an affiliate cookie set the source to digistore. The
 * upgrade UI uses this to swap out Stripe checkout for the Digistore
 * checkout-ds24.com flow.
 */
export function hasDigistoreAffiliateCookie(): boolean {
  return readAffiliateCookies().source === "digistore";
}

/**
 * Build the Digistore24 checkout URL for the Loot Pro product, with
 * aff/campaign params carried from the cookie. Pass plan='annual' to
 * preselect the yearly payment plan; default is the monthly rebill.
 *
 * Digistore's documented checkout URL takes ?aff=<id>&campaign=<id>
 * to attribute the sale and ?payplan=<id> if you want to preselect a
 * specific plan id. We carry the cookie values straight through so
 * the affiliate gets credit; plan preselection is left to the
 * Digistore product config (both monthly + annual are payment plans
 * under the same product).
 */
export function buildDigistoreCheckoutUrl(opts?: {
  affId?: string | null;
  campaign?: string | null;
}): string {
  const base =
    "https://www.checkout-ds24.com/product/" + DIGISTORE_PRODUCT_ID;
  const params = new URLSearchParams();
  if (opts?.affId) params.set("aff", opts.affId);
  if (opts?.campaign) params.set("campaign", opts.campaign);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export const DIGISTORE_FIND_ORDER_URL =
  "https://www.digistore24.com/find_my_order";
