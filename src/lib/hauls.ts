import { createClient } from "@/lib/supabase";

export type HaulVerdict = "buy" | "maybe" | "pass";
export type HaulSource  = "scan_single" | "scan_shelf" | "scan_crate" | "manual";
export type HaulStatus  = "saved" | "bought" | "listed" | "sold";

export interface SaveHaulInput {
  name: string;
  image_url?: string | null;
  buy_price?: number | null;
  est_resale_low?: number | null;
  est_resale_high?: number | null;
  verdict?: HaulVerdict | null;
  source: HaulSource;
}

export async function saveHaul(
  input: SaveHaulInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "not authenticated" };

  const { data, error } = await supabase
    .from("hauls")
    .insert({
      user_id:         userData.user.id,
      name:            input.name,
      image_url:       input.image_url ?? null,
      buy_price:       input.buy_price ?? null,
      est_resale_low:  input.est_resale_low ?? null,
      est_resale_high: input.est_resale_high ?? null,
      verdict:         input.verdict ?? null,
      source:          input.source,
      status:          "saved",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: (data as { id: string } | null)?.id };
}
