import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { conditionGrade, type ConditionGradeResult } from "@/lib/claude";

interface ConditionGradeBody {
  images?: string[];
}

interface ConditionGradeError {
  error: string;
}

/**
 * POST /api/condition-grade
 * Pro-only multi-image condition grading. Accepts up to 6 base64
 * images; gates on profiles.is_pro. Free users receive 403 with a
 * "requires Pro" message so the UI can route them to the paywall.
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<ConditionGradeResult | ConditionGradeError>> {
  let body: ConditionGradeBody;
  try {
    body = (await req.json()) as ConditionGradeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.images) || body.images.length === 0) {
    return NextResponse.json(
      { error: "At least one image is required" },
      { status: 400 },
    );
  }
  if (body.images.length > 6) {
    return NextResponse.json(
      { error: "Maximum of 6 images per grade" },
      { status: 400 },
    );
  }

  // Pro gate — read profiles.is_pro for the authed user. Anonymous
  // requests are rejected with 401 so the client knows to log in
  // before retrying.
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to grade conditions" },
        { status: 401 },
      );
    }
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .maybeSingle();
    const testProEmails = (process.env.PRO_TEST_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isTestPro = user.email
      ? testProEmails.includes(user.email.toLowerCase())
      : false;
    const isPro = profileRow?.is_pro === true || isTestPro;
    if (!isPro) {
      return NextResponse.json(
        { error: "Condition grading requires Pro." },
        { status: 403 },
      );
    }
  } catch (gateErr) {
    console.error("Condition grade gate failed:", gateErr);
    return NextResponse.json(
      { error: "Could not verify subscription" },
      { status: 500 },
    );
  }

  try {
    const result = await conditionGrade(body.images);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Condition grade error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
