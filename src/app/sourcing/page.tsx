import { createServerSupabaseClient } from "@/lib/supabase-server";
import { buildWeekPlan } from "@/lib/sourcingPlan";
import type { StoreRecord, LogRecord } from "@/lib/sourcingPlan";
import { KNOWN_CHAINS } from "@/lib/sourcingPatterns";

// Temporary verification page — dumps the plan output as JSON.
// Replace with full UI in phase 6b.
export default async function SourcingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return (
      <main style={{ padding: 24, fontFamily: "monospace", color: "#e5e7eb", background: "#111", minHeight: "100vh" }}>
        <h2>sourcing plan</h2>
        <p style={{ color: "#E8636B" }}>not authenticated — sign in to see your plan</p>
        <hr />
        <h3>output shape (/api/sourcing/plan)</h3>
        <pre style={{ color: "#5CE0B8", fontSize: 13 }}>{JSON.stringify(
          {
            weekPlan: [
              {
                date: "YYYY-MM-DD",
                weekday: 0,
                entries: [
                  {
                    store: { id: "uuid", name: "My Goodwill", chain: "Goodwill", location_label: "Broad St" },
                    label: "Weekly color tag 50% off · check current color in-app",
                    confidence: "pattern | confirmed | unknown",
                  },
                ],
              },
            ],
            bestStop: {
              store: { id: "uuid", name: "My Goodwill", chain: "Goodwill", location_label: "Broad St" },
              label: "Senior Discount Day — extra 20% off (55+, most locations)",
              confidence: "confirmed",
            },
          },
          null,
          2,
        )}</pre>
        <h3>known chains</h3>
        <pre style={{ color: "#D4A574", fontSize: 13 }}>{JSON.stringify(KNOWN_CHAINS, null, 2)}</pre>
      </main>
    );
  }

  const [storesRes, logsRes] = await Promise.all([
    supabase
      .from("sourcing_stores")
      .select("id, name, chain, location_label")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase
      .from("sourcing_logs")
      .select("store_id, logged_date, was_on_sale")
      .eq("user_id", user.id),
  ]);

  const stores = (storesRes.data ?? []) as StoreRecord[];
  const logs = (logsRes.data ?? []) as LogRecord[];
  const plan = buildWeekPlan(stores, logs);

  return (
    <main style={{ padding: 24, fontFamily: "monospace", color: "#e5e7eb", background: "#111", minHeight: "100vh" }}>
      <h2 style={{ color: "#5CE0B8" }}>sourcing plan (placeholder — phase 6b will style this)</h2>
      <p style={{ color: "#9ca3af" }}>user: {user.email} · {stores.length} stores · {logs.length} logs</p>

      <h3>bestStop</h3>
      <pre style={{ color: "#5CE0B8", fontSize: 13 }}>{JSON.stringify(plan.bestStop, null, 2)}</pre>

      <h3>weekPlan (7 days)</h3>
      <pre style={{ color: "#e5e7eb", fontSize: 12 }}>{JSON.stringify(plan.weekPlan, null, 2)}</pre>

      <hr style={{ borderColor: "#374151", margin: "24px 0" }} />
      <h3 style={{ color: "#9ca3af" }}>api endpoints</h3>
      <ul style={{ color: "#9ca3af", fontSize: 13 }}>
        <li>GET /api/sourcing/plan</li>
        <li>GET /api/sourcing/stores</li>
        <li>POST /api/sourcing/stores — {`{ name, chain, location_label? }`}</li>
        <li>DELETE /api/sourcing/stores?id=uuid</li>
        <li>POST /api/sourcing/log — {`{ store_id, was_on_sale, logged_date?, note? }`}</li>
      </ul>
    </main>
  );
}
