import { NextResponse } from "next/server";
import { generateImprovementPlan } from "@/services/improvement.service";
import { createClient } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await generateImprovementPlan(user.id);

    return NextResponse.json(plan);
  } catch (err: any) {
    console.error("[/api/improvement] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
