import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isAdminEmail } from "@/lib/admin";
import ReviewClient from "./ReviewClient";

export const dynamic = "force-dynamic";

interface ApplicationRow {
  id: string;
  name: string;
  email: string;
  primary_platform: string | null;
  follower_count: string | null;
  handle: string | null;
  channel_url: string | null;
  notes: string | null;
  status: "pending" | "reviewing" | "approved" | "rejected";
  reviewed_at: string | null;
  reviewed_by: string | null;
  notes_internal: string | null;
  submitted_at: string;
}

export default async function Founding20AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    redirect("/onboarding?next=/admin/founding20");
  }
  if (!isAdminEmail(user.email)) {
    return (
      <main style={{ padding: 64, color: "#fff", fontFamily: "system-ui" }}>
        <h1>403</h1>
        <p>Not authorized. Add this email to ADMIN_EMAILS in env to access.</p>
      </main>
    );
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("founding20_applications")
    .select(
      "id, name, email, primary_platform, follower_count, handle, channel_url, notes, status, reviewed_at, reviewed_by, notes_internal, submitted_at",
    )
    .order("submitted_at", { ascending: false });

  if (error) {
    return (
      <main style={{ padding: 64, color: "#fff", fontFamily: "system-ui" }}>
        <h1>Database error</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  const rows = (data ?? []) as unknown as ApplicationRow[];
  return <ReviewClient rows={rows} />;
}
