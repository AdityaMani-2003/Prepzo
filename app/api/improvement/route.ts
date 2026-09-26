import { POST as handleImprovementPlan } from "../improvement-plan/route";
import { createClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: metrics } = await supabase
      .from("skill_metrics")
      .select("*")
      .eq("user_id", user.id);

    return NextResponse.json({ metrics: metrics || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load metrics" }, { status: 500 });
  }
}

export async function POST(req: any) {
  return handleImprovementPlan(req);
}
